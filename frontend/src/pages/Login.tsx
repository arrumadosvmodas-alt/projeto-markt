import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, ApiError } from "../lib/auth-context";
import { formatCpf } from "../lib/cpf";
import { Button, TextInput, Logo, Card } from "../components/ui";
import { api } from "../lib/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Dispara aquecimento silencioso do servidor Render
    api.get("/health").catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(cpf, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar");
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
        <h1 className="text-3xl font-extrabold tracking-tight text-graphite-900">Markt</h1>
        <p className="mt-2 text-sm font-semibold text-graphite-500 max-w-xs mx-auto">
          Controle suas compras de supermercado com inteligência
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
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
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Link 
              to="/esqueci-senha"
              className="text-[11px] font-semibold text-graphite-400 hover:text-graphite-600 underline underline-offset-2 cursor-pointer transition-all"
            >
              Esqueceu a senha?
            </Link>
          </div>
          {error && <p className="text-xs font-semibold text-clay-600">{error}</p>}
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-graphite-500 font-medium">
        Ainda não tem conta?{" "}
        <Link to="/cadastro" className="font-semibold text-forest-600 hover:text-forest-700 underline underline-offset-2">
          Cadastre-se
        </Link>
      </p>

      {/* LINK DO SAC NO RODAPÉ */}
      <div className="mt-8 text-center animate-fade-in">
        <a 
          href="mailto:linnsheitor@gmail.com?subject=Suporte%20Markt"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-600 hover:text-forest-700 bg-forest-50/50 hover:bg-forest-50 border border-forest-100/50 px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-sm"
        >
          <span>📧 SAC - linnsheitor@gmail.com</span>
        </a>
      </div>
    </div>
  );
}

