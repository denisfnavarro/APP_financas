/**
 * Testa a camada de dados direto no Supabase: as políticas de Row Level Security
 * e as constraints da tabela `transactions`.
 *
 *   node --env-file=.env.local tests/rls.mjs
 *
 * Cria dois usuários descartáveis para provar que um não alcança os dados do
 * outro. Requer "Confirm email" desligado — veja tests/README.md.
 */
import { createClient } from "@supabase/supabase-js";

import {
  createReporter,
  explicaFalhaDeCadastro,
  explicaFaltaDeSessao,
  supabaseEnv,
  TEST_EMAIL_DOMAIN,
  verificaConfiguracaoDeAuth,
} from "./helpers.mjs";

const { url, key } = supabaseEnv();
const { check, finish } = createReporter();
const stamp = Date.now();

await verificaConfiguracaoDeAuth(url, key);

async function novoUsuario(tag) {
  const client = createClient(url, key);
  const email = `teste-${tag}-${stamp}@${TEST_EMAIL_DOMAIN}`;
  const password = `Senha-${tag}-${stamp}!`;
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) {
    console.error(`\nNão consegui criar o usuário de teste: ${explicaFalhaDeCadastro(error)}`);
    process.exit(2);
  }
  if (!data.session) {
    console.error("\n" + explicaFaltaDeSessao());
    process.exit(2);
  }
  return { client, email, password, userId: data.user.id };
}

const a = await novoUsuario("a");
check("cadastro cria sessão (usuário A)", Boolean(a.userId), a.email);

const b = await novoUsuario("b");
check("cadastro cria sessão (usuário B)", Boolean(b.userId), b.email);

// --- A cria transações -------------------------------------------------------
const { data: criadas, error: erroInsert } = await a.client
  .from("transactions")
  .insert([
    { description: "Salário de setembro", amount: 7550, date: "2026-09-05", type: "receita", category: "salario", user_id: a.userId },
    { description: "Mercado", amount: 432.9, date: "2026-09-12", type: "despesa", category: "alimentacao", user_id: a.userId },
  ])
  .select();
check("A cria duas transações", !erroInsert && criadas?.length === 2, erroInsert?.message ?? "");

const alvo = criadas?.[0];

const { data: lidasA } = await a.client.from("transactions").select("*");
check("A lê as próprias transações", lidasA?.length === 2, `${lidasA?.length} linha(s)`);

// --- Isolamento entre contas -------------------------------------------------
const { data: lidasB } = await b.client.from("transactions").select("*");
check("RLS: B não enxerga as transações de A", lidasB?.length === 0, `${lidasB?.length} linha(s) visíveis`);

const { data: updB } = await b.client
  .from("transactions").update({ description: "invadido" }).eq("id", alvo.id).select();
check("RLS: B não consegue editar linha de A", (updB?.length ?? 0) === 0, `${updB?.length ?? 0} linha(s) afetadas`);

const { data: delB } = await b.client
  .from("transactions").delete().eq("id", alvo.id).select();
check("RLS: B não consegue excluir linha de A", (delB?.length ?? 0) === 0, `${delB?.length ?? 0} linha(s) afetadas`);

const { error: erroForja } = await a.client.from("transactions").insert({
  description: "forjada", amount: 10, date: "2026-09-18", type: "despesa", category: "outros", user_id: b.userId,
});
check("RLS: A não consegue gravar em nome de B", Boolean(erroForja), erroForja?.code ?? "sem erro (RUIM)");

// --- Constraints da tabela ---------------------------------------------------
const casos = [
  ["valor precisa ser > 0", { amount: -5, category: "outros", type: "despesa" }],
  ["categoria fora da lista é rejeitada", { amount: 10, category: "cripto", type: "despesa" }],
  ["tipo fora do enum é rejeitado", { amount: 10, category: "outros", type: "estorno" }],
  ["descrição vazia é rejeitada", { amount: 10, category: "outros", type: "despesa", description: "   " }],
];
for (const [nome, campos] of casos) {
  const { error } = await a.client.from("transactions").insert({
    description: "invalida", date: "2026-09-18", user_id: a.userId, ...campos,
  });
  check(`constraint: ${nome}`, Boolean(error), error?.code ?? "sem erro (RUIM)");
}

// --- A edita e exclui as próprias --------------------------------------------
const { data: updA } = await a.client
  .from("transactions").update({ description: "Salário de setembro (ajustado)" }).eq("id", alvo.id).select();
check("A edita a própria transação", updA?.length === 1, updA?.[0]?.description ?? "");

const linha = updA?.[0];
check("trigger atualiza updated_at", Boolean(linha) && linha.updated_at !== linha.created_at, linha?.updated_at ?? "");

const { data: delA } = await a.client.from("transactions").delete().eq("id", alvo.id).select();
check("A exclui a própria transação", delA?.length === 1);

// --- Limpeza -----------------------------------------------------------------
await a.client.from("transactions").delete().eq("user_id", a.userId);
const { data: sobrou } = await a.client.from("transactions").select("id");
check("limpeza: nenhuma transação de teste sobrou", sobrou?.length === 0, `${sobrou?.length} restante(s)`);

const ok = finish(
  `\nUsuários criados (apague em Authentication → Users):\n  ${a.email}\n  ${b.email}`
);
process.exit(ok ? 0 : 1);
