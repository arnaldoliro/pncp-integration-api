import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { db } from '../../database/connection.js';
import { env } from '../../config/env.config.js';
import { ServicosService } from '../servicos/servicos.service.js';
import { ViewsReaderService } from '../views-reader/views-reader.service.js';
import { PncpHttpClient } from '../pncp-client/pncp-http-client.service.js';
import { PncpLogService, type GravarLogDto } from '../pncp-log/pncp-log.service.js';
import { PncpDadosContratacoes } from '../pncp-dados-contratacoes/pncp-dados-contratacoes.service.js';
import type { ServicoRequestDto } from '../../shared/types/servico-request.dto.js';
import type {
  OrchestratorDetalhe,
  OrchestratorResult,
} from '../../shared/types/orchestrator-result.js';
import { buildPayload } from './payload-builder.js';
import { buildUrl } from './url-builder.js';

const METODOS_COM_SEQUENCIAL = new Set(['PUT', 'PATCH', 'DELETE']);

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly servicosService: ServicosService,
    private readonly viewsReaderService: ViewsReaderService,
    private readonly pncpHttpClient: PncpHttpClient,
    private readonly pncpLogService: PncpLogService,
    private readonly pncpDadosContratacoes: PncpDadosContratacoes,
  ) {}

  async executar(dto: ServicoRequestDto): Promise<OrchestratorResult> {
    const config = await this.servicosService.resolverPorNome(
      dto.tel_descricao_servico,
    );

    const controle = await db
      .selectFrom('PNCP_CONTROLE_DADOS')
      .select('con_link_principal')
      .executeTakeFirst();

    const baseUrl =
      (controle?.con_link_principal ?? '') || env.pncp.baseUrl || '';
    if (!baseUrl) {
      throw new InternalServerErrorException(
        'Base URL do PNCP não configurada (con_link_principal e PNCP_BASE_URL ausentes).',
      );
    }

    const records = await this.viewsReaderService.buscar(
      config.tel_entidade,
      dto.ORG_COD,
      dto.LIC_COD,
    );

    const detalhes: OrchestratorDetalhe[] = [];
    let enviados = 0;
    let erros = 0;
    let ignorados = 0;
    const conOrgao = parseInt(dto.ORG_COD, 10);

    for (const record of records) {
      const conCompraId = String(record['LIC_COD'] ?? dto.LIC_COD ?? '');

      const context: Record<string, unknown> = {
        tel_descricao_servico: dto.tel_descricao_servico,
        ORG_COD: dto.ORG_COD,
        LIC_COD: dto.LIC_COD,
        ID2: dto.ID2,
        justificativa: dto.justificativa,
        ...record,
      };

      let url = '';
      let body: unknown;
      let sucesso = false;
      let mensagemErro: string | undefined;
      let lsIdPncp: number | null = null;

      try {
        const metodo = config.ser_tipo?.toUpperCase();
        if (!metodo) {
          throw new InternalServerErrorException(
            `ser_tipo não configurado para "${dto.tel_descricao_servico}".`,
          );
        }

        if (metodo === 'POST') {
          const existente = await this.pncpDadosContratacoes.buscarSequencial(
            conCompraId,
            conOrgao,
          );
          if (existente) {
            ignorados++;
            detalhes.push({
              id: conCompraId,
              sucesso: false,
              mensagem: 'Registro já enviado ao PNCP (sequencial existente).',
            });
            continue;
          }
        }

        if (METODOS_COM_SEQUENCIAL.has(metodo)) {
          const sequencialLocal =
            await this.pncpDadosContratacoes.buscarSequencial(
              conCompraId,
              conOrgao,
            );
          if (!sequencialLocal) {
            throw new InternalServerErrorException(
              `Sequencial PNCP não encontrado localmente para LIC_COD "${conCompraId}". Recurso pode não ter sido enviado via POST.`,
            );
          }
          context['sequencial'] = sequencialLocal.con_sequencial;
          context['ano'] = sequencialLocal.con_ano;
        }

        url = buildUrl(config.ser_link, baseUrl, context);

        let response: unknown;
        if (metodo === 'DELETE') {
          body = { justificativa: dto.justificativa };
          response = await this.pncpHttpClient.delete(url, body);
        } else if (metodo === 'GET') {
          response = await this.pncpHttpClient.get(url);
        } else {
          if (!config.tel_json_consumo) {
            throw new InternalServerErrorException(
              `tel_json_consumo não configurado para "${dto.tel_descricao_servico}".`,
            );
          }
          body = buildPayload(config.tel_json_consumo, context);

          if (metodo === 'POST') {
            response = await this.pncpHttpClient.post(url, body);
          } else if (metodo === 'PUT') {
            response = await this.pncpHttpClient.put(url, body);
          } else if (metodo === 'PATCH') {
            response = await this.pncpHttpClient.patch(url, body);
          } else {
            throw new InternalServerErrorException(
              `Método HTTP desconhecido: ${metodo}`,
            );
          }
        }

        if (metodo === 'POST') {
          const compraUri = (response as { compraUri?: string } | null)
            ?.compraUri;
          if (compraUri) {
            const parts = compraUri.split('/');
            const conSequencial = parseInt(parts[parts.length - 1], 10);
            const conAno = parts[parts.length - 2];
            if (!isNaN(conSequencial) && conAno) {
              await this.pncpDadosContratacoes.gravarSequencial({
                con_compra_id: conCompraId,
                con_orgao: conOrgao,
                con_sequencial: conSequencial,
                con_ano: conAno,
              });
              lsIdPncp = conSequencial;
            } else {
              this.logger.warn(
                `compraUri com formato inesperado na resposta do PNCP: ${compraUri}`,
              );
            }
          } else {
            this.logger.warn(
              `Resposta POST sem compraUri para LIC_COD "${conCompraId}"`,
            );
          }
        }

        if (metodo === 'DELETE') {
          await this.pncpDadosContratacoes.remover(conCompraId, conOrgao);
        }

        sucesso = true;
        enviados++;

        await this.gravarLog({
          ls_acao: dto.tel_descricao_servico,
          ls_url: url,
          ls_cod_erro: null,
          ls_mensagem: null,
          ls_json: body !== undefined ? JSON.stringify(body) : null,
          ser_id: config.ser_id,
          ls_orgao: conOrgao || null,
          ls_id_pncp: lsIdPncp,
          ls_numeroprocesso: null,
        });
      } catch (error) {
        erros++;
        mensagemErro = (error as Error).message;
        const codErro =
          error instanceof HttpException ? error.getStatus() : 500;

        await this.gravarLog({
          ls_acao: dto.tel_descricao_servico,
          ls_url: url,
          ls_cod_erro: codErro,
          ls_mensagem: mensagemErro,
          ls_json: body !== undefined ? JSON.stringify(body) : null,
          ser_id: config.ser_id,
          ls_orgao: conOrgao || null,
          ls_id_pncp: null,
          ls_numeroprocesso: null,
        });
      }

      detalhes.push({ id: conCompraId, sucesso, mensagem: mensagemErro });
    }

    return { total: records.length, enviados, erros, ignorados, detalhes };
  }

  private async gravarLog(dados: GravarLogDto): Promise<void> {
    try {
      await this.pncpLogService.gravar(dados);
    } catch (error) {
      this.logger.warn(`Falha ao gravar log PNCP: ${(error as Error).message}`);
    }
  }
}
