import "server-only";

import { CATEGORY_SLUGS } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import type { Transaction, TransactionType } from "@/types/transaction";

export type TransactionFilters = {
  /** `null` em ano ou mês significa "todo o período". */
  year: number | null;
  month: number | null;
  category: string | null;
  type: TransactionType | null;
  search: string | null;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function currentPeriod() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * Lê os filtros da URL. Valores inválidos viram "sem filtro" em vez de erro —
 * a URL é editável pelo usuário e não vale derrubar a página por causa dela.
 */
export function parseFilters(searchParams: RawSearchParams): TransactionFilters {
  const period = currentPeriod();

  const rawYear = first(searchParams.ano);
  const rawMonth = first(searchParams.mes);
  const rawCategory = first(searchParams.categoria);
  const rawType = first(searchParams.tipo);
  const rawSearch = first(searchParams.q)?.trim();

  const year =
    rawYear === "todos" ? null : Number.isInteger(Number(rawYear)) ? Number(rawYear) : period.year;

  const monthNumber = Number(rawMonth);
  const month =
    rawMonth === "todos" || year === null
      ? null
      : monthNumber >= 1 && monthNumber <= 12
        ? monthNumber
        : rawMonth === undefined
          ? period.month
          : null;

  return {
    year,
    month,
    category: rawCategory && CATEGORY_SLUGS.includes(rawCategory) ? rawCategory : null,
    type: rawType === "receita" || rawType === "despesa" ? rawType : null,
    search: rawSearch ? rawSearch : null,
  };
}

export function periodLabel(filters: TransactionFilters) {
  if (filters.year === null) return "Todo o período";
  if (filters.month === null) return String(filters.year);
  return new Date(filters.year, filters.month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

/** Intervalo [de, até] em ISO para os filtros de período. */
export function dateRange(filters: TransactionFilters) {
  if (filters.year === null) return null;
  if (filters.month === null) {
    return { from: `${filters.year}-01-01`, to: `${filters.year}-12-31` };
  }
  const mm = String(filters.month).padStart(2, "0");
  const last = lastDayOfMonth(filters.year, filters.month);
  return { from: `${filters.year}-${mm}-01`, to: `${filters.year}-${mm}-${last}` };
}

function normalize(rows: unknown[]): Transaction[] {
  return (rows as Transaction[]).map((row) => ({ ...row, amount: Number(row.amount) }));
}

export async function listTransactions(filters: TransactionFilters): Promise<Transaction[]> {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const range = dateRange(filters);
  if (range) query = query.gte("date", range.from).lte("date", range.to);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.search) {
    // `%` e `,` quebram o parser do PostgREST dentro de um `ilike`.
    const safe = filters.search.replace(/[%,]/g, " ");
    query = query.ilike("description", `%${safe}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return normalize(data ?? []);
}

/** Transações dos últimos `months` meses, para o gráfico de evolução. */
export async function listRecentMonths(months: number): Promise<Transaction[]> {
  const supabase = await createClient();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("date", from)
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);
  return normalize(data ?? []);
}

export type Summary = {
  income: number;
  expense: number;
  balance: number;
  count: number;
};

export function summarize(transactions: Transaction[]): Summary {
  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    if (t.type === "receita") income += t.amount;
    else expense += t.amount;
  }

  return {
    income,
    expense,
    balance: income - expense,
    count: transactions.length,
  };
}

export type CategorySlice = { category: string; total: number };

export function groupByCategory(
  transactions: Transaction[],
  type: TransactionType
): CategorySlice[] {
  const totals = new Map<string, number>();

  for (const t of transactions) {
    if (t.type !== type) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }

  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export type MonthlyPoint = { month: string; income: number; expense: number };

export function groupByMonth(transactions: Transaction[], months: number): MonthlyPoint[] {
  const buckets = new Map<string, MonthlyPoint>();
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { month: key, income: 0, expense: 0 });
  }

  for (const t of transactions) {
    const key = t.date.slice(0, 7);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (t.type === "receita") bucket.income += t.amount;
    else bucket.expense += t.amount;
  }

  return [...buckets.values()];
}

/**
 * Anos oferecidos no filtro: do primeiro lançamento até hoje, sempre incluindo
 * o ano corrente (conta nova ainda não tem transação nenhuma).
 */
export async function listYears(): Promise<number[]> {
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  const { data, error } = await supabase
    .from("transactions")
    .select("date")
    .order("date", { ascending: true })
    .limit(1);

  if (error) throw new Error(error.message);

  const firstYear = data?.[0]?.date ? Number(String(data[0].date).slice(0, 4)) : currentYear;
  const from = Math.min(firstYear, currentYear);

  return Array.from({ length: currentYear - from + 1 }, (_, i) => currentYear - i);
}
