import { haversineDistanceKm } from "./haversine";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const REQUEST_TIMEOUT_MS = 6000;

export interface NearbyMarket {
  externalId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
}

export async function findNearbyMarkets(
  lat: number,
  lng: number,
  radiusMeters = 2000
): Promise<NearbyMarket[]> {
  const query = `
    [out:json][timeout:5];
    (
      node["shop"~"^(supermarket|convenience|grocery)$"](around:${radiusMeters},${lat},${lng});
      way["shop"~"^(supermarket|convenience|grocery)$"](around:${radiusMeters},${lat},${lng});
    );
    out center;
  `;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      body: query,
      headers: { "Content-Type": "text/plain" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass respondeu ${response.status}`);
    }

    const data = (await response.json()) as {
      elements: Array<{
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };

    const markets: NearbyMarket[] = data.elements
      .map((el) => {
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        if (elLat == null || elLng == null || !el.tags?.name) return null;

        const addressParts = [
          el.tags["addr:street"],
          el.tags["addr:housenumber"],
          el.tags["addr:suburb"],
        ].filter(Boolean);

        return {
          externalId: `osm-${el.id}`,
          name: el.tags.name,
          address: addressParts.length ? addressParts.join(", ") : null,
          lat: elLat,
          lng: elLng,
          distanceKm: haversineDistanceKm(lat, lng, elLat, elLng),
        };
      })
      .filter((m): m is NearbyMarket => m !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return markets;
  } finally {
    clearTimeout(timeout);
  }
}
