import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatCpf } from "../lib/cpf";
import { Button, Card, PageHeader, TextInput } from "../components/ui";

interface AdminUser {
  id: string;
  cpf: string;
  name: string;
  createdAt: string;
  subscriptionType: string;
  subscriptionStart: string;
  subscriptionEnd: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal/form states
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [subType, setSubType] = useState("free_trial");
  const [subEnd, setSubEnd] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await api.get<{ users: AdminUser[] }>("/admin/users");
      setUsers(data.users);
    } catch (err) {
      setError("Não foi possível carregar os usuários. Verifique se você é um administrador.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function startEdit(user: AdminUser) {
    setEditingUser(user);
    setSubType(user.subscriptionType);
    
    // Format ISO date to YYYY-MM-DD for date input
    const dateObj = new Date(user.subscriptionEnd);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    setSubEnd(`${yyyy}-${mm}-${dd}`);
  }

  async function handleSaveSubscription(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);

    try {
      // Convert YYYY-MM-DD to ISO date at end of day
      const finalDate = new Date(`${subEnd}T23:59:59Z`);
      await api.put(`/admin/users/${editingUser.id}/subscription`, {
        subscriptionType: subType,
        subscriptionEnd: finalDate.toISOString(),
      });
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      alert("Erro ao atualizar assinatura do usuário.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-sm font-semibold text-graphite-500">Buscando lista de usuários...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 text-center space-y-4">
        <PageHeader title="Acesso Restrito" subtitle="Controle de Usuários" />
        <Card className="p-6 border border-clay-200 bg-clay-50/50 rounded-2xl text-clay-700 text-sm font-semibold">
          {error}
        </Card>
        <Link to="/perfil" className="inline-block text-xs font-bold text-forest-600 hover:underline">
          Voltar para Perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Link to="/perfil" className="text-graphite-500 hover:text-graphite-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
            <path d="M19 12H5M5 12l6-6M5 12l6 6" />
          </svg>
        </Link>
        <PageHeader title="Gerenciamento de Usuários" subtitle={`${users.length} usuários cadastrados`} />
      </div>

      {/* EDIT MODAL / FORM OVERLAY */}
      {editingUser && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-graphite-900/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-sm p-6 bg-white border border-cream-200 rounded-2xl space-y-4 shadow-lg animate-fade-in">
            <div>
              <p className="font-bold text-graphite-900 text-base">Ajustar Acesso</p>
              <p className="text-xs text-graphite-500 mt-0.5">Editando acesso de: {editingUser.name}</p>
            </div>

            <form onSubmit={handleSaveSubscription} className="space-y-4">
              <div className="space-y-2">
                <span className="block text-xs font-bold text-graphite-700 uppercase tracking-wide">Tipo de Assinatura</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "free_trial", label: "Gratuito" },
                    { id: "monthly", label: "Mensal" },
                    { id: "yearly", label: "Anual" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSubType(opt.id)}
                      className={`px-2 py-2 text-xs font-bold border rounded-xl transition cursor-pointer ${
                        subType === opt.id
                          ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                          : "bg-white border-cream-200 text-graphite-700 hover:border-amber-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <TextInput
                label="Data de Vencimento"
                type="date"
                value={subEnd}
                onChange={(e) => setSubEnd(e.target.value)}
                required
              />

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 bg-amber-600 border border-amber-700 hover:bg-amber-700 text-white shadow-sm" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
                <Button type="button" variant="ghost" className="flex-1 text-graphite-500" onClick={() => setEditingUser(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* USER LIST */}
      <div className="space-y-3">
        {users.map((u) => {
          const isExpired = new Date(u.subscriptionEnd) < new Date();
          const isAdmin = u.cpf === "02129401473" || u.cpf === "00000000000";

          return (
            <Card key={u.id} className="p-4 border border-cream-200 bg-white rounded-2xl shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between gap-3">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-bold text-graphite-900 truncate flex items-center gap-1.5">
                    <span>{u.name}</span>
                    {isAdmin && <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-md">ADMIN</span>}
                  </p>
                  <p className="text-[10px] text-graphite-400 font-semibold mt-0.5">CPF: {formatCpf(u.cpf)}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    isExpired && !isAdmin
                      ? "bg-clay-50 text-clay-700" 
                      : "bg-forest-50 text-forest-700"
                  }`}>
                    {isAdmin ? "Acesso Perpétuo" : isExpired ? "Expirado" : "Ativo"}
                  </span>
                </div>
              </div>

              <div className="flex items-end justify-between border-t border-cream-100/60 pt-2.5">
                <div className="text-[10px] text-graphite-500 font-medium">
                  <p>Plano: <span className="font-bold text-graphite-800 uppercase">{u.subscriptionType}</span></p>
                  <p className="mt-0.5">Vence: <span className="font-bold text-graphite-800">{new Date(u.subscriptionEnd).toLocaleDateString("pt-BR")}</span></p>
                </div>
                {!isAdmin && (
                  <Button
                    onClick={() => startEdit(u)}
                    variant="ghost"
                    className="text-xs font-bold text-amber-600 hover:bg-amber-50 active:bg-amber-100 border border-amber-100 px-3 py-1 rounded-xl shrink-0 cursor-pointer"
                  >
                    Ajustar Acesso
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
