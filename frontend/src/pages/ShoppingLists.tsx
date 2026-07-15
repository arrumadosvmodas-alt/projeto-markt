import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Button, TextInput, Card } from "../components/ui";

interface ShoppingListItem {
  id?: string;
  name: string;
}

interface CustomShoppingList {
  id: string;
  name: string;
  createdAt: string;
  items: ShoppingListItem[];
}

interface DefaultCategory {
  category: string;
  items: string[];
}

interface PriceSuggestion {
  lastPrice: number | null;
  minPrice: number | null;
}

export default function ShoppingLists() {
  const [loading, setLoading] = useState(true);
  
  const [defaultCategories, setDefaultCategories] = useState<DefaultCategory[]>([]);
  const [customLists, setCustomLists] = useState<CustomShoppingList[]>([]);
  
  const [activeTab, setActiveTab] = useState<"minhas" | "criar" | "editar">("minhas");
  
  // States for list creation/editing
  const [listName, setListName] = useState("");
  const [selectedDefaultItems, setSelectedDefaultItems] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  
  // Price suggestions cache to avoid repeated requests
  const [priceSuggestions, setPriceSuggestions] = useState<Record<string, PriceSuggestion>>({});

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ defaultList: DefaultCategory[]; customLists: CustomShoppingList[] }>("/shopping-lists");
      setDefaultCategories(data.defaultList);
      setCustomLists(data.customLists);
      
      // Pre-fetch price suggestions for default items so they are ready
      const allDefault = data.defaultList.flatMap(c => c.items);
      fetchPricesForItems(allDefault.slice(0, 30)); // Fetch first 30 to limit overhead initially
    } catch (err: any) {
      console.error("Não foi possível carregar as listas de compras");
    } finally {
      setLoading(false);
    }
  };

  const fetchPricesForItems = async (itemNames: string[]) => {
    const suggestions: Record<string, PriceSuggestion> = { ...priceSuggestions };
    await Promise.all(
      itemNames.map(async (name) => {
        if (suggestions[name]) return;
        try {
          const res = await api.get<PriceSuggestion>(`/shopping-lists/suggest-price?name=${encodeURIComponent(name)}`);
          suggestions[name] = res;
        } catch {
          suggestions[name] = { lastPrice: null, minPrice: null };
        }
      })
    );
    setPriceSuggestions(suggestions);
  };

  const handleToggleDefaultItem = async (itemName: string) => {
    const isSelected = selectedDefaultItems.includes(itemName);
    let updated: string[];
    if (isSelected) {
      updated = selectedDefaultItems.filter(i => i !== itemName);
    } else {
      updated = [...selectedDefaultItems, itemName];
      // Fetch price suggestion when item gets selected
      if (!priceSuggestions[itemName]) {
        fetchPricesForItems([itemName]);
      }
    }
    setSelectedDefaultItems(updated);
  };

  const handleAddCustomItem = () => {
    const name = newItemName.trim();
    if (!name) return;
    if (customItems.includes(name) || selectedDefaultItems.includes(name)) {
      setNewItemName("");
      return;
    }
    setCustomItems([...customItems, name]);
    fetchPricesForItems([name]);
    setNewItemName("");
  };

  const handleRemoveCustomItem = (name: string) => {
    setCustomItems(customItems.filter(i => i !== name));
  };

  // Calculate predicted cost based on either lastPrice or minPrice fallback
  const getPredictedCost = () => {
    let total = 0;
    const allItems = [...selectedDefaultItems, ...customItems];
    allItems.forEach(item => {
      const price = priceSuggestions[item]?.lastPrice || priceSuggestions[item]?.minPrice || 0;
      total += price;
    });
    return total;
  };

  const handleSaveList = async () => {
    const name = listName.trim();
    if (!name) {
      alert("Por favor, dê um nome para sua lista.");
      return;
    }

    const allItems = [...selectedDefaultItems, ...customItems];
    if (allItems.length === 0) {
      alert("Adicione pelo menos um item à lista.");
      return;
    }

    try {
      if (activeTab === "editar" && editingListId) {
        await api.put(`/shopping-lists/${editingListId}`, { name, items: allItems });
      } else {
        await api.post("/shopping-lists", { name, items: allItems });
      }
      
      // Reset form
      setListName("");
      setSelectedDefaultItems([]);
      setCustomItems([]);
      setEditingListId(null);
      setActiveTab("minhas");
      fetchLists();
    } catch (err: any) {
      alert("Erro ao salvar lista de compras");
    }
  };

  const handleStartEdit = (list: CustomShoppingList) => {
    setEditingListId(list.id);
    setListName(list.name);
    
    // Distinguish between default items and custom items
    const defaultListNames = defaultCategories.flatMap(c => c.items);
    const defaults: string[] = [];
    const customs: string[] = [];
    
    list.items.forEach(item => {
      if (defaultListNames.includes(item.name)) {
        defaults.push(item.name);
      } else {
        customs.push(item.name);
      }
    });
    
    setSelectedDefaultItems(defaults);
    setCustomItems(customs);
    
    // Fetch prices
    fetchPricesForItems(list.items.map(i => i.name));
    
    setActiveTab("editar");
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta lista?")) return;
    try {
      await api.delete(`/shopping-lists/${id}`);
      fetchLists();
    } catch {
      alert("Erro ao excluir lista.");
    }
  };

  const formatPrice = (p: number | null) => {
    if (p === null || p === undefined) return "-";
    return `R$ ${p.toFixed(2)}`;
  };

  if (loading && customLists.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-graphite-500">
        Carregando listas de compras...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-20">
      <h1 className="text-2xl font-bold text-forest-800 mb-2">Listas de Compras</h1>
      
      {/* Tabs */}
      <div className="flex border-b border-cream-200 mb-4 bg-white rounded-lg p-1 shadow-sm">
        <button
          onClick={() => {
            setActiveTab("minhas");
            setEditingListId(null);
          }}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-md transition-colors ${
            activeTab === "minhas" 
              ? "bg-forest-600 text-white shadow-sm" 
              : "text-graphite-600 hover:text-graphite-900"
          }`}
        >
          Minhas Listas
        </button>
        <button
          onClick={() => {
            setListName("");
            setSelectedDefaultItems([]);
            setCustomItems([]);
            setActiveTab("criar");
          }}
          className={`flex-1 text-center py-2 text-sm font-semibold rounded-md transition-colors ${
            activeTab === "criar" || activeTab === "editar"
              ? "bg-forest-600 text-white shadow-sm" 
              : "text-graphite-600 hover:text-graphite-900"
          }`}
        >
          {activeTab === "editar" ? "Editando Lista" : "Nova Lista"}
        </button>
      </div>

      {activeTab === "minhas" ? (
        <div className="space-y-4">
          {customLists.length === 0 ? (
            <Card className="p-8 text-center bg-cream-50/50 border border-dashed border-cream-300">
              <span className="text-4xl">📋</span>
              <h3 className="mt-2 text-sm font-semibold text-graphite-800">Nenhuma lista criada</h3>
              <p className="mt-1 text-xs text-graphite-500">Crie uma lista de compras para estimar gastos e usar no supermercado.</p>
              <Button
                onClick={() => setActiveTab("criar")}
                className="mt-4 bg-forest-600 text-white px-3 py-1.5 text-xs"
              >
                Criar minha primeira lista
              </Button>
            </Card>
          ) : (
            customLists.map((list) => (
              <Card key={list.id} className="p-4 border border-cream-100 hover:border-cream-300 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-graphite-800 text-base">{list.name}</h3>
                    <p className="text-[11px] text-graphite-400">
                      Criada em: {new Date(list.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-forest-700 font-semibold mt-1">
                      {list.items.length} itens cadastrados
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleStartEdit(list)}
                      variant="secondary"
                      className="text-xs px-2.5 py-1 text-forest-600 border border-forest-100 hover:bg-forest-50"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDeleteList(list.id)}
                      variant="ghost"
                      className="text-xs px-2.5 py-1 text-red-600 border border-red-100 hover:bg-red-50 bg-red-50/50"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>

                <div className="mt-3 border-t border-cream-100 pt-2">
                  <div className="flex flex-wrap gap-1">
                    {list.items.slice(0, 8).map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-cream-100/70 text-graphite-700 font-medium px-2 py-0.5 rounded-full"
                      >
                        {item.name}
                      </span>
                    ))}
                    {list.items.length > 8 && (
                      <span className="text-[10px] bg-forest-100 text-forest-800 font-semibold px-2 py-0.5 rounded-full">
                        +{list.items.length - 8} outros
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="p-4 border border-cream-200">
            <TextInput
              label="Nome da Lista"
              placeholder="Ex: Rancho Mensal, Churrasco Fim de Semana"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              required
            />
          </Card>

          {/* Estimador de Preço Previsto */}
          <Card className="p-4 bg-gradient-to-br from-forest-500 to-emerald-600 text-white shadow-md border-0">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-forest-100 uppercase tracking-wider font-semibold">Valor Previsto Total</p>
                <h2 className="text-3xl font-extrabold">{formatPrice(getPredictedCost())}</h2>
              </div>
              <span className="text-3xl">💰</span>
            </div>
            <p className="text-[10px] text-emerald-100 mt-2 font-medium">
              * Estimativa com base no seu menor/último preço registrado no histórico.
            </p>
          </Card>

          {/* Custom Items Creator */}
          <Card className="p-4 border border-cream-200">
            <h3 className="text-sm font-bold text-graphite-800 mb-2">Adicionar item fora da lista padrão</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <TextInput
                  label=""
                  placeholder="Nome do produto (ex: Detergente Ypê, Pão)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAddCustomItem}
                className="bg-forest-600 text-white hover:bg-forest-700 self-end h-10 px-4"
              >
                +
              </Button>
            </div>

            {customItems.length > 0 && (
              <div className="mt-3 border-t border-cream-100 pt-3">
                <p className="text-[11px] font-bold text-graphite-400 mb-2">Itens Customizados:</p>
                <div className="space-y-1.5">
                  {customItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-cream-50 p-2 rounded-lg text-xs">
                      <span className="font-semibold text-graphite-800">{item}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-graphite-400">
                          Min: {formatPrice(priceSuggestions[item]?.minPrice)}
                        </span>
                        <button
                          onClick={() => handleRemoveCustomItem(item)}
                          className="text-red-500 font-bold hover:text-red-700"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Default List selector grouped by Category */}
          <h3 className="font-bold text-graphite-700 text-sm mt-4 mb-2">Selecione os itens da Lista Padrão:</h3>
          
          <div className="space-y-4">
            {defaultCategories.map((cat, catIdx) => (
              <Card key={catIdx} className="p-4 border border-cream-100">
                <h4 className="font-bold text-forest-700 text-sm mb-3 border-b border-cream-100 pb-1.5 flex justify-between">
                  <span>{cat.category}</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {cat.items.map((item, itemIdx) => {
                    const isSelected = selectedDefaultItems.includes(item);
                    const priceInfo = priceSuggestions[item];
                    return (
                      <button
                        key={itemIdx}
                        onClick={() => handleToggleDefaultItem(item)}
                        className={`flex flex-col text-left p-2.5 rounded-xl border transition-all text-xs ${
                          isSelected
                            ? "border-forest-600 bg-forest-50/50 ring-1 ring-forest-600"
                            : "border-cream-200 bg-white hover:bg-cream-50/50"
                        }`}
                      >
                        <span className="font-bold text-graphite-800 mb-1">{item}</span>
                        {priceInfo && (priceInfo.lastPrice || priceInfo.minPrice) ? (
                          <span className="text-[9px] text-forest-700 font-medium">
                            Último: {formatPrice(priceInfo.lastPrice)}
                          </span>
                        ) : (
                          <span className="text-[9px] text-graphite-400">Sem histórico</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          <div className="fixed bottom-16 inset-x-0 p-4 bg-cream-50/90 backdrop-blur-md border-t border-cream-200 flex gap-2 justify-center max-w-md mx-auto z-10">
            <Button
              onClick={() => setActiveTab("minhas")}
              variant="secondary"
              className="flex-1 max-w-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveList}
              className="flex-1 max-w-xs bg-forest-600 text-white"
            >
              Salvar Lista
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
