# Testes

Dois testes que rodam contra um Supabase de verdade — não há mock.

| Arquivo | O que cobre |
| --- | --- |
| `rls.mjs` | Camada de dados: políticas de Row Level Security e constraints da tabela |
| `e2e.mjs` | Interface inteira num Chrome headless: cadastro, CRUD, filtros, CSV e logout |

## Antes de rodar

Os dois criam usuários de verdade no seu projeto, e isso só funciona com a
confirmação de e-mail desligada — senão o cadastro não devolve sessão e não há
como exercitar as políticas de RLS.

No painel do Supabase: **Authentication → Sign In / Providers → Email →
desligar "Confirm email" → Save**.

> Cuidado para não desligar o **"Enable Email provider"**, que fica logo acima:
> ele derruba o login inteiro. O que você quer é só o "Confirm email".

Os dois scripts conferem essa configuração antes de começar e param na hora, com
a instrução do que ajustar, em vez de falharem no meio do caminho.

**Religue depois de testar.** Com ele desligado, qualquer pessoa cria conta com
um e-mail que não é dela.

## Rodando

```bash
# camada de dados
node --env-file=.env.local tests/rls.mjs

# interface (precisa do app no ar em outro terminal)
npm run dev
node --env-file=.env.local tests/e2e.mjs
```

Ou pelos atalhos do `package.json`:

```bash
npm run test:rls
npm run test:e2e
```

## Depois de rodar

Os testes apagam as transações que criaram, mas **não conseguem apagar os
usuários** — isso exige a chave `service_role`, que de propósito não fica no
projeto. Remova os `teste-*@example.com` em **Authentication → Users**.

## Variáveis

| Variável | Padrão | Para quê |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | — | vem do `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | vem do `.env.local` |
| `BASE_URL` | `http://localhost:3000` | onde o app está rodando (só `e2e.mjs`) |
| `CHROME_PATH` | detectado | caminho do Chrome, se não estiver no lugar padrão |
| `SHOTS_DIR` | `/tmp` | onde salvar os screenshots do `e2e.mjs` |
| `TEST_EMAIL_DOMAIN` | `example.com` | domínio dos usuários descartáveis |
