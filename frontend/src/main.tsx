// Limpeza incondicional de Service Workers e Caches antigos para evitar asset caching antigo
if (typeof window !== "undefined") {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log("Service Worker desregistrado para compatibilidade");
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
