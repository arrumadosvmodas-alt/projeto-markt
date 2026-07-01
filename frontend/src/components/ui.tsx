import type { ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5c8a2e" />
          <stop offset="100%" stopColor="#3f6212" />
        </linearGradient>
      </defs>
      {/* Bolsa de compras estilizada que forma um M */}
      <path
        d="M6 10H26L23.5 24C23.2 25.7 21.7 27 20 27H12C10.3 27 8.8 25.7 8.5 24L6 10Z"
        fill="url(#logo-gradient)"
      />
      {/* Alça que parece folha / arco superior */}
      <path
        d="M11 10C11 6.5 13.2 4 16 4C18.8 4 21 6.5 21 10"
        stroke="#e0935a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Detalhe interno da alça */}
      <path
        d="M13.5 10C13.5 7.8 14.6 6.5 16 6.5C17.4 6.5 18.5 7.8 18.5 10"
        stroke="#fdfaf5"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Linhas do M central */}
      <path
        d="M10 15L13.5 21L16 17.5L18.5 21L22 15"
        stroke="#fdfaf5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm border border-cream-200/60 transition-all duration-200 hover:shadow-md ${className}`} {...props}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-graphite-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-graphite-500 font-medium">{subtitle}</p>}
    </header>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  const variants = {
    primary: "bg-forest-600 text-cream-50 hover:bg-forest-700 shadow-sm hover:shadow active:bg-forest-800",
    secondary: "bg-forest-50 text-forest-700 hover:bg-forest-100 active:bg-forest-200",
    ghost: "text-graphite-700 hover:bg-cream-100 active:bg-cream-200",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function TextInput({
  label,
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-semibold text-graphite-700">{label}</span>
      <input
        className={`w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-base text-graphite-900 outline-none transition-all duration-200 focus:border-forest-500 focus:ring-4 focus:ring-forest-100/50 ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-xs font-medium text-clay-600">{error}</span>}
    </label>
  );
}

export function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-cream-200 bg-white/60 px-6 py-12 text-center shadow-sm">
      {icon && <div className="text-graphite-400 bg-cream-100 p-3 rounded-full">{icon}</div>}
      <p className="font-semibold text-graphite-800">{title}</p>
      {description && <p className="text-sm text-graphite-500 max-w-xs">{description}</p>}
    </div>
  );
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

