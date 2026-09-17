# Finanças Pessoais

Web app de controle financeiro pessoal: registre receitas e despesas, categorize
cada lançamento e acompanhe receita, despesa e saldo do mês em uma única tela.

Construído a partir do PRD `PRD_FinancasPessoais_Aula41.pdf`.

## Funcionalidades

- **Landing page** pública com a proposta do produto.
- **Login e cadastro** por e-mail e senha (Supabase Auth), com rotas protegidas.
- **Dashboard** com cards de Receita, Despesa e Saldo, rosca de composição por
  categoria (receitas e despesas) e evolução dos últimos 6 meses.
- **CRUD de transações**: criar, editar e excluir, com descrição, valor, data,
  tipo e categoria.
- **Categorias pré-definidas**: Alimentação, Transporte, Moradia, Lazer, Saúde,
  Educação, Salário, Freelance e Outros.
- **Busca e filtros** por descrição, mês, ano, categoria e tipo — tudo refletido
  na URL, então um filtro é compartilhável.
- **Exportar CSV** do que está filtrado na tela, no formato que o Excel pt-BR abre
  direto (separador `;`, vírgula decimal e BOM UTF-8).
- **Responsivo** e com tema claro/escuro.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Estilos | Tailwind CSS v4, componentes no padrão shadcn/ui |
| Gráficos | Recharts |
| Backend | Supabase (PostgreSQL + Auth + Row Level Security) |
| Deploy | Vercel |

Não há backend próprio: o app fala direto com o Supabase, e o isolamento entre
contas é garantido por RLS no banco.

## Como rodar

### 1. Crie o projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Abra **SQL Editor** e rode o conteúdo de
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   Ele cria a tabela `transactions`, os índices e as políticas de RLS.
3. Em **Project Settings → API**, copie a *Project URL* e a chave *anon public*.

> Para testar sem confirmar e-mail, desligue **Authentication → Providers → Email →
> Confirm email**. Deixando ligado, o cadastro só entra depois do clique no link,
> que volta para `/auth/callback`.

### 2. Configure as variáveis

```bash
cp .env.example .env.local
```

Preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

A chave *anon* é pública por design — quem protege os dados é a RLS.

### 3. Suba o app

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build |
| `npm run lint` | ESLint |

## Deploy na Vercel

1. Suba o repositório para o GitHub.
2. Importe o projeto na Vercel.
3. Em **Settings → Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. No Supabase, em **Authentication → URL Configuration**, inclua o domínio da
   Vercel em *Site URL* e em *Redirect URLs* (`https://SEU-APP.vercel.app/auth/callback`).

## Organização do código

```
src/
  app/
    page.tsx                  landing page
    login/                    entrar e criar conta
    auth/                     signOut e callback de confirmação de e-mail
    dashboard/
      page.tsx                cards + gráficos
      transacoes/page.tsx     lista, filtros, CRUD e exportação
      actions.ts              Server Actions de criar/editar/excluir
  components/
    ui/                       primitivos no padrão shadcn/ui
    dashboard/                cards e gráficos
    transactions/             filtros, tabela e formulário
  lib/
    supabase/                 clients de browser, servidor e proxy
    transactions.ts           consultas e agregações
    categories.ts             categorias e suas cores fixas
    csv.ts, format.ts         exportação e formatação pt-BR
  proxy.ts                    renova a sessão e protege /dashboard
supabase/migrations/          schema e políticas de RLS
```

### Sobre as cores dos gráficos

Cada categoria tem uma cor fixa (definida em `globals.css` e referenciada em
`lib/categories.ts`), então nenhuma categoria troca de cor quando os valores
mudam. As fatias da rosca saem sempre na ordem fixa das categorias, e não por
valor: foi essa sequência de cores que passou na checagem de contraste e de
daltonismo. A ordem por valor aparece na lista abaixo do gráfico, que também
serve como versão tabular — todo valor do gráfico está escrito em algum lugar.
