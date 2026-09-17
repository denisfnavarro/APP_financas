export type TransactionType = "receita" | "despesa";

export type Transaction = {
  id: string;
  user_id: string;
  description: string;
  /** Valor sempre positivo. O sinal vem de `type`. */
  amount: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  created_at: string;
};

export type TransactionInput = {
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  category: string;
};
