import type { ReactNode } from "react";
import { BottomNav } from "./BottomNavNew";
import { useAuth } from "../lib/auth-context";

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      {/* Cabeçalho Superior Fixo - Estilo Revolut/Lista Mercado */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-black">
        <div className="flex h-16 items-center justify-between px-lg">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600"></span>
            <span className="text-xl font-extrabold tracking-tight text-white font-display">Markt</span>
          </div>

          {user && (
            <div className="flex items-center gap-md">
              <span className="text-sm font-semibold text-gray-600">
                {user.name.split(" ")[0]}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-white text-xs font-bold uppercase tracking-wider">
                {initials}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 pb-24 overflow-y-auto">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

