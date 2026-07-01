import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// Maiores altas e quedas de preço: compara as duas últimas compras de cada produto
router.get("/price-changes", async (req: AuthedRequest, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  const items = await prisma.purchaseItem.findMany({
    where: { purchase: { userId: req.userId, status: "completed" } },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const byProduct = new Map<string, typeof items>();
  for (const item of items) {
    const list = byProduct.get(item.productId) ?? [];
    list.push(item);
    byProduct.set(item.productId, list);
  }

  const changes = [...byProduct.values()]
    .filter((list) => list.length >= 2)
    .map((list) => {
      const [latest, previous] = list;
      const deltaAbs = latest.price - previous.price;
      const deltaPct = previous.price === 0 ? 0 : (deltaAbs / previous.price) * 100;
      return {
        product: {
          id: latest.product.id,
          name: latest.product.name,
          category: latest.product.category,
        },
        previousPrice: previous.price,
        latestPrice: latest.price,
        deltaAbs,
        deltaPct,
      };
    });

  const highs = [...changes]
    .filter((c) => c.deltaAbs > 0)
    .sort((a, b) => b.deltaPct - a.deltaPct)
    .slice(0, limit);

  const lows = [...changes]
    .filter((c) => c.deltaAbs < 0)
    .sort((a, b) => a.deltaPct - b.deltaPct)
    .slice(0, limit);

  res.json({ highs, lows });
});

// Gasto por período, adaptando a granularidade à frequência real de compras
router.get("/spending", async (req: AuthedRequest, res) => {
  const purchases = await prisma.purchase.findMany({
    where: { userId: req.userId, status: "completed" },
    orderBy: { completedAt: "asc" },
  });

  if (purchases.length === 0) {
    return res.json({ granularity: "monthly", series: [] });
  }

  const first = purchases[0].completedAt!;
  const last = purchases[purchases.length - 1].completedAt!;
  const daySpan = Math.max(
    1,
    (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)
  );
  const avgGapDays = daySpan / Math.max(1, purchases.length - 1);
  const granularity = avgGapDays <= 10 ? "weekly" : "monthly";

  const bucketKey = (date: Date) => {
    if (granularity === "weekly") {
      const oneJan = new Date(date.getFullYear(), 0, 1);
      const week = Math.ceil(
        ((date.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7
      );
      return `${date.getFullYear()}-S${String(week).padStart(2, "0")}`;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const buckets = new Map<string, number>();
  for (const p of purchases) {
    const key = bucketKey(p.completedAt!);
    buckets.set(key, (buckets.get(key) ?? 0) + p.totalAmount);
  }

  const series = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, total]) => ({ period, total }));

  res.json({ granularity, series });
});

// Gasto por categoria de produto
router.get("/by-category", async (req: AuthedRequest, res) => {
  const items = await prisma.purchaseItem.findMany({
    where: { purchase: { userId: req.userId, status: "completed" } },
    include: { product: true },
  });

  const byCategory = new Map<string, number>();
  for (const item of items) {
    const category = item.product.category ?? "Sem categoria";
    byCategory.set(category, (byCategory.get(category) ?? 0) + item.subtotal);
  }

  const categories = [...byCategory.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  res.json({ categories });
});

// Insights extras: ticket médio, mercado mais econômico, itens que mais pesam no orçamento
router.get("/highlights", async (req: AuthedRequest, res) => {
  const purchases = await prisma.purchase.findMany({
    where: { userId: req.userId, status: "completed" },
    include: { market: true, items: { include: { product: true } } },
  });

  const avgTicket =
    purchases.length > 0
      ? purchases.reduce((sum, p) => sum + p.totalAmount, 0) / purchases.length
      : 0;

  const marketTotals = new Map<string, { name: string; total: number; count: number }>();
  for (const p of purchases) {
    const entry = marketTotals.get(p.marketId) ?? {
      name: p.market.name,
      total: 0,
      count: 0,
    };
    entry.total += p.totalAmount;
    entry.count += 1;
    marketTotals.set(p.marketId, entry);
  }

  const marketAverages = [...marketTotals.values()]
    .map((m) => ({ name: m.name, avgTicket: m.total / m.count, purchaseCount: m.count }))
    .sort((a, b) => a.avgTicket - b.avgTicket);

  const productTotals = new Map<string, { name: string; total: number }>();
  for (const p of purchases) {
    for (const item of p.items) {
      const entry = productTotals.get(item.productId) ?? {
        name: item.product.name,
        total: 0,
      };
      entry.total += item.subtotal;
      productTotals.set(item.productId, entry);
    }
  }

  const topProducts = [...productTotals.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  res.json({
    avgTicket,
    cheapestMarket: marketAverages[0] ?? null,
    topBudgetProducts: topProducts,
  });
});

export default router;
