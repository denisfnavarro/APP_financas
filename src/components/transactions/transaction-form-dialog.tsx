"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react";

import { createTransaction, updateTransaction } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoriesForType } from "@/lib/categories";
import { parseAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/types/transaction";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Passar uma transação coloca o formulário em modo de edição. */
  transaction?: Transaction | null;
};

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* O conteúdo do Radix só existe enquanto aberto, e a `key` troca ao mudar de
            lançamento: o formulário remonta já com os valores certos, sem efeito de reset. */}
        {open && (
          <TransactionForm
            key={transaction?.id ?? "novo"}
            transaction={transaction ?? null}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TransactionForm({
  transaction,
  onDone,
}: {
  transaction: Transaction | null;
  onDone: () => void;
}) {
  const editing = Boolean(transaction);

  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? "despesa",
  );
  const [description, setDescription] = useState(
    transaction?.description ?? "",
  );
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount).replace(".", ",") : "",
  );
  const [date, setDate] = useState(transaction?.date ?? today);
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const options = useMemo(() => categoriesForType(type), [type]);

  function handleTypeChange(next: TransactionType) {
    setType(next);
    // "Salário" não faz sentido em uma despesa: limpa o que não pertence ao novo tipo.
    if (category && !categoriesForType(next).some((c) => c.slug === category)) {
      setCategory("");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const value = parseAmount(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }
    if (!category) {
      setError("Selecione uma categoria.");
      return;
    }

    const formData = new FormData();
    formData.set("description", description);
    formData.set("amount", String(value));
    formData.set("date", date);
    formData.set("type", type);
    formData.set("category", category);

    startTransition(async () => {
      const result = transaction
        ? await updateTransaction(transaction.id, formData)
        : await createTransaction(formData);

      if (result.ok) onDone();
      else setError(result.error);
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {editing ? "Editar lançamento" : "Novo lançamento"}
        </DialogTitle>
        <DialogDescription>
          {editing
            ? "Altere os dados e salve para atualizar o lançamento."
            : "Registre uma receita ou uma despesa."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Tipo</Label>
          <div className="bg-muted grid grid-cols-2 gap-1 rounded-lg p-1">
            {(["despesa", "receita"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTypeChange(value)}
                aria-pressed={type === value}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  type === value
                    ? value === "receita"
                      ? "bg-success text-success-foreground shadow-sm"
                      : "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "receita" ? "Receita" : "Despesa"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Supermercado, aluguel, salário…"
            maxLength={120}
            required
            autoFocus
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Categoria</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.slug} value={option.slug}>
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full"
                    style={{ background: option.color }}
                  />
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p
            role="alert"
            className="text-destructive flex items-start gap-2 text-sm"
          >
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onDone}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <LoaderCircleIcon className="animate-spin" />}
            {editing ? "Salvar alterações" : "Adicionar"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
