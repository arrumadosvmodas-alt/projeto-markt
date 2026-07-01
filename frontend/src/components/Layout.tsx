import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Logo } from "./ui";
import { useAuth } from "../lib/auth-context";

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "";

  return (
    <div className="min-h-screen bg-cream-50 text-graphite-900 flex flex-col">
      {/* Cabeçalho Superior Fixo */}
      <header className="sticky top-0 z-20 border-b border-cream-200 bg-cream-50/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="text-lg font-bold tracking-tight text-forest-700">Markt</span>
          </div>
          
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-graphite-500">
                Olá, {user.name.split(" ")[0]}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-100 text-xs font-bold text-forest-700 ring-2 ring-forest-50 select-none">
                {initials}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

