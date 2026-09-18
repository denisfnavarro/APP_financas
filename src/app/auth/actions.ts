"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

import { getSiteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  notice?: string;
};

/** Só aceita caminhos internos: `redirectTo` vem da URL e é editável por quem acessa. */
function safeRedirect(value: FormDataEntryValue | null) {
  const path = String(value ?? "");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}

function traduzir(error: AuthError | Error): string {
  const message = error.message;

  if (/Invalid login credentials/i.test(message)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(message)) return "Confirme seu e-mail antes de entrar.";
  if (/User already registered/i.test(message))
    return "Este e-mail já tem cadastro. Use a aba Entrar.";
  if (/Password should be at least/i.test(message))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (/Email address .* is invalid/i.test(message)) return "Informe um e-mail válido.";
  if (/rate limit|too many requests/i.test(message))
    return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  if (/Signups not allowed|signups are disabled/i.test(message))
    return "Os cadastros estão desativados no momento.";
  if (/Supabase não configurado/i.test(message)) return message;

  return "Não foi possível concluir. Tente novamente.";
}

/**
 * Entrar e cadastrar rodam no servidor: o formulário manda só e-mail e senha, e
 * a chave do Supabase nunca é embarcada no JavaScript do navegador.
 */
export async function authenticate(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const mode = String(formData.get("mode") ?? "entrar");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const destino = safeRedirect(formData.get("redirectTo"));

  if (!email || !password) return { error: "Preencha e-mail e senha." };
  if (password.length < 6) return { error: "A senha precisa ter pelo menos 6 caracteres." };

  let supabase;
  try {
    supabase = await createClient();
  } catch (e) {
    return { error: traduzir(e as Error) };
  }

  if (mode === "criar") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
    });
    if (error) return { error: traduzir(error) };

    // Com "Confirm email" ligado não vem sessão: o acesso só abre depois do link.
    if (!data.session) {
      return { notice: "Conta criada. Confira seu e-mail para confirmar o cadastro." };
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: traduzir(error) };
  }

  revalidatePath("/", "layout");
  redirect(destino);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
