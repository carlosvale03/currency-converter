![CI](https://github.com/carlosvale03/currency-converter/actions/workflows/ci.yml/badge.svg)

# 💱 Conversor de Moedas — Next.js + TypeScript + Tailwind

Conversão precisa e resiliente entre **moedas fiat** (USD, EUR, BRL, GBP, JPY, CAD, AUD, CHF) e **criptomoedas** (BTC, ETH, USDT).
Taxa dinâmica com múltiplos provedores, gráfico intraday de 7 dias e fallback automático para tabela estática.

---

## ✨ Funcionalidades

- Conversão entre **FIAT↔FIAT**, **FIAT↔CRYPTO** e **CRYPTO↔CRYPTO**
- Taxa dinâmica com fallback em cascata
  - Intraday: **Yahoo Finance** (sem chave)
  - Diário: **Frankfurter / ECB** (FIAT, dias úteis)
  - Fallback FIAT: **Open ER-API** (sem chave)
  - Fallback final FIAT+CRYPTO: **Currency-API (CDN)** (sem chave)
  - Se tudo falhar: **tabela estática** (para não bloquear o usuário)
- **Gráfico** (7 dias) ao lado do conversor (desktop) e em modal (mobile), com tooltip/hover
- Precisão monetária com `decimal.js` e arredondamento **ROUND_HALF_EVEN**
- **Acessibilidade**: labels, `aria-live`, foco visível, ordem de tab, skip-link
- **UX**: skeleton/loader, toasts (erros/avisos com retry), estados de hover/focus
- **Design**: paleta baseada no azul-petróleo #003C5F, cards, grid elegante
- **Docker** (produção): imagem slim usando **Next** standalone, **HEALTHCHECK** e `compose`

> 🔎 Para criptomoedas: quando o sistema entrar no fallback estático, os valores são estimativas. Prefira a taxa dinâmica sempre que possível.

---

## 🧱 Stack

- **Next.js 15** + **TypeScript**
- **Tailwind CSS**
- **decimal.js** (cálculos monetários precisos)
- Infra: **Docker** (produção), **GitHub Actions** (CI)

---

## 🗂️ Arquitetura
```bash
    src/
        app/
            api/
            rate/route.ts            # taxa "latest" (server): fallback Yahoo→Frankfurter→OpenER→Currency-API
            timeseries/route.ts      # série 7d (server): Yahoo intraday → Frankfurter diário
            layout.tsx
            page.tsx                   # página (hero, conversor, gráfico, seções)
            globals.css                # tokens de cor (CSS vars), utilitários e temas
        components/
            AmountInput.tsx
            CurrencySelect.tsx
            SwapButton.tsx
            ResultPanel.tsx
            ErrorBanner.tsx
            ToastProvider.tsx          # toasts + retry
            Skeleton.tsx               # loaders
            Modal.tsx                  # modal para gráfico (mobile)
            RateChart.tsx              # SVG interativo (tooltip/hover)
            Section.tsx / H2.tsx / FeatureCard.tsx / SkipLink.tsx
        core/
            money.ts                   # tipos/listas de moedas; fiat + crypto; helpers de label
            convert.ts                 # função pura de conversão com decimal.js
        providers/
            http.ts                    # cliente fino: chama /api/rate (nenhuma variável de servidor aqui)
            static.ts                  # fallback estático USD-base (FIAT e CRYPTO, cripto ~aprox.)
        server/
            rates/
            latest.ts                # lógica server-side de "latest" (usa env + fetch externos)
            timeseries.ts            # lógica server-side de série (type-safe, sem any)
        env/
            server.ts                  # validação de env com Zod
```



**Decisões de arquitetura** (resumo):
- **Server first para integrações**: todo acesso a APIs externas/ENV fica no servidor (`/api/*`).
- **Provider pattern**: `getLatestRateWithFallback()` e `getSeriesWithFallback()` padronizam o fluxo e o fallback.
- **UI desacoplada** e componentizada; estilos via tokens (`:root` CSS vars).

---

## 🌍 Moedas suportadas

- FIAT: `USD, EUR, BRL, GBP, JPY, CAD, AUD, CHF`
- CRYPTO: `BTC, ETH, USDT` (marcadas como “· CRYPTO” no seletor)

---

## 🔧 Rodando localmente (dev)

Pré-requisitos: Node 18+ e npm.

```bash
# 1) instalar deps
npm install

# 2) opcional: configurar a URL da API de câmbio
cp .env.example .env.local

# 3) rodar em dev
npm run dev
# abra http://localhost:3000
```

## Rodando com Docker (produção)

Pensado para o avaliador subir em 1 comando.

```bash
# build & run
docker compose -f docker-compose.prod.yml up --build

# acesse
# http://localhost:3000
```

O que o Docker faz:
- Build multi-stage → **Next standalone** (slim)
- **HEALTHCHECK** via HTTP
- Variáveis lidas de env/compose

> Nota: para hot-reload durante o desenvolvimento, prefira npm run dev fora do Docker.

---

## ⚙️ Variáveis de ambiente

Arquivo: `.env.example` (sem segredos)
```bash
    FRANKFURTER_BASE=https://api.frankfurter.dev/v1
    OPEN_ER_API_BASE=https://open.er-api.com/v6
    # CDN oficial (npm path). O código tenta fallback ao path legado (GH) se necessário.
    CURRENCY_API_CDN_BASE=https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies

    # Client log level: silent | error | warn | info | debug
    NEXT_PUBLIC_LOG_LEVEL=info
```

---

## 🧪 Qualidade e Acessibilidade

- Validação de env com Zod em `env/server.ts`
- Error Boundary e logger (silenciado em prod via `NEXT_PUBLIC_LOG_LEVEL`)
- A11y: foco visível, aria-live, ordem de tab consistente, skip-link (`Ir para o conteúdo`)
- Guard-rails de input: limite de dígitos, normalização vírgula→ponto, tratamento de overflow
- Toasts com retry para falhas dinâmicas

---

## 📜 Licença

MIT — use e adapte à vontade.