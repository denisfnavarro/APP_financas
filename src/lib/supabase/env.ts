import "server-only";

/**
 * As credenciais do Supabase ficam SEM o prefixo `NEXT_PUBLIC_` de propósito.
 *
 * Tudo que é `NEXT_PUBLIC_` é inlinado no JavaScript que o navegador baixa.
 * Como nenhum componente de cliente fala com o Supabase — a autenticação e o
 * CRUD passam por Server Actions —, as chaves nunca precisam sair do servidor.
 * O `server-only` acima faz o build quebrar se alguém importar este arquivo de
 * um componente de cliente, em vez de vazar a chave silenciosamente.
 */
export function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: defina SUPABASE_URL e SUPABASE_ANON_KEY em .env.local (veja .env.example)."
    );
  }

  return { url, anonKey };
}

export function hasSupabaseEnv() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

/**
 * Origem pública do app, usada no link de confirmação de e-mail.
 * Na Vercel, `VERCEL_PROJECT_PRODUCTION_URL` já vem preenchida.
 */
export function getSiteUrl() {
  const explicit = process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
