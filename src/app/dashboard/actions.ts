"use server";

import { revalidatePath } from "next/cache";

import { CATEGORY_SLUGS } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import type { TransactionInput } from "@/types/transaction";

export type ActionResult = { ok: true } | { ok: false; error: string };

function parseInput(formData: FormData): TransactionInput | string {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date") ?? "");
  const type = String(formData.get("type") ?? "");
  const category = String(formData.get("category") ?? "");

  if (description.length < 1 || description.length > 120) {
    return "Informe uma descrição de até 120 caracteres.";
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return "Informe um valor maior que zero.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "Informe uma data válida.";
  }
  if (type !== "receita" && type !== "despesa") {
    return "Selecione o tipo do lançamento.";
  }
  if (!CATEGORY_SLUGS.includes(category)) {
    return "Selecione uma categoria válida.";
  }

  return { description, amount: Math.round(amount * 100) / 100, date, type, category };
}

export async function createTransaction(formData: FormData): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase.from("transactions").insert({ ...parsed, user_id: user.id });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transacoes");
  return { ok: true };
}

export async function updateTransaction(id: string, formData: FormData): Promise<ActionResult> {
  const parsed = parseInput(formData);
  if (typeof parsed === "string") return { ok: false, error: parsed };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  // O `eq("user_id")` é redundante com a RLS, mas evita um update silencioso de 0 linhas.
  const { error } = await supabase
    .from("transactions")
    .update(parsed)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transacoes");
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transacoes");
  return { ok: true };
}
