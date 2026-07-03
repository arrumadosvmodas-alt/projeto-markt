import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { useAuth } from "../lib/auth-context";

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      {/* Cabeçalho Superior Fixo - Adaptável aos Temas */}
      <header className="sticky top-0 z-20 border-b border-cream-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-forest-600"></span>
            <span className="text-xl font-extrabold tracking-tight text-graphite-900 font-display">Markt</span>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-graphite-500">
                {user.name.split(" ")[0]}
              </span>
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="h-9 w-9 rounded-full object-cover border border-cream-200 shadow-sm"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-50 border border-forest-100 text-forest-600 text-xs font-bold uppercase tracking-wider">
                  {initials}
                </div>
              )}
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

