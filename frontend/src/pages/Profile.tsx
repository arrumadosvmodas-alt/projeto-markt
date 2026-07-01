import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { formatCpf } from "../lib/cpf";
import { Button, Card, PageHeader } from "../components/ui";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <PageHeader title="Perfil" />

      <Card className="mb-6 p-6 border border-cream-200 bg-white">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 border border-forest-100 text-forest-600">
            <UserIconBig />
          </div>
          <div>
            <p className="text-lg font-bold text-graphite-900">{user?.name}</p>
            <p className="text-xs text-graphite-400 font-semibold mt-0.5">Cliente Markt</p>
          </div>
        </div>
        <div className="space-y-4 border-t border-cream-100 pt-5">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-graphite-500">CPF cadastrado</span>
            <span className="font-bold text-graphite-900">
              {user ? formatCpf(user.cpf) : ""}
            </span>
          </div>
        </div>
      </Card>

      <Button
        variant="ghost"
        className="w-full text-clay-600 hover:bg-clay-50 active:bg-clay-100 border border-transparent hover:border-clay-100/50 rounded-xl py-3"
        onClick={() => {
          logout();
          navigate("/login", { replace: true });
        }}
      >
        <SignOutIcon />
        Fazer logout
      </Button>
    </div>
  );
}

function UserIconBig() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-forest-600" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

