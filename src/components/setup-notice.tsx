import { TerminalIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Mostrada no lugar da tela quando o `.env.local` ainda não foi preenchido.
 */
export function SetupNotice() {
  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TerminalIcon className="size-4" />
          Configure o Supabase
        </CardTitle>
        <CardDescription>
          O app precisa das credenciais do seu projeto Supabase para funcionar.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <ol className="text-muted-foreground list-decimal space-y-2 pl-5">
          <li>
            Crie um projeto em <span className="text-foreground">supabase.com</span>.
          </li>
          <li>
            Rode o SQL de <code className="text-foreground">supabase/migrations/0001_init.sql</code>{" "}
            no SQL Editor.
          </li>
          <li>
            Copie <code className="text-foreground">.env.example</code> para{" "}
            <code className="text-foreground">.env.local</code> e preencha a URL e a chave anon.
          </li>
          <li>
            Reinicie o servidor com <code className="text-foreground">npm run dev</code>.
          </li>
        </ol>
        <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs leading-relaxed">
{`NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica`}
        </pre>
      </CardContent>
    </Card>
  );
}
