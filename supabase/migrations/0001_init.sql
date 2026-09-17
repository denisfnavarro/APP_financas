-- Finanças Pessoais — schema inicial
-- Rode este arquivo no SQL Editor do Supabase (ou via `supabase db push`).

create extension if not exists "pgcrypto";

create type public.transaction_type as enum ('receita', 'despesa');

create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  description text not null check (char_length(trim(description)) between 1 and 120),
  amount      numeric(12, 2) not null check (amount > 0),
  date        date not null,
  type        public.transaction_type not null,
  category    text not null check (
                category in (
                  'alimentacao', 'transporte', 'moradia', 'lazer', 'saude',
                  'educacao', 'salario', 'freelance', 'outros'
                )
              ),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- O dashboard sempre lê "as transações do usuário em uma janela de datas".
create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_user_category_idx on public.transactions (user_id, category);

-- Busca por descrição sem diferenciar acento/caixa.
create extension if not exists "pg_trgm";
create index transactions_description_trgm_idx
  on public.transactions using gin (description gin_trgm_ops);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: cada usuário só enxerga e altera as próprias transações.
-- ---------------------------------------------------------------------------
alter table public.transactions enable row level security;

create policy "Usuário lê suas transações"
  on public.transactions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuário cria suas transações"
  on public.transactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Usuário edita suas transações"
  on public.transactions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuário exclui suas transações"
  on public.transactions for delete
  to authenticated
  using (auth.uid() = user_id);
