import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { SpendingChart } from "../components/charts/SpendingChart";
import { CategoryChart } from "../components/charts/CategoryChart";
import { Card, EmptyState, PageHeader, formatBRL } from "../components/ui";

interface PriceChange {
  product: { id: string; name: string; category: string | null };
  previousPrice: number;
  latestPrice: number;
  deltaAbs: number;
  deltaPct: number;
}

interface SpendingResponse {
  granularity: "weekly" | "monthly";
  series: { period: string; total: number }[];
}

interface Highlights {
  avgTicket: number;
  cheapestMarket: { name: string; avgTicket: number; purchaseCount: number } | null;
  topBudgetProducts: { name: string; total: number }[];
}

export default function Analytics() {
  const [priceChanges, setPriceChanges] = useState<{ highs: PriceChange[]; lows: PriceChange[] } | null>(null);
  const [spending, setSpending] = useState<SpendingResponse | null>(null);
  const [categories, setCategories] = useState<{ category: string; total: number }[] | null>(null);
  const [highlights, setHighlights] = useState<Highlights | null>(null);

  useEffect(() => {
    api.get<{ highs: PriceChange[]; lows: PriceChange[] }>("/analytics/price-changes").then(setPriceChanges);
    api.get<SpendingResponse>("/analytics/spending").then(setSpending);
    api.get<{ categories: { category: string; total: number }[] }>("/analytics/by-category").then((d) => setCategories(d.categories));
    api.get<Highlights>("/analytics/highlights").then(setHighlights);
  }, []);

  const hasAnyData = spending && spending.series.length > 0;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <PageHeader title="Economia doméstica" subtitle="Como seus gastos de mercado estão se comportando" />

      {!hasAnyData && spending !== null && (
        <EmptyState
          title="Ainda não há dados suficientes"
          description="Finalize algumas compras para ver suas análises aqui."
        />
      )}

      {highlights && (highlights.avgTicket > 0 || highlights.cheapestMarket) && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Card className="p-4 flex flex-col justify-between h-28 border border-cream-200">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-graphite-500 uppercase tracking-wider">Ticket Médio</span>
              <div className="bg-forest-50 p-1.5 rounded-lg text-forest-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="12" y1="10" x2="12" y2="18" />
                  <path d="M8 14h8" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-graphite-950 tracking-tight">
                {formatBRL(highlights.avgTicket)}
              </p>
              <p className="text-[10px] text-graphite-400 font-semibold mt-0.5">Média por compra realizada</p>
            </div>
          </Card>

          {highlights.cheapestMarket && (
            <Card className="p-4 flex flex-col justify-between h-28 border border-cream-200">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-graphite-500 uppercase tracking-wider">Mais Econômico</span>
                <div className="bg-clay-50 p-1.5 rounded-lg text-clay-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-base font-extrabold text-graphite-900 truncate tracking-tight">
                  {highlights.cheapestMarket.name}
                </p>
                <p className="text-[10px] text-graphite-500 font-bold mt-0.5">
                  Média de {formatBRL(highlights.cheapestMarket.avgTicket)}
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {hasAnyData && (
        <Card className="mb-6 p-4 border border-cream-200">
          <p className="mb-3 text-xs font-bold text-graphite-700 uppercase tracking-wider">
            Gasto {spending!.granularity === "weekly" ? "semanal" : "mensal"}
          </p>
          <SpendingChart series={spending!.series} />
        </Card>
      )}

      {categories && categories.length > 0 && (
        <Card className="mb-6 p-4 border border-cream-200">
          <p className="mb-3 text-xs font-bold text-graphite-700 uppercase tracking-wider">Gasto por categoria</p>
          <CategoryChart categories={categories} />
        </Card>
      )}

      {priceChanges && (priceChanges.highs.length > 0 || priceChanges.lows.length > 0) && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PriceChangeList title="Maiores altas" items={priceChanges.highs} tone="high" />
          <PriceChangeList title="Maiores quedas" items={priceChanges.lows} tone="low" />
        </div>
      )}

      {highlights && highlights.topBudgetProducts.length > 0 && (
        <Card className="p-4 border border-cream-200">
          <p className="mb-4 text-xs font-bold text-graphite-700 uppercase tracking-wider">
            Itens que mais pesam no orçamento
          </p>
          <ul className="space-y-4">
            {(() => {
              const maxVal = highlights.topBudgetProducts[0]?.total || 1;
              return highlights.topBudgetProducts.slice(0, 5).map((p, idx) => {
                const pct = (p.total / maxVal) * 100;
                return (
                  <li key={p.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cream-100 text-[10px] font-extrabold text-graphite-600">
                          {idx + 1}
                        </span>
                        <span className="text-graphite-800 font-semibold">{p.name}</span>
                      </div>
                      <span className="font-bold text-graphite-900">{formatBRL(p.total)}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-cream-100 overflow-hidden">
                      <div
                        className="h-full bg-clay-400 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              });
            })()}
          </ul>
        </Card>
      )}
    </div>
  );
}

function PriceChangeList({
  title,
  items,
  tone,
}: {
  title: string;
  items: PriceChange[];
  tone: "high" | "low";
}) {
  if (items.length === 0) return null;
  const isHigh = tone === "high";
  const color = isHigh ? "text-clay-600" : "text-forest-600";
  const bgColor = isHigh ? "bg-clay-50" : "bg-forest-50";

  return (
    <Card className="p-4 border border-cream-200">
      <p className="mb-3 text-xs font-bold text-graphite-700 uppercase tracking-wider">{title}</p>
      <ul className="space-y-2.5">
        {items.slice(0, 5).map((c) => (
          <li key={c.product.id} className="flex items-center justify-between text-sm">
            <span className="truncate pr-2 font-semibold text-graphite-800">{c.product.name}</span>
            <span className={`shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${bgColor} ${color}`}>
              {isHigh ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
              {c.deltaPct > 0 ? "+" : ""}
              {c.deltaPct.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
