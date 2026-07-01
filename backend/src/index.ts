import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import marketRoutes from "./routes/markets";
import purchaseRoutes from "./routes/purchases";
import productRoutes from "./routes/products";
import analyticsRoutes from "./routes/analytics";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não definido. Copie .env.example para .env");
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/markets", marketRoutes);
app.use("/purchases", purchaseRoutes);
app.use("/products", productRoutes);
app.use("/analytics", analyticsRoutes);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});
