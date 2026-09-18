/** Utilidades compartilhadas pelos testes. */

export function env(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    console.error(
      `\nFalta a variável ${name}.\n` +
        `Rode os testes com o .env.local carregado:\n` +
        `  node --env-file=.env.local tests/<arquivo>.mjs\n`
    );
    process.exit(2);
  }
  return value;
}

export function supabaseEnv() {
  return {
    url: env("NEXT_PUBLIC_SUPABASE_URL"),
    key: env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function createReporter() {
  const results = [];
  return {
    check(name, passed, detail = "") {
      results.push({ name, passed, detail });
      console.log(`${passed ? "PASS  " : "FALHOU"}  ${name}${detail ? ` — ${detail}` : ""}`);
      return passed;
    },
    finish(extra = "") {
      const falhas = results.filter((r) => !r.passed);
      console.log(`\n${results.length - falhas.length}/${results.length} verificações passaram`);
      if (falhas.length) console.log("FALHAS: " + falhas.map((f) => f.name).join(" | "));
      if (extra) console.log(extra);
      return falhas.length === 0;
    },
  };
}

/** Domínio dos e-mails descartáveis. Só é usado quando nada é enviado de fato. */
export const TEST_EMAIL_DOMAIN = process.env.TEST_EMAIL_DOMAIN ?? "example.com";

const AJUSTE =
  "Ajuste em Authentication → Sign In / Providers → Email:\n" +
  "  • 'Enable Email provider'  -> LIGADO\n" +
  "  • 'Confirm email'          -> DESLIGADO (religue depois de testar)";

/**
 * Traduz as três formas que a mesma causa assume na resposta do Supabase.
 *
 * Com "Confirm email" ligado o Supabase passa a validar a entregabilidade do
 * endereço antes de enviar, e recusa domínios reservados como example.com — ou
 * seja, a configuração errada aparece como "e-mail inválido", não como falta de
 * sessão. Sem esse mapeamento a mensagem de erro manda a pessoa para o lado errado.
 */
export function explicaFalhaDeCadastro(error) {
  const msg = error?.message ?? "";

  if (/invalid/i.test(msg) && /email/i.test(msg)) {
    return (
      `o Supabase recusou o endereço de teste ("${msg}").\n` +
      "Quase sempre isso é 'Confirm email' LIGADO: ao precisar enviar o e-mail,\n" +
      `o Supabase valida o domínio e rejeita os reservados como ${TEST_EMAIL_DOMAIN}.\n` +
      AJUSTE +
      "\n(Se o provedor exigir um domínio real, defina TEST_EMAIL_DOMAIN.)"
    );
  }

  if (/provider.*disabled|signups.*disabled/i.test(msg)) {
    return `o provedor de e-mail está desligado ("${msg}").\n` + AJUSTE;
  }

  return `${msg}\n` + AJUSTE;
}

/**
 * Checagem barata antes de qualquer teste: pergunta ao Supabase como a
 * autenticação está configurada. Custa uma requisição e não cria usuário —
 * bem melhor do que descobrir a configuração errada no meio do caminho.
 */
export async function verificaConfiguracaoDeAuth(url, key) {
  let settings;
  try {
    const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
    settings = await r.json();
  } catch (e) {
    console.error(`\nNão consegui falar com o Supabase em ${url}: ${e.message}`);
    process.exit(2);
  }

  const problemas = [];
  if (settings?.external?.email !== true) problemas.push("o provedor de e-mail está DESLIGADO");
  if (settings?.mailer_autoconfirm !== true) problemas.push("'Confirm email' está LIGADO");
  if (settings?.disable_signup === true) problemas.push("novos cadastros estão bloqueados");

  if (problemas.length) {
    console.error(`\nOs testes não podem rodar: ${problemas.join(" e ")}.\n${AJUSTE}`);
    process.exit(2);
  }
}

/** Cadastro aceito, mas sem sessão: confirmação de e-mail ainda exigida. */
export function explicaFaltaDeSessao() {
  return "cadastro não devolveu sessão — 'Confirm email' ainda está exigindo confirmação.\n" + AJUSTE;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
