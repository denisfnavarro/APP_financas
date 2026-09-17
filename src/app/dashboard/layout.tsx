import Link from "next/link";
import { redirect } from "next/navigation";
import { WalletMinimalIcon } from "lucide-react";

import { DashboardNav } from "@/components/dashboard-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Sem credenciais não dá nem para perguntar quem é o usuário; a tela de login
  // é quem mostra as instruções de setup.
  if (!hasSupabaseEnv()) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware já barra visitantes; isto cobre o caso da sessão expirar no meio.
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <WalletMinimalIcon className="size-4" />
            </div>
            <span className="hidden font-semibold sm:inline">Finanças</span>
          </Link>

          <DashboardNav />

          <div className="ml-auto flex items-center gap-1">
            <span className="text-muted-foreground mr-1 hidden max-w-[16rem] truncate text-sm md:inline">
              {user.email}
            </span>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
