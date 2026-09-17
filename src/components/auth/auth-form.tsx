"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircleIcon, CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "entrar" | "criar";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  const [mode, setMode] = useState<Mode>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();

      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(redirectTo);
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;

      // Com "Confirm email" ligado no Supabase não vem sessão: o usuário precisa
      // clicar no link do e-mail antes de entrar.
      if (data.session) {
        router.replace(redirectTo);
        router.refresh();
      } else {
        setNotice("Conta criada. Confira seu e-mail para confirmar o cadastro.");
      }
    } catch (err) {
      setError(translateError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full">
      <div className="bg-muted mb-6 grid grid-cols-2 gap-1 rounded-lg p-1">
        {(["entrar", "criar"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => switchMode(value)}
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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

        {notice && (
          <p className="text-success flex items-start gap-2 text-sm">
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
            {notice}
          </p>
        )}

        <Button type="submit" disabled={pending} className="mt-2 w-full">
          {pending && <LoaderCircleIcon className="animate-spin" />}
          {mode === "entrar" ? "Entrar" : "Criar conta"}
        </Button>
      </form>
    </div>
  );
}

function translateError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (/Invalid login credentials/i.test(message)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(message))
    return "Confirme seu e-mail antes de entrar.";
  if (/User already registered/i.test(message))
    return "Este e-mail já tem cadastro. Use a aba Entrar.";
  if (/Password should be at least/i.test(message))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (/Supabase não configurado/i.test(message)) return message;

  return message || "Não foi possível concluir. Tente novamente.";
}
