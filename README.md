# projetoA-frontend

Interface web do **Projeto A** — integrada ao **Conecta**. Login direto, fluxo Conecta via handoff e gestão administrativa.

Pode rodar em **domínio próprio** ou ser acessado via **Conecta**.

---

## Tecnologias

| Tecnologia | Versão |
|------------|--------|
| Next.js | 15.5 (App Router) |
| React | 18.3 |
| TypeScript | 5.6 |
| Node.js | 20 |

Build: **standalone** para Docker.

---

## Arquitetura BFF

```
Browser → /projetoA-api/* → projetoA-frontend (proxy) → projetoA-api:8081
```

- Tokens em cookies **HttpOnly** (sem localStorage)
- Middleware protege rotas autenticadas
- Whitelist/blacklist no proxy (bloqueia `/internal`, `/actuator`, swagger)

---

## Variáveis de ambiente

| Variável | Descrição | Dev default |
|----------|-----------|-------------|
| `NEXT_PUBLIC_APP_URL` | URL pública do frontend | `http://localhost:3002` |
| `PROJETO_A_API_INTERNAL_URL` | URL interna da API (servidor) | auto `localhost:8081` |
| `CONECTA_INTERNAL_BASE_URL` | URL do Conecta para bootstrap | `https://conecta.sps.ce.gov.br/conecta-api` |
| `CONECTA_SISTEMA_CODIGO` | Sigla no Conecta | `PROJETO_A` |
| `CONECTA_CLIENT_SECRET` | Secret S2S do sistema no painel Conecta | (obrigatório) |
| `CONECTA_BOOTSTRAP_OPTIONAL` | não falha a subida sem chave BFF | `true` |
| `PORT` | Porta HTTP | `3002` |

A chave BFF e metadados (`urlBase`, `issuer`, …) vêm do bootstrap Conecta na subida (`instrumentation.ts`) com `CONECTA_CLIENT_SECRET` — não configure a chave BFF manualmente em produção. `NEXT_PUBLIC_APP_URL` / `APP_URL` devem coincidir com `url_base` no painel Conecta.

### Resolução automática da API interna

Ordem em `src/lib/env.ts`:

1. `PROJETO_A_API_INTERNAL_URL` (override)
2. `PROJETO_A_API_SERVICE_HOST/PORT` (Kubernetes)
3. `http://projeto-a-api:8081` (produção)
4. `http://localhost:8081` (dev)

---

## Desenvolvimento local

```bash
cp config/projetoA-frontend.dev.env.example config/projetoA-frontend.dev.env
# Edite CREDENCIAIS em config/*.dev.env

npm install
npm run dev
```

Acesse `http://localhost:3002`. Requer `projetoA-api` na porta `8081`.

### Integração Conecta (dev)

Em desenvolvimento, as URLs do Conecta ficam no próprio `config/*-frontend.dev.env`, apontando para produção via o proxy BFF:

`CONECTA_INTERNAL_BASE_URL=https://conecta.sps.ce.gov.br/conecta-api`

Homologação usa `https://hconecta.sps.ce.gov.br/conecta-api`.

Use o mesmo `CONECTA_CLIENT_SECRET` da API (secret em claro do sistema no painel Conecta).


---

## Segurança (alinhada ao conecta-frontend)

- Proxy BFF com whitelist de rotas
- Security headers (HSTS, X-Frame-Options, nosniff)
- Erros 502 sem expor URL interna
- Middleware com cookie `PROJETO_A_ACCESS_TOKEN`

---

## Fluxo Conecta

1. Usuário autentica no Conecta
2. Conecta redireciona para `/auth/conecta-complete?ticket=...`
3. BFF chama `POST /auth/conecta/complete` na API com `X-Bff-Internal-Key`
4. Cookies de sessão são definidos e usuário vai para `/home`

---

## Docker

```bash
docker compose up -d
```

Imagem: `hub.sps.ce.gov.br/conecta/projetoA-frontend`

---

## Kubernetes

Referência: `docs/k8s/projetoA-frontend-configmap.example.yaml`

```yaml
PROJETO_A_API_INTERNAL_URL: http://<nome-do-service>:8081
NEXT_PUBLIC_APP_URL: https://SEU_DOMINIO_PROJETOA
CONECTA_INTERNAL_BASE_URL: http://conecta-api:8080
CONECTA_SISTEMA_CODIGO: PROJETO_A
```

A chave BFF é obtida do Conecta na subida — não inclua `PROJETO_A_BFF_INTERNAL_KEY` no ConfigMap.

O Ingress deve enviar tráfego do domínio próprio (e `/projetoA-api/*`) para este frontend.

---

## Alinhamento com projetoA-api

| Frontend | Backend / Conecta |
|----------|-------------------|
| `NEXT_PUBLIC_APP_URL` | `APP_CORS_ALLOWED_ORIGINS` (incluir) + `url_base` no cadastro Conecta |
| `CONECTA_INTERNAL_BASE_URL` + `CONECTA_SISTEMA_CODIGO` + `CONECTA_CLIENT_SECRET` | Cadastro do sistema `PROJETO_A` no Conecta |
| `PROJETO_A_API_INTERNAL_URL` | `APP_API_INTERNAL_URL` na API |
| `CONECTA_INTERNAL_BASE_URL` | Service `conecta-api` no cluster |

Consulte `projetoA-api/README.md` para configuração do backend.
