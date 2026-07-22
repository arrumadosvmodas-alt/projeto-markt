import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./routes/auth";
import marketRoutes from "./routes/markets";
import purchaseRoutes from "./routes/purchases";
import productRoutes from "./routes/products";
import analyticsRoutes from "./routes/analytics";
import subscriptionRoutes from "./routes/subscription";
import walletRoutes from "./routes/wallet";
import adminRoutes from "./routes/admin";
import shoppingListRoutes from "./routes/shopping-lists";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não definido. Copie .env.example para .env");
}

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Limitação de requisições nas rotas de autenticação (cadastro/login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 requisições por IP
  message: { error: "Muitas tentativas de login ou cadastro. Tente novamente mais tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authLimiter, authRoutes);
app.use("/markets", marketRoutes);
app.use("/purchases", purchaseRoutes);
app.use("/products", productRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/subscription", subscriptionRoutes);
app.use("/wallet", walletRoutes);
app.use("/admin", adminRoutes);
app.use("/shopping-lists", shoppingListRoutes);

async function ensureAdminUser() {
  try {
    const adminCpf = "00000000000";
    const existing = await prisma.user.findUnique({
      where: { cpf: adminCpf },
    });
    if (!existing) {
      const hash = await bcrypt.hash("admin123", 10);
      await prisma.user.create({
        data: {
          cpf: adminCpf,
          name: "Admin",
          passwordHash: hash,
          subscriptionType: "yearly",
          subscriptionStart: new Date(),
          subscriptionEnd: new Date("2099-12-31T23:59:59Z"),
        },
      });
      console.log("Admin user (000.000.000-00) created successfully with password 'admin123'.");
    }

    // Garante que o usuário Heitor existe com assinatura correta
    const heitorCpf = "02129401473";
    const existingHeitor = await prisma.user.findUnique({ where: { cpf: heitorCpf } });
    if (!existingHeitor) {
      const heitorHash = await bcrypt.hash("16Ta15Ti@", 10);
      await prisma.user.create({
        data: {
          cpf: heitorCpf,
          name: "Heitor Silvio Lins dos Santos",
          passwordHash: heitorHash,
          subscriptionType: "yearly",
          subscriptionStart: new Date(),
          subscriptionEnd: new Date("2099-12-31T23:59:59Z"),
        },
      });
      console.log("Heitor's account created.");
    } else {
      // Apenas renova a assinatura, sem alterar senha ou outros dados
      await prisma.user.update({
        where: { cpf: heitorCpf },
        data: {
          subscriptionType: "yearly",
          subscriptionEnd: new Date("2099-12-31T23:59:59Z"),
        },
      });
      console.log("Heitor's subscription renewed.");
    }

    // Garante apenas a assinatura ativa de Cybelle, sem alterar a senha dela caso já exista
    const cybelleCpf = "64290840434";
    const cybelle = await prisma.user.findUnique({ where: { cpf: cybelleCpf } });
    
    if (cybelle) {
      await prisma.user.update({
        where: { cpf: cybelleCpf },
        data: {
          subscriptionType: "monthly",
          subscriptionEnd: new Date("2026-08-20T02:59:59.000Z")
        }
      });
      console.log("[DEBUG] Acesso de Cybelle garantido. Assinatura ativa atualizada.");
    } else {
      console.log("[DEBUG] Cybelle NÃO existe no Railway! Criando conta...");
      const defaultHash = await bcrypt.hash("16Ta15Ti@", 10);
      await prisma.user.create({
        data: {
          cpf: cybelleCpf,
          name: "Cybelle Regina Lins dos Santos",
          passwordHash: defaultHash,
          email: "cybellelsantos@gmail.com",
          subscriptionType: "monthly",
          subscriptionStart: new Date(),
          subscriptionEnd: new Date("2026-08-20T02:59:59.000Z")
        }
      });
      console.log("[DEBUG] Conta da Cybelle criada com a senha inicial '16Ta15Ti@'.");
    }
  } catch (err) {
    console.error("Error in ensureAdminUser:", err);
  }
}

// Garante usuários padrão ao iniciar
ensureAdminUser();

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});
