import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requireActiveSubscription } from "../middleware/auth";
import { lookupOpenFoodFacts } from "../services/openfoodfacts";

const router = Router();
router.use(requireAuth);
router.use(requireActiveSubscription);

const lookupSchema = z.object({ barcode: z.string().min(3) });

router.post("/lookup", async (req, res) => {
  const parsed = lookupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Código de barras inválido" });
  }

  const barcode = parsed.data.barcode.trim();

  const existing = await prisma.product.findUnique({ where: { barcode } });
  if (existing) {
    return res.json({ found: true, source: "local", product: existing });
  }

  const off = await lookupOpenFoodFacts(barcode);
  if (off) {
    const created = await prisma.product.create({
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

const manualCreateSchema = z.object({
  barcode: z.string().min(3),
  name: z.string().min(1),
  category: z.string().optional(),
});

router.post("/manual", async (req, res) => {
  const parsed = manualCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const existing = await prisma.product.findUnique({
    where: { barcode: parsed.data.barcode },
  });
  if (existing) return res.json({ product: existing });

  const product = await prisma.product.create({
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
  if (!query) return res.json({ products: [] });

  try {
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: 10,
    });
    res.json({ products });
  } catch (error: any) {
    console.error("Erro na busca de produtos:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
