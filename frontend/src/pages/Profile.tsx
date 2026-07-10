import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { formatCpf } from "../lib/cpf";
import { Button, Card, PageHeader } from "../components/ui";
import { api } from "../lib/api";
import type { User } from "../lib/types";

function compressAndBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("markt_theme") || "green";
    }
    return "green";
  });

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "";
  const isAdmin = user?.cpf === "02129401473" || user?.cpf === "00000000000";

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (deleteConfirmationText.trim().toUpperCase() !== "EXCLUIR") {
      alert("Por favor, digite EXCLUIR para confirmar.");
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete("/auth/profile");
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      alert("Erro ao excluir conta. Tente novamente.");
      console.error(err);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  }

  // Event handler for photo selection
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressedBase64 = await compressAndBase64(file);
      const data = await api.put<{ user: User }>("/auth/profile", {
        avatarUrl: compressedBase64,
      });
      updateUser(data.user);
    } catch (err) {
      alert("Erro ao enviar a foto do perfil.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  // Event handler for theme change
  function handleThemeChange(selectedTheme: string) {
    setTheme(selectedTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("markt_theme", selectedTheme);
      document.documentElement.setAttribute("data-theme", selectedTheme);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-6">
      <PageHeader title="Perfil" />

      {/* CARD 1: INFORMAÇÕES PESSOAIS */}
      <Card className="p-6 border border-cream-200 bg-white rounded-2xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative group">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Foto de perfil"
                className="h-16 w-16 rounded-full object-cover border-2 border-forest-100 shadow-sm"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-50 border border-forest-100 text-forest-600 font-bold text-xl uppercase tracking-wider">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-forest-600 text-white shadow hover:bg-forest-700 transition cursor-pointer"
              title="Alterar foto"
            >
              <CameraIcon />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-graphite-900 truncate">{user?.name}</p>
            <p className="text-xs text-graphite-400 font-semibold mt-0.5">
              {uploading ? "Carregando foto..." : "Cliente Markt"}
            </p>
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

      {/* CARD 2: CORES DO APLICATIVO */}
      <Card className="p-6 border border-cream-200 bg-white rounded-2xl">
        <div className="mb-4">
          <p className="font-bold text-graphite-900">Cores do Aplicativo</p>
          <p className="text-xs text-graphite-500 mt-0.5">Personalize o tema visual do seu Markt</p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: "green", label: "Original", dotColor: "bg-[#3f6212]" },
            { id: "indigo", label: "Azul Oceano", dotColor: "bg-[#4f46e5]" },
            { id: "dark", label: "Modo Escuro", dotColor: "bg-[#494FDF]" },
          ].map((themeOpt) => (
            <button
              key={themeOpt.id}
              onClick={() => handleThemeChange(themeOpt.id)}
              className={`flex flex-col items-center justify-center p-3 border rounded-2xl transition cursor-pointer ${
                theme === themeOpt.id
                  ? "bg-forest-50/50 border-forest-600 shadow-sm"
                  : "bg-cream-50/20 border-cream-200 hover:border-forest-300"
              }`}
            >
              <span className={`h-4.5 w-4.5 rounded-full ${themeOpt.dotColor} border border-white/20`} />
              <span className="text-[11px] font-bold text-graphite-700 mt-2">{themeOpt.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* CARD 3: PLANO DE ASSINATURA */}
      <Card className="p-6 border border-cream-200 bg-white rounded-2xl">
        <div className="mb-4">
          <p className="font-bold text-graphite-900">Plano de Assinatura</p>
          <p className="text-xs text-graphite-500 mt-0.5">Gerencie seu plano e período de uso</p>
        </div>
        
        <div className="space-y-3.5 text-sm">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-graphite-500">Plano Atual</span>
            <span className="font-bold text-graphite-900 bg-forest-50 text-forest-700 px-2.5 py-0.5 rounded-xl text-xs">
              {user?.subscriptionType === "free_trial" && "Gratuito (7 dias)"}
              {user?.subscriptionType === "monthly" && "Mensal"}
              {user?.subscriptionType === "yearly" && "Anual"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-semibold text-graphite-500">Válido até</span>
            <span className="font-bold text-graphite-900">
              {user ? new Date(user.subscriptionEnd).toLocaleDateString("pt-BR") : ""}
            </span>
          </div>
          
          {user?.queuedPlan && (
            <div className="border-t border-cream-100 pt-3 flex justify-between items-start gap-2">
              <div className="text-xs text-graphite-500 font-medium">
                <p className="font-bold text-graphite-700">Próximo plano agendado:</p>
                <p className="mt-0.5">Começa logo após o vencimento do atual.</p>
              </div>
              <span className="font-bold text-graphite-900 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-xl text-xs shrink-0">
                {user.queuedPlan === "yearly" ? "Anual" : "Mensal"}
              </span>
            </div>
          )}
          
          <Button 
            onClick={() => navigate("/billing")} 
            variant="secondary" 
            className="w-full mt-2.5 border border-forest-100"
          >
            Alterar ou Renovar Plano
          </Button>
        </div>
      </Card>

      {/* CARD DO ADMINISTRADOR */}
      {isAdmin && (
        <Card className="p-6 border border-amber-200 bg-amber-50/10 rounded-2xl">
          <div className="mb-4">
            <p className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>👑 Painel de Administração</span>
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Gerencie os acessos e assinaturas dos usuários do sistema</p>
          </div>
          <Button 
            onClick={() => navigate("/admin/users")} 
            className="w-full bg-amber-600 border border-amber-700 hover:bg-amber-700 text-white shadow-sm"
          >
            Gerenciar Usuários
          </Button>
        </Card>
      )}

      {/* BOTÃO DE LOGOUT */}
      <Button
        variant="ghost"
        className="w-full text-clay-600 hover:bg-clay-50 active:bg-clay-100 border border-transparent hover:border-clay-100/50 rounded-2xl py-3 shadow-none mt-2 cursor-pointer"
        onClick={() => {
          logout();
          navigate("/login", { replace: true });
        }}
      >
        <SignOutIcon />
        Fazer logout
      </Button>

      {/* LINK DO SAC NO RODAPÉ */}
      <div className="mt-8 text-center">
        <a 
          href="mailto:linnsheitor@gmail.com?subject=Suporte%20Markt"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-600 hover:text-forest-700 bg-forest-50/50 hover:bg-forest-50 border border-forest-100/50 px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-sm"
        >
          <span>📧 SAC - linnsheitor@gmail.com</span>
        </a>
      </div>

      {/* BOTÃO PARA EXCLUSÃO DE CONTA */}
      <div className="mt-12 mb-6 text-center animate-fade-in">
        <button
          onClick={() => {
            setDeleteConfirmationText("");
            setShowDeleteModal(true);
          }}
          className="text-xs font-bold text-clay-400 hover:text-clay-600 underline underline-offset-4 cursor-pointer transition-all"
        >
          Excluir minha conta permanentemente
        </button>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE CONTA */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-cream-200 bg-white p-6 shadow-2xl">
            <p className="text-lg font-extrabold text-graphite-900 flex items-center gap-2">
              <span>⚠️ Excluir Conta?</span>
            </p>
            
            <div className="mt-4 space-y-3.5 text-xs text-graphite-600 font-medium leading-relaxed text-left">
              <p className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-2xl">
                <strong>ℹ️ Inatividade vs Exclusão:</strong>
                <br />
                Se você apenas parar de usar o app (ficar inativo), seu histórico de compras, mercados e orçamentos <strong>permanecerão salvos</strong> para quando você voltar.
              </p>
              <p className="bg-clay-50 border border-clay-200 text-clay-950 p-3 rounded-2xl">
                <strong>🚨 Apagar tudo permanentemente:</strong> Ao confirmar a exclusão, todo o histórico de compras, itens e limites financeiros serão <strong>excluídos permanentemente</strong> e não poderão ser recuperados.
              </p>
              <p className="px-1 text-graphite-500 font-semibold">
                Para prosseguir e confirmar a perda total dos dados, digite <strong className="text-clay-600">EXCLUIR</strong> abaixo:
              </p>
            </div>

            <div className="mt-4">
              <input
                type="text"
                placeholder="Digite EXCLUIR para confirmar"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full p-3 border border-cream-200 rounded-xl bg-white text-sm font-bold text-center uppercase text-clay-600 focus:outline-none focus:border-clay-500 tracking-widest placeholder:tracking-normal placeholder:font-medium transition-all"
              />
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText.trim().toUpperCase() !== "EXCLUIR" || isDeleting}
                className="w-full bg-clay-600 border border-clay-700 hover:bg-clay-700 text-white shadow-sm"
              >
                {isDeleting ? "Excluindo..." : "Confirmar e Excluir Tudo"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteModal(false)}
                className="w-full text-graphite-500 hover:bg-cream-50"
              >
                Cancelar e Manter Conta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
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
