import type { TransactionType } from "@/types/transaction";

export type Category = {
  slug: string;
  label: string;
  /** Em qual tipo de lançamento a categoria costuma aparecer. */
  types: TransactionType[];
  /** Token de cor do tema, usado nos gráficos e badges. */
  color: string;
};

/**
 * Categorias pré-definidas do PRD. O banco guarda o `slug`, a UI mostra o `label`.
 */
export const CATEGORIES: Category[] = [
  { slug: "alimentacao", label: "Alimentação", types: ["despesa"], color: "var(--cat-alimentacao)" },
  { slug: "transporte", label: "Transporte", types: ["despesa"], color: "var(--cat-transporte)" },
  { slug: "moradia", label: "Moradia", types: ["despesa"], color: "var(--cat-moradia)" },
  { slug: "lazer", label: "Lazer", types: ["despesa"], color: "var(--cat-lazer)" },
  { slug: "saude", label: "Saúde", types: ["despesa"], color: "var(--cat-saude)" },
  { slug: "educacao", label: "Educação", types: ["despesa"], color: "var(--cat-educacao)" },
  { slug: "salario", label: "Salário", types: ["receita"], color: "var(--cat-salario)" },
  { slug: "freelance", label: "Freelance", types: ["receita"], color: "var(--cat-freelance)" },
  { slug: "outros", label: "Outros", types: ["receita", "despesa"], color: "var(--cat-outros)" },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string): Category {
  return (
    BY_SLUG.get(slug) ?? {
      slug,
      label: slug,
      types: ["receita", "despesa"],
      color: "var(--cat-outros)",
    }
  );
}

export function categoryLabel(slug: string) {
  return getCategory(slug).label;
}

export function categoriesForType(type: TransactionType) {
  return CATEGORIES.filter((c) => c.types.includes(type));
}
