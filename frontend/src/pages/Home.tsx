import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Purchase, PurchaseSummary } from "../lib/types";
import NewPurchase from "./NewPurchase";
import ActivePurchase from "./ActivePurchase";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    api
      .get<{ purchases: PurchaseSummary[] }>("/purchases")
      .then(async (data) => {
        const open = data.purchases.find((p) => p.status === "open");
        if (open) {
          const full = await api.get<{ purchase: Purchase }>(`/purchases/${open.id}`);
          setPurchase(full.purchase);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-graphite-500">
        Carregando...
      </div>
    );
  }

  if (!purchase) {
    return (
      <NewPurchase
        onStarted={(p) => setPurchase(p)}
      />
    );
  }

  return (
    <ActivePurchase
      purchase={purchase}
      onChange={setPurchase}
      onCompleted={(id) => navigate(`/historico/${id}`, { replace: true })}
      onCanceled={() => setPurchase(null)}
    />
  );
}
