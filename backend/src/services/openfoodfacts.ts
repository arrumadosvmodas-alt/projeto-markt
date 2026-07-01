const REQUEST_TIMEOUT_MS = 5000;

export interface OffProduct {
  name: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
}

export async function lookupOpenFoodFacts(
  barcode: string
): Promise<OffProduct | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
        barcode
      )}.json`,
      { signal: controller.signal }
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      status: number;
      product?: {
        product_name?: string;
        brands?: string;
        categories?: string;
        image_front_small_url?: string;
      };
    };

    if (data.status !== 1 || !data.product?.product_name) return null;

    const firstCategory = data.product.categories
      ?.split(",")
      .map((c) => c.trim())
      .filter(Boolean)[0];

    return {
      name: data.product.product_name,
      brand: data.product.brands?.split(",")[0]?.trim() ?? null,
      category: firstCategory ?? null,
      imageUrl: data.product.image_front_small_url ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
