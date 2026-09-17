"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { formatCurrency } from "@/lib/format";
import type { CategorySlice } from "@/lib/transactions";

type Props = {
  slices: CategorySlice[];
  emptyMessage: string;
};

/**
 * Rosca de composição por categoria.
 *
 * As fatias saem na ordem fixa de `CATEGORIES`, não na ordem de valor: assim a
 * vizinhança entre cores é sempre a mesma — foi essa sequência que passou na
 * checagem de daltonismo — e nenhuma categoria troca de cor quando os valores mudam.
 */
export function CategoryChart({ slices, emptyMessage }: Props) {
  const data = useMemo(() => {
    const order = new Map(CATEGORIES.map((c, index) => [c.slug, index]));
    return [...slices].sort(
      (a, b) => (order.get(a.category) ?? 99) - (order.get(b.category) ?? 99)
    );
  }, [slices]);

  const total = data.reduce((sum, slice) => sum + slice.total, 0);

  // A lista abaixo do gráfico é ordenada por valor: é ela que responde
  // "para onde foi o dinheiro" e serve de versão tabular do gráfico.
  const ranked = useMemo(() => [...data].sort((a, b) => b.total - a.total), [data]);

  if (total === 0) {
    return (
      <p className="text-muted-foreground flex h-[260px] items-center justify-center px-6 text-center text-sm text-pretty">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative mx-auto h-[200px] w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={1.5}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((slice) => (
                <Cell key={slice.category} fill={getCategory(slice.category).color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const slice = payload[0].payload as CategorySlice;
                const share = ((slice.total / total) * 100).toFixed(1).replace(".", ",");
                return (
                  <ChartTooltip
                    title={getCategory(slice.category).label}
                    rows={[
                      {
                        label: "Total",
                        value: slice.total,
                        color: getCategory(slice.category).color,
                      },
                    ]}
                    footer={`${share}% do período`}
                  />
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-muted-foreground text-xs">Total</span>
          <span className="text-lg font-semibold tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5">
        {ranked.map((slice) => {
          const category = getCategory(slice.category);
          const share = (slice.total / total) * 100;
          return (
            <li key={slice.category} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: category.color }}
              />
              <span className="min-w-0 flex-1">{category.label}</span>
              <span className="text-muted-foreground w-10 shrink-0 text-right tabular-nums">
                {share.toFixed(0)}%
              </span>
              <span className="w-28 shrink-0 text-right font-medium tabular-nums">
                {formatCurrency(slice.total)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
