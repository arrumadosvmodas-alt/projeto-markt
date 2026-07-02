import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../lib/api";
import { useGeolocation } from "../lib/useGeolocation";
import type { Market, NearbyMarket } from "../lib/types";
import { Button, Card, TextInput } from "./ui";

// Ícones personalizados em SVG para o Leaflet
const userIcon = L.divIcon({
  className: "custom-user-icon",
  html: `<div class="relative flex h-6 w-6 items-center justify-center">
    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-400 opacity-75"></span>
    <span class="relative inline-flex h-3.5 w-3.5 rounded-full bg-forest-600 border-2 border-white shadow"></span>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const marketIcon = L.divIcon({
  className: "custom-market-icon",
  html: `<div class="flex items-center justify-center h-8 w-8 rounded-full bg-forest-50 border-2 border-forest-600 shadow text-forest-700">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const selectedIcon = L.divIcon({
  className: "custom-selected-icon",
  html: `<div class="flex items-center justify-center h-8 w-8 rounded-full bg-clay-50 border-2 border-clay-600 shadow text-clay-700">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
      <path d="M12 2a8 8 0 00-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 00-8-8z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export function MarketPicker({ onSelect }: { onSelect: (market: Market) => void }) {
  const geo = useGeolocation();
  const [nearby, setNearby] = useState<NearbyMarket[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [mineMarkets, setMineMarkets] = useState<Market[]>([]);
  const [saving, setSaving] = useState(false);

  // Estados do Mapa
  const [map, setMap] = useState<L.Map | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<L.Marker | null>(null);

  useEffect(() => {
    api
      .get<{ markets: Market[] }>("/markets/mine")
      .then((data) => setMineMarkets(data.markets))
      .catch(() => {});
  }, []);

  // Busca mercados próximos em um raio de 500 metros
  useEffect(() => {
    if (!geo.coords) return;
    setSearchError(null);
    api
      .get<{ markets: NearbyMarket[] }>(
        `/markets/nearby?lat=${geo.coords.lat}&lng=${geo.coords.lng}&radius=500`
      )
      .then((data) => setNearby(data.markets))
      .catch(() => setSearchError("Não foi possível buscar mercados próximos agora."));
  }, [geo.coords]);

  // Inicializa o mapa do Leaflet
  useEffect(() => {
    if (!geo.coords || map) return;

    const mapInstance = L.map("picker-map", {
      zoomControl: false,
    }).setView([geo.coords.lat, geo.coords.lng], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(mapInstance);

    // Adiciona o marcador do usuário
    L.marker([geo.coords.lat, geo.coords.lng], { icon: userIcon }).addTo(mapInstance);

    // Adiciona o escutador de cliques no mapa
    mapInstance.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setSelectedCoords({ lat, lng });
      setManualMode(true);
      setManualName("");
      setManualAddress(`Coordenadas: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    });

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, [geo.coords]);

  // Atualiza/Cria o marcador de seleção customizada no mapa
  useEffect(() => {
    if (!map || !selectedCoords) return;

    if (selectedMarker) {
      selectedMarker.setLatLng([selectedCoords.lat, selectedCoords.lng]);
    } else {
      const marker = L.marker([selectedCoords.lat, selectedCoords.lng], { icon: selectedIcon }).addTo(map);
      setSelectedMarker(marker);
    }
    map.panTo([selectedCoords.lat, selectedCoords.lng]);
  }, [selectedCoords, map]);

  // Adiciona marcadores dos estabelecimentos próximos
  useEffect(() => {
    if (!map || !nearby) return;

    const marketGroup = L.layerGroup().addTo(map);

    nearby.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], { icon: marketIcon }).addTo(marketGroup);
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; min-width: 140px;">
          <p style="margin: 0 0 4px 0; font-weight: bold; color: #1f2937; font-size: 13px;">${m.name}</p>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 10px;">${m.address ?? "Endereço não informado"}</p>
          <button class="select-btn" data-id="${m.externalId}" style="background-color: #3f6212; color: #fdfaf5; border: none; padding: 6px 12px; font-size: 11px; font-weight: bold; border-radius: 8px; width: 100%; cursor: pointer; transition: background-color 0.2s;">
            Selecionar Mercado
          </button>
        </div>
      `);
    });

    return () => {
      map.removeLayer(marketGroup);
    };
  }, [map, nearby]);

  // Escuta cliques no botão do popup do mapa de forma dinâmica
  useEffect(() => {
    if (!map) return;

    const onPopupOpen = (e: L.PopupEvent) => {
      const popupNode = e.popup.getElement();
      if (!popupNode) return;
      const btn = popupNode.querySelector(".select-btn");
      if (btn) {
        const extId = btn.getAttribute("data-id");
        const m = nearby?.find((item) => item.externalId === extId);
        if (m) {
          btn.addEventListener("click", () => {
            selectNearby(m);
          });
        }
      }
    };

    map.on("popupopen", onPopupOpen);
    return () => {
      map.off("popupopen", onPopupOpen);
    };
  }, [map, nearby]);

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
        lat: selectedCoords?.lat ?? undefined,
        lng: selectedCoords?.lng ?? undefined,
      });
      onSelect(data.market);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelManual() {
    setManualMode(false);
    setSelectedCoords(null);
    if (selectedMarker && map) {
      map.removeLayer(selectedMarker);
      setSelectedMarker(null);
    }
  }

  return (
    <div className="space-y-4">
      {!geo.coords && (
        <Button onClick={geo.request} disabled={geo.loading} className="w-full shadow-md shadow-forest-600/10">
          {geo.loading ? "Buscando localização..." : "Usar minha localização"}
        </Button>
      )}

      {geo.coords && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-graphite-400 uppercase tracking-wider">
            Toque no mapa para marcar ou escolha abaixo (Raio 500m)
          </p>
          <div className="overflow-hidden rounded-2xl border border-cream-200 shadow-sm bg-cream-50">
            <div id="picker-map" className="h-64 w-full z-10" />
          </div>
        </div>
      )}

      {geo.error && <p className="text-sm text-clay-600 font-semibold">{geo.error}</p>}
      {searchError && <p className="text-sm text-clay-600 font-semibold">{searchError}</p>}

      {!manualMode && (
        <>
          {nearby && nearby.length === 0 && (
            <p className="text-sm text-graphite-500 font-medium text-center py-2">
              Nenhum mercado encontrado perto de você no raio de 500m.
            </p>
          )}

          {nearby && nearby.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-graphite-400 uppercase tracking-wider">Mercados próximos</p>
              <ul className="space-y-2">
                {nearby.map((m) => (
                  <li key={m.externalId} className="animate-fade-in">
                    <button
                      disabled={saving}
                      onClick={() => selectNearby(m)}
                      className="w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-left transition hover:border-forest-300 disabled:opacity-50 shadow-sm hover:shadow"
                    >
                      <p className="font-bold text-graphite-900 text-sm">{m.name}</p>
                      <p className="text-xs text-graphite-500 font-medium mt-1">
                        {m.address ?? "Endereço não informado"} · {m.distanceKm.toFixed(2)} km
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mineMarkets.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs font-bold text-graphite-400 uppercase tracking-wider">
                Mercados que você já usou
              </p>
              <ul className="space-y-2">
                {mineMarkets.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => onSelect(m)}
                      className="w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-left transition hover:border-forest-300 shadow-sm hover:shadow"
                    >
                      <p className="font-bold text-graphite-900 text-sm">{m.name}</p>
                      {m.address && <p className="text-xs text-graphite-500 font-medium mt-1">{m.address}</p>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setManualMode(true)}
            className="w-full text-center text-sm font-semibold text-forest-600 underline-offset-4 hover:underline py-2 cursor-pointer"
          >
            Não encontrei o mercado, informar manualmente
          </button>
        </>
      )}

      {manualMode && (
        <Card className="p-4 border border-cream-200 bg-white">
          <div className="mb-3">
            <p className="font-bold text-graphite-900">Cadastrar Novo Mercado</p>
            {selectedCoords && (
              <span className="inline-block bg-forest-50 text-forest-700 text-[10px] font-bold px-2 py-0.5 rounded-lg mt-1">
                Coordenadas selecionadas no mapa
              </span>
            )}
          </div>
          <form onSubmit={submitManual} className="space-y-3">
            <TextInput
              label="Nome do mercado"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Ex: Supermercado Preço Bom"
              required
            />
            <TextInput
              label="Endereço"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Ex: Av. Principal, 123"
            />
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={saving} className="flex-1">
                Continuar
              </Button>
              <Button type="button" variant="ghost" onClick={handleCancelManual}>
                Voltar
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
