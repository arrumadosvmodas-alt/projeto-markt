import type { PriceComparison } from "../lib/types";
import { formatBRL } from "./ui";

export function PriceDeltaBadge({ comparison }: { comparison: PriceComparison }) {
  if (comparison.kind === "first_purchase") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-2.5 py-1 text-xs font-semibold text-graphite-700">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3 text-graphite-500">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        Primeira compra deste item
      </span>
    );
  }

  const { kind, deltaAbs, deltaPct, previousPrice } = comparison;

  const styles = {
    higher: "bg-clay-100 text-clay-600 border border-clay-200/50",
    lower: "bg-forest-50 text-forest-700 border border-forest-100/60",
    same: "bg-cream-100 text-graphite-700 border border-cream-200/50",
  }[kind];

  const label = {
    higher: `Mais caro: +${formatBRL(Math.abs(deltaAbs))} (+${deltaPct.toFixed(0)}%)`,
    lower: `Mais barato: -${formatBRL(Math.abs(deltaAbs))} (-${deltaPct.toFixed(0)}%)`,
    same: "Manteve o preço",
  }[kind];

  const icon = {
    higher: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    ),
    lower: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    ),
    same: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5">
        <line x1="5" y1="9" x2="19" y2="9" />
        <line x1="5" y1="15" x2="19" y2="15" />
      </svg>
    ),
  }[kind];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {icon}
      <span>{label}</span>
      <span className="opacity-60 font-medium">· antes {formatBRL(previousPrice)}</span>
    </span>
  );
}

