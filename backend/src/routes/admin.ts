import { Router } from "express";
import { prisma } from "../prisma";
import jwt from "jsonwebtoken";

const router = Router();

// Middleware to authorize admin only
async function requireAdmin(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token ausente" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const isAdmin = user.cpf === "02129401473" || user.cpf === "00000000000";
    if (!isAdmin) {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// GET /admin/users - List all users
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        cpf: true,
        name: true,
        createdAt: true,
        subscriptionType: true,
        subscriptionStart: true,
        subscriptionEnd: true,
      },
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// PUT /admin/users/:id/subscription - Adjust user subscription type and date
router.put("/users/:id/subscription", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { subscriptionType, subscriptionEnd } = req.body;

  if (!subscriptionType || !subscriptionEnd) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        subscriptionType,
        subscriptionEnd: new Date(subscriptionEnd),
      },
    });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar assinatura do usuário" });
  }
});

export default router;
