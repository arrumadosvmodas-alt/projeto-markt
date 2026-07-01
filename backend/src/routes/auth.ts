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

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const { name, password } = parsed.data;
  const cpf = normalizeCpf(parsed.data.cpf);

  if (!isValidCpf(cpf)) {
    return res.status(400).json({ error: "CPF inválido" });
  }

  const existing = await prisma.user.findUnique({ where: { cpf } });
  if (existing) {
    return res.status(409).json({ error: "CPF já cadastrado" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { cpf, name, passwordHash },
  });

  const token = signToken(user.id);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, cpf: user.cpf },
  });
});

router.post("/login", async (req, res) => {
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
  res.json({ token, user: { id: user.id, name: user.name, cpf: user.cpf } });
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
    res.json({ user: { id: user.id, name: user.name, cpf: user.cpf } });
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
});

export default router;
