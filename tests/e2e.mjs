/**
 * Teste ponta a ponta pela interface: dirige um Chrome headless contra o app
 * rodando, exercitando cadastro, CRUD, filtros, exportação e logout.
 *
 *   npm run dev                                   # em outro terminal
 *   node --env-file=.env.local tests/e2e.mjs
 *
 * Requer "Confirm email" desligado — veja tests/README.md.
 * Variáveis opcionais: BASE_URL (padrão http://localhost:3000), CHROME_PATH.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

import {
  createReporter,
  explicaFaltaDeSessao,
  sleep,
  supabaseEnv,
  TEST_EMAIL_DOMAIN,
  verificaConfiguracaoDeAuth,
} from "./helpers.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const { url: SUPABASE_URL, key: SUPABASE_KEY } = supabaseEnv();
const { check, finish } = createReporter();

const CHROME = process.env.CHROME_PATH ?? [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => existsSync(p));

if (!CHROME) {
  console.error("Chrome não encontrado. Informe o caminho em CHROME_PATH.");
  process.exit(2);
}

const PORT = 9333;
const PROFILE = "/tmp/chrome-e2e-profile";
const DOWNLOADS = "/tmp/chrome-e2e-downloads";
const SHOTS = process.env.SHOTS_DIR ?? "/tmp";

rmSync(PROFILE, { recursive: true, force: true });
rmSync(DOWNLOADS, { recursive: true, force: true });
mkdirSync(DOWNLOADS, { recursive: true });

const stamp = Date.now();
const EMAIL = `teste-ui-${stamp}@${TEST_EMAIL_DOMAIN}`;
const SENHA = `Senha-ui-${stamp}!`;

await verificaConfiguracaoDeAuth(SUPABASE_URL, SUPABASE_KEY);

// Falha cedo e com mensagem clara se o app não estiver no ar.
try {
  const r = await fetch(`${BASE}/login`);
  if (!r.ok) throw new Error(`status ${r.status}`);
} catch (e) {
  console.error(`App não respondeu em ${BASE} (${e.message}). Rode 'npm run dev' antes.`);
  process.exit(2);
}

const chrome = spawn(CHROME, [
  "--headless", "--disable-gpu", "--no-sandbox", `--remote-debugging-port=${PORT}`,
  "--window-size=1280,1400", `--user-data-dir=${PROFILE}`, "about:blank",
]);

for (let i = 0; i < 80; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {}
  await sleep(300);
}

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let msgId = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++msgId; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((r) => (ws.onopen = r));

await send("Page.enable");
await send("Runtime.enable");
await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: DOWNLOADS });

async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300));
  return r.result?.result?.value;
}

/**
 * React ignora `el.value = x`: é preciso usar o setter nativo e disparar o
 * evento à mão. E os componentes Radix abrem no pointerdown, não no click.
 */
const HELPERS = `
window.__t = {
  setInput(sel, value) {
    const el = document.querySelector(sel);
    if (!el) throw new Error("input nao encontrado: " + sel);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  },
  realClick(el) {
    if (!el) throw new Error("elemento nulo no clique");
    const o = { bubbles: true, cancelable: true, button: 0, pointerId: 1, isPrimary: true, view: window };
    el.dispatchEvent(new PointerEvent("pointerdown", o));
    el.dispatchEvent(new MouseEvent("mousedown", o));
    el.dispatchEvent(new PointerEvent("pointerup", o));
    el.dispatchEvent(new MouseEvent("mouseup", o));
    el.click();
    return true;
  },
  clickText(text, sel = "button,a,[role=option],[role=tab]") {
    const el = [...document.querySelectorAll(sel)].find(
      (e) => e.textContent.trim().toLowerCase().includes(text.toLowerCase())
    );
    if (!el) throw new Error("nao achei por texto: " + text);
    return window.__t.realClick(el);
  },
  clickSel(sel) { return window.__t.realClick(document.querySelector(sel)); },
  text() { return document.body.innerText; },
};
true;
`;
const prep = () => evaluate(HELPERS);

