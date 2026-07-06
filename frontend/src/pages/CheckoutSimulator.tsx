import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { api } from "../lib/api";
import type { User } from "../lib/types";
import { Button, Card } from "../components/ui";

export default function CheckoutSimulator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const plan = searchParams.get("plan") || "monthly";
  const price = searchParams.get("price") || "9.90";
  const planLabel = plan === "yearly" ? "Plano Anual Markt" : "Plano Mensal Markt";

  async function handleConfirm() {
    setLoading(true);
    try {
      const data = await api.post<{ user: User }>("/subscription/confirm-payment", {
        planType: plan,
      });
      updateUser(data.user);
      alert("Pagamento simulado com sucesso!");
      navigate("/", { replace: true });
    } catch (err) {
      alert("Erro ao confirmar pagamento simulado.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-7 w-7">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-graphite-900">Mercado Pago</h1>
        <p className="text-xs text-graphite-500 font-semibold mt-1">Ambiente de Testes / Simulação de Checkout</p>
      </div>

      <Card className="p-5 border border-cream-200 bg-white space-y-4 rounded-2xl shadow-sm">
        <div className="border-b border-cream-100 pb-3">
          <p className="text-xs text-graphite-400 font-bold uppercase tracking-wider">Item a pagar</p>
          <p className="text-base font-extrabold text-graphite-900 mt-1">{planLabel}</p>
        </div>

        <div className="flex justify-between items-baseline py-1">
          <span className="text-sm font-semibold text-graphite-500">Valor total</span>
          <span className="text-2xl font-black text-forest-700">R$ {Number(price).toFixed(2).replace(".", ",")}</span>
        </div>

        <div className="bg-cream-50/50 rounded-xl p-3 border border-cream-100/60 text-[11px] text-graphite-500 leading-relaxed font-medium">
          ℹ️ Esta é uma simulação de pagamento. Ao clicar em "Confirmar", o sistema ativará seu plano automaticamente sem cobranças reais.
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={handleConfirm} disabled={loading} className="w-full">
            {loading ? "Processando..." : "Confirmar Pagamento"}
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)} className="w-full text-graphite-500">
            Cancelar e Voltar
          </Button>
        </div>
      </Card>
    </div>
  );
}
