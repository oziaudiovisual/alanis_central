# Alanis Central de Vendas

Sistema para receber webhooks da Cakto, armazenar transações (PIX, aprovadas, recusadas, reembolsos, chargebacks) e manter uma lista ativa de compradores.

## Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL 16
- **Views**: EJS (server-side rendering)
- **Deploy**: Docker → EasyPanel

## Quick Start (Local)

```bash
# 1. Clone
git clone https://github.com/SEU_USUARIO/alanis_central.git
cd alanis_central

# 2. Copie o .env
cp .env.example .env

# 3. Suba com Docker Compose
docker compose up -d

# 4. Acesse
open http://localhost:3000
```

**Login padrão**: `admin@alanis.com` / `admin123`

## Deploy no EasyPanel

1. Crie o repositório `alanis_central` no GitHub
2. No EasyPanel, importe o template JSON (`easypanel-template.json`)
3. Configure as variáveis de ambiente (`DB_PASSWORD`, `SESSION_SECRET`)
4. Deploy

## Webhook da Cakto

Configure na Cakto a URL: `https://SEU_DOMINIO/webhook/cakto`

Eventos suportados:
- `compra_aprovada`
- `compra_recusada`
- `pix_gerado`
- `reembolso`
- `chargeback`
