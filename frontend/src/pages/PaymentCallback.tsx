import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { api } from "../lib/api";
import type { User } from "../lib/types";
import { Button, Card } from "../components/ui";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const plan = searchParams.get("plan") || "monthly";
  const mpStatus = searchParams.get("status") || searchParams.get("collection_status") || searchParams.get("payment_status") || "";

  useEffect(() => {
    async function confirmPayment() {
      // Se o Mercado Pago retornar approved, success ou pending (caso o boleto/Pix esteja pendente)
      const isApproved = ["approved", "success"].includes(mpStatus);
      
      if (!isApproved) {
        setStatus("error");
        setErrorMessage("O pagamento não foi aprovado pelo intermediador.");
        return;
      }

      try {
        const data = await api.post<{ user: User }>("/subscription/confirm-payment", {
          planType: plan,
        });
        updateUser(data.user);
        setStatus("success");
      } catch (err: any) {
        console.error(err);
        setStatus("error");
        setErrorMessage(err.message || "Erro ao processar ativação do plano.");
      }
    }

    confirmPayment();
  }, [mpStatus, plan, updateUser]);

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-8">
      {status === "loading" && (
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-forest-500 border-t-transparent" />
          <h1 className="text-lg font-bold text-graphite-900">Processando seu pagamento...</h1>
          <p className="text-xs text-graphite-500 font-semibold">Aguarde enquanto ativamos o seu plano.</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-50 text-forest-600 border border-forest-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-7 w-7">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-graphite-900">Plano Ativado!</h1>
            <p className="text-xs text-graphite-500 font-semibold mt-1">Obrigado por assinar o Markt.</p>
          </div>

          <Card className="p-5 border border-cream-200 bg-white rounded-2xl text-center space-y-4">
            <p className="text-sm font-semibold text-graphite-700">
              Seu acesso já foi restabelecido e está ativo. Divirta-se organizando suas compras!
            </p>
            <Button onClick={() => navigate("/", { replace: true })} className="w-full">
              Começar a Usar
            </Button>
          </Card>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-clay-50 text-clay-600 border border-clay-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-7 w-7">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold text-graphite-900">Falha no Pagamento</h1>
            <p className="text-xs text-graphite-500 font-semibold mt-1">Não foi possível ativar sua assinatura.</p>
          </div>

          <Card className="p-5 border border-cream-200 bg-white rounded-2xl text-center space-y-4">
            <p className="text-sm font-semibold text-clay-600 leading-relaxed">
              {errorMessage}
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/billing", { replace: true })} className="w-full">
                Tentar Novamente
              </Button>
              <Button variant="ghost" onClick={() => navigate("/perfil", { replace: true })} className="w-full text-graphite-500">
                Ir para o Perfil
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
