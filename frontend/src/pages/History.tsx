import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { PurchaseSummary } from "../lib/types";
import { Card, EmptyState, PageHeader, formatBRL } from "../components/ui";

export default function History() {
  const [purchases, setPurchases] = useState<PurchaseSummary[] | null>(null);

  useEffect(() => {
    api
      .get<{ purchases: PurchaseSummary[] }>("/purchases")
      .then((data) => setPurchases(data.purchases.filter((p) => p.status === "completed")));
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <PageHeader title="Histórico de compras" />

      {purchases === null && (
        <div className="flex justify-center py-12 text-sm font-semibold text-graphite-500">
          <svg className="h-5 w-5 animate-spin text-forest-600 mr-2" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Carregando histórico...
        </div>
      )}

      {purchases?.length === 0 && (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Nenhuma compra finalizada"
          description="Suas compras concluídas vão aparecer aqui de forma organizada."
        />
      )}

      <ul className="space-y-3">
        {purchases?.map((p) => (
          <li key={p.id} className="animate-fade-in">
            <Link to={`/historico/${p.id}`}>
              <Card className="p-4 border border-cream-200 hover:border-forest-300 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-forest-50 p-2 rounded-xl text-forest-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-graphite-900">{p.market.name}</p>
                      <p className="text-xs text-graphite-500 font-medium">
                        {p.completedAt && new Date(p.completedAt).toLocaleDateString("pt-BR")} · {p.itemCount} {p.itemCount === 1 ? "item" : "itens"}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-graphite-950 text-base">{formatBRL(p.totalAmount)}</p>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

