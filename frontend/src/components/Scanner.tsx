import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Button, TextInput } from "./ui";

interface ScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export function Scanner({ onDetected, onClose }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let stopped = false;

    reader
      .decodeFromVideoDevice(null, videoRef.current!, (result) => {
        if (stopped || !result) return;
        stopped = true;
        reader.reset();
        onDetected(result.getText());
      })
      .catch(() => {
        setCameraError(
          "Não foi possível acessar a câmera. Você pode digitar o código abaixo."
        );
      });

    return () => {
      stopped = true;
      reader.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) onDetected(manualCode.trim());
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-graphite-900/95 p-4">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between text-cream-50">
          <h2 className="font-semibold">Ler código de barras</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Fechar">
            <CloseIcon />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-sm text-cream-100">
              {cameraError}
            </div>
          )}
        </div>

        <form onSubmit={submitManual} className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <TextInput
              label="Ou digite o código de barras"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              inputMode="numeric"
              placeholder="7891000100103"
            />
          </div>
          <Button type="submit" variant="secondary">
            Usar
          </Button>
        </form>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-cream-50">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
