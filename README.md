# 💱 Conversor de Moedas — Next.js + TypeScript + Tailwind

Aplicação simples para converter valores entre **USD**, **EUR** e **BRL**.

---

## ✨ Funcionalidades

- Conversão entre **USD/EUR/BRL**
- **Provider pattern** de taxas:
  - **HTTP** (dinâmico) via API configurável
  - **Estático** (fallback) quando a API falhar
- Precisão financeira com arredondamento bancário
- Validações de entrada e mensagens de erro
- Acessibilidade: labels, `aria-live`, foco visível
- Pronto para rodar em **Docker** (produção) ou localmente (`npm run dev`)

---

## 🧱 Stack

- **Next.js 15** + **TypeScript**
- **Tailwind CSS**
- **decimal.js** (cálculos monetários precisos)
- Vitest + Testing Library (Opcional para testes)

---

## 🗂️ Arquitetura
````bash
    src/
        app/
            page.tsx           # tela do conversor (App Router)
            globals.css
        core/
            money.ts           # tipos de moeda e helpers
            convert.ts         # função pura de conversão (usa decimal.js)
        providers/
            static.ts          # taxas estáticas (fallback)
            http.ts            # busca taxa em API externa
        components/
            AmountInput.tsx
            CurrencySelect.tsx
            SwapButton.tsx
            ResultPanel.tsx
            ErrorBanner.tsx
    tests/
        convert.spec.ts      # exemplo de teste unitário (opcional)
```



**Decisões de arquitetura** (resumo):
- **Provider pattern**: alterna entre `HttpRateProvider` e `StaticRateProvider` com a mesma interface.
- **Precisão**: toda conta monetária usa `decimal.js`; arredondamento `ROUND_HALF_EVEN`.
- **Fallback resiliente**: erro na API ⇒ usa tabela fixa e informa no UI.
- **UI desacoplada**: componentes pequenos e reusáveis.

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

Arquivos relevantes:

- Dockerfile: build em múltiplas fases → standalone do Next.
- docker-compose.prod.yml:
    - expõe porta 3000
    - permite definir `NEXT_PUBLIC_RATE_API_BASE` via env/compose

> Observação: o compose de dev via Docker foi deixado fora por questões de hot-reload no Windows. Para desenvolvimento diário, use npm run dev fora do Docker.