async function goto(path) {
  await send("Page.navigate", { url: `${BASE}${path}` });
  await sleep(2500);
  await prep();
}
const corpo = () => evaluate(`window.__t.text()`);

async function shot(name) {
  const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  writeFileSync(`${SHOTS}/${name}.png`, Buffer.from(s.result.data, "base64"));
}

// ---------------------------------------------------------------- 1. cadastro
await goto("/login");
await evaluate(`window.__t.clickText("Criar conta")`);
await sleep(300);
await evaluate(`window.__t.setInput("#email", ${JSON.stringify(EMAIL)})`);
await evaluate(`window.__t.setInput("#password", ${JSON.stringify(SENHA)})`);
await evaluate(`window.__t.clickSel("form button[type=submit]")`);
await sleep(5000);

let rota = await evaluate(`location.pathname`);
if (rota !== "/dashboard") {
  await prep();
  console.error("\n" + explicaFaltaDeSessao());
  console.error("TELA:", (await corpo()).slice(0, 300));
}
check("cadastro pela UI redireciona para o dashboard", rota === "/dashboard", `pathname=${rota}`);

await prep();
let txt = await corpo();
check("dashboard mostra os cards de resumo", /Receitas/.test(txt) && /Despesas/.test(txt) && /Saldo/.test(txt));
check("dashboard de conta nova começa zerado", /R\$\s?0,00/.test(txt));
await shot("e2e-01-dashboard-vazio");

// ------------------------------------------------------- 2. criar lançamentos
async function criarLancamento({ descricao, valor, data, tipo, categoria }) {
  await prep();
  await evaluate(`window.__t.clickText("Novo lançamento")`);
  await sleep(900);
  await prep();
  await evaluate(`window.__t.clickText(${JSON.stringify(tipo)}, "[role=dialog] button")`);
  await sleep(200);
  await evaluate(`window.__t.setInput("#description", ${JSON.stringify(descricao)})`);
  await evaluate(`window.__t.setInput("#amount", ${JSON.stringify(valor)})`);
  await evaluate(`window.__t.setInput("#date", ${JSON.stringify(data)})`);
  await evaluate(`window.__t.clickSel("#category")`);
  await sleep(700);
  await prep();
  await evaluate(`window.__t.clickText(${JSON.stringify(categoria)}, "[role=option]")`);
  await sleep(400);
  await prep();
  await evaluate(`window.__t.clickText("Adicionar", "[role=dialog] button[type=submit]")`);
  await sleep(3000);
}

await goto("/dashboard/transacoes");
await criarLancamento({ descricao: "Salário de setembro", valor: "7550,00", data: "2026-09-05", tipo: "Receita", categoria: "Salário" });
await prep();
txt = await corpo();
check("lançamento de receita aparece na lista", /Salário de setembro/.test(txt));
check("valor formatado em pt-BR", /7\.550,00/.test(txt));

await criarLancamento({ descricao: "Mercado do mês", valor: "432,90", data: "2026-09-12", tipo: "Despesa", categoria: "Alimentação" });
await criarLancamento({ descricao: "Aluguel", valor: "1850", data: "2026-09-10", tipo: "Despesa", categoria: "Moradia" });
await prep();
txt = await corpo();
check("três lançamentos na lista", /Mercado do mês/.test(txt) && /Aluguel/.test(txt));
check("contador mostra 3 lançamentos", /3 lançamentos/.test(txt));
check("saldo calculado (7550 − 2282,90 = 5267,10)", /5\.267,10/.test(txt));
await shot("e2e-02-transacoes");

// ------------------------------------------------------------ 3. exportar CSV
await evaluate(`window.__t.clickText("Exportar CSV")`);
await sleep(2500);
const arquivos = readdirSync(DOWNLOADS).filter((f) => f.endsWith(".csv"));
check("exportar CSV baixa um arquivo", arquivos.length > 0, arquivos.join(", "));
if (arquivos.length) {
  const csv = readFileSync(`${DOWNLOADS}/${arquivos[0]}`, "utf8");
  const linhas = csv.trim().split("\r\n");
  check("CSV tem BOM UTF-8", csv.charCodeAt(0) === 0xfeff);
  check("CSV usa ; como separador", linhas[0].replace(/^﻿/, "") === "Data;Descrição;Categoria;Tipo;Valor");
  check("CSV traz as 3 linhas", linhas.length === 4, `${linhas.length} com cabeçalho`);
  check("CSV usa vírgula decimal e sinal na despesa", /-432,90/.test(csv));
}

