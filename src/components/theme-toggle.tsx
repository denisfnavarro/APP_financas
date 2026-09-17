"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * O tema vive na classe do <html>, aplicada pelo script inline do layout antes da
 * primeira pintura. Aqui a gente só lê essa fonte externa — daí o useSyncExternalStore
 * em vez de um estado espelhado, que daria mismatch de hidratação.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false // no servidor assumimos claro; o script inline corrige antes de pintar
  );

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("tema", next ? "dark" : "light");
    } catch {
      // Modo privado sem storage: o tema volta ao padrão no próximo load.
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
