import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, ApiError } from "../lib/auth-context";
import { formatCpf, isValidCpf } from "../lib/cpf";
import { Button, TextInput, Logo, Card } from "../components/ui";
import { api } from "../lib/api";
import { openCheckout } from "../lib/checkout";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [planType, setPlanType] = useState<"free_trial" | "monthly" | "yearly">("free_trial");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidCpf(cpf)) {
      setError("CPF inválido");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await register(cpf, name, password, planType);
      
      if (planType !== "free_trial") {
        // Redireciona imediatamente para o fluxo de checkout
        const pref = await api.post<{ initPoint: string }>("/subscription/create-preference", {
          planType,
        });
        openCheckout(pref.initPoint);
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-8">
      <div className="mb-8 text-center animate-fade-in">
        <div className="mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-cream-200">
          <Logo className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-graphite-900">Criar conta</h1>
        <p className="mt-2 text-sm font-semibold text-graphite-500 max-w-xs mx-auto">
          Cadastre-se rapidamente para começar a economizar
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <TextInput
            label="Nome"
            placeholder="Seu nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextInput
            label="CPF"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={formatCpf(cpf)}
            onChange={(e) => setCpf(e.target.value)}
            maxLength={14}
            required
          />
          <TextInput
            label="Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-graphite-500 uppercase tracking-wider">Escolha seu Plano</label>
            <select
              value={planType}
              onChange={(e) => setPlanType(e.target.value as any)}
              className="w-full p-3.5 border border-cream-200 rounded-xl bg-white text-sm font-bold text-graphite-900 focus:outline-none focus:border-forest-600 transition-all cursor-pointer"
            >
              <option value="free_trial">Gratuito (7 dias grátis)</option>
              <option value="monthly">Mensal (R$ 9,90/mês)</option>
              <option value="yearly">Anual (R$ 99,00/ano)</option>
            </select>
          </div>

          {error && <p className="text-xs font-semibold text-clay-600">{error}</p>}
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-graphite-500 font-medium">
        Já tem conta?{" "}
        <Link to="/login" className="font-semibold text-forest-600 hover:text-forest-700 underline underline-offset-2">
          Entrar
        </Link>
      </p>
    </div>
  );
}

