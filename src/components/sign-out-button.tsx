import { LogOutIcon } from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" size="icon" aria-label="Sair da conta">
        <LogOutIcon />
      </Button>
    </form>
  );
}
