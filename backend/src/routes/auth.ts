import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../prisma";
import { isValidCpf, normalizeCpf } from "../services/cpf";

const router = Router();

const registerSchema = z.object({
  cpf: z.string(),
  name: z.string().min(2),
  password: z.string().min(6),
  planType: z.enum(["free_trial", "monthly", "yearly"]).optional(),
});

const loginSchema = z.object({
  cpf: z.string(),
  password: z.string(),
});

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, {
    expiresIn: "30d",
  });
}

async function checkAndSerializeUser(user: any) {
  let activeUser = user;
  const now = new Date();
  if (now > user.subscriptionEnd && user.queuedPlan && user.queuedPlanEnd) {
    activeUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionType: user.queuedPlan,
        subscriptionStart: user.subscriptionEnd,
        subscriptionEnd: user.queuedPlanEnd,
        queuedPlan: null,
        queuedPlanEnd: null,
      },
    });
  }

  return {
    id: activeUser.id,
    name: activeUser.name,
    cpf: activeUser.cpf,
    avatarUrl: activeUser.avatarUrl,
    subscriptionType: activeUser.subscriptionType,
    subscriptionStart: activeUser.subscriptionStart,
    subscriptionEnd: activeUser.subscriptionEnd,
    queuedPlan: activeUser.queuedPlan,
    queuedPlanEnd: activeUser.queuedPlanEnd,
  };
}

router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const { name, password, planType = "free_trial" } = parsed.data;
    const cpf = normalizeCpf(parsed.data.cpf);

    if (!isValidCpf(cpf)) {
      return res.status(400).json({ error: "CPF inválido" });
    }

    const existing = await prisma.user.findUnique({ where: { cpf } });
    if (existing) {
      return res.status(409).json({ error: "CPF já cadastrado" });
    }

    const now = new Date();
    let durationDays = 7;
    if (planType === "monthly") durationDays = 30;
    if (planType === "yearly") durationDays = 365;
    const subscriptionEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        cpf,
        name,
        passwordHash,
        subscriptionType: planType,
        subscriptionStart: now,
        subscriptionEnd,
      },
    });

    const token = signToken(user.id);
    const serializedUser = await checkAndSerializeUser(user);
    res.status(201).json({
      token,
      user: serializedUser,
    });
  } catch (error: any) {
    console.error("Erro no registro:", error);
    res.status(500).json({ error: error.message ?? "Erro interno no servidor" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const cpf = normalizeCpf(parsed.data.cpf);
    const user = await prisma.user.findUnique({ where: { cpf } });
    if (!user) {
      return res.status(401).json({ error: "CPF ou senha incorretos" });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "CPF ou senha incorretos" });
    }

    const token = signToken(user.id);
    const serializedUser = await checkAndSerializeUser(user);
    res.json({ token, user: serializedUser });
  } catch (error: any) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: error.message ?? "Erro interno no servidor" });
  }
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token ausente" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
    };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const serializedUser = await checkAndSerializeUser(user);
    res.json({ user: serializedUser });
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().nullable().optional(),
});

router.put("/profile", async (req, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token ausente" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
    };
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const data: any = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.avatarUrl !== undefined) data.avatarUrl = parsed.data.avatarUrl;

    const user = await prisma.user.update({
      where: { id: payload.sub },
      data,
    });

    const serializedUser = await checkAndSerializeUser(user);
    res.json({ user: serializedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message ?? "Erro ao atualizar perfil" });
  }
});

router.delete("/profile", async (req, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token ausente" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
    };
    const userId = payload.sub;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Executa a exclusão em lote de todas as informações em uma transação
    await prisma.$transaction([
      prisma.purchaseItem.deleteMany({
        where: { purchase: { userId } }
      }),
      prisma.purchase.deleteMany({
        where: { userId }
      }),
      prisma.walletLimit.deleteMany({
        where: { userId }
      }),
      prisma.market.updateMany({
        where: { createdByUserId: userId },
        data: { createdByUserId: null }
      }),
      prisma.user.delete({
        where: { id: userId }
      })
    ]);

    res.json({ message: "Conta excluída com sucesso" });
  } catch (error: any) {
    console.error("Erro ao excluir conta:", error);
    res.status(500).json({ error: error.message ?? "Erro ao excluir conta" });
  }
});

export default router;
