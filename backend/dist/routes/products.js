"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const openfoodfacts_1 = require("../services/openfoodfacts");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use(auth_1.requireActiveSubscription);
const lookupSchema = zod_1.z.object({ barcode: zod_1.z.string().min(3) });
router.post("/lookup", async (req, res) => {
    const parsed = lookupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Código de barras inválido" });
    }
    const barcode = parsed.data.barcode.trim();
    const existing = await prisma_1.prisma.product.findUnique({ where: { barcode } });
    if (existing) {
        return res.json({ found: true, source: "local", product: existing });
    }
    const off = await (0, openfoodfacts_1.lookupOpenFoodFacts)(barcode);
    if (off) {
        const created = await prisma_1.prisma.product.create({
            data: {
                barcode,
                name: off.name,
                brand: off.brand,
                category: off.category,
                imageUrl: off.imageUrl,
                source: "openfoodfacts",
            },
        });
        return res.json({ found: true, source: "openfoodfacts", product: created });
    }
    res.json({ found: false, barcode });
});
const manualCreateSchema = zod_1.z.object({
    barcode: zod_1.z.string().min(3),
    name: zod_1.z.string().min(1),
    category: zod_1.z.string().optional(),
});
router.post("/manual", async (req, res) => {
    const parsed = manualCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Dados inválidos" });
    }
    const existing = await prisma_1.prisma.product.findUnique({
        where: { barcode: parsed.data.barcode },
    });
    if (existing)
        return res.json({ product: existing });
    const product = await prisma_1.prisma.product.create({
        data: {
            barcode: parsed.data.barcode,
            name: parsed.data.name,
            category: parsed.data.category ?? null,
            source: "manual",
        },
    });
    res.status(201).json({ product });
});
router.get("/search", async (req, res) => {
    const query = req.query.q ? String(req.query.q).trim() : "";
    if (!query)
        return res.json({ products: [] });
    try {
        const products = await prisma_1.prisma.product.findMany({
            where: {
                name: {
                    contains: query,
                    mode: "insensitive",
                },
            },
            take: 10,
        });
        res.json({ products });
    }
    catch (error) {
        console.error("Erro na busca de produtos:", error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
