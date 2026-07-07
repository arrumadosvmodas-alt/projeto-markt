import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Button, TextInput } from "./ui";

interface ScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
  onManual?: () => void;
}

export function Scanner({ onDetected, onClose, onManual }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("markt_torch_preference") === "true";
    }
    return false;
  });

  useEffect(() => {
    // Restringe para ler APENAS formatos de código de barras, excluindo QR Code
    const hints = new Map();
    const formats = [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF
    ];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);

    const reader = new BrowserMultiFormatReader(hints);
    let stopped = false;

    reader
      .decodeFromVideoDevice(null, videoRef.current!, (result) => {
        if (stopped || !result) return;
        stopped = true;
        
        // Desativa a lanterna antes de resetar a câmera
        setTorch(false);
        reader.reset();
        onDetected(result.getText());
      })
      .catch(() => {
        setCameraError(
          "Não foi possível acessar a câmera. Você pode digitar o código ou cadastrar manualmente."
        );
      });

    return () => {
      stopped = true;
      setTorch(false);
      reader.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monitora e aplica o estado da lanterna (torch)
  useEffect(() => {
    setTorch(torchEnabled);
  }, [torchEnabled]);

  function setTorch(enabled: boolean) {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities = track.getCapabilities() as any;
        if (capabilities.torch) {
          track.applyConstraints({
            advanced: [{ torch: enabled }]
          } as any).catch((e) => console.log("Constraints error:", e));
        }
      } catch (e) {
        console.log("Torch capabilities check error:", e);
      }
    }
  }

  function handleVideoPlay() {
    setTorch(torchEnabled);
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) onDetected(manualCode.trim());
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-graphite-900/95 p-4">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between text-cream-50">
          <h2 className="font-semibold">Ler código de barras</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const nextVal = !torchEnabled;
                setTorchEnabled(nextVal);
                localStorage.setItem("markt_torch_preference", String(nextVal));
              }}
              className={`rounded-full p-2 hover:bg-white/10 transition-colors ${
                torchEnabled ? "text-amber-400" : "text-cream-50"
              }`}
              title="Alternar lanterna"
            >
              <FlashIcon />
            </button>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10 text-cream-50" aria-label="Fechar">
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-2xl bg-black flex flex-col justify-between">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline onPlay={handleVideoPlay} />
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-sm text-cream-100">
              {cameraError}
            </div>
          )}
          {onManual && (
            <div className="absolute bottom-4 left-0 right-0 px-4">
              <Button
                onClick={onManual}
                variant="secondary"
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md backdrop-blur-sm transition-all duration-200"
              >
                Cadastrar manualmente (Digitar item)
              </Button>
            </div>
          )}
        </div>

        <form onSubmit={submitManual} className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <TextInput
              label="Ou digite o número do código de barras"
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
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function FlashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
