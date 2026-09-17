import Link from "next/link";
import {
  ArrowRightIcon,
  ChartPieIcon,
  FileSpreadsheetIcon,
  ListFilterIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  WalletMinimalIcon,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: WalletMinimalIcon,
    title: "Receitas e despesas em um lugar",
    description:
      "Cadastre cada lançamento com descrição, valor, data e categoria. Edite ou exclua quando precisar.",
  },
  {
    icon: ChartPieIcon,
    title: "Dashboard com o resumo do mês",
    description:
      "Receita total, despesa total e saldo em cards, mais a distribuição dos gastos por categoria.",
  },
  {
    icon: ListFilterIcon,
    title: "Busca e filtros",
    description:
      "Filtre por mês, ano, categoria e tipo. Ou simplesmente busque pela descrição do lançamento.",
  },
  {
    icon: FileSpreadsheetIcon,
    title: "Exportação em CSV",
    description:
      "Baixe exatamente o que está filtrado na tela, pronto para abrir no Excel ou no Google Sheets.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Seus dados são só seus",
    description:
      "Autenticação por e-mail e senha, com Row Level Security isolando as transações de cada conta.",
  },
  {
    icon: SmartphoneIcon,
    title: "Funciona no celular",
    description:
      "Layout responsivo: registre um gasto no caminho de casa e confira o saldo no desktop depois.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <WalletMinimalIcon className="size-4" />
            </div>
            <span className="font-semibold">Finanças Pessoais</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium">
              Controle financeiro sem planilha
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Saiba para onde vai o seu dinheiro
            </h1>
            <p className="text-muted-foreground text-lg text-pretty">
              Extratos, planilhas e anotações soltas não mostram o quadro inteiro. Registre
              receitas e despesas em segundos e acompanhe receita, despesa e saldo do mês em uma
              única tela.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/login">
                  Começar agora
                  <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#recursos">Ver recursos</Link>
              </Button>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Receitas do mês", value: "R$ 7.400,00", tone: "text-success" },
              { label: "Despesas do mês", value: "R$ 4.185,30", tone: "text-destructive" },
              { label: "Saldo", value: "R$ 3.214,70", tone: "text-foreground" },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-sm">{item.label}</span>
                  <span className={`text-2xl font-semibold tabular-nums ${item.tone}`}>
                    {item.value}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-muted-foreground mt-3 text-center text-xs">
            Exemplo ilustrativo do dashboard.
          </p>
        </section>

        <section id="recursos" className="border-t">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight">
                Tudo o que você precisa para começar
              </h2>
              <p className="text-muted-foreground mt-3 text-pretty">
                Simples o bastante para usar todo dia, completo o bastante para fechar o mês.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <Card key={title}>
                  <CardHeader>
                    <div className="bg-secondary text-secondary-foreground mb-2 flex size-9 items-center justify-center rounded-lg">
                      <Icon className="size-4" />
                    </div>
                    <CardTitle className="text-base">{title}</CardTitle>
                    <CardDescription className="text-pretty">{description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-balance">
              Comece a organizar suas finanças hoje
            </h2>
            <Button asChild size="lg">
              <Link href="/login">
                Criar minha conta
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm sm:flex-row sm:px-6">
          <span>Finanças Pessoais</span>
          <span>Next.js · Supabase · shadcn/ui</span>
        </div>
      </footer>
    </div>
  );
}
