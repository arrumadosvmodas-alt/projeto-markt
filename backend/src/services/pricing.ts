import { PrismaClient } from "@prisma/client";

export type PriceComparison =
  | { kind: "first_purchase" }
  | {
      kind: "higher" | "lower" | "same";
      previousPrice: number;
      deltaAbs: number;
      deltaPct: number;
    };

export async function comparePriceWithLastPurchase(
  prisma: PrismaClient,
  userId: string,
  productId: string,
  currentPurchaseId: string,
  currentPrice: number
): Promise<PriceComparison> {
  const previousItem = await prisma.purchaseItem.findFirst({
    where: {
      productId,
      purchaseId: { not: currentPurchaseId },
      purchase: { userId },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!previousItem) return { kind: "first_purchase" };

  const deltaAbs = currentPrice - previousItem.price;
  const deltaPct =
    previousItem.price === 0 ? 0 : (deltaAbs / previousItem.price) * 100;

  const kind =
    Math.abs(deltaAbs) < 0.005 ? "same" : deltaAbs > 0 ? "higher" : "lower";

  return {
    kind,
    previousPrice: previousItem.price,
    deltaAbs,
    deltaPct,
  };
}
