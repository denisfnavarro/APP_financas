"use client";

import { useState, useTransition } from "react";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  DownloadIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { deleteTransaction } from "@/app/dashboard/actions";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCategory } from "@/lib/categories";
import { downloadCsv, transactionsToCsv } from "@/lib/csv";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

type Props = {
  transactions: Transaction[];
  /** Sufixo do arquivo exportado, ex.: "setembro-de-2026". */
  exportLabel: string;
};

export function TransactionsPanel({ transactions, exportLabel }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(transaction: Transaction) {
    setEditing(transaction);
    setFormOpen(true);
  }

  function handleExport() {
    const slug = exportLabel
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    downloadCsv(`transacoes-${slug || "todas"}.csv`, transactionsToCsv(transactions));
  }

  function confirmDelete() {
    if (!toDelete) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteTransaction(toDelete.id);
      if (result.ok) setToDelete(null);
      else setDeleteError(result.error);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={openNew}>
          <PlusIcon />
          Novo lançamento
        </Button>
        <Button variant="outline" onClick={handleExport} disabled={transactions.length === 0}>
          <DownloadIcon />
          Exportar CSV
        </Button>
        <span className="text-muted-foreground ml-auto text-sm">
          {transactions.length} {transactions.length === 1 ? "lançamento" : "lançamentos"}
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="font-medium">Nenhum lançamento por aqui</p>
          <p className="text-muted-foreground max-w-sm text-sm text-pretty">
            Ajuste os filtros acima ou registre seu primeiro lançamento deste período.
          </p>
          <Button variant="outline" onClick={openNew}>
            <PlusIcon />
            Novo lançamento
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="w-full">Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => {
                const category = getCategory(transaction.category);
                const income = transaction.type === "receita";
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell className="font-medium whitespace-normal">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full",
                            income
                              ? "bg-success/15 text-success"
                              : "bg-destructive/10 text-destructive"
                          )}
                        >
                          {income ? (
                            <ArrowUpRightIcon className="size-3.5" />
                          ) : (
                            <ArrowDownLeftIcon className="size-3.5" />
                          )}
                        </span>
                        {transaction.description}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1.5 font-normal">
                        <span
                          aria-hidden
                          className="size-2 rounded-full"
                          style={{ background: category.color }}
                        />
                        {category.label}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        income ? "text-success" : "text-destructive"
                      )}
                    >
                      {income ? "+" : "−"} {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(transaction)}
                          aria-label={`Editar ${transaction.description}`}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setDeleteError(null);
                            setToDelete(transaction);
                          }}
                          aria-label={`Excluir ${transaction.description}`}
                        >
                          <Trash2Icon />
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        transaction={editing}
      />

      <Dialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open && !pending) setToDelete(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir lançamento?</DialogTitle>
            <DialogDescription>
              {toDelete
                ? `"${toDelete.description}" será removido permanentemente.`
                : null}
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p role="alert" className="text-destructive text-sm">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={pending}>
              {pending && <LoaderCircleIcon className="animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
