import { formatBRL } from "./ui";

export function BudgetBar({
  total,
  budgetLimit,
}: {
  total: number;
  budgetLimit: number | null;
}) {
  if (!budgetLimit) {
    return (
      <div className="flex items-baseline justify-between py-1">
        <span className="text-sm font-semibold text-graphite-500">Total da compra</span>
        <span className="text-2xl font-bold tracking-tight text-forest-700">{formatBRL(total)}</span>
      </div>
    );
  }

  const pct = Math.min(100, (total / budgetLimit) * 100);
  const over = total > budgetLimit;
  const remaining = budgetLimit - total;
  
  const barColor = over
    ? "bg-clay-600"
    : pct >= 80
      ? "bg-clay-400"
      : "bg-forest-500";

  return (
    <div className="space-y-2 py-1">
      <div className="flex items-baseline justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-graphite-500 uppercase tracking-wider">
            Gasto Atual
          </span>
          <span className="text-xl font-bold text-graphite-900">
            {formatBRL(total)} <span className="text-xs font-medium text-graphite-400">/ {formatBRL(budgetLimit)}</span>
          </span>
        </div>
        <span className={`text-lg font-bold ${over ? "text-clay-600" : "text-graphite-700"}`}>
          {pct.toFixed(0)}%
        </span>
      </div>
      
      <div className="h-3 w-full overflow-hidden rounded-full bg-cream-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        {over ? (
          <span className="font-semibold text-clay-600 flex items-center gap-1">
            ⚠️ Estourou por {formatBRL(Math.abs(remaining))}
          </span>
        ) : pct >= 80 ? (
          <span className="font-semibold text-clay-600">
            Atenção: restam apenas {formatBRL(remaining)}
          </span>
        ) : (
          <span className="font-semibold text-forest-600">
            Ainda restam {formatBRL(remaining)}
          </span>
        )}
      </div>
    </div>
  );
}

