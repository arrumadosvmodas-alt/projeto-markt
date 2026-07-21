import { useState, useEffect } from "react";
import { api } from "../lib/api";
import type { Product, Purchase, PriceComparison, PurchaseItem } from "../lib/types";
import { Scanner } from "../components/Scanner";
import { BudgetBar } from "../components/BudgetBar";
import { PriceDeltaBadge } from "../components/PriceDeltaBadge";
import { Button, Card, PageHeader, TextInput, formatBRL } from "../components/ui";

type Step =
  | { kind: "idle" }
  | { kind: "adding-choice" }
  | { kind: "typing-code" }
  | { kind: "searching-name" }
  | { kind: "paying" }
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

  const [listName, setListName] = useState<string | null>(null);
  const [listItems, setListItems] = useState<{ name: string; status: 'pending' | 'bought' | 'not_found' }[]>([]);
  const [isListExpanded, setIsListExpanded] = useState(false);

  useEffect(() => {
    const listRaw = localStorage.getItem(`markt_active_list_${purchase.id}`);
    if (listRaw) {
      try {
        const parsed = JSON.parse(listRaw);
        setListName(parsed.name);
        const savedProgress = localStorage.getItem(`markt_active_list_progress_${purchase.id}`);
        if (savedProgress) {
          setListItems(JSON.parse(savedProgress));
        } else {
          setListItems(parsed.items.map((name: string) => ({ name, status: 'pending' })));
        }
      } catch (e) {
        console.error("Erro ao carregar lista ativa:", e);
      }
    }
  }, [purchase.id]);

  useEffect(() => {
    if (listItems.length > 0) {
      localStorage.setItem(`markt_active_list_progress_${purchase.id}`, JSON.stringify(listItems));
    }
  }, [listItems, purchase.id]);

  // Remove o item da lista ao marcar como comprado
  const markItemBought = (index: number) => {
    setListItems(prev => prev.filter((_, i) => i !== index));
    setStep({ kind: "idle" });
  };

  const handleToggleNotFound = (index: number) => {
    const updated = [...listItems];
    updated[index].status = updated[index].status === 'not_found' ? 'pending' : 'not_found';
    setListItems(updated);
    setStep({ kind: "idle" });
  };

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

      // Auto-match: se o produto adicionado coincide com item pendente da lista, remove-o
      const matchIdx = listItems.findIndex(i => 
        i.status === 'pending' && 
        product.name.toLowerCase().includes(i.name.toLowerCase())
      );
      if (matchIdx !== -1) {
        setListItems(prev => prev.filter((_, i) => i !== matchIdx));
      }

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

  async function completePurchase(paymentMethod: string, paymentDetails?: string) {
    setCompleting(true);
    try {
      let shoppingListReport;
      const activeListRaw = localStorage.getItem(`markt_active_list_${purchase.id}`);
      if (activeListRaw) {
        const parsedList = JSON.parse(activeListRaw);
        shoppingListReport = {
          shoppingListId: parsedList.id,
          name: parsedList.name,
          items: listItems.map(item => ({
            name: item.name,
            status: item.status === 'bought' ? 'bought' : 'not_found'
          }))
        };
      }

      await api.post(`/purchases/${purchase.id}/complete`, {
        paymentMethod,
        paymentDetails,
        shoppingListReport
      });

      localStorage.removeItem(`markt_active_list_${purchase.id}`);
      localStorage.removeItem(`markt_active_list_progress_${purchase.id}`);
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

  async function handleEditMarketName() {
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
      onChange({
        ...purchase,
        market: data.market,
      });
    } catch {
      alert("Erro ao atualizar o nome do estabelecimento.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <PageHeader title={purchase.market.name} subtitle={`${purchase.items.length} itens na compra`} />
          <button
            onClick={handleEditMarketName}
            className="text-[11px] font-bold text-forest-600 hover:text-forest-700 cursor-pointer flex items-center gap-1 -mt-4 mb-2"
          >
            <span>Corrigir nome do estabelecimento</span>
            <PencilIcon />
          </button>
        </div>
        <Button
          variant="ghost"
          onClick={handleCancelPurchase}
          className="text-clay-600 hover:text-clay-700 hover:bg-clay-50 font-semibold text-xs px-2.5 py-1.5 border border-clay-200/50 rounded-xl shrink-0 mt-1 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
            <path d="M19 12H5M5 12l6-6M5 12l6 6" />
          </svg>
          Voltar / Desistir
        </Button>
      </div>

      <Card className="p-4 bg-white border border-cream-200 mb-4">
        <BudgetBar total={purchase.totalAmount} budgetLimit={purchase.budgetLimit} />
      </Card>

      {listName && (
        <Card className="p-4 bg-white border border-cream-200 mb-4 animate-fade-in shadow-sm">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsListExpanded(!isListExpanded)}>
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <span className="font-bold text-graphite-800 text-sm">{listName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-forest-50 px-2 py-0.5 rounded-full font-bold text-forest-700">
                {listItems.filter(i => i.status === 'bought').length}/{listItems.length}
              </span>
              <span className="text-xs text-graphite-400 font-semibold">{isListExpanded ? "Ocultar" : "Mostrar"}</span>
            </div>
          </div>

          {isListExpanded && (
            <div className="mt-3 border-t border-cream-100 pt-3 space-y-2.5">
              {/* Contadores */}
              <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold pb-2 border-b border-cream-100/50">
                <div className="bg-clay-50 text-clay-700 p-1.5 rounded-xl">
                  <div>Não Possui</div>
                  <div className="text-sm font-black">{listItems.filter(i => i.status === 'not_found').length}</div>
                </div>
                <div className="bg-cream-100/60 text-graphite-700 p-1.5 rounded-xl">
                  <div>Restante</div>
                  <div className="text-sm font-black">{listItems.filter(i => i.status === 'pending').length}</div>
                </div>
              </div>

              {/* Lista de Itens - bought items are removed; not_found stay visible */}
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {listItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 hover:bg-cream-50 rounded-xl transition-colors">
                    <span className={`text-xs font-semibold ${
                      item.status === 'not_found' ? 'text-clay-500 line-through' : 'text-graphite-800'
                    }`}>
                      {item.name}
                      {item.status === 'not_found' && <span className="ml-1 text-[9px] font-bold text-clay-400">(não possui)</span>}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => markItemBought(idx)}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all duration-200 cursor-pointer bg-white border-cream-200 text-forest-600 hover:bg-forest-50"
                      >
                        ✔ Comprado
                      </button>
                      <button
                        onClick={() => handleToggleNotFound(idx)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all duration-200 cursor-pointer ${
                          item.status === 'not_found'
                            ? 'bg-clay-600 border-clay-600 text-white shadow-sm'
                            : 'bg-white border-cream-200 text-clay-600 hover:bg-clay-50'
                        }`}
                      >
                        ❌ Não possui
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {lastComparison && (
        <Card className="p-4 border border-cream-200 bg-white border-l-4 border-l-forest-500 mb-4 animate-fade-in">
          <p className="text-[10px] font-bold text-graphite-400 uppercase tracking-wider">Último item adicionado</p>
          <p className="mt-1 text-sm font-bold text-graphite-900 truncate">{lastComparison.productName}</p>
          <div className="mt-2">
            <PriceDeltaBadge comparison={lastComparison.comparison} />
          </div>
        </Card>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-clay-600 mb-4">{error}</p>}

      {step.kind === "idle" && (
        <Button
          className="w-full shadow-md shadow-forest-600/10 transition-all duration-150 active:scale-[0.98]"
          onClick={() => setStep({ kind: "adding-choice" })}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar item
        </Button>
      )}

      {step.kind === "looking-up" && (
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-graphite-500 py-3">
          <svg className="h-4 w-4 animate-spin text-forest-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Identificando produto...
        </div>
      )}

      {step.kind === "adding-choice" && (
        <Card className="p-4 border border-cream-200 bg-white mt-4">
          <p className="font-bold text-graphite-900 mb-3">Como deseja adicionar o item?</p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setStep({ kind: "scanning" })} className="w-full">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Ler código de barras (Câmera)
            </Button>
            <Button onClick={() => setStep({ kind: "typing-code" })} variant="secondary" className="w-full border border-forest-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M3 5h18M3 10h18M3 15h18M3 20h18" />
              </svg>
              Digitar número do código de barras
            </Button>
            <Button onClick={() => setStep({ kind: "searching-name" })} variant="secondary" className="w-full border border-forest-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Digitar nome do item
            </Button>
            <Button onClick={() => setStep({ kind: "idle" })} variant="ghost" className="w-full text-graphite-500">
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {step.kind === "typing-code" && (
        <Card className="p-4 border border-cream-200 bg-white mt-4">
          <p className="font-bold text-graphite-900 mb-3">Digitar código de barras</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const code = (e.currentTarget.elements.namedItem("barcode") as HTMLInputElement).value;
              if (code.trim()) handleBarcode(code.trim());
            }}
            className="space-y-3"
          >
            <TextInput
              label="Código de barras"
              name="barcode"
              type="text"
              inputMode="numeric"
              placeholder="Ex: 7891000100103"
              autoFocus
              required
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Buscar Produto
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep({ kind: "adding-choice" })}>
                Voltar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {step.kind === "searching-name" && (
        <SearchingNameForm
          initialQuery=""
          onSelectProduct={(product) => setStep({ kind: "price-quantity", product })}
          onCancel={() => {
            setStep({ kind: "adding-choice" });
          }}
        />
      )}{step.kind === "manual-product" && (
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

      {step.kind === "paying" && (
        <PaymentForm
          totalAmount={purchase.totalAmount}
          onConfirm={(method, details) => completePurchase(method, details)}
          onCancel={() => setStep({ kind: "idle" })}
          loading={completing}
        />
      )}

      {/* Listagem de Itens Adicionados */}
      {purchase.items.length > 0 && (
        <div className="animate-fade-in pt-2 mt-6">
          <p className="mb-3 text-xs font-bold text-graphite-400 uppercase tracking-wider">Itens adicionados</p>
          <ul className="space-y-2.5">
            {[...purchase.items].reverse().map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 border border-cream-200/60 shadow-sm transition-all duration-200 hover:shadow">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-bold text-graphite-900 truncate">{item.product.name}</p>
                  <span className="inline-block px-2.5 py-1 bg-cream-100/60 text-graphite-600 rounded-xl text-[10px] font-bold mt-1">
                    {item.quantity} × {formatBRL(item.price)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-graphite-900 pr-1 tabular-nums">{formatBRL(item.subtotal)}</p>
                  
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

      {step.kind === "idle" && (
        <Button
          variant="secondary"
          className="w-full border border-forest-100 shadow-sm mt-8 transition-all duration-150 active:scale-[0.98]"
          onClick={() => setStep({ kind: "paying" })}
          disabled={completing || purchase.items.length === 0}
        >
          Finalizar compra
        </Button>
      )}
      {step.kind === "scanning" && (
        <Scanner 
          onDetected={handleBarcode} 
          onClose={() => setStep({ kind: "idle" })} 
          onManual={() => {
            const virtualBarcode = "manual-" + Date.now();
            setStep({ kind: "manual-product", barcode: virtualBarcode });
          }}
        />
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

function SearchingNameForm({
  onSelectProduct,
  onCancel,
  initialQuery = "",
}: {
  onSelectProduct: (product: Product) => void;
  onCancel: () => void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handler = setTimeout(() => {
      api.get<{ products: Product[] }>(`/products/search?q=${encodeURIComponent(q)}`)
        .then((data) => setResults(data.products))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 400);

    return () => clearTimeout(handler);
  }, [query]);

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    const virtualBarcode = "manual-" + Date.now();
    try {
      const data = await api.post<{ product: Product }>("/products/manual", {
        barcode: virtualBarcode,
        name: newName.trim(),
        category: newCategory.trim() || undefined,
      });
      onSelectProduct(data.product);
    } catch {
      alert("Erro ao criar produto.");
    } finally {
      setLoading(false);
    }
  }

  if (creating) {
    return (
      <Card className="mt-4 p-4 border border-cream-200 bg-white">
        <p className="font-bold text-graphite-900 mb-3">Cadastrar Novo Produto</p>
        <form onSubmit={handleCreateProduct} className="space-y-3">
          <TextInput
            label="Nome do produto"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex: Alface Crespa"
            autoFocus
            required
          />
          <TextInput
            label="Categoria (opcional)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Ex: Hortifruti"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              Cadastrar e Avançar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              Voltar
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="mt-4 p-4 border border-cream-200 bg-white">
      <p className="font-bold text-graphite-900 mb-2">Digitar nome do item</p>
      <TextInput
        label="Pesquisar produto"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ex: Arroz Tio João"
        autoFocus
      />

      {loading && (
        <p className="text-xs text-graphite-400 mt-2">Pesquisando...</p>
      )}

      {query.trim() && results.length > 0 && (
        <ul className="mt-3 divide-y divide-cream-100 border border-cream-100 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto shadow-sm">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelectProduct(p)}
                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-graphite-800 hover:bg-forest-50 hover:text-forest-700 transition cursor-pointer"
              >
                {p.name} {p.brand ? `(${p.brand})` : ""}
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim() && results.length === 0 && !loading && (
        <div className="mt-3 p-3 bg-cream-50 rounded-xl border border-cream-200/60 text-center animate-fade-in">
          <p className="text-xs text-graphite-500 mb-2">Nenhum produto encontrado com este nome.</p>
          <Button
            type="button"
            variant="secondary"
            className="text-xs py-2 px-3 border border-forest-200"
            onClick={() => {
              setNewName(query);
              setCreating(true);
            }}
          >
            Cadastrar "{query}" como Novo Produto
          </Button>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border border-forest-100 text-xs py-2"
          onClick={() => setCreating(true)}
        >
          Cadastrar Novo Produto do Zero
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-xs py-2"
          onClick={onCancel}
        >
          Voltar
        </Button>
      </div>
    </Card>
  );
}

function PaymentForm({
  totalAmount,
  onConfirm,
  onCancel,
  loading,
}: {
  totalAmount: number;
  onConfirm: (method: string, details?: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [method, setMethod] = useState<"a_vista" | "credito" | "alimentacao" | "misto">("a_vista");

  const [cashVal, setCashVal] = useState("");
  const [creditVal, setCreditVal] = useState("");
  const [voucherVal, setVoucherVal] = useState("");

  const cash = Number(cashVal) || 0;
  const credit = Number(creditVal) || 0;
  const voucher = Number(voucherVal) || 0;

  const currentTotal = cash + credit + voucher;
  const remaining = totalAmount - currentTotal;
  const isComplete = method === "misto" ? Math.abs(remaining) < 0.01 : true;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete) return;

    if (method === "misto") {
      const detailsList: string[] = [];
      if (cash > 0) detailsList.push(`${formatBRL(cash)} À vista`);
      if (credit > 0) detailsList.push(`${formatBRL(credit)} Crédito`);
      if (voucher > 0) detailsList.push(`${formatBRL(voucher)} Alimentação`);
      
      const jsonDetails = JSON.stringify({
        a_vista: cash,
        credito: credit,
        alimentacao: voucher,
        text: detailsList.join(", ")
      });
      onConfirm("misto", jsonDetails);
    } else {
      onConfirm(method);
    }
  }

  return (
    <Card className="mt-4 p-4 border border-cream-200 bg-white">
      <div className="mb-3">
        <p className="font-bold text-graphite-900">Finalizar Compra</p>
        <p className="text-xs font-semibold text-graphite-500">Valor Total: {formatBRL(totalAmount)}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <span className="block text-sm font-semibold text-graphite-700">Forma de pagamento</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "a_vista", label: "À vista / Débito" },
              { id: "credito", label: "Crédito" },
              { id: "alimentacao", label: "Alimentação" },
              { id: "misto", label: "Misto (Várias)" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMethod(opt.id as any)}
                className={`px-3 py-2.5 text-xs font-bold border rounded-xl transition cursor-pointer ${
                  method === opt.id
                    ? "bg-forest-600 border-forest-600 text-white shadow-sm"
                    : "bg-white border-cream-200 text-graphite-700 hover:border-forest-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {method === "misto" && (
          <div className="space-y-3 p-3 bg-cream-50 rounded-2xl border border-cream-200/60 animate-fade-in">
            <p className="text-xs font-bold text-graphite-700">Distribuir pagamento:</p>
            <div className="space-y-2">
              <TextInput
                label="À vista / Débito (R$)"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={cashVal}
                onChange={(e) => setCashVal(e.target.value)}
              />
              <TextInput
                label="Crédito (R$)"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={creditVal}
                onChange={(e) => setCreditVal(e.target.value)}
              />
              <TextInput
                label="Alimentação (R$)"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={voucherVal}
                onChange={(e) => setVoucherVal(e.target.value)}
              />
            </div>

            <div className="pt-2 border-t border-cream-200/80 flex items-center justify-between text-xs font-semibold">
              <span className="text-graphite-600">Total distribuído:</span>
              <span className="text-graphite-900 font-bold">{formatBRL(currentTotal)}</span>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-graphite-600">Restante:</span>
              <span className={`font-bold ${remaining > 0 ? "text-clay-600" : remaining === 0 ? "text-forest-600" : "text-amber-600"}`}>
                {remaining > 0 ? `Falta ${formatBRL(remaining)}` : remaining === 0 ? "Valor exato!" : `Troco de ${formatBRL(Math.abs(remaining))}`}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={loading || !isComplete}
            className="flex-1 shadow-md shadow-forest-600/10"
          >
            {loading ? "Processando..." : "Confirmar e Finalizar"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Voltar
          </Button>
        </div>
      </form>
    </Card>
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


