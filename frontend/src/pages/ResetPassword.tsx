import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { Button, TextInput, Logo, Card } from "../components/ui";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Token de redefinição inválido ou ausente.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve conter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas digitadas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao alterar a senha. O link pode ter expirado.");
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
        <h1 className="text-3xl font-extrabold tracking-tight text-graphite-900">Nova Senha</h1>
        <p className="mt-2 text-sm font-semibold text-graphite-500 max-w-xs mx-auto">
          Escolha uma nova senha forte para acessar sua conta
        </p>
      </div>

      <Card className="p-6">
        {!token ? (
          <div className="text-center space-y-4">
            <p className="text-sm font-bold text-clay-600">Link inválido ou expirado</p>
            <p className="text-xs text-graphite-500 font-semibold leading-relaxed">
              O token de redefinição de senha está ausente ou perdeu a validade. Solicite uma nova recuperação.
            </p>
            <Link to="/esqueci-senha" className="block w-full">
              <Button className="w-full" variant="secondary">Solicitar Nova Chave</Button>
            </Link>
          </div>
        ) : success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 border border-forest-100 text-forest-600 text-xl font-bold">
              ✔
            </div>
            <p className="text-sm font-bold text-graphite-800">Senha redefinida com sucesso!</p>
            <p className="text-xs text-graphite-500 font-semibold leading-relaxed">
              Sua nova senha já está ativa. Clique no botão abaixo para fazer login.
            </p>
            <Link to="/login" className="block w-full">
              <Button className="w-full">Ir para o Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <TextInput
              label="Nova Senha"
              type="password"
              placeholder="No mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <TextInput
              label="Confirmar Nova Senha"
              type="password"
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {error && <p className="text-xs font-semibold text-clay-600 leading-normal">{error}</p>}
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Redefinindo..." : "Salvar Nova Senha"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
