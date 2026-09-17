import { categoryLabel } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import type { Transaction } from "@/types/transaction";

const HEADERS = ["Data", "Descrição", "Categoria", "Tipo", "Valor"];

function escapeCell(value: string) {
  return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Gera CSV com `;` e vírgula decimal — o que o Excel em pt-BR abre sem pedir import.
 */
export function transactionsToCsv(transactions: Transaction[]) {
  const rows = transactions.map((t) => [
    formatDate(t.date),
    t.description,
    categoryLabel(t.category),
    t.type === "receita" ? "Receita" : "Despesa",
    (t.type === "despesa" ? -t.amount : t.amount).toFixed(2).replace(".", ","),
  ]);

  return [HEADERS, ...rows].map((row) => row.map(escapeCell).join(";")).join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  // BOM para o Excel reconhecer o UTF-8 e não quebrar os acentos.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
