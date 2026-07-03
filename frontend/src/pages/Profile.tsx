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
      <Card className="p-6 border border-cream-200 bg-white">
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
      <Card className="p-6 border border-cream-200 bg-white">
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

      {/* BOTÃO DE LOGOUT */}
      <Button
        variant="ghost"
        className="w-full text-clay-600 hover:bg-clay-50 active:bg-clay-100 border border-transparent hover:border-clay-100/50 rounded-2xl py-3 shadow-none"
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
