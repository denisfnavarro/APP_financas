"use client";

import { formatCurrency } from "@/lib/format";

export type TooltipRow = { label: string; value: number; color?: string };

export function ChartTooltip({
  title,
  rows,
  footer,
}: {
  title: string;
  rows: TooltipRow[];
  footer?: string;
}) {
  return (
    <div className="bg-popover text-popover-foreground min-w-40 rounded-lg border p-3 text-sm shadow-md">
      <p className="mb-2 font-medium">{title}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2">
            {row.color && (
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: row.color }}
              />
            )}
            <span className="text-muted-foreground">{row.label}</span>
            <span className="ml-auto font-medium tabular-nums">
              {formatCurrency(row.value)}
            </span>
          </li>
        ))}
      </ul>
      {footer && <p className="text-muted-foreground mt-2 text-xs">{footer}</p>}
    </div>
  );
}
