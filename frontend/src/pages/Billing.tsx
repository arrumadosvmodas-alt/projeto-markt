import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { api } from "../lib/api";
import { Button, Card, PageHeader } from "../components/ui";

export default function Billing() {
  const { user, logout } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const isExpired = user && new Date(user.subscriptionEnd) < new Date();

  async function handleSubscribe(planType: "monthly" | "yearly") {
    setLoadingPlan(planType);
    try {
      const data = await api.post<{ initPoint: string }>("/subscription/create-preference", {
        planType,
      });
      // Redirect to Mercado Pago checkout preference url (or simulated payment url)
      window.location.href = data.initPoint;
    } catch (err) {
      alert("Erro ao iniciar assinatura.");
      console.error(err);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-8 space-y-6">
      <div className="text-center">
        <PageHeader 
          title="Assinatura Markt" 
          subtitle="Escolha um plano para continuar controlando suas compras"
        />
      </div>

      {isExpired && (
        <Card className="p-4 border border-clay-200 bg-clay-50/50 rounded-2xl border-l-4 border-l-clay-500 animate-pulse">
          <p className="text-sm font-bold text-clay-700">Período de uso expirou</p>
          <p className="text-xs text-clay-600 mt-1 font-semibold">
            Seu acesso gratuito ou plano anterior terminou. Escolha um dos planos abaixo para reativar seu acesso.
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {/* PLANO MENSAL */}
        <Card className="p-5 border border-cream-200 bg-white rounded-2xl flex flex-col justify-between hover:border-forest-300 transition-all duration-200">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-base font-extrabold text-graphite-900">Plano Mensal</span>
              <span className="bg-forest-50 text-forest-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">Mais flexível</span>
            </div>
            <p className="text-xs text-graphite-500 font-semibold mt-1">Acesso ilimitado cobrado mensalmente.</p>
            <p className="text-2xl font-black text-graphite-900 mt-4 tabular-nums">
              R$ 9,90<span className="text-xs font-semibold text-graphite-500"> / mês</span>
            </p>
          </div>
          <Button 
            onClick={() => handleSubscribe("monthly")} 
            disabled={loadingPlan !== null}
            className="w-full mt-5"
          >
            {loadingPlan === "monthly" ? "Carregando..." : "Assinar Mensal"}
          </Button>
        </Card>

        {/* PLANO ANUAL */}
        <Card className="p-5 border border-cream-200 bg-white rounded-2xl flex flex-col justify-between hover:border-forest-300 transition-all duration-200">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-base font-extrabold text-graphite-900">Plano Anual</span>
              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-lg">Melhor custo-benefício</span>
            </div>
            <p className="text-xs text-graphite-500 font-semibold mt-1">Acesso por 1 ano completo com desconto.</p>
            <p className="text-2xl font-black text-graphite-900 mt-4 tabular-nums">
              R$ 99,00<span className="text-xs font-semibold text-graphite-500"> / ano</span>
            </p>
          </div>
          <Button 
            onClick={() => handleSubscribe("yearly")} 
            disabled={loadingPlan !== null}
            className="w-full mt-5"
          >
            {loadingPlan === "yearly" ? "Carregando..." : "Assinar Anual"}
          </Button>
        </Card>
      </div>

      <Button
        variant="ghost"
        className="w-full text-graphite-500 border border-cream-200 hover:bg-cream-100/50 rounded-2xl py-3"
        onClick={() => {
          logout();
          window.location.href = "/login";
        }}
      >
        Sair / Fazer logout
      </Button>
    </div>
  );
}
