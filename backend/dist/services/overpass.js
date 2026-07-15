"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNearbyMarkets = findNearbyMarkets;
const haversine_1 = require("./haversine");
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const REQUEST_TIMEOUT_MS = 6000;
async function findNearbyMarkets(lat, lng, radiusMeters = 2000) {
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
        const data = (await response.json());
        const markets = data.elements
            .map((el) => {
            const elLat = el.lat ?? el.center?.lat;
            const elLng = el.lon ?? el.center?.lon;
            if (elLat == null || elLng == null || !el.tags?.name)
                return null;
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
                distanceKm: (0, haversine_1.haversineDistanceKm)(lat, lng, elLat, elLng),
            };
        })
            .filter((m) => m !== null)
            .sort((a, b) => a.distanceKm - b.distanceKm);
        return markets;
    }
    finally {
        clearTimeout(timeout);
    }
}
