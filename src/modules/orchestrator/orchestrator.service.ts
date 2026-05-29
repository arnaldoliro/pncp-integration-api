import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Kysely } from 'kysely';
import type { Database } from '../../database/connection.js';
import { env } from '../../config/env.config.js';
import { ServicosService } from '../servicos/servicos.service.js';
import { ViewsReaderService } from '../views-reader/views-reader.service.js';
import { PncpHttpClient } from '../pncp-client/pncp-http-client.service.js';
import { PncpLogService, type GravarLogDto } from '../pncp-log/pncp-log.service.js';
import { PncpDadosContratacoes } from '../pncp-dados-contratacoes/pncp-dados-contratacoes.service.js';
import { DatabasePoolService } from '../database-discovery/database-pool.service.js';
import type { ServicoRequestDto } from '../../shared/types/servico-request.dto.js';
import type {
  OrchestratorDetalhe,
  OrchestratorResult,
} from '../../shared/types/orchestrator-result.js';
import { buildPayload } from './payload-builder.js';
import { buildUrl } from './url-builder.js';

const METODOS_COM_SEQUENCIAL = new Set(['PUT', 'PATCH', 'DELETE']);
const ITENS_VIEW = 'vw_ContratoEditalAviso_Item_6_3';
const ITENS_SERVICO_NOME = '6.3.10 Inserir Itens a uma Contratação';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly servicosService: ServicosService,
    private readonly viewsReaderService: ViewsReaderService,
    private readonly pncpHttpClient: PncpHttpClient,
    private readonly pncpLogService: PncpLogService,
    private readonly pncpDadosContratacoes: PncpDadosContratacoes,
    private readonly databasePool: DatabasePoolService,
  ) {}

  async executar(dto: ServicoRequestDto): Promise<OrchestratorResult> {
    const db: Kysely<Database> = await this.databasePool.obterDatabase(dto.database);

    const config = await this.servicosService.resolverPorNome(
      dto.tel_descricao_servico,
      db,
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
    if (!baseUrl.startsWith('https://')) {
      throw new InternalServerErrorException(
        'Base URL do PNCP inválida: deve começar com https://',
      );
    }

    const records = await this.viewsReaderService.buscar(
      config.tel_entidade,
      dto.ORG_COD,
      dto.LIC_COD,
      db,
    );
    const detalhes: OrchestratorDetalhe[] = [];
    let enviados = 0;
    let erros = 0;
    let ignorados = 0;
    const conOrgao = parseInt(dto.ORG_COD, 10);
    const metodoServico = config.ser_tipo?.toUpperCase() ?? null;
    const urlRequerSequencial = config.ser_link.includes('{sequencial}');

    await this.gravarLog({
      ls_usuario: dto.usuario,
      ls_acao: metodoServico,
      ls_url: null,
      ls_cod_erro: 1,
      ls_mensagem: `Iniciando Serviço ${dto.tel_descricao_servico}`,
      ls_descricao: `Iniciando o Serviço de ${dto.tel_descricao_servico}`,
      ls_json: null,
      ser_id: config.ser_id,
      ls_orgao: conOrgao || null,
      ls_id_pncp: null,
      ls_numeroprocesso: dto.LIC_COD ?? null,
    }, db);

    for (const record of records) {
      const conCompraId = String(record['LIC_COD'] ?? dto.LIC_COD ?? '');
      const licRow = await db
        .selectFrom('LIC_LICITACAO')
        .select('LIC_NUMERO')
        .where('LIC_COD', '=', parseInt(conCompraId, 10))
        .executeTakeFirst();
      const conNumeroCompra = licRow?.LIC_NUMERO ?? conCompraId;

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
      let descricaoErro: string | null = null;
      let lsIdPncp: number | null = null;
      let documentosAdicionais: Record<string, unknown>[] = [];
      let primeiroDocumento: Record<string, unknown> | null = null;
      let itensEnviados: Record<string, unknown>[] = [];
      let pncpResponse: { status: number; body: unknown; location: string | null } | undefined;

      try {
        const metodo = config.ser_tipo?.toUpperCase();
        if (!metodo) {
          throw new InternalServerErrorException(
            `ser_tipo não configurado para "${dto.tel_descricao_servico}".`,
          );
        }

        if (metodo === 'POST' && !urlRequerSequencial) {
          const existente = await this.pncpDadosContratacoes.buscarSequencial(
            conNumeroCompra,
            conOrgao,
            db,
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

        if (METODOS_COM_SEQUENCIAL.has(metodo) || urlRequerSequencial) {
          const sequencialLocal =
            await this.pncpDadosContratacoes.buscarSequencial(
              conNumeroCompra,
              conOrgao,
              db,
            );
          if (!sequencialLocal) {
            throw new InternalServerErrorException(
              `Sequencial PNCP não encontrado localmente para numeroCompra "${conNumeroCompra}". Recurso pode não ter sido enviado via POST.`,
            );
          }
          context['sequencial'] = sequencialLocal.con_sequencial;
          context['ano'] = sequencialLocal.con_ano;
        }

        url = buildUrl(config.ser_link, baseUrl, context);

          if (metodo === 'DELETE') {
          if (!dto.justificativa) {
            throw new BadRequestException(
              `O campo "justificativa" é obrigatório para operações DELETE ("${dto.tel_descricao_servico}").`,
            );
          }
          body = { justificativa: dto.justificativa };
          pncpResponse = await this.pncpHttpClient.delete(url, db, body);
        } else if (metodo === 'GET') {
          pncpResponse = await this.pncpHttpClient.get(url, db);
        } else {
          if (!config.tel_json_consumo) {
            throw new InternalServerErrorException(
              `tel_json_consumo não configurado para "${dto.tel_descricao_servico}".`,
            );
          }

          if (config.tel_entidade === 'vw_Inserir_Contratacao_6_3_1') {
            const itensConfig = await this.servicosService.resolverPorNome(ITENS_SERVICO_NOME, db);
            if (!itensConfig.tel_json_consumo) {
              throw new InternalServerErrorException(
                `tel_json_consumo não configurado para o serviço "${ITENS_SERVICO_NOME}".`,
              );
            }
            const itensRecords = await this.viewsReaderService.buscar(
              ITENS_VIEW,
              dto.ORG_COD,
              conCompraId,
              db,
            );
            itensEnviados = itensRecords.map((row) =>
              buildPayload(itensConfig.tel_json_consumo!, row as Record<string, unknown>),
            );
            context['itensCompra'] = itensEnviados;
          }

          body = buildPayload(config.tel_json_consumo, context);

          if (metodo === 'POST') {
            if (config.ser_arquivo === 'S') {
              if (config.tel_entidade_doc) {
                // 6.3.1: postMultipart (JSON + arquivo) usando view de documentos separada
                const documentos = await this.viewsReaderService.buscar(config.tel_entidade_doc, dto.ORG_COD, conCompraId, db);
                if (documentos.length === 0) {
                  throw new InternalServerErrorException(
                    `Nenhum documento encontrado na view "${config.tel_entidade_doc}" para LIC_COD "${conCompraId}".`,
                  );
                }
                const primeiro = documentos[0];
                primeiroDocumento = primeiro;
                documentosAdicionais = documentos.slice(1);
                pncpResponse = await this.pncpHttpClient.postMultipart(
                  url,
                  body as Record<string, unknown>,
                  {
                    buffer: primeiro['arquivo'] as Buffer,
                    titulo: String(primeiro['TituloDocumento'] ?? ''),
                    tipoDocumentoId: Number(primeiro['TipoDocumentoId'] ?? 0),
                    extensao: String(primeiro['Extencao'] ?? 'pdf'),
                  },
                  db,
                  config.sin_ser_nome_cabecalho_json ?? 'compra',
                  config.sin_ser_nome_cabecalho_arquivo ?? 'documento',
                );
              } else {
                // 6.3.6: upload puro — postArquivo para cada documento da tel_entidade
                const documentos = await this.viewsReaderService.buscar(config.tel_entidade, dto.ORG_COD, conCompraId, db);
                if (documentos.length === 0) {
                  throw new InternalServerErrorException(
                    `Nenhum documento encontrado na view "${config.tel_entidade}" para LIC_COD "${conCompraId}".`,
                  );
                }
                for (const doc of documentos) {
                  const tituloDoc = String(doc['TituloDocumento'] ?? '');
                  try {
                    const docResp = await this.pncpHttpClient.postArquivo(url, {
                      buffer: doc['arquivo'] as Buffer,
                      titulo: tituloDoc,
                      tipoDocumentoId: Number(doc['TipoDocumentoId'] ?? 0),
                      extensao: String(doc['Extencao'] ?? 'pdf'),
                    }, db);
                    const docLocParts = docResp.location?.split('/') ?? [];
                    const docSeq = docResp.location ? parseInt(docLocParts[docLocParts.length - 1], 10) : null;
                    await this.pncpDadosContratacoes.gravarDocumento({
                      sin_con_data_alteracao: new Date(),
                      sin_con_ano: String(context['ano'] ?? ''),
                      sin_con_numerocompra: conNumeroCompra,
                      sin_con_nome_arquivo: tituloDoc,
                      sequencialarquivo: docSeq && !isNaN(docSeq) ? docSeq : null,
                    }, db);
                    pncpResponse = docResp;
                    lsIdPncp = docSeq && !isNaN(docSeq) ? docSeq : null;
                    await this.gravarLog({
                      ls_usuario: dto.usuario,
                      ls_acao: 'POST',
                      ls_url: url,
                      ls_cod_erro: docResp.status,
                      ls_mensagem: `Documento "${tituloDoc}" enviado com sucesso.`,
                      ls_descricao: 'Ação Realizada com Sucesso!',
                      ls_json: null,
                      ser_id: config.ser_id,
                      ls_orgao: conOrgao || null,
                      ls_id_pncp: lsIdPncp,
                      ls_numeroprocesso: conNumeroCompra,
                    }, db);
                    enviados++;
                  } catch (docError) {
                    erros++;
                    let docMensagemErro: string;
                    let docDescricaoErro: string | null;
                    let docCodErro: number;
                    if (docError instanceof HttpException) {
                      const resp = docError.getResponse() as { body?: string; message?: string | string[] };
                      const bodyText = resp.body ?? (Array.isArray(resp.message) ? resp.message.join(', ') : resp.message) ?? docError.message;
                      docMensagemErro = `HTTP ${docError.getStatus()}: ${bodyText}`;
                      docDescricaoErro = resp.body ?? (Array.isArray(resp.message) ? resp.message.join(', ') : (resp.message ?? docError.message));
                      docCodErro = docError.getStatus();
                    } else {
                      docMensagemErro = (docError as Error).message;
                      docDescricaoErro = docMensagemErro;
                      docCodErro = 500;
                    }
                    await this.gravarLog({
                      ls_usuario: dto.usuario,
                      ls_acao: 'ERRO',
                      ls_url: url,
                      ls_cod_erro: docCodErro,
                      ls_mensagem: docMensagemErro,
                      ls_descricao: docDescricaoErro,
                      ls_json: null,
                      ser_id: config.ser_id,
                      ls_orgao: conOrgao || null,
                      ls_id_pncp: null,
                      ls_numeroprocesso: conNumeroCompra,
                    }, db);
                  }
                }
              }
            } else {
              pncpResponse = await this.pncpHttpClient.post(url, body, db);
            }
          } else if (metodo === 'PUT') {
            pncpResponse = await this.pncpHttpClient.put(url, body, db);
          } else if (metodo === 'PATCH') {
            pncpResponse = await this.pncpHttpClient.patch(url, body, db);
          } else {
            throw new InternalServerErrorException(
              `Método HTTP desconhecido: ${metodo}`,
            );
          }
        }

        if (metodo === 'POST') {
          if (urlRequerSequencial && config.ser_arquivo !== 'S') {
            // 6.3.15: POST sub-recurso JSON (sem arquivo)
            const location = pncpResponse?.location ?? null;
            const locationParts = location?.split('/') ?? [];
            const sequencialResultado = location
              ? parseInt(locationParts[locationParts.length - 1], 10)
              : null;

            await this.pncpDadosContratacoes.gravarResultadoItem({
              sin_ite_numerocompra: conNumeroCompra,
              sin_ite_numeroitem: String(record['numeroItem'] ?? ''),
              sin_ite_ano: String(context['ano'] ?? ''),
              sin_ite_iditemview: String(record['numeroItem'] ?? ''),
              sin_ite_sequencial: sequencialResultado && !isNaN(sequencialResultado) ? sequencialResultado : null,
              sin_ite_fornecedor: String(record['niFornecedor'] ?? ''),
            }, db);

            lsIdPncp = sequencialResultado && !isNaN(sequencialResultado) ? sequencialResultado : null;
          } else if (config.ser_arquivo !== 'S' || config.tel_entidade_doc) {
            // POST primário (JSON puro ou 6.3.1 multipart) — extrai sequencial do compraUri
            const compraUri = (pncpResponse?.body as { compraUri?: string } | null)
              ?.compraUri;
            if (!compraUri) {
              throw new InternalServerErrorException(
                `Resposta POST sem compraUri para LIC_COD "${conCompraId}". Sequencial não pôde ser salvo.`,
              );
            }
            const parts = compraUri.split('/');
            const conSequencial = parseInt(parts[parts.length - 1], 10);
            const conAno = parts[parts.length - 2];
            if (isNaN(conSequencial) || !conAno) {
              throw new InternalServerErrorException(
                `compraUri com formato inesperado na resposta do PNCP: ${compraUri}`,
              );
            }
            await this.pncpDadosContratacoes.gravarSequencial(
              {
                con_compra_id: conNumeroCompra,
                con_orgao: conOrgao,
                con_sequencial: conSequencial,
                con_ano: conAno,
                CON_DATAENVIO: new Date(),
              },
              db,
            );
            lsIdPncp = conSequencial;

            if (primeiroDocumento !== null) {
              const documentoUri = (pncpResponse?.body as { documentoUri?: string } | null)?.documentoUri ?? null;
              const docUriParts = documentoUri?.split('/') ?? [];
              const primeiroDocSeq = documentoUri ? parseInt(docUriParts[docUriParts.length - 1], 10) : null;
              await this.pncpDadosContratacoes.gravarDocumento({
                sin_con_data_alteracao: new Date(),
                sin_con_ano: conAno,
                sin_con_numerocompra: conNumeroCompra,
                sin_con_nome_arquivo: String(primeiroDocumento['TituloDocumento'] ?? ''),
                sequencialarquivo: primeiroDocSeq && !isNaN(primeiroDocSeq) ? primeiroDocSeq : null,
              }, db);
            }

            if (documentosAdicionais.length > 0) {
              const arquivosBaseUrl = `${url}/${conAno}/${conSequencial}/arquivos`;
              for (const doc of documentosAdicionais) {
                const docResp = await this.pncpHttpClient.postArquivo(
                  arquivosBaseUrl,
                  {
                    buffer: doc['arquivo'] as Buffer,
                    titulo: String(doc['TituloDocumento'] ?? ''),
                    tipoDocumentoId: Number(doc['TipoDocumentoId'] ?? 0),
                    extensao: String(doc['Extencao'] ?? 'pdf'),
                  },
                  db,
                );
                const docLocParts = docResp.location?.split('/') ?? [];
                const docSeq = docResp.location ? parseInt(docLocParts[docLocParts.length - 1], 10) : null;
                await this.pncpDadosContratacoes.gravarDocumento({
                  sin_con_data_alteracao: new Date(),
                  sin_con_ano: conAno,
                  sin_con_numerocompra: conNumeroCompra,
                  sin_con_nome_arquivo: String(doc['TituloDocumento'] ?? ''),
                  sequencialarquivo: docSeq,
                }, db);
              }
            }

            for (const item of itensEnviados) {
              await this.pncpDadosContratacoes.gravarItem({
                sin_ite_data_alteracao: new Date(),
                sin_ite_ano: conAno,
                sin_ite_numeroitem: String(item['numeroItem'] ?? ''),
                sin_ite_numeropncp: String(conSequencial),
                sin_ite_numerocompra: conNumeroCompra,
                ite_id_situacao: null,
              }, db);
            }
          }
        }

        if (metodo === 'DELETE') {
          await this.pncpDadosContratacoes.remover(conNumeroCompra, conOrgao, db);
        }

        sucesso = true;
        enviados++;
        await this.gravarLog(
          {
            ls_usuario: dto.usuario,
            ls_acao: config.ser_tipo?.toUpperCase() ?? null,
            ls_url: url,
            ls_cod_erro: pncpResponse?.status ?? null,
            ls_mensagem: pncpResponse?.body !== undefined && pncpResponse.body !== null
              ? JSON.stringify(pncpResponse.body)
              : null,
            ls_descricao: 'Ação Realizada com Sucesso!',
            ls_json: body !== undefined ? JSON.stringify(body) : null,
            ser_id: config.ser_id,
            ls_orgao: conOrgao || null,
            ls_id_pncp: lsIdPncp,
            ls_numeroprocesso: conNumeroCompra,
          },
          db,
        );
      } catch (error) {
        erros++;
        if (error instanceof HttpException) {
          const resp = error.getResponse() as { body?: string; message?: string | string[] };
          const bodyText = resp.body
            ?? (Array.isArray(resp.message) ? resp.message.join(', ') : resp.message)
            ?? error.message;
          mensagemErro = `HTTP ${error.getStatus()}: ${bodyText}`;
          if (resp.body) {
            try {
              const parsed = JSON.parse(resp.body) as { message?: string };
              descricaoErro = parsed.message ?? resp.body;
            } catch {
              descricaoErro = resp.body;
            }
          } else {
            descricaoErro = Array.isArray(resp.message) ? resp.message.join(', ') : (resp.message ?? error.message);
          }
        } else {
          mensagemErro = (error as Error).message;
          descricaoErro = mensagemErro;
        }
        const codErro =
          error instanceof HttpException ? error.getStatus() : 500;

        await this.gravarLog(
          {
            ls_usuario: dto.usuario,
            ls_acao: 'ERRO',
            ls_url: url,
            ls_cod_erro: codErro,
            ls_mensagem: mensagemErro ?? null,
            ls_descricao: descricaoErro,
            ls_json: body !== undefined ? JSON.stringify(body) : null,
            ser_id: config.ser_id,
            ls_orgao: conOrgao || null,
            ls_id_pncp: null,
            ls_numeroprocesso: conNumeroCompra,
          },
          db,
        );
      }

      detalhes.push({ id: conCompraId, sucesso, mensagem: mensagemErro });
    }

    await this.gravarLog({
      ls_usuario: dto.usuario,
      ls_acao: metodoServico,
      ls_url: null,
      ls_cod_erro: 2,
      ls_mensagem: `Finalizando Serviço ${dto.tel_descricao_servico}`,
      ls_descricao: `Finalizando o Serviço de ${dto.tel_descricao_servico}`,
      ls_json: null,
      ser_id: config.ser_id,
      ls_orgao: conOrgao || null,
      ls_id_pncp: null,
      ls_numeroprocesso: dto.LIC_COD ?? null,
    }, db);

    return { total: records.length, enviados, erros, ignorados, detalhes };
  }

  private async gravarLog(dados: GravarLogDto, db: Kysely<Database>): Promise<void> {
    try {
      await this.pncpLogService.gravar(dados, db);
    } catch (error) {
      this.logger.warn(`Falha ao gravar log PNCP: ${(error as Error).message}`);
    }
  }
}
