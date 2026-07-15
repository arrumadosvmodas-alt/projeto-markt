"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const overpass_1 = require("../services/overpass");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use(auth_1.requireActiveSubscription);
router.get("/nearby", async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = req.query.radius ? Number(req.query.radius) : 2000;
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({ error: "lat e lng são obrigatórios" });
    }
    try {
        const markets = await (0, overpass_1.findNearbyMarkets)(lat, lng, radius);
        res.json({ markets });
    }
    catch {
        res
            .status(502)
            .json({ error: "Não foi possível buscar mercados próximos agora" });
    }
});
const manualSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    address: zod_1.z.string().optional(),
    lat: zod_1.z.number().optional(),
    lng: zod_1.z.number().optional(),
});
router.post("/manual", async (req, res) => {
    const parsed = manualSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Dados inválidos" });
    }
    const existing = await prisma_1.prisma.market.findFirst({
        where: {
            source: "manual",
            createdByUserId: req.userId,
            name: { equals: parsed.data.name },
        },
    });
    if (existing)
        return res.json({ market: existing });
    const market = await prisma_1.prisma.market.create({
        data: {
            name: parsed.data.name,
            address: parsed.data.address ?? null,
            lat: parsed.data.lat ?? null,
            lng: parsed.data.lng ?? null,
            source: "manual",
            createdByUserId: req.userId,
        },
    });
    res.status(201).json({ market });
});
const fromOsmSchema = zod_1.z.object({
    externalId: zod_1.z.string(),
    name: zod_1.z.string(),
    address: zod_1.z.string().nullable().optional(),
    lat: zod_1.z.number(),
    lng: zod_1.z.number(),
});
router.post("/from-osm", async (req, res) => {
    const parsed = fromOsmSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Dados inválidos" });
    }
    const existing = await prisma_1.prisma.market.findFirst({
        where: { source: "osm", externalId: parsed.data.externalId },
    });
    if (existing)
        return res.json({ market: existing });
    const market = await prisma_1.prisma.market.create({
        data: {
            name: parsed.data.name,
            address: parsed.data.address ?? null,
            lat: parsed.data.lat,
            lng: parsed.data.lng,
            source: "osm",
            externalId: parsed.data.externalId,
        },
    });
    res.status(201).json({ market });
});
router.get("/mine", async (req, res) => {
    const markets = await prisma_1.prisma.market.findMany({
        where: { source: "manual", createdByUserId: req.userId },
        orderBy: { createdAt: "desc" },
    });
    res.json({ markets });
});
const updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
});
router.put("/:id", async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Nome inválido" });
    }
    const market = await prisma_1.prisma.market.findUnique({
        where: { id: req.params.id },
    });
    if (!market)
        return res.status(404).json({ error: "Estabelecimento não encontrado" });
    const updated = await prisma_1.prisma.market.update({
        where: { id: req.params.id },
        data: { name: parsed.data.name },
    });
    res.json({ market: updated });
});
exports.default = router;
