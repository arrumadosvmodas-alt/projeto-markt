import { useState } from "react";
import { api } from "../lib/api";
import type { Product, Purchase, PriceComparison, PurchaseItem } from "../lib/types";
import { Scanner } from "../components/Scanner";
import { BudgetBar } from "../components/BudgetBar";
import { PriceDeltaBadge } from "../components/PriceDeltaBadge";
import { Button, Card, PageHeader, TextInput, formatBRL } from "../components/ui";

type Step =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "looking-up"; barcode: string }
  | { kind: "manual-product"; barcode: string }
  | { kind: "price-quantity"; product: Product }
  | { kind: "editing-item"; item: PurchaseItem };

export default function ActivePurchase({
  purchase,
  onChange,
  onCompleted,
  onCanceled,
}: {
  purchase: Purchase;
  onChange: (purchase: Purchase) => void;
  onCompleted: (purchaseId: string) => void;
  onCanceled: () => void;
}) {
  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [lastComparison, setLastComparison] = useState<{
    productName: string;
    comparison: PriceComparison;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  async function handleBarcode(barcode: string) {
    setStep({ kind: "looking-up", barcode });
    setError(null);
    try {
      const data = await api.post<{ found: boolean; product?: Product }>(
        "/products/lookup",
        { barcode }
      );
      if (data.found && data.product) {
        setStep({ kind: "price-quantity", product: data.product });
      } else {
        setStep({ kind: "manual-product", barcode });
      }
    } catch {
      setError("Não foi possível identificar o produto. Tente novamente.");
      setStep({ kind: "idle" });
    }
  }

  async function handleAddItem(product: Product, price: number, quantity: number) {
    setError(null);
    try {
      const data = await api.post<{
        priceComparison: PriceComparison;
        totalAmount: number;
      }>(`/purchases/${purchase.id}/items`, {
        productId: product.id,
        price,
        quantity,
      });

      setLastComparison({ productName: product.name, comparison: data.priceComparison });

      const refreshed = await api.get<{ purchase: Purchase }>(
        `/purchases/${purchase.id}`
      );
      onChange(refreshed.purchase);
      setStep({ kind: "idle" });
    } catch {
      setError("Não foi possível adicionar o item. Tente novamente.");
    }
  }

  async function handleUpdateItem(itemId: string, price: number, quantity: number) {
    setError(null);
    try {
      const res = await api.put<{ purchase: Purchase }>(
        `/purchases/${purchase.id}/items/${itemId}`,
        { price, quantity }
      );
      onChange(res.purchase);
      setStep({ kind: "idle" });
    } catch {
      setError("Não foi possível atualizar o item. Tente novamente.");
    }
  }

  async function completePurchase() {
    setCompleting(true);
    try {
      await api.post(`/purchases/${purchase.id}/complete`);
      onCompleted(purchase.id);
    } catch {
      setError("Não foi possível finalizar a compra.");
      setCompleting(false);
    }
  }

  async function handleCancelPurchase() {
    const confirmed = window.confirm(
      "Tem certeza que deseja desistir desta compra? Todos os itens adicionados serão perdidos e esta compra não constará no seu histórico."
    );
    if (!confirmed) return;

    try {
      await api.delete(`/purchases/${purchase.id}`);
      onCanceled();
    } catch {
      setError("Não foi possível cancelar a compra.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <PageHeader title={purchase.market.name} subtitle={`${purchase.items.length} itens na compra`} />
        </div>
        <Button
          variant="ghost"
          onClick={handleCancelPurchase}
          className="text-clay-600 hover:text-clay-700 hover:bg-clay-50 font-semibold text-xs px-2.5 py-1.5 border border-clay-200/50 rounded-xl shrink-0 mt-1"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
            <path d="M19 12H5M5 12l6-6M5 12l6 6" />
          </svg>
          Voltar / Desistir
        </Button>
      </div>

      <Card className="p-4">
        <BudgetBar total={purchase.totalAmount} budgetLimit={purchase.budgetLimit} />
      </Card>

      {lastComparison && (
        <Card className="mt-4 p-4 border-l-4 border-l-forest-500">
          <p className="text-xs font-semibold text-graphite-400 uppercase tracking-wider">Último item adicionado</p>
          <p className="mt-1 text-sm font-bold text-graphite-900">{lastComparison.productName}</p>
          <div className="mt-2">
            <PriceDeltaBadge comparison={lastComparison.comparison} />
          </div>
        </Card>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-clay-600">{error}</p>}

      <Button
        className="mt-5 w-full shadow-md shadow-forest-600/10"
        onClick={() => setStep({ kind: "scanning" })}
        disabled={step.kind !== "idle"}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Adicionar item
      </Button>

      {step.kind === "looking-up" && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-graphite-500">
          <svg className="h-4 w-4 animate-spin text-forest-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Identificando produto...
        </div>
      )}

      {step.kind === "manual-product" && (
        <ManualProductForm
          barcode={step.barcode}
          onCreated={(product) => setStep({ kind: "price-quantity", product })}
          onCancel={() => setStep({ kind: "idle" })}
        />
      )}

      {step.kind === "price-quantity" && (
        <PriceQuantityForm
          product={step.product}
          onSubmit={(price, quantity) => handleAddItem(step.product, price, quantity)}
          onCancel={() => setStep({ kind: "idle" })}
        />
      )}

      {step.kind === "editing-item" && (
        <EditPriceQuantityForm
          item={step.item}
          onSubmit={(price, quantity) => handleUpdateItem(step.item.id, price, quantity)}
          onCancel={() => setStep({ kind: "idle" })}
        />
      )}

      {purchase.items.length > 0 && (
        <div className="mt-8 animate-fade-in">
          <p className="mb-3 text-sm font-bold text-graphite-700 uppercase tracking-wider">Itens adicionados</p>
          <ul className="space-y-2.5">
            {[...purchase.items].reverse().map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3.5 border border-cream-200/60 shadow-sm transition-all duration-200 hover:shadow">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-bold text-graphite-900 truncate">{item.product.name}</p>
                  <span className="inline-block px-2 py-0.5 bg-cream-100/80 text-graphite-600 rounded-lg text-[10px] font-bold mt-1">
                    {item.quantity} × {formatBRL(item.price)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-graphite-900 pr-1">{formatBRL(item.subtotal)}</p>
                  
                  <button
                    onClick={() => setStep({ kind: "editing-item", item })}
                    className="rounded-xl p-2 text-graphite-400 hover:bg-forest-50 hover:text-forest-600 transition-all duration-200 cursor-pointer"
                    aria-label="Editar item"
                  >
                    <EditIcon />
                  </button>

                  <button
                    onClick={async () => {
                      if (confirm(`Deseja realmente excluir o item "${item.product.name}"?`)) {
                        try {
                          const res = await api.delete<{ purchase: Purchase }>(
                            `/purchases/${purchase.id}/items/${item.id}`
                          );
                          onChange(res.purchase);
                        } catch {
                          setError("Não foi possível remover o item.");
                        }
                      }
                    }}
                    className="rounded-xl p-2 text-graphite-400 hover:bg-clay-100 hover:text-clay-600 transition-all duration-200 cursor-pointer"
                    aria-label="Remover item"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button
        variant="secondary"
        className="mt-8 w-full border border-forest-100"
        onClick={completePurchase}
        disabled={completing || purchase.items.length === 0}
      >
        {completing ? "Finalizando..." : "Finalizar compra"}
      </Button>


      {step.kind === "scanning" && (
        <Scanner onDetected={handleBarcode} onClose={() => setStep({ kind: "idle" })} />
      )}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M19 4h-4V3a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v1H5v2h1v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6h1V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ManualProductForm({
  barcode,
  onCreated,
  onCancel,
}: {
  barcode: string;
  onCreated: (product: Product) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = await api.post<{ product: Product }>("/products/manual", {
        barcode,
        name: name.trim(),
        category: category.trim() || undefined,
      });
      onCreated(data.product);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-4 p-4">
      <p className="mb-3 text-sm text-graphite-500">
        Não encontramos esse produto (código {barcode}). Cadastre rapidamente:
      </p>
      <form onSubmit={submit} className="space-y-3">
        <TextInput label="Nome do produto" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        <TextInput label="Categoria (opcional)" value={category} onChange={(e) => setCategory(e.target.value)} />
        <div className="flex gap-2">
          <Button type="submit" disabled={saving} className="flex-1">
            Continuar
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PriceQuantityForm({
  product,
  onSubmit,
  onCancel,
}: {
  product: Product;
  onSubmit: (price: number, quantity: number) => void;
  onCancel: () => void;
}) {
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = Number(price);
    const quantityNum = Number(quantity);
    if (!(priceNum > 0) || !(quantityNum > 0)) return;
    setSubmitting(true);
    onSubmit(priceNum, quantityNum);
  }

  return (
    <Card className="mt-4 p-4">
      <p className="mb-3 font-medium text-graphite-900">{product.name}</p>
      <form onSubmit={submit} className="space-y-3">
        <TextInput
          label="Preço (R$)"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          autoFocus
          required
        />
        <TextInput
          label="Quantidade"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting} className="flex-1">
            Adicionar
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function EditPriceQuantityForm({
  item,
  onSubmit,
  onCancel,
}: {
  item: PurchaseItem;
  onSubmit: (price: number, quantity: number) => void;
  onCancel: () => void;
}) {
  const [price, setPrice] = useState(String(item.price));
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [submitting, setSubmitting] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = Number(price);
    const quantityNum = Number(quantity);
    if (!(priceNum > 0) || !(quantityNum > 0)) return;
    setSubmitting(true);
    onSubmit(priceNum, quantityNum);
  }

  return (
    <Card className="mt-4 p-4 border border-cream-200 bg-white">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-bold text-graphite-900">Editar {item.product.name}</p>
        <span className="text-xs font-semibold text-graphite-400">Alterando valores</span>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <TextInput
          label="Preço unitário (R$)"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          autoFocus
          required
        />
        <TextInput
          label="Quantidade"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting} className="flex-1">
            Salvar
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

