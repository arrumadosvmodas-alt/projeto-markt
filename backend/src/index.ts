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

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});
