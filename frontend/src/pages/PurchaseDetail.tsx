import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Purchase } from "../lib/types";
import { Card, PageHeader, formatBRL } from "../components/ui";

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [purchase, setPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<{ purchase: Purchase }>(`/purchases/${id}`).then((data) => setPurchase(data.purchase));
  }, [id]);

  if (!purchase) {
    return <div className="px-4 py-8 text-center text-graphite-500">Carregando...</div>;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Link to="/historico" className="mb-4 inline-block text-sm font-semibold text-forest-600 hover:text-forest-700 hover:underline">
        ← Voltar ao histórico
      </Link>
      <PageHeader
        title={purchase.market.name}
        subtitle={
          purchase.completedAt
            ? new Date(purchase.completedAt).toLocaleString("pt-BR")
            : undefined
        }
      />

      <Card className="p-4 border border-cream-200 bg-white">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-graphite-500">Total da compra</span>
          <span className="text-2xl font-extrabold text-forest-700">
            {formatBRL(purchase.totalAmount)}
          </span>
        </div>
        {purchase.budgetLimit && (
          <div className="mt-2.5 pt-2.5 border-t border-cream-100 flex items-center justify-between text-xs font-semibold text-graphite-500">
            <span>Limite definido</span>
            <span>{formatBRL(purchase.budgetLimit)}</span>
          </div>
        )}
      </Card>

      <div className="mt-8 space-y-2.5">
        <p className="text-xs font-bold text-graphite-700 uppercase tracking-wider">Itens desta compra</p>
        {purchase.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3.5 border border-cream-200/60 shadow-sm transition-all duration-200 hover:shadow">
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-bold text-graphite-900 truncate">{item.product.name}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="inline-block px-2 py-0.5 bg-cream-100/80 text-graphite-600 rounded-lg text-[10px] font-bold">
                  {item.quantity} × {formatBRL(item.price)}
                </span>
                {item.product.category && (
                  <span className="inline-block px-2 py-0.5 bg-forest-50 text-forest-700 rounded-lg text-[10px] font-bold">
                    {item.product.category}
                  </span>
                )}
              </div>
            </div>
            <p className="font-bold text-graphite-900 shrink-0">{formatBRL(item.subtotal)}</p>
          </div>
        ))}
      </div>
    </div>
  );

}
