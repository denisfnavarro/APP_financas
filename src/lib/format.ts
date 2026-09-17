const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number) {
  return currency.format(value);
}

export function formatCompactCurrency(value: number) {
  return compactCurrency.format(value);
}

/** Formata uma data `YYYY-MM-DD` sem deixar o fuso puxar o dia para trás. */
export function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function monthName(month: number) {
  return MONTH_NAMES[month - 1] ?? "";
}

export function monthShortLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]?.slice(0, 3)}/${String(year).slice(2)}`;
}

/** Converte um texto digitado ("1.234,56" ou "1234.56") em número. */
export function parseAmount(input: string): number {
  const normalized = input
    .trim()
    .replace(/\s/g, "")
    .replace(/R\$/i, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
}
