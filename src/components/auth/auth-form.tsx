"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { AlertCircleIcon, CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";

import { authenticate, type AuthState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "entrar" | "criar";

/**
 * Este componente não conhece o Supabase. Ele posta e-mail e senha para uma
 * Server Action, que é quem fala com o banco — por isso nenhuma credencial
 * aparece no JavaScript baixado pelo navegador.
 */
export function AuthForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  const [mode, setMode] = useState<Mode>("entrar");
  const [state, formAction] = useActionState<AuthState, FormData>(authenticate, {});

  return (
    <div className="w-full">
      <div className="bg-muted mb-6 grid grid-cols-2 gap-1 rounded-lg p-1">
        {(["entrar", "criar"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {value === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "entrar" ? "current-password" : "new-password"}
            placeholder="Mínimo de 6 caracteres"
            minLength={6}
            required
          />
        </div>

        {state.error && (
          <p role="alert" className="text-destructive flex items-start gap-2 text-sm">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </p>
        )}

        {state.notice && (
          <p className="text-success flex items-start gap-2 text-sm">
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
            {state.notice}
          </p>
        )}

        <SubmitButton mode={mode} />
      </form>
    </div>
  );
}

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="mt-2 w-full">
      {pending && <LoaderCircleIcon className="animate-spin" />}
      {mode === "entrar" ? "Entrar" : "Criar conta"}
    </Button>
  );
}
