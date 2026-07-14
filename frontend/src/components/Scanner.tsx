import { useEffect, useRef, useState, useCallback } from "react";
import {
  BarcodeFormat,
  DecodeHintType,
  Result,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  MultiFormatReader,
} from "@zxing/library";
import { CapacitorFlash } from "@capgo/capacitor-flash";
import { Button, TextInput } from "./ui";

interface ScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
  onManual?: () => void;
}

// Proporção do crop da região central de interesse
const CROP_RATIO_W = 0.85; // 85% da largura
const CROP_RATIO_H = 0.30; // 30% da altura (faixa central ampliada)

export function Scanner({ onDetected, onClose, onManual }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastResultRef = useRef<{ text: string; count: number; at: number } | null>(null);
  const rafRef = useRef<number>(0);
  const readerRef = useRef<MultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stoppedRef = useRef(false);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState("Aponte para o código de barras");
  const [manualCode, setManualCode] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const pref = localStorage.getItem("markt_torch_preference");
      return pref !== "false";
    }
    return true;
  });

  // ── Loop de decodificação via requestAnimationFrame + canvas crop ──────────
  const decodeFrame = useCallback(() => {
    if (stoppedRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const reader = readerRef.current;
    if (!video || !canvas || !reader || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(decodeFrame);
      return;
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) {
      rafRef.current = requestAnimationFrame(decodeFrame);
      return;
    }

    // Captura apenas a região central da imagem
    const cropW = Math.floor(vw * CROP_RATIO_W);
    const cropH = Math.floor(vh * CROP_RATIO_H);
    const cropX = Math.floor((vw - cropW) / 2);
    const cropY = Math.floor((vh - cropH) / 2);

    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      rafRef.current = requestAnimationFrame(decodeFrame);
      return;
    }
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    try {
      const imageData = ctx.getImageData(0, 0, cropW, cropH);
      const luminances = new Uint8ClampedArray(cropW * cropH);
      for (let i = 0; i < cropW * cropH; i++) {
        const r = imageData.data[i * 4];
        const g = imageData.data[i * 4 + 1];
        const b = imageData.data[i * 4 + 2];
        // Conversão luma ponderada BT.601 — melhor contraste para barras finas
        luminances[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      }
      const source = new RGBLuminanceSource(luminances, cropW, cropH);
      const bitmap = new BinaryBitmap(new HybridBinarizer(source));
      const result = reader.decode(bitmap);

      const stableCode = getStableBarcode(result, setScanStatus, lastResultRef);
      if (stableCode) {
        stoppedRef.current = true;
        setTorchFn(false, streamRef);
        cancelAnimationFrame(rafRef.current);
        stopStream(streamRef.current);
        onDetected(stableCode);
        return;
      }
    } catch {
      // Sem leitura neste frame — continua tentando
    }

    rafRef.current = requestAnimationFrame(decodeFrame);
  }, [onDetected]);

  useEffect(() => {
    // Configura o decodificador com hints otimizados
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.PURE_BARCODE, false);
    readerRef.current = new MultiFormatReader();
    readerRef.current.setHints(hints);

    async function startScanner() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            frameRate: { ideal: 60, min: 30 },
            focusMode: "continuous",
            exposureMode: "continuous",
            whiteBalanceMode: "continuous",
          } as MediaTrackConstraints,
        });

        if (stoppedRef.current) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Aguarda autofoco estabilizar antes de aplicar zoom
        setTimeout(() => improveCameraTrack(stream), 650);

        // Inicia o loop de decodificação
        rafRef.current = requestAnimationFrame(decodeFrame);
      } catch {
        setCameraError(
          "Não foi possível acessar a câmera. Você pode digitar o código ou cadastrar manualmente."
        );
      }
    }

    startScanner();

    return () => {
      stoppedRef.current = true;
      cancelAnimationFrame(rafRef.current);
      setTorchFn(false, streamRef);
      stopStream(streamRef.current);
    };
  }, [decodeFrame]);

  useEffect(() => {
    setTorchFn(torchEnabled, streamRef);
  }, [torchEnabled]);

  function handleVideoPlay() {
    setTorchFn(torchEnabled, streamRef);
    setTimeout(() => setTorchFn(torchEnabled, streamRef), 400);
    setTimeout(() => setTorchFn(torchEnabled, streamRef), 900);
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const code = manualCode.trim().replace(/\D/g, "");
    if (code) onDetected(code);
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
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-white/10 text-cream-50"
              aria-label="Fechar"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-2xl bg-black flex flex-col justify-between">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
            onPlay={handleVideoPlay}
          />
          {/* Canvas oculto para captura e crop da imagem */}
          <canvas ref={canvasRef} className="hidden" />

          {!cameraError && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6">
              <div className="relative w-full max-w-sm">
                {/* Janela de leitura ampliada */}
                <div className="relative h-40 w-full rounded-xl border-2 border-cream-50/90 shadow-[0_0_0_999px_rgba(0,0,0,0.42)] overflow-hidden">
                  {/* Linha de escaneamento animada */}
                  <div className="scan-line absolute left-0 right-0 h-0.5 bg-amber-400/90" />
                </div>
                {/* Cantos de mira */}
                <span className="absolute left-0 top-0 h-6 w-6 border-l-[3px] border-t-[3px] border-amber-400 rounded-tl-lg" />
                <span className="absolute right-0 top-0 h-6 w-6 border-r-[3px] border-t-[3px] border-amber-400 rounded-tr-lg" />
                <span className="absolute left-0 bottom-0 h-6 w-6 border-l-[3px] border-b-[3px] border-amber-400 rounded-bl-lg" />
                <span className="absolute right-0 bottom-0 h-6 w-6 border-r-[3px] border-b-[3px] border-amber-400 rounded-br-lg" />
              </div>
              <p className="mt-4 rounded-full bg-black/60 px-4 py-2 text-center text-xs font-semibold text-cream-50">
                {scanStatus}
              </p>
            </div>
          )}
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

      <style>{`
        @keyframes scan {
          0%   { top: 0%; }
          50%  { top: calc(100% - 2px); }
          100% { top: 0%; }
        }
        .scan-line { animation: scan 2s ease-in-out infinite; position: absolute; }
      `}</style>
    </div>
  );
}

