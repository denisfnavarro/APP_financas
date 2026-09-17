import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { CategoryChart } from "@/components/dashboard/category-chart";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategory } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  groupByCategory,
  groupByMonth,
  listRecentMonths,
  listTransactions,
  listYears,
  parseFilters,
  periodLabel,
  summarize,
  type RawSearchParams,
} from "@/lib/transactions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

const MONTHS_IN_TREND = 6;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseFilters(await searchParams);
  const [transactions, trend, years] = await Promise.all([
    listTransactions(filters),
    listRecentMonths(MONTHS_IN_TREND),
    listYears(),
  ]);

  const summary = summarize(transactions);
  const period = periodLabel(filters);
  const expensesByCategory = groupByCategory(transactions, "despesa");
  const incomeByCategory = groupByCategory(transactions, "receita");
  const monthly = groupByMonth(trend, MONTHS_IN_TREND);
  const latest = transactions.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Resumo de {period.toLowerCase()} · {summary.count}{" "}
          {summary.count === 1 ? "lançamento" : "lançamentos"}
        </p>
      </div>

      <Suspense fallback={<div className="h-28" />}>
        <TransactionFilters years={years} showType={false} />
      </Suspense>

      <SummaryCards summary={summary} period={period} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Despesas por categoria</CardTitle>
            <CardDescription>Para onde o dinheiro foi em {period.toLowerCase()}.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryChart
              slices={expensesByCategory}
              emptyMessage="Nenhuma despesa registrada neste período."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receitas por categoria</CardTitle>
            <CardDescription>De onde o dinheiro veio em {period.toLowerCase()}.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryChart
              slices={incomeByCategory}
              emptyMessage="Nenhuma receita registrada neste período."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos {MONTHS_IN_TREND} meses</CardTitle>
          <CardDescription>
            Receitas e despesas mês a mês — independente dos filtros acima.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={monthly} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos recentes</CardTitle>
          <CardDescription>Os cinco últimos do período selecionado.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {latest.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Nenhum lançamento neste período.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {latest.map((transaction) => {
                const category = getCategory(transaction.category);
                const income = transaction.type === "receita";
                return (
                  <li key={transaction.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: category.color }}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {transaction.description}
                    </span>
                    <span className="text-muted-foreground hidden shrink-0 sm:inline">
                      {category.label}
                    </span>
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      {formatDate(transaction.date)}
                    </span>
                    <span
                      className={cn(
                        "w-28 shrink-0 text-right font-medium tabular-nums",
                        income ? "text-success" : "text-destructive"
                      )}
                    >
                      {income ? "+" : "−"} {formatCurrency(transaction.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <Button asChild variant="outline" className="self-start">
            <Link href="/dashboard/transacoes">
              Ver todas as transações
              <ArrowRightIcon />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