// ----------------------------------------------------------------- 4. filtros
await goto("/dashboard/transacoes?q=aluguel");
txt = await corpo();
check("busca por descrição filtra a lista", /Aluguel/.test(txt) && !/Mercado do mês/.test(txt));

await goto("/dashboard/transacoes?categoria=moradia");
txt = await corpo();
check("filtro por categoria funciona", /Aluguel/.test(txt) && !/Salário de setembro/.test(txt));

await goto("/dashboard/transacoes?tipo=receita");
txt = await corpo();
check("filtro por tipo funciona", /Salário de setembro/.test(txt) && !/Aluguel/.test(txt));

await goto("/dashboard/transacoes?mes=1&ano=2020");
txt = await corpo();
check("período sem dados mostra estado vazio", /Nenhum lançamento por aqui/.test(txt));

// --------------------------------------------------------------- 5. dashboard
await goto("/dashboard");
txt = await corpo();
check("dashboard soma as receitas", /7\.550,00/.test(txt));
check("dashboard lista categorias na composição", /Moradia/.test(txt) && /Alimentação/.test(txt) && /Salário/.test(txt));
await shot("e2e-03-dashboard-com-dados");

// ------------------------------------------------------------------ 6. editar
await goto("/dashboard/transacoes");
await evaluate(`window.__t.clickSel("button[aria-label^='Editar Aluguel']")`);
await sleep(1200);
await prep();
await evaluate(`window.__t.setInput("#description", "Aluguel + condomínio")`);
await evaluate(`window.__t.setInput("#amount", "2100,00")`);
await evaluate(`window.__t.clickText("Salvar alterações", "[role=dialog] button[type=submit]")`);
await sleep(3000);
await prep();
txt = await corpo();
check("edição salva a nova descrição", /Aluguel \+ condomínio/.test(txt));
check("edição salva o novo valor", /2\.100,00/.test(txt));

// ----------------------------------------------------------------- 7. excluir
await evaluate(`window.__t.clickSel("button[aria-label^='Excluir Aluguel']")`);
await sleep(1000);
await prep();
txt = await corpo();
check("exclusão pede confirmação", /Excluir lançamento\?/.test(txt));
await evaluate(`window.__t.clickText("Excluir", "[role=dialog] button")`);
await sleep(3000);
await prep();
txt = await corpo();
check("exclusão remove o lançamento", !/Aluguel \+ condomínio/.test(txt));
check("sobraram 2 lançamentos", /2 lançamentos/.test(txt));

// ------------------------------------------------------------------ 8. logout
await evaluate(`window.__t.clickSel("button[aria-label='Sair da conta']")`);
await sleep(3000);
rota = await evaluate(`location.pathname`);
check("logout volta para o login", rota === "/login", `pathname=${rota}`);

await goto("/dashboard");
rota = await evaluate(`location.pathname`);
check("sem sessão, /dashboard volta a barrar", rota === "/login", `pathname=${rota}`);

ws.close();
chrome.kill();

// ------------------------------------------------------------------ 9. limpeza
const limpeza = createClient(SUPABASE_URL, SUPABASE_KEY);
const { data: sessao } = await limpeza.auth.signInWithPassword({ email: EMAIL, password: SENHA });
if (sessao?.user) {
  await limpeza.from("transactions").delete().eq("user_id", sessao.user.id);
  const { data: resto } = await limpeza.from("transactions").select("id");
  check("limpeza: transações do teste removidas", resto?.length === 0, `${resto?.length} restante(s)`);
}

const ok = finish(`\nUsuário criado (apague em Authentication → Users):\n  ${EMAIL}`);
process.exit(ok ? 0 : 1);
