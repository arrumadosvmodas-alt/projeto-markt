"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const pricing_1 = require("../services/pricing");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use(auth_1.requireActiveSubscription);
const createSchema = zod_1.z.object({
    marketId: zod_1.z.string(),
    budgetLimit: zod_1.z.number().positive().optional(),
    shoppingListId: zod_1.z.string().optional(),
});
router.post("/", async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Dados inválidos" });
    }
    const market = await prisma_1.prisma.market.findUnique({
        where: { id: parsed.data.marketId },
    });
    if (!market)
        return res.status(404).json({ error: "Mercado não encontrado" });
    const purchase = await prisma_1.prisma.purchase.create({
        data: {
            userId: req.userId,
            marketId: market.id,
            budgetLimit: parsed.data.budgetLimit,
            shoppingListId: parsed.data.shoppingListId || null,
        },
    });
    res.status(201).json({ purchase });
});
router.get("/", async (req, res) => {
    const purchases = await prisma_1.prisma.purchase.findMany({
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
            paymentMethod: p.paymentMethod,
            paymentDetails: p.paymentDetails,
        })),
    });
});
router.get("/:id", async (req, res) => {
    const purchase = await prisma_1.prisma.purchase.findFirst({
        where: { id: req.params.id, userId: req.userId },
        include: {
            market: true,
            items: { include: { product: true }, orderBy: { createdAt: "asc" } },
            shoppingListReport: { include: { items: true } },
        },
    });
    if (!purchase)
        return res.status(404).json({ error: "Compra não encontrada" });
    res.json({ purchase });
});
const addItemSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    price: zod_1.z.number().positive(),
    quantity: zod_1.z.number().positive(),
});
router.post("/:id/items", async (req, res) => {
    const parsed = addItemSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Dados inválidos" });
    }
    const purchase = await prisma_1.prisma.purchase.findFirst({
        where: { id: req.params.id, userId: req.userId },
    });
    if (!purchase)
        return res.status(404).json({ error: "Compra não encontrada" });
    if (purchase.status !== "open") {
        return res.status(409).json({ error: "Compra já finalizada" });
    }
    const product = await prisma_1.prisma.product.findUnique({
        where: { id: parsed.data.productId },
    });
    if (!product)
        return res.status(404).json({ error: "Produto não encontrado" });
    const { price, quantity } = parsed.data;
    const subtotal = price * quantity;
    const priceComparison = await (0, pricing_1.comparePriceWithLastPurchase)(prisma_1.prisma, req.userId, product.id, purchase.id, price);
    const [item, updatedPurchase] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.purchaseItem.create({
            data: {
                purchaseId: purchase.id,
                productId: product.id,
                price,
                quantity,
                subtotal,
            },
            include: { product: true },
        }),
        prisma_1.prisma.purchase.update({
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
router.delete("/:id/items/:itemId", async (req, res) => {
    const { id, itemId } = req.params;
    const purchase = await prisma_1.prisma.purchase.findFirst({
        where: { id, userId: req.userId },
    });
    if (!purchase)
        return res.status(404).json({ error: "Compra não encontrada" });
    if (purchase.status !== "open") {
        return res.status(409).json({ error: "Não é possível deletar itens de uma compra finalizada" });
    }
    const item = await prisma_1.prisma.purchaseItem.findUnique({ where: { id: itemId } });
    if (!item || item.purchaseId !== purchase.id) {
        return res.status(404).json({ error: "Item não encontrado" });
    }
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.purchaseItem.delete({ where: { id: itemId } }),
        prisma_1.prisma.purchase.update({
            where: { id },
            data: { totalAmount: { decrement: item.subtotal } },
        }),
    ]);
    const updated = await prisma_1.prisma.purchase.findUnique({
        where: { id },
        include: {
            market: true,
            items: { include: { product: true }, orderBy: { createdAt: "asc" } },
        },
    });
    res.json({ purchase: updated });
});
const updateItemSchema = zod_1.z.object({
    price: zod_1.z.number().positive(),
    quantity: zod_1.z.number().positive(),
});
router.put("/:id/items/:itemId", async (req, res) => {
    const { id, itemId } = req.params;
    const parsed = updateItemSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Dados inválidos" });
    }
    const purchase = await prisma_1.prisma.purchase.findFirst({
        where: { id, userId: req.userId },
    });
    if (!purchase)
        return res.status(404).json({ error: "Compra não encontrada" });
    if (purchase.status !== "open") {
        return res.status(409).json({ error: "Não é possível alterar itens de uma compra finalizada" });
    }
    const item = await prisma_1.prisma.purchaseItem.findUnique({ where: { id: itemId } });
    if (!item || item.purchaseId !== purchase.id) {
        return res.status(404).json({ error: "Item não encontrado" });
    }
    const { price, quantity } = parsed.data;
    const newSubtotal = price * quantity;
    const diff = newSubtotal - item.subtotal;
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.purchaseItem.update({
            where: { id: itemId },
            data: {
                price,
                quantity,
                subtotal: newSubtotal,
            },
        }),
        prisma_1.prisma.purchase.update({
            where: { id },
            data: { totalAmount: { increment: diff } },
        }),
    ]);
    const updated = await prisma_1.prisma.purchase.findUnique({
        where: { id },
        include: {
            market: true,
            items: { include: { product: true }, orderBy: { createdAt: "asc" } },
        },
    });
    res.json({ purchase: updated });
});
const completeSchema = zod_1.z.object({
    paymentMethod: zod_1.z.enum(["a_vista", "credito", "alimentacao", "misto"]),
    paymentDetails: zod_1.z.string().optional(),
    shoppingListReport: zod_1.z.object({
        shoppingListId: zod_1.z.string(),
        name: zod_1.z.string(),
        items: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            status: zod_1.z.enum(["bought", "not_found"]),
        }))
    }).optional()
});
router.post("/:id/complete", async (req, res) => {
    const parsed = completeSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Dados de pagamento inválidos" });
    }
    const purchase = await prisma_1.prisma.purchase.findFirst({
        where: { id: req.params.id, userId: req.userId },
    });
    if (!purchase)
        return res.status(404).json({ error: "Compra não encontrada" });
    if (purchase.status === "completed") {
        return res.status(409).json({ error: "Compra já finalizada" });
    }
    // Se houver um relatório de lista de compras, salva-o
    if (parsed.data.shoppingListReport) {
        const report = parsed.data.shoppingListReport;
        await prisma_1.prisma.purchaseShoppingListReport.create({
            data: {
                purchaseId: purchase.id,
                shoppingListId: report.shoppingListId,
                name: report.name,
                items: {
                    create: report.items.map(item => ({
                        name: item.name,
                        status: item.status
                    }))
                }
            }
        });
    }
    const updated = await prisma_1.prisma.purchase.update({
        where: { id: purchase.id },
        data: {
            status: "completed",
            completedAt: new Date(),
            paymentMethod: parsed.data.paymentMethod,
            paymentDetails: parsed.data.paymentDetails ?? null,
        },
    });
    res.json({ purchase: updated });
});
router.delete("/:id", async (req, res) => {
    try {
        const purchaseId = req.params.id;
        // Primeiro deleta todos os itens da compra para evitar erros de chave estrangeira
        await prisma_1.prisma.purchaseItem.deleteMany({
            where: {
                purchaseId,
                purchase: { userId: req.userId }
            }
        });
        // Depois deleta a compra em si
        await prisma_1.prisma.purchase.delete({
            where: {
                id: purchaseId,
                userId: req.userId
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Erro ao deletar compra:", error);
        res.status(500).json({ error: error.message ?? "Erro ao deletar compra" });
    }
});
exports.default = router;
