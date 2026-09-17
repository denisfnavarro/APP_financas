import { Suspense } from "react";
import type { Metadata } from "next";

import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionsPanel } from "@/components/transactions/transactions-panel";
import {
  listTransactions,
  listYears,
  parseFilters,
  periodLabel,
  summarize,
  type RawSearchParams,
} from "@/lib/transactions";

export const metadata: Metadata = {
  title: "Transações",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseFilters(await searchParams);
  const [transactions, years] = await Promise.all([listTransactions(filters), listYears()]);

  const summary = summarize(transactions);
  const period = periodLabel(filters);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
        <p className="text-muted-foreground text-sm">
          Registre, edite e exporte seus lançamentos.
        </p>
      </div>

      <Suspense fallback={<div className="h-28" />}>
        <TransactionFilters years={years} />
      </Suspense>

      <SummaryCards summary={summary} period={period} />

      <TransactionsPanel transactions={transactions} exportLabel={period} />
    </div>
  );
}
