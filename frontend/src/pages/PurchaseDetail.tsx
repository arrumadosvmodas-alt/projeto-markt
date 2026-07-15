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
    api.get<{ purchase: Purchase }>(`/purchases/${id}`).then((res) => {
      setPurchase(res.purchase);
    });
  }, [id]);

  async function handleEditMarketName() {
    if (!purchase) return;
    const newName = window.prompt("Editar nome do estabelecimento:", purchase.market.name);
    if (newName === null) return;
    if (!newName.trim() || newName.trim().length < 2) {
      alert("Nome inválido! Deve conter pelo menos 2 caracteres.");
      return;
    }

    try {
      const data = await api.put<{ market: any }>(`/markets/${purchase.market.id}`, {
        name: newName.trim(),
      });
      setPurchase({
        ...purchase,
        market: data.market,
      });
    } catch {
      alert("Erro ao atualizar o nome do estabelecimento.");
    }
  }

  if (!purchase) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="mb-4">
        <Link
          to="/historico"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-graphite-500 hover:text-graphite-700 hover:underline"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
            <path d="M19 12H5M5 12l6-6M5 12l6 6" />
          </svg>
          Voltar para histórico
        </Link>
      </div>

      <PageHeader
        title={purchase.market.name}
        subtitle={new Date(purchase.completedAt!).toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      />

      <Card className="p-4 border border-cream-200 bg-white rounded-2xl mb-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-graphite-500">Total da compra</span>
          <span className="text-2xl font-black text-forest-700 tabular-nums">
            {formatBRL(purchase.totalAmount)}
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-cream-100 flex items-center justify-between text-xs font-semibold text-graphite-500">
          <span>Estabelecimento</span>
          <button
            onClick={handleEditMarketName}
            className="flex items-center gap-1 text-forest-600 hover:text-forest-700 font-bold cursor-pointer"
            title="Clique para editar"
          >
            <span>{purchase.market.name}</span>
            <PencilIcon />
          </button>
        </div>
        {purchase.budgetLimit && (
          <div className="mt-2.5 pt-2.5 border-t border-cream-100 flex items-center justify-between text-xs font-semibold text-graphite-500">
            <span>Limite definido</span>
            <span className="tabular-nums">{formatBRL(purchase.budgetLimit)}</span>
          </div>
        )}
        {purchase.paymentMethod && (
          <div className="mt-2.5 pt-2.5 border-t border-cream-100 flex flex-col gap-1 text-xs font-semibold text-graphite-500">
            <div className="flex items-center justify-between">
              <span>Forma de pagamento</span>
              <span className="text-graphite-800 font-bold">
                {purchase.paymentMethod === "a_vista" && "À vista / Débito"}
                {purchase.paymentMethod === "credito" && "Cartão de Crédito"}
                {purchase.paymentMethod === "alimentacao" && "Vale Alimentação"}
                {purchase.paymentMethod === "misto" && "Misto (Múltiplas formas)"}
              </span>
            </div>
            {purchase.paymentDetails && (
              <div className="text-[10px] text-graphite-400 font-semibold text-right mt-0.5 italic">
                {(() => {
                  try {
                    const parsed = JSON.parse(purchase.paymentDetails);
                    return parsed.text || purchase.paymentDetails;
                  } catch {
                    return purchase.paymentDetails;
                  }
                })()}
              </div>
            )}
          </div>
        )}
      </Card>

      {purchase.shoppingListReport && (
        <Card className="p-4 border border-cream-200 bg-white rounded-2xl mb-6">
          <p className="text-[10px] font-bold text-graphite-400 uppercase tracking-wider mb-2">
            Relatório de Lista de Compras ({purchase.shoppingListReport.name})
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] font-bold text-forest-700 block mb-1">Comprados</span>
              <div className="space-y-1">
                {purchase.shoppingListReport.items.filter((i: any) => i.status === 'bought').map((item: any, idx: number) => (
                  <div key={idx} className="text-xs text-graphite-600 bg-forest-50/50 px-2.5 py-1 rounded-lg">
                    {item.name}
                  </div>
                ))}
                {purchase.shoppingListReport.items.filter((i: any) => i.status === 'bought').length === 0 && (
                  <div className="text-xs text-graphite-400 italic">Nenhum item comprado</div>
                )}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold text-clay-700 block mb-1">Não Localizados</span>
              <div className="space-y-1">
                {purchase.shoppingListReport.items.filter((i: any) => i.status === 'not_found').map((item: any, idx: number) => (
                  <div key={idx} className="text-xs text-graphite-600 bg-clay-50/50 px-2.5 py-1 rounded-lg">
                    {item.name}
                  </div>
                ))}
                {purchase.shoppingListReport.items.filter((i: any) => i.status === 'not_found').length === 0 && (
                  <div className="text-xs text-graphite-400 italic font-medium">Nenhum item em falta</div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2.5">
        <p className="text-xs font-bold text-graphite-700 uppercase tracking-wider">Itens desta compra</p>
        {purchase.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 border border-cream-200/60 shadow-sm transition-all duration-200 hover:shadow">
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-bold text-graphite-900 truncate">{item.product.name}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="inline-block px-2.5 py-1 bg-cream-100/60 text-graphite-600 rounded-xl text-[10px] font-bold">
                  {item.quantity} × {formatBRL(item.price)}
                </span>
                {item.product.category && (
                  <span className="inline-block px-2.5 py-1 bg-forest-50 text-forest-700 rounded-xl text-[10px] font-bold">
                    {item.product.category}
                  </span>
                )}
              </div>
            </div>
            <p className="font-bold text-graphite-900 shrink-0 tabular-nums">{formatBRL(item.subtotal)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
