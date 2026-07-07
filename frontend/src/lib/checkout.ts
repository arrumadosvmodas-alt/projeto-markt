import { Capacitor } from "@capacitor/core";

/**
 * Abre o checkout do Mercado Pago com segurança.
 *
 * Motivo: no app nativo (Capacitor) a UI roda dentro de uma WebView Android.
 * Se navegarmos com `window.location.href` dentro dessa WebView, os scripts do
 * checkout do Mercado Pago são bloqueados (erro de CSP / botão "Criar Pix"
 * cinza). A solução é abrir o checkout FORA da WebView, no navegador do sistema.
 *
 * - Nativo (Capacitor): abre no navegador padrão do dispositivo.
 * - Web/PWA: força navegação top-level (escapa de qualquer iframe).
 */
export function openCheckout(url: string) {
  if (Capacitor.isNativePlatform()) {
    // "_blank" no Capacitor abre no navegador do sistema, fora da WebView do app.
    window.open(url, "_blank");
    return;
  }

  // Navegador / PWA: garante navegação no topo, nunca dentro de um iframe.
  if (window.top && window.top !== window.self) {
    window.top.location.href = url;
  } else {
    window.location.href = url;
  }
}
