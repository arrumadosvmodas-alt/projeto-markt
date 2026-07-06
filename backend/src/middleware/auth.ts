import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

export interface AuthedRequest extends Request {
  userId?: string;
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token ausente" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
    };
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

export async function requireActiveSubscription(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const isExpired = new Date(user.subscriptionEnd) < new Date();
    if (isExpired) {
      return res.status(402).json({ error: "Assinatura expirada. Efetue o pagamento." });
    }

    next();
  } catch (error) {
    console.error("Erro no middleware de assinatura:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
