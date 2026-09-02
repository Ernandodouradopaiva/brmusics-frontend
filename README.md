# brmusics-frontend

Interface web do **BRMusics** — escalas, repertórios e comunicação dos músicos.

Login local (CPF/senha). Sessão via cookie HttpOnly `BRMUSICS_ACCESS_TOKEN`. Não há fluxo Conecta.

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
Browser → /brmusics-api/* → brmusics-frontend (proxy) → brmusics-api:8081
```

- Tokens em cookies **HttpOnly** (sem localStorage)
- Middleware protege rotas autenticadas
- Whitelist/blacklist no proxy (bloqueia `/internal`, `/actuator`, swagger)

---

## Variáveis de ambiente

| Variável | Descrição | Dev default |
|----------|-----------|-------------|
| `NEXT_PUBLIC_APP_URL` | URL pública do frontend | `http://localhost:3002` |
| `BRMUSICS_API_INTERNAL_URL` | URL interna da API (servidor) | auto `localhost:8081` |
| `PORT` | Porta HTTP | `3002` |

### Resolução automática da API interna

Ordem em `src/lib/env.ts`:

1. `BRMUSICS_API_INTERNAL_URL` (override)
2. `BRMUSICS_API_SERVICE_HOST/PORT` (Kubernetes)
3. `http://brmusics-api:8081` (produção)
4. `http://localhost:8081` (dev)

---

## Desenvolvimento local

```bash
cp config/brmusics-frontend.dev.env.example config/brmusics-frontend.dev.env
# Edite CREDENCIAIS em config/*.dev.env

npm install
npm run dev
```

Acesse `http://localhost:3002`. Requer `brmusics-api` na porta `8081`.

---

## Segurança

- Proxy BFF com whitelist de rotas
- Security headers (HSTS, X-Frame-Options, nosniff)
- Erros 502 sem expor URL interna
- Middleware com cookie `BRMUSICS_ACCESS_TOKEN`

---

## Login

1. Usuário informa CPF e senha em `/login`
2. BFF chama `POST /auth/login` na API
3. Cookie de sessão é definido e o usuário vai para `/home`

---

## Docker

```bash
docker compose up -d
```

Imagem: `ernandopaiva/brmusics-frontend`

---

## Kubernetes

Referência: `docs/k8s/brmusics-frontend-configmap.example.yaml`

```yaml
BRMUSICS_API_INTERNAL_URL: http://<nome-do-service>:8081
NEXT_PUBLIC_APP_URL: https://SEU_DOMINIO_BRMUSICS
```

O Ingress deve enviar tráfego do domínio próprio (e `/brmusics-api/*`) para este frontend.

---

## Alinhamento com brmusics-api

| Frontend | Backend |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | `APP_CORS_ALLOWED_ORIGINS` (incluir) |
| `BRMUSICS_API_INTERNAL_URL` | `APP_API_INTERNAL_URL` na API |

Consulte `brmusics-api/README.md` para configuração do backend.
