# Markt — Controle de Compras em Mercados

App web (PWA) para controlar compras no supermercado: escolha do mercado por
geolocalização, limite de gasto opcional, leitura de código de barras/QR para
adicionar itens, comparação automática de preço com a última compra do mesmo
produto, histórico de compras e análises de economia doméstica.

## Estrutura

- `backend/` — API Node.js + Express + TypeScript + Prisma (SQLite)
- `frontend/` — App React + Vite + TypeScript + Tailwind CSS (PWA)

## Como rodar localmente

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

Sobe em `http://localhost:4000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Sobe em `http://localhost:5173` (proxy `/api` → backend na porta 4000).

Abra `http://localhost:5173` no navegador, crie uma conta com um CPF válido e
comece a registrar compras.

## Fluxo principal

1. **Login/cadastro** por CPF + senha.
2. **Nova compra**: toque em "Usar minha localização" para ver mercados
   próximos (via OpenStreetMap/Overpass) ou informe o mercado manualmente.
   Defina um limite de gasto opcional.
3. **Adicionar item**: leia o código de barras pela câmera ou digite
   manualmente. O produto é identificado automaticamente (Open Food Facts) ou
   cadastrado na hora se for novo. Informe preço e quantidade — o sistema
   mostra se o item ficou mais caro, mais barato ou igual à última compra.
4. **Finalizar compra** quando terminar.
5. **Histórico** e **Análises** mostram compras passadas, maiores altas/quedas
   de preço, gasto por período e por categoria, e destaques como ticket médio
   e mercado mais econômico.

## Observações técnicas

- Banco de dados SQLite local (`backend/prisma/dev.db`) — fácil de trocar para
  Postgres depois via `DATABASE_URL` no `.env` e ajuste do `provider` no
  `schema.prisma`.
- Câmera e geolocalização exigem HTTPS ou `localhost`; ambos os recursos têm
  fallback manual (digitar código de barras / informar mercado) para quando
  não estiverem disponíveis.
