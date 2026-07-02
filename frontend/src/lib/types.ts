export interface User {
  id: string;
  name: string;
  cpf: string;
}

export interface Market {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  source: "osm" | "manual";
}

export interface NearbyMarket {
  externalId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  source: "openfoodfacts" | "manual";
}

export interface PurchaseItem {
  id: string;
  price: number;
  quantity: number;
  subtotal: number;
  createdAt: string;
  product: Product;
}

export interface Purchase {
  id: string;
  status: "open" | "completed";
  budgetLimit: number | null;
  totalAmount: number;
  startedAt: string;
  completedAt: string | null;
  market: Market;
  items: PurchaseItem[];
  paymentMethod: string | null;
  paymentDetails: string | null;
}

export interface PurchaseSummary {
  id: string;
  status: "open" | "completed";
  totalAmount: number;
  itemCount: number;
  startedAt: string;
  completedAt: string | null;
  market: { id: string; name: string };
}

export type PriceComparison =
  | { kind: "first_purchase" }
  | {
      kind: "higher" | "lower" | "same";
      previousPrice: number;
      deltaAbs: number;
      deltaPct: number;
    };
