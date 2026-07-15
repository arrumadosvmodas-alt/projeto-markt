"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePriceWithLastPurchase = comparePriceWithLastPurchase;
async function comparePriceWithLastPurchase(prisma, userId, productId, currentPurchaseId, currentPrice) {
    const previousItem = await prisma.purchaseItem.findFirst({
        where: {
            productId,
            purchaseId: { not: currentPurchaseId },
            purchase: { userId },
        },
        orderBy: { createdAt: "desc" },
    });
    if (!previousItem)
        return { kind: "first_purchase" };
    const deltaAbs = currentPrice - previousItem.price;
    const deltaPct = previousItem.price === 0 ? 0 : (deltaAbs / previousItem.price) * 100;
    const kind = Math.abs(deltaAbs) < 0.005 ? "same" : deltaAbs > 0 ? "higher" : "lower";
    return {
        kind,
        previousPrice: previousItem.price,
        deltaAbs,
        deltaPct,
    };
}
