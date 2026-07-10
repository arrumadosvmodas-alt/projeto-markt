import { useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { formatCpf } from "../lib/cpf";
import { Button, TextInput, Logo, Card } from "../components/ui";

export default function ForgotPassword() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { cpf });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao enviar e-mail de recuperação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-8 bg-cream-50 text-graphite-800">
      <div className="mb-8 text-center animate-fade-in">
        <div className="mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-cream-200">
          <Logo className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-graphite-900">Recuperar Senha</h1>
        <p className="mt-2 text-sm font-semibold text-graphite-500 max-w-xs mx-auto">
          Enviaremos um link de redefinição de senha para o seu e-mail cadastrado
        </p>
      </div>

      <Card className="p-6">
        {success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 border border-forest-100 text-forest-600 text-xl font-bold">
              ✔
            </div>
            <p className="text-sm font-bold text-graphite-800">E-mail de recuperação enviado!</p>
            <p className="text-xs text-graphite-500 font-semibold leading-relaxed">
              Verifique sua caixa de entrada e clique no link seguro de redefinição para escolher uma nova senha.
            </p>
            <Link to="/login" className="block w-full">
              <Button className="w-full">Voltar para o Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <TextInput
              label="Digite seu CPF"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={formatCpf(cpf)}
              onChange={(e) => setCpf(e.target.value)}
              maxLength={14}
              required
            />
            {error && <p className="text-xs font-semibold text-clay-600 leading-normal">{error}</p>}
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Enviando..." : "Enviar E-mail de Recuperação"}
            </Button>
          </form>
        )}
      </Card>

      {!success && (
        <p className="mt-6 text-center text-sm text-graphite-500 font-medium">
          Lembrou a senha?{" "}
          <Link to="/login" className="font-semibold text-forest-600 hover:text-forest-700 underline underline-offset-2">
            Fazer Login
          </Link>
        </p>
      )}
    </div>
  );
}
