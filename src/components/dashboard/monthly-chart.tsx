"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { formatCompactCurrency, monthShortLabel } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/transactions";

const SERIES = [
  { key: "income" as const, label: "Receitas", color: "var(--serie-receita)" },
  { key: "expense" as const, label: "Despesas", color: "var(--serie-despesa)" },
];

export function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
  const hasData = data.some((point) => point.income > 0 || point.expense > 0);

  if (!hasData) {
    return (
      <p className="text-muted-foreground flex h-[260px] items-center justify-center px-6 text-center text-sm text-pretty">
        Assim que você registrar lançamentos, a evolução dos últimos meses aparece aqui.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Legenda fixa: com receita em verde e despesa em vermelho, o nome ao lado
          do marcador é o que garante a leitura de quem não distingue as duas cores. */}
      <ul className="flex flex-wrap items-center gap-4 text-sm">
        {SERIES.map((serie) => (
          <li key={serie.key} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2.5 w-3.5 rounded-sm"
              style={{ background: serie.color }}
            />
            <span className="text-muted-foreground">{serie.label}</span>
          </li>
        ))}
      </ul>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />
            <XAxis
              dataKey="month"
              tickFormatter={monthShortLabel}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              dy={6}
            />
            <YAxis
              tickFormatter={(value: number) => formatCompactCurrency(value)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              width={64}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as MonthlyPoint;
                return (
                  <ChartTooltip
                    title={monthShortLabel(String(label))}
                    rows={[
                      { label: "Receitas", value: point.income, color: "var(--serie-receita)" },
                      { label: "Despesas", value: point.expense, color: "var(--serie-despesa)" },
                    ]}
                    footer={`Saldo: ${new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(point.income - point.expense)}`}
                  />
                );
              }}
            />
            {SERIES.map((serie) => (
              <Bar
                key={serie.key}
                dataKey={serie.key}
                name={serie.label}
                fill={serie.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
