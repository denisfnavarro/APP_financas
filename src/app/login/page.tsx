import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftIcon, WalletMinimalIcon } from "lucide-react";

import { AuthForm } from "@/components/auth/auth-form";
import { SetupNotice } from "@/components/setup-notice";
import { Card, CardContent } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-12">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeftIcon className="size-4" />
        Voltar para o início
      </Link>

      {hasSupabaseEnv() ? (
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl">
                <WalletMinimalIcon className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Finanças Pessoais</h1>
                <p className="text-muted-foreground text-sm">
                  Entre para acompanhar suas receitas e despesas.
                </p>
              </div>
            </div>

            <Suspense fallback={<div className="h-72" />}>
              <AuthForm />
            </Suspense>
          </CardContent>
        </Card>
      ) : (
        <SetupNotice />
      )}
    </main>
  );
}
