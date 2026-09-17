"use client";

import { useEffect } from "react";
import { AlertCircleIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isSetup = /Supabase não configurado/i.test(error.message);

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircleIcon className="text-destructive size-4" />
          {isSetup ? "Supabase não configurado" : "Algo deu errado"}
        </CardTitle>
        <CardDescription>
          {isSetup
            ? "Preencha o .env.local com a URL e a chave anon do seu projeto e reinicie o servidor."
            : "Não foi possível carregar seus dados agora."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">{error.message}</pre>
        <Button variant="outline" className="self-start" onClick={reset}>
          <RotateCcwIcon />
          Tentar de novo
        </Button>
      </CardContent>
    </Card>
  );
}
