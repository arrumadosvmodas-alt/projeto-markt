import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireActiveSubscription, AuthedRequest } from "../middleware/auth";
import { findNearbyMarkets } from "../services/overpass";

const router = Router();
router.use(requireAuth);
router.use(requireActiveSubscription);

router.get("/nearby", async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = req.query.radius ? Number(req.query.radius) : 2000;

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: "lat e lng são obrigatórios" });
  }

  try {
    const markets = await findNearbyMarkets(lat, lng, radius);
    res.json({ markets });
  } catch {
    res
      .status(502)
      .json({ error: "Não foi possível buscar mercados próximos agora" });
  }
});

const manualSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

router.post("/manual", async (req: AuthedRequest, res) => {
  const parsed = manualSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const existing = await prisma.market.findFirst({
    where: {
      source: "manual",
      createdByUserId: req.userId,
      name: { equals: parsed.data.name },
    },
  });
  if (existing) return res.json({ market: existing });

  const market = await prisma.market.create({
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

const fromOsmSchema = z.object({
  externalId: z.string(),
  name: z.string(),
  address: z.string().nullable().optional(),
  lat: z.number(),
  lng: z.number(),
});

router.post("/from-osm", async (req, res) => {
  const parsed = fromOsmSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const existing = await prisma.market.findFirst({
    where: { source: "osm", externalId: parsed.data.externalId },
  });
  if (existing) return res.json({ market: existing });

  const market = await prisma.market.create({
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

router.get("/mine", async (req: AuthedRequest, res) => {
  const markets = await prisma.market.findMany({
    where: { source: "manual", createdByUserId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ markets });
});

export default router;
