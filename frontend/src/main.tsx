// Limpeza de cache do Service Worker no Capacitor para evitar asset caching antigo
if (typeof window !== "undefined" && (window as any).Capacitor) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log("Service Worker desregistrado para compatibilidade no Capacitor");
            window.location.reload();
          }
        });
      }
    });
  }
  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
} else if (typeof window !== "undefined") {
  // Registra o Service Worker apenas no navegador web comum
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Erro ao registrar SW:", err);
      });
    });
  }
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
if (typeof window !== "undefined") {
  const savedTheme = localStorage.getItem("markt_theme") || "green";
  document.documentElement.setAttribute("data-theme", savedTheme);
}
import App from "./App.tsx";
import { AuthProvider } from "./lib/auth-context";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