// ── Funções utilitárias ────────────────────────────────────────────────────────

async function setTorchFn(enabled: boolean, streamRef: React.MutableRefObject<MediaStream | null>) {
  try {
    const { value: isAvailable } = await CapacitorFlash.isAvailable();
    if (isAvailable) {
      if (enabled) {
        await CapacitorFlash.switchOn({ intensity: 1.0 });
      } else {
        await CapacitorFlash.switchOff();
      }
      return;
    }
  } catch (e) {
    console.log("CapacitorFlash plugin failed, falling back to MediaStream:", e);
  }
  const stream = streamRef.current;
  const track = stream?.getVideoTracks()[0];
  if (track) {
    try {
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        track.applyConstraints({ advanced: [{ torch: enabled }] } as any).catch(() => {});
      }
    } catch {}
  }
}

async function improveCameraTrack(stream: MediaStream) {
  const track = stream.getVideoTracks()[0];
  if (!track) return;
  try {
    const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
      focusMode?: string[];
      zoom?: { min: number; max: number; step?: number };
    };
    const advanced: Record<string, unknown>[] = [];

    if (capabilities.focusMode?.includes("continuous")) {
      advanced.push({ focusMode: "continuous" });
    }
    // Zoom suave: 1.3×–2.0× para facilitar leitura de códigos menores
    if (capabilities.zoom) {
      const zoom = Math.min(
        Math.max(1.3, capabilities.zoom.min),
        Math.min(2.0, capabilities.zoom.max)
      );
      advanced.push({ zoom });
    }
    if (advanced.length) {
      await track.applyConstraints({ advanced } as MediaTrackConstraints);
    }
  } catch (e) {
    console.log("Camera optimization unavailable:", e);
  }
}

function getStableBarcode(
  result: Result,
  setScanStatus: (s: string) => void,
  lastResultRef: React.MutableRefObject<{ text: string; count: number; at: number } | null>
): string | null {
  const text = result.getText().replace(/\D/g, "");
  if (!isLikelyBarcode(text)) return null;

  const now = Date.now();
  const previous = lastResultRef.current;
  const isSame = previous?.text === text && now - previous.at < 2000;
  const count = isSame ? previous!.count + 1 : 1;
  lastResultRef.current = { text, count, at: now };

  // Aceita imediatamente se EAN-13 com dígito verificador válido
  if (count === 1 && isValidEAN13(text)) {
    setScanStatus("Código confirmado ✔");
    return text;
  }
  // Ou 2 leituras consecutivas para outros formatos
  if (count >= 2) {
    setScanStatus("Código confirmado ✔");
    return text;
  }

  setScanStatus("Centralize o código na faixa...");
  return null;
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function isLikelyBarcode(text: string) {
  return /^[0-9]{8,14}$/.test(text);
}

/** Valida dígito verificador EAN-13 para aceitar na 1ª leitura com confiança */
function isValidEAN13(code: string): boolean {
  if (code.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10 === parseInt(code[12]);
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
