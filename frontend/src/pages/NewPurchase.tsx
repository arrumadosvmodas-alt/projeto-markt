import { useState, useEffect } from "react";
import { api } from "../lib/api";
import type { Market, Purchase } from "../lib/types";
import { MarketPicker } from "../components/MarketPicker";
import { Button, PageHeader, TextInput, Card } from "../components/ui";

interface ShoppingListItem {
  name: string;
}

interface CustomShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
}

interface DefaultCategory {
  category: string;
  items: string[];
}

export default function NewPurchase({
  onStarted,
}: {
  onStarted: (purchase: Purchase) => void;
}) {
  const [market, setMarket] = useState<Market | null>(null);
  
  // Wizard stages: "market" -> "list" -> "budget"
  const [stage, setStage] = useState<"market" | "list" | "budget">("market");
  
  const [customLists, setCustomLists] = useState<CustomShoppingList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedListName, setSelectedListName] = useState<string>("Nenhuma");
  const [predictedCost, setPredictedCost] = useState<number | null>(null);
  
  const [hasBudget, setHasBudget] = useState<boolean | null>(null);
  const [budgetLimit, setBudgetLimit] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (market) {
      fetchLists();
    }
  }, [market]);

  const fetchLists = async () => {
    try {
      const data = await api.get<{ defaultList: DefaultCategory[]; customLists: CustomShoppingList[] }>("/shopping-lists");
      setCustomLists(data.customLists);
    } catch {
      console.log("Erro ao carregar listas de compras");
    }
  };

  const handleSelectList = async (listId: string | null, listName: string, itemsList: string[]) => {
    setSelectedListId(listId);
    setSelectedListName(listName);
    
    if (itemsList.length === 0) {
      setPredictedCost(0);
      setStage("budget");
      return;
    }

    // Calcular custo previsto buscando o preço histórico de cada item
    try {
      let total = 0;
      await Promise.all(
        itemsList.map(async (name) => {
          try {
            const res = await api.get<{ lastPrice: number | null; minPrice: number | null }>(
              `/shopping-lists/suggest-price?name=${encodeURIComponent(name)}`
            );
            const price = res.lastPrice || res.minPrice || 0;
            total += price;
          } catch {}
        })
      );
      setPredictedCost(total);
    } catch {
      setPredictedCost(0);
    }
    
    setStage("budget");
  };

  async function startPurchase() {
    if (!market) return;
    setStarting(true);
    setError(null);
    try {
      const limit = hasBudget && budgetLimit ? Number(budgetLimit) : undefined;
      const data = await api.post<{ purchase: { id: string } }>("/purchases", {
        marketId: market.id,
        budgetLimit: limit,
        shoppingListId: selectedListId || undefined,
      });
      const full = await api.get<{ purchase: Purchase }>(
        `/purchases/${data.purchase.id}`
      );
      
      // Armazena temporariamente os itens da lista selecionada para uso no ActivePurchase
      if (selectedListId) {
        localStorage.setItem(`markt_active_list_${full.purchase.id}`, JSON.stringify({
          id: selectedListId,
          name: selectedListName,
          items: selectedListId === "default" 
            ? ["Arroz", "Feijão", "Macarrão", "Café", "Açúcar", "Sal", "Leite", "Óleo", "Sabão", "Detergente"] // Simplificado padrão
            : customLists.find(l => l.id === selectedListId)?.items.map(i => i.name) || []
        }));
      }

      onStarted(full.purchase);
    } catch {
      setError("Não foi possível iniciar a compra. Tente novamente.");
    } finally {
      setStarting(false);
    }
  }

  if (stage === "market" || !market) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <PageHeader
          title="Onde você vai comprar?"
          subtitle="Escolha o mercado para começar a registrar os itens"
        />
        <MarketPicker onSelect={(m) => {
          setMarket(m);
          setStage("list");
        }} />
      </div>
    );
  }

  if (stage === "list") {
    return (
      <div className="mx-auto max-w-md px-4 py-8 space-y-4">
        <PageHeader title="Selecionar Lista de Compras" subtitle={market.name} />
        
        <Card
          onClick={() => handleSelectList(null, "Nenhuma", [])}
          className="p-5 cursor-pointer border border-cream-200 hover:border-forest-400 text-left transition-all duration-200 active:scale-[0.99] flex items-start gap-4"
        >
          <span className="text-2xl">🚫</span>
          <div>
            <p className="font-bold text-graphite-900">Continuar sem lista</p>
            <p className="text-xs text-graphite-500 mt-1 font-medium">Faça sua compra livremente registrando os itens na hora.</p>
          </div>
        </Card>

        <Card
          onClick={() => handleSelectList("default", "Lista Padrão", ["Arroz", "Feijão", "Macarrão", "Café", "Açúcar", "Sal", "Leite", "Óleo", "Sabão", "Detergente"])}
          className="p-5 cursor-pointer border border-cream-200 hover:border-forest-400 text-left transition-all duration-200 active:scale-[0.99] flex items-start gap-4"
        >
          <span className="text-2xl">📋</span>
          <div>
            <p className="font-bold text-graphite-900">Usar a Lista Padrão</p>
            <p className="text-xs text-graphite-500 mt-1 font-medium">Usa os itens básicos sugeridos de supermercado.</p>
          </div>
        </Card>

        {customLists.map(list => (
          <Card
            key={list.id}
            onClick={() => handleSelectList(list.id, list.name, list.items.map(i => i.name))}
            className="p-5 cursor-pointer border border-cream-200 hover:border-forest-400 text-left transition-all duration-200 active:scale-[0.99] flex items-start gap-4"
          >
            <span className="text-2xl">🌟</span>
            <div>
              <p className="font-bold text-graphite-900">{list.name}</p>
              <p className="text-xs text-graphite-500 mt-1 font-medium">{list.items.length} itens cadastrados.</p>
            </div>
          </Card>
        ))}

        <button
          onClick={() => setStage("market")}
          className="mt-6 block w-full text-center text-sm font-semibold text-graphite-500 hover:text-graphite-700 underline underline-offset-2 transition"
        >
          ← Escolher outro mercado
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <PageHeader title="Definir limite de gasto" subtitle={`${market.name} (${selectedListName})`} />

      {predictedCost !== null && predictedCost > 0 && (
        <Card className="p-4 bg-amber-50 border border-amber-200 text-xs font-semibold mb-4 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-graphite-700">💡 Estimativa da lista (referência):</span>
            <span className="text-base font-extrabold text-graphite-900">R$ {predictedCost.toFixed(2).replace(".", ",")}</span>
          </div>
          <p className="text-[10px] font-medium text-graphite-500">Este valor é apenas uma estimativa baseada no seu histórico. Você pode comprar normalmente independente deste valor.</p>
        </Card>
      )}

      {hasBudget === null && (
        <div className="space-y-4">
          <Card
            onClick={() => {
              setHasBudget(true);
              if (predictedCost && predictedCost > 0) {
                setBudgetLimit(predictedCost.toFixed(2));
              }
            }}
            className="p-5 cursor-pointer border border-cream-200 hover:border-forest-400 text-left transition-all duration-200 active:scale-[0.99] flex items-start gap-4"
          >
            <div className="bg-forest-50 p-2.5 rounded-xl text-forest-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="12" y1="10" x2="12" y2="18" />
                <path d="M8 14h8" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-graphite-900">Definir um limite de gastos</p>
              <p className="text-xs text-graphite-500 mt-1 font-medium">Ideal para controlar suas finanças e evitar surpresas no caixa.</p>
            </div>
          </Card>

          <Card
            onClick={() => setHasBudget(false)}
            className="p-5 cursor-pointer border border-cream-200 hover:border-forest-400 text-left transition-all duration-200 active:scale-[0.99] flex items-start gap-4"
          >
            <div className="bg-cream-100 p-2.5 rounded-xl text-graphite-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-graphite-900">Comprar sem limite definido</p>
              <p className="text-xs text-graphite-500 mt-1 font-medium">Registre itens livremente. Você pode ver o total a qualquer momento.</p>
            </div>
          </Card>
        </div>
      )}

      {hasBudget === true && (
        <Card className="p-5 border border-cream-200 space-y-4">
          <TextInput
            label="Qual o limite máximo da compra? (R$)"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="Ex: 150.00"
            value={budgetLimit}
            onChange={(e) => setBudgetLimit(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button className="flex-1" disabled={!budgetLimit || starting} onClick={startPurchase}>
              {starting ? "Iniciando..." : "Começar compra"}
            </Button>
            <Button variant="ghost" type="button" onClick={() => setHasBudget(null)}>
              Voltar
            </Button>
          </div>
        </Card>
      )}

      {hasBudget === false && (
        <Card className="p-5 border border-cream-200 text-center space-y-4">
          <p className="text-sm font-semibold text-graphite-700">Você começará a comprar sem limite.</p>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={starting} onClick={startPurchase}>
              {starting ? "Iniciando..." : "Confirmar e iniciar"}
            </Button>
            <Button variant="ghost" type="button" onClick={() => setHasBudget(null)}>
              Voltar
            </Button>
          </div>
        </Card>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-clay-600">{error}</p>}

      {hasBudget === null && (
        <button
          onClick={() => {
            setStage("list");
            setHasBudget(null);
          }}
          className="mt-6 block w-full text-center text-sm font-semibold text-graphite-500 hover:text-graphite-700 underline underline-offset-2 transition"
        >
          ← Escolher outra lista
        </button>
      )}
    </div>
  );
}
