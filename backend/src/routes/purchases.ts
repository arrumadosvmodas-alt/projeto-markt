import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { comparePriceWithLastPurchase } from "../services/pricing";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  marketId: z.string(),
  budgetLimit: z.number().positive().optional(),
});

router.post("/", async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const market = await prisma.market.findUnique({
    where: { id: parsed.data.marketId },
  });
  if (!market) return res.status(404).json({ error: "Mercado não encontrado" });

  const purchase = await prisma.purchase.create({
    data: {
      userId: req.userId!,
      marketId: market.id,
      budgetLimit: parsed.data.budgetLimit,
    },
  });

  res.status(201).json({ purchase });
});

router.get("/", async (req: AuthedRequest, res) => {
  const purchases = await prisma.purchase.findMany({
    where: { userId: req.userId },
    include: { market: true, items: true },
    orderBy: { startedAt: "desc" },
  });

  res.json({
    purchases: purchases.map((p) => ({
      id: p.id,
      market: { id: p.market.id, name: p.market.name },
      status: p.status,
      totalAmount: p.totalAmount,
      itemCount: p.items.length,
      startedAt: p.startedAt,
      completedAt: p.completedAt,
    })),
  });
});

router.get("/:id", async (req: AuthedRequest, res) => {
  const purchase = await prisma.purchase.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: {
      market: true,
      items: { include: { product: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!purchase) return res.status(404).json({ error: "Compra não encontrada" });

  res.json({ purchase });
});

const addItemSchema = z.object({
  productId: z.string(),
  price: z.number().positive(),
  quantity: z.number().positive(),
});

router.post("/:id/items", async (req: AuthedRequest, res) => {
  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const purchase = await prisma.purchase.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!purchase) return res.status(404).json({ error: "Compra não encontrada" });
  if (purchase.status !== "open") {
    return res.status(409).json({ error: "Compra já finalizada" });
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
  });
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });

  const { price, quantity } = parsed.data;
  const subtotal = price * quantity;

  const priceComparison = await comparePriceWithLastPurchase(
    prisma,
    req.userId!,
    product.id,
    purchase.id,
    price
  );

  const [item, updatedPurchase] = await prisma.$transaction([
    prisma.purchaseItem.create({
      data: {
        purchaseId: purchase.id,
        productId: product.id,
        price,
        quantity,
        subtotal,
      },
      include: { product: true },
    }),
    prisma.purchase.update({
      where: { id: purchase.id },
      data: { totalAmount: { increment: subtotal } },
    }),
  ]);

  const budgetProgressPct = updatedPurchase.budgetLimit
    ? (updatedPurchase.totalAmount / updatedPurchase.budgetLimit) * 100
    : null;

  res.status(201).json({
    item,
    priceComparison,
    totalAmount: updatedPurchase.totalAmount,
    budgetLimit: updatedPurchase.budgetLimit,
    budgetProgressPct,
  });
});

router.delete("/:id/items/:itemId", async (req: AuthedRequest, res) => {
  const { id, itemId } = req.params;
  const purchase = await prisma.purchase.findFirst({
    where: { id, userId: req.userId },
  });
  if (!purchase) return res.status(404).json({ error: "Compra não encontrada" });
  if (purchase.status !== "open") {
    return res.status(409).json({ error: "Não é possível deletar itens de uma compra finalizada" });
  }

  const item = await prisma.purchaseItem.findUnique({ where: { id: itemId } });
  if (!item || item.purchaseId !== purchase.id) {
    return res.status(404).json({ error: "Item não encontrado" });
  }

  await prisma.$transaction([
    prisma.purchaseItem.delete({ where: { id: itemId } }),
    prisma.purchase.update({
      where: { id },
      data: { totalAmount: { decrement: item.subtotal } },
    }),
  ]);

  const updated = await prisma.purchase.findUnique({
    where: { id },
    include: {
      market: true,
      items: { include: { product: true }, orderBy: { createdAt: "asc" } },
    },
  });
  res.json({ purchase: updated });
});

const updateItemSchema = z.object({
  price: z.number().positive(),
  quantity: z.number().positive(),
});

router.put("/:id/items/:itemId", async (req: AuthedRequest, res) => {
  const { id, itemId } = req.params;
  const parsed = updateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const purchase = await prisma.purchase.findFirst({
    where: { id, userId: req.userId },
  });
  if (!purchase) return res.status(404).json({ error: "Compra não encontrada" });
  if (purchase.status !== "open") {
    return res.status(409).json({ error: "Não é possível alterar itens de uma compra finalizada" });
  }

  const item = await prisma.purchaseItem.findUnique({ where: { id: itemId } });
  if (!item || item.purchaseId !== purchase.id) {
    return res.status(404).json({ error: "Item não encontrado" });
  }

  const { price, quantity } = parsed.data;
  const newSubtotal = price * quantity;
  const diff = newSubtotal - item.subtotal;

  await prisma.$transaction([
    prisma.purchaseItem.update({
      where: { id: itemId },
      data: {
        price,
        quantity,
        subtotal: newSubtotal,
      },
    }),
    prisma.purchase.update({
      where: { id },
      data: { totalAmount: { increment: diff } },
    }),
  ]);

  const updated = await prisma.purchase.findUnique({
    where: { id },
    include: {
      market: true,
      items: { include: { product: true }, orderBy: { createdAt: "asc" } },
    },
  });

  res.json({ purchase: updated });
});

router.post("/:id/complete", async (req: AuthedRequest, res) => {
  const purchase = await prisma.purchase.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!purchase) return res.status(404).json({ error: "Compra não encontrada" });
  if (purchase.status === "completed") {
    return res.status(409).json({ error: "Compra já finalizada" });
  }

  const updated = await prisma.purchase.update({
    where: { id: purchase.id },
    data: { status: "completed", completedAt: new Date() },
  });

  res.json({ purchase: updated });
});

export default router;
