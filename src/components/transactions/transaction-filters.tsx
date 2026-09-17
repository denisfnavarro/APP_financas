"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircleIcon, SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { monthName } from "@/lib/format";

const ALL = "todos";

type Props = {
  years: number[];
  /** Esconde o filtro de tipo nas telas em que ele não faz sentido. */
  showType?: boolean;
};

export function TransactionFilters({ years, showType = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentYear = searchParams.get("ano") ?? String(new Date().getFullYear());
  const currentMonth = searchParams.get("mes") ?? String(new Date().getMonth() + 1);
  const currentCategory = searchParams.get("categoria") ?? ALL;
  const currentType = searchParams.get("tipo") ?? ALL;

  const queryParam = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(queryParam);

  // Alguém pode chegar por um link já filtrado, ou usar o voltar do navegador:
  // reajusta o input durante a renderização em vez de um efeito espelhando estado.
  const [lastQueryParam, setLastQueryParam] = useState(queryParam);
  if (queryParam !== lastQueryParam) {
    setLastQueryParam(queryParam);
    setSearch(queryParam);
  }

  function push(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function setParam(key: string, value: string, clearWhen = ALL) {
    push((params) => {
      if (value === clearWhen) params.delete(key);
      else params.set(key, value);
    });
  }

  // Debounce da busca: evita uma navegação por tecla digitada.
  useEffect(() => {
    if (search === queryParam) return;

    const timer = setTimeout(() => {
      push((params) => {
        if (search.trim()) params.set("q", search.trim());
        else params.delete("q");
      });
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters =
    searchParams.get("q") ||
    searchParams.get("categoria") ||
    searchParams.get("tipo") ||
    searchParams.get("ano") === ALL ||
    searchParams.get("mes") === ALL;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        {pending ? (
          <LoaderCircleIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin" />
        ) : (
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        )}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por descrição…"
          aria-label="Buscar por descrição"
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Select value={currentMonth} onValueChange={(v) => setParam("mes", v, "")}>
          <SelectTrigger aria-label="Filtrar por mês">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os meses</SelectItem>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <SelectItem key={m} value={String(m)}>
                {monthName(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentYear} onValueChange={(v) => setParam("ano", v, "")}>
          <SelectTrigger aria-label="Filtrar por ano">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todo o período</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentCategory} onValueChange={(v) => setParam("categoria", v)}>
          <SelectTrigger aria-label="Filtrar por categoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as categorias</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category.slug} value={category.slug}>
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ background: category.color }}
                />
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showType && (
          <Select value={currentType} onValueChange={(v) => setParam("tipo", v)}>
            <SelectTrigger aria-label="Filtrar por tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Receitas e despesas</SelectItem>
              <SelectItem value="receita">Só receitas</SelectItem>
              <SelectItem value="despesa">Só despesas</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
        >
          <XIcon />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
