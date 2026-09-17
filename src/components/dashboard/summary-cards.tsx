import { ArrowDownLeftIcon, ArrowUpRightIcon, WalletMinimalIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { Summary } from "@/lib/transactions";
import { cn } from "@/lib/utils";

export function SummaryCards({ summary, period }: { summary: Summary; period: string }) {
  const tiles = [
    {
      label: "Receitas",
      value: summary.income,
      icon: ArrowUpRightIcon,
      tone: "text-success",
      iconTone: "bg-success/15 text-success",
    },
    {
      label: "Despesas",
      value: summary.expense,
      icon: ArrowDownLeftIcon,
      tone: "text-destructive",
      iconTone: "bg-destructive/10 text-destructive",
    },
    {
      label: "Saldo",
      value: summary.balance,
      icon: WalletMinimalIcon,
      tone: summary.balance < 0 ? "text-destructive" : "text-foreground",
      iconTone: "bg-secondary text-secondary-foreground",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {tiles.map(({ label, value, icon: Icon, tone, iconTone }) => (
        <Card key={label}>
          <CardContent className="flex items-start gap-4">
            <div
              className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", iconTone)}
            >
              <Icon className="size-4" />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-muted-foreground text-sm">{label}</span>
              <span className={cn("text-2xl font-semibold tabular-nums", tone)}>
                {formatCurrency(value)}
              </span>
              <span className="text-muted-foreground text-xs">{period}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
