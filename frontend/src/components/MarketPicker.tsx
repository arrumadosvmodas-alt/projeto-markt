import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useGeolocation } from "../lib/useGeolocation";
import type { Market, NearbyMarket } from "../lib/types";
import { Button, Card, TextInput } from "./ui";

export function MarketPicker({ onSelect }: { onSelect: (market: Market) => void }) {
  const geo = useGeolocation();
  const [nearby, setNearby] = useState<NearbyMarket[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [mineMarkets, setMineMarkets] = useState<Market[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ markets: Market[] }>("/markets/mine")
      .then((data) => setMineMarkets(data.markets))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!geo.coords) return;
    setSearchError(null);
    api
      .get<{ markets: NearbyMarket[] }>(
        `/markets/nearby?lat=${geo.coords.lat}&lng=${geo.coords.lng}`
      )
      .then((data) => setNearby(data.markets))
      .catch(() => setSearchError("Não foi possível buscar mercados próximos agora."));
  }, [geo.coords]);

  async function selectNearby(m: NearbyMarket) {
    setSaving(true);
    try {
      const data = await api.post<{ market: Market }>("/markets/from-osm", m);
      onSelect(data.market);
    } finally {
      setSaving(false);
    }
  }

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualName.trim()) return;
    setSaving(true);
    try {
      const data = await api.post<{ market: Market }>("/markets/manual", {
        name: manualName.trim(),
        address: manualAddress.trim() || undefined,
      });
      onSelect(data.market);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {!manualMode && (
        <>
          {!geo.coords && (
            <Button onClick={geo.request} disabled={geo.loading} className="w-full">
              {geo.loading ? "Buscando localização..." : "Usar minha localização"}
            </Button>
          )}

          {geo.error && <p className="text-sm text-clay-600">{geo.error}</p>}
          {searchError && <p className="text-sm text-clay-600">{searchError}</p>}

          {nearby && nearby.length === 0 && (
            <p className="text-sm text-graphite-500">
              Nenhum mercado encontrado perto de você.
            </p>
          )}

          {nearby && nearby.length > 0 && (
            <ul className="space-y-2">
              {nearby.map((m) => (
                <li key={m.externalId}>
                  <button
                    disabled={saving}
                    onClick={() => selectNearby(m)}
                    className="w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-left transition hover:border-forest-300 disabled:opacity-50"
                  >
                    <p className="font-medium text-graphite-900">{m.name}</p>
                    <p className="text-xs text-graphite-500">
                      {m.address ?? "Endereço não informado"} · {m.distanceKm.toFixed(1)} km
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {mineMarkets.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-graphite-700">
                Mercados que você já usou
              </p>
              <ul className="space-y-2">
                {mineMarkets.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => onSelect(m)}
                      className="w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-left transition hover:border-forest-300"
                    >
                      <p className="font-medium text-graphite-900">{m.name}</p>
                      {m.address && <p className="text-xs text-graphite-500">{m.address}</p>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setManualMode(true)}
            className="w-full text-center text-sm font-medium text-forest-600 underline-offset-2 hover:underline"
          >
            Não encontrei o mercado, informar manualmente
          </button>
        </>
      )}

      {manualMode && (
        <Card className="p-4">
          <form onSubmit={submitManual} className="space-y-3">
            <TextInput
              label="Nome do mercado"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              required
            />
            <TextInput
              label="Endereço (opcional)"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="flex-1">
                Continuar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setManualMode(false)}>
                Voltar
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
