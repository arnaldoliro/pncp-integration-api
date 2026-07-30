# PNCP Integration API

Backend NestJS que serve um frontend Next.js embutido como iframe dentro do Maker (sistema externo). O frontend aciona esta API para buscar dados no banco SQL Server via views configuráveis, enviar ao PNCP e registrar o resultado.

## Arquitetura

```
Maker (sistema externo)
  └── abre iframe com ?token=<jwt-30s>
        └── Next.js (frontend puro)
              ├── POST /api/auth/sessao  → troca token curto por sessão (1h)
              ├── GET  /api/servicos     → lista serviços disponíveis
              └── POST /api/servicos     → executa envio ao PNCP
                        └── NestJS → SQL Server → PNCP
```

**Stack:** NestJS 11 · TypeScript strict · Kysely · SQL Server (tedious + tarn) · @nestjs/jwt · fetch nativo

## Como rodar localmente

```bash
npm install
cp .env.example .env   # preencher variáveis
npm run start:dev
```

## Variáveis de ambiente

```env
NODE_ENV=development
PORT=3000

ALLOWED_ORIGINS=http://localhost:3001

# Servidores SQL Server (adicionar blocos conforme necessário)
DB_SERVER_1=
DB_PORT_1=1433
DB_USER_1=
DB_PASSWORD_1=

DB_ENCRYPT=true
DB_TRUST_SERVER_CERT=true

PNCP_BASE_URL=https://treina.pncp.gov.br/api/pncp
PNCP_TIMEOUT=30000
PNCP_RETRY_ATTEMPTS=3
PNCP_AUTH_URL=https://treina.pncp.gov.br/api/pncp
```

> O segredo JWT **não** é variável de ambiente — é armazenado em `PNCP_CONTROLE_DADOS.con_jwt_secret` no banco de cada cliente.

## Endpoints

### `POST /api/auth/sessao`
Troca o token de entrada (30s, gerado pelo Maker) por um token de sessão (1h).

```json
// Request
{ "token": "<jwt-30s>" }

// Response
{ "token": "<jwt-sessao-1h>" }
```

### `GET /api/servicos`
Lista os serviços disponíveis para o banco do usuário autenticado.

```
Authorization: Bearer <token-sessao>
```

### `POST /api/servicos`
Executa um serviço de envio ao PNCP.

```
Authorization: Bearer <token-sessao>
```

```json
{
  "usuario": 1,
  "tel_descricao_servico": "Inserir Contratação",
  "ORG_COD": "12345678000100",
  "ID": "4567",
  "justificativa": "Texto opcional (obrigatório apenas para DELETE)"
}
```

## Autenticação JWT

O `database` do cliente viaja no token JWT — nunca no body da requisição. Cada banco tem seu próprio `con_jwt_secret` em `PNCP_CONTROLE_DADOS`. O Maker lê esse segredo e o usa para assinar o token de entrada; o NestJS valida com o mesmo segredo buscado do banco.

## Documentação interna

Consulte `CLAUDE.md` para documentação técnica completa: arquitetura, fluxos, regras de banco, segurança e padrão de views.
