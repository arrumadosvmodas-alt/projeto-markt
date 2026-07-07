import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button, Card, PageHeader, TextInput } from "../components/ui";

interface WalletCategory {
  id: string;
  label: string;
  limit: number;
  spent: number;
  remaining: number;
  exceeded: number;
}

interface TopProduct {
  name: string;
  amount: number;
}

interface WalletStatus {
  configured: boolean;
  shouldPrompt?: boolean;
  cycleStartDate: string;
  cycleEndDate: string;
  walletCycleDay?: number;
  totalLimit?: number;
  totalSpent?: number;
  spentPercent?: number;
  momVariation?: number;
  categories?: WalletCategory[];
  topProducts?: TopProduct[];
  advice?: string;
}

interface HistoryPoint {
  label: string;
  credito: number; // estimated limit
  debito: number; // actual spent
}

interface PriceChangeItem {
  product: {
    id: string;
    name: string;
    category: string | null;
  };
  previousPrice: number;
  latestPrice: number;
  deltaAbs: number;
  deltaPct: number;
}

export default function Wallet() {
  const [status, setStatus] = useState<WalletStatus | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [highs, setHighs] = useState<PriceChangeItem[]>([]);
  const [lows, setLows] = useState<PriceChangeItem[]>([]);

  // Form states
  const [cycleDay, setCycleDay] = useState("5");
  const [limitDebito, setLimitDebito] = useState("0");
  const [limitCredito, setLimitCredito] = useState("0");
  const [limitAlimentacao, setLimitAlimentacao] = useState("0");
  const [limitOutros, setLimitOutros] = useState("0");
  const [isEditing, setIsEditing] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.get<WalletStatus>("/wallet/status");
      setStatus(data);

      if (data.configured) {
        setCycleDay(String(data.walletCycleDay ?? 5));
        
        // Find existing limits from category array to pre-fill form
        const deb = data.categories?.find((c) => c.id === "debito")?.limit ?? 0;
        const cre = data.categories?.find((c) => c.id === "credito")?.limit ?? 0;
        const ali = data.categories?.find((c) => c.id === "alimentacao")?.limit ?? 0;
        const out = data.categories?.find((c) => c.id === "outros")?.limit ?? 0;

        setLimitDebito(String(deb));
        setLimitCredito(String(cre));
        setLimitAlimentacao(String(ali));
        setLimitOutros(String(out));

        const histData = await api.get<{ history: HistoryPoint[] }>("/wallet/history");
        setHistory(histData.history);

        try {
          const changes = await api.get<{ highs: PriceChangeItem[]; lows: PriceChangeItem[] }>("/analytics/price-changes?limit=3");
          setHighs(changes.highs);
          setLows(changes.lows);
        } catch (e) {
          console.error("Erro ao buscar alterações de preço:", e);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados da carteira:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveLimits(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/wallet/limits", {
        cycleDay: Number(cycleDay),
        limitDebito: Number(limitDebito),
        limitCredito: Number(limitCredito),
        limitAlimentacao: Number(limitAlimentacao),
        limitOutros: Number(limitOutros),
      });
      setIsEditing(false);
      await loadData();
    } catch (err) {
      alert("Erro ao salvar os limites.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function formatBRL(val: number) {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-forest-500 border-t-transparent" />
        <p className="text-sm font-semibold text-graphite-500">Carregando dados da carteira...</p>
      </div>
    );
  }

  const showSetupForm = !status?.configured || isEditing || status?.shouldPrompt;

  if (showSetupForm) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 space-y-6">
        <div className="text-center">
          <PageHeader 
            title={status?.shouldPrompt ? "Nova Virada de Mês!" : "Configurar Carteira"} 
            subtitle={
              status?.shouldPrompt 
                ? "Defina ou confirme os limites estimados para o novo ciclo de consumo." 
                : "Defina seus limites de faturamento mensal por categoria para acompanhar seus gastos."
            }
          />
        </div>

        {status?.shouldPrompt && (
          <Card className="p-4 border border-forest-200 bg-forest-50/50 rounded-2xl border-l-4 border-l-forest-500">
            <p className="text-xs font-bold text-forest-700">💡 Lógica de Sobras Ativa</p>
            <p className="text-[11px] text-forest-600 mt-1 font-semibold leading-relaxed">
              O saldo positivo restante de cada categoria do mês passado será somado aos limites inseridos abaixo automaticamente. Valores excedidos anteriores serão mantidos no histórico e não diminuirão seu limite.
            </p>
          </Card>
        )}

        <Card className="p-6 border border-cream-200 bg-white rounded-2xl shadow-sm">
          <form onSubmit={handleSaveLimits} className="space-y-4">
            <TextInput
              label="Dia de Fechamento / Virada de Mês (1 a 31)"
              type="number"
              min="1"
              max="31"
              value={cycleDay}
              onChange={(e) => setCycleDay(e.target.value)}
              required
            />
            
            <div className="border-t border-cream-100 pt-4 space-y-3">
              <p className="font-bold text-graphite-900 text-sm">Limites Estimados por Categoria (R$)</p>
              
              <TextInput
                label="Débito / Dinheiro"
                type="number"
                step="0.01"
                min="0"
                value={limitDebito}
                onChange={(e) => setLimitDebito(e.target.value)}
              />
              <TextInput
                label="Cartão de Crédito"
                type="number"
                step="0.01"
                min="0"
                value={limitCredito}
                onChange={(e) => setLimitCredito(e.target.value)}
              />
              <TextInput
                label="Vale Alimentação"
                type="number"
                step="0.01"
                min="0"
                value={limitAlimentacao}
                onChange={(e) => setLimitAlimentacao(e.target.value)}
              />
              <TextInput
                label="Outros / Misto"
                type="number"
                step="0.01"
                min="0"
                value={limitOutros}
                onChange={(e) => setLimitOutros(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Salvando..." : "Confirmar e Salvar"}
              </Button>
              {status?.configured && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsEditing(false)} 
                  className="w-full text-graphite-500"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // Calculate overall limit vs spent
  const totalLimit = status?.totalLimit ?? 0;
  const totalSpent = status?.totalSpent ?? 0;
  const spentPercent = status?.spentPercent ?? 0;
  const remainingTotal = Math.max(0, totalLimit - totalSpent);

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <PageHeader 
            title="Minha Carteira" 
            subtitle={`Ciclo de ${new Date(status?.cycleStartDate ?? "").toLocaleDateString("pt-BR")} a ${new Date(status?.cycleEndDate ?? "").toLocaleDateString("pt-BR")}`} 
          />
        </div>
        <Button
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="font-semibold text-xs px-2.5 py-1.5 border border-cream-200 rounded-xl shrink-0 mt-1 cursor-pointer"
        >
          Ajustar Limites
        </Button>
      </div>

      {/* CARD 1: CONSOLIDADO GERAL */}
      <Card className="p-6 border border-cream-200 bg-white rounded-2xl shadow-sm space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-graphite-400 uppercase tracking-wider">Limite Mensal Estimado</p>
            <p className="text-2xl font-black text-graphite-900 mt-1">{formatBRL(totalLimit)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-graphite-400 uppercase tracking-wider">Saldo Restante</p>
            <p className="text-2xl font-black text-forest-600 mt-1">{formatBRL(remainingTotal)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs font-semibold text-graphite-500">
            <span>Consumo real: {formatBRL(totalSpent)}</span>
            <span>{spentPercent.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full bg-cream-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                spentPercent > 100 
                  ? "bg-clay-600" 
                  : spentPercent > 80 
                    ? "bg-amber-500" 
                    : "bg-forest-600"
              }`}
              style={{ width: `${Math.min(100, spentPercent)}%` }}
            />
          </div>
        </div>

        {/* Smart Advice and MoM change */}
        <div className="border-t border-cream-100 pt-3 flex flex-col gap-2">
          {status?.momVariation !== undefined && status.momVariation !== 0 && (
            <p className="text-xs font-semibold text-graphite-500">
              Consumo em relação ao ciclo anterior:{" "}
              <span className={`font-bold ${status.momVariation > 0 ? "text-clay-600" : "text-forest-600"}`}>
                {status.momVariation > 0 ? `+${status.momVariation.toFixed(1)}%` : `${status.momVariation.toFixed(1)}%`}
              </span>
            </p>
          )}
          <p className="text-xs text-graphite-600 bg-cream-50/50 border border-cream-200/50 p-2.5 rounded-xl font-medium leading-relaxed">
            {status?.advice}
          </p>
        </div>
      </Card>

      {/* CARD 2: MEIOS DE PAGAMENTO BREAKDOWN */}
      <div className="grid grid-cols-2 gap-3">
        {status?.categories?.map((cat) => {
          const limitPercent = cat.limit > 0 ? (cat.spent / cat.limit) * 100 : 0;
          return (
            <Card key={cat.id} className="p-4 border border-cream-200 bg-white rounded-2xl flex flex-col justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold text-graphite-900 truncate">{cat.label}</p>
                <p className="text-base font-extrabold text-graphite-800 mt-2">{formatBRL(cat.spent)}</p>
                <p className="text-[10px] text-graphite-400 font-semibold mt-0.5">limite: {formatBRL(cat.limit)}</p>
              </div>

              <div className="mt-3.5 space-y-1.5">
                <div className="h-1.5 w-full bg-cream-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      limitPercent > 100 
                        ? "bg-clay-600" 
                        : limitPercent > 80 
                          ? "bg-amber-500" 
                          : "bg-forest-600"
                    }`}
                    style={{ width: `${Math.min(100, limitPercent)}%` }}
                  />
                </div>
                {cat.exceeded > 0 ? (
                  <p className="text-[9px] text-clay-600 font-bold">Estourou: {formatBRL(cat.exceeded)}</p>
                ) : (
                  <p className="text-[9px] text-forest-600 font-bold">Sobra: {formatBRL(cat.remaining)}</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* CARD 3: VILÕES DE GASTO (TOP PRODUCTS) */}
      {status?.topProducts && status.topProducts.length > 0 && (
        <Card className="p-5 border border-cream-200 bg-white rounded-2xl shadow-sm">
          <p className="font-bold text-graphite-900 text-sm mb-3">Vilões de Gastos do Ciclo</p>
          <div className="space-y-2">
            {status.topProducts.map((prod, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-medium">
                <span className="text-graphite-700 truncate pr-2">
                  {idx + 1}. {prod.name}
                </span>
                <span className="font-bold text-graphite-900 shrink-0">{formatBRL(prod.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CARD 4: VARIAÇÕES DE PREÇO (ALTAS E BAIXAS QUE INFLUENCIARAM O MÊS) */}
      {(highs.length > 0 || lows.length > 0) && (
        <Card className="p-5 border border-cream-200 bg-white rounded-2xl shadow-sm space-y-4">
          <div>
            <p className="font-bold text-graphite-900 text-sm">Altas e Baixas que Influenciaram o Mês</p>
            <p className="text-[10px] text-graphite-500 font-semibold mt-0.5">Comparativo de preços nas últimas compras do mercado</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Maiores Altas */}
            {highs.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-clay-600 flex items-center gap-1">
                  <span>📈 Altas de Preço</span>
                </p>
                <div className="space-y-1.5">
                  {highs.map((item, idx) => (
                    <div key={idx} className="text-[10px] font-semibold text-graphite-750">
                      <p className="truncate font-bold" title={item.product.name}>{item.product.name}</p>
                      <p className="text-[9px] text-clay-600 font-bold mt-0.5">
                        +{item.deltaPct.toFixed(1)}% ({formatBRL(item.previousPrice)} → {formatBRL(item.latestPrice)})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Maiores Baixas */}
            {lows.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-forest-600 flex items-center gap-1">
                  <span>📉 Baixas de Preço</span>
                </p>
                <div className="space-y-1.5">
                  {lows.map((item, idx) => (
                    <div key={idx} className="text-[10px] font-semibold text-graphite-750">
                      <p className="truncate font-bold" title={item.product.name}>{item.product.name}</p>
                      <p className="text-[9px] text-forest-600 font-bold mt-0.5">
                        {item.deltaPct.toFixed(1)}% ({formatBRL(item.previousPrice)} → {formatBRL(item.latestPrice)})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* CARD 5: HISTÓRICO DE CONSUMO (GRÁFICO DE LINHAS) */}
      {(() => {
        // Lógica de Padding para garantir que o gráfico seja exibido desde o primeiro dia de uso
        let chartPoints = [...history];
        if (chartPoints.length === 0) {
          const currentMonthName = new Date(status?.cycleStartDate || "").toLocaleDateString("pt-BR", { month: "short" });
          chartPoints = [
            { label: "Início", credito: 0, debito: 0 },
            { label: currentMonthName || "Mês Atual", credito: totalLimit, debito: totalSpent }
          ];
        } else if (chartPoints.length === 1) {
          chartPoints = [
            { label: "Início", credito: 0, debito: 0 },
            ...chartPoints
          ];
        }

        return (
          <Card className="p-5 border border-cream-200 bg-white rounded-2xl shadow-sm">
            <p className="font-bold text-graphite-900 text-sm mb-1">Evolução Crédito vs Débito</p>
            <p className="text-[10px] text-graphite-500 font-semibold mb-4">Acompanhamento consolidado do orçamento e gastos</p>

            {/* SVG-based Line Chart */}
            <div className="w-full h-44 flex items-center justify-center">
              {(() => {
                const maxVal = Math.max(...chartPoints.flatMap((pt) => [pt.credito, pt.debito]), 100);
                const padding = 20;
                const width = 340;
                const height = 140;
                
                const pointsCount = chartPoints.length;
                const stepX = (width - padding * 2) / (pointsCount - 1 || 1);
                
                // Map points to SVG coordinates
                const creditPoints = chartPoints.map((pt, idx) => {
                  const x = padding + idx * stepX;
                  const y = height - padding - ((pt.credito / maxVal) * (height - padding * 2));
                  return { x, y };
                });

                const debitPoints = chartPoints.map((pt, idx) => {
                  const x = padding + idx * stepX;
                  const y = height - padding - ((pt.debito / maxVal) * (height - padding * 2));
                  return { x, y };
                });

                // Generate SVG path string
                const creditPathStr = creditPoints.reduce((acc, pt, idx) => 
                  acc + (idx === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`), "");

                const debitPathStr = debitPoints.reduce((acc, pt, idx) => 
                  acc + (idx === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`), "");

                return (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                    {/* Grid Lines */}
                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f3f4f6" strokeWidth="1" />
                    <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="#f3f4f6" strokeWidth="1" />
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" strokeWidth="1" />

                    {/* Credit Line (Estimated Budget) */}
                    <path d={creditPathStr} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Debit Line (Actual Consumption) */}
                    <path d={debitPathStr} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Dots for Credit */}
                    {creditPoints.map((pt, idx) => (
                      <circle key={`cr-${idx}`} cx={pt.x} cy={pt.y} r="3.5" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />
                    ))}

                    {/* Dots for Debit */}
                    {debitPoints.map((pt, idx) => (
                      <circle key={`db-${idx}`} cx={pt.x} cy={pt.y} r="3.5" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                    ))}

                    {/* Labels */}
                    {chartPoints.map((pt, idx) => {
                      const x = padding + idx * stepX;
                      return (
                        <text 
                          key={`lbl-${idx}`} 
                          x={x} 
                          y={height - 4} 
                          fontSize="8" 
                          fontWeight="bold" 
                          fill="#6b7280" 
                          textAnchor="middle"
                        >
                          {pt.label}
                        </text>
                      );
                    })}
                  </svg>
                );
              })()}
            </div>

            {/* Legend */}
            <div className="flex justify-center items-center gap-4 mt-3 text-[10px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                <span className="text-graphite-600">Créditos (Limites)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#6366f1]" />
                <span className="text-graphite-600">Consumo (Débitos)</span>
              </div>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
