"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const auth_1 = __importDefault(require("./routes/auth"));
const markets_1 = __importDefault(require("./routes/markets"));
const purchases_1 = __importDefault(require("./routes/purchases"));
const products_1 = __importDefault(require("./routes/products"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const subscription_1 = __importDefault(require("./routes/subscription"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const admin_1 = __importDefault(require("./routes/admin"));
const shopping_lists_1 = __importDefault(require("./routes/shopping-lists"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("./prisma");
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não definido. Copie .env.example para .env");
}
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Limitação de requisições nas rotas de autenticação (cadastro/login)
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 requisições por IP
    message: { error: "Muitas tentativas de login ou cadastro. Tente novamente mais tarde." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authLimiter, auth_1.default);
app.use("/markets", markets_1.default);
app.use("/purchases", purchases_1.default);
app.use("/products", products_1.default);
app.use("/analytics", analytics_1.default);
app.use("/subscription", subscription_1.default);
app.use("/wallet", wallet_1.default);
app.use("/admin", admin_1.default);
app.use("/shopping-lists", shopping_lists_1.default);
async function ensureAdminUser() {
    try {
        const adminCpf = "00000000000";
        const existing = await prisma_1.prisma.user.findUnique({
            where: { cpf: adminCpf },
        });
        if (!existing) {
            const hash = await bcryptjs_1.default.hash("admin123", 10);
            await prisma_1.prisma.user.create({
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
        const existingHeitor = await prisma_1.prisma.user.findUnique({ where: { cpf: heitorCpf } });
        if (!existingHeitor) {
            const heitorHash = await bcryptjs_1.default.hash("16Ta15Ti@", 10);
            await prisma_1.prisma.user.create({
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
        }
        else {
            // Apenas renova a assinatura, sem alterar senha ou outros dados
            await prisma_1.prisma.user.update({
                where: { cpf: heitorCpf },
                data: {
                    subscriptionType: "yearly",
                    subscriptionEnd: new Date("2099-12-31T23:59:59Z"),
                },
            });
            console.log("Heitor's subscription renewed.");
        }
    }
    catch (err) {
        console.error("Error in ensureAdminUser:", err);
    }
}
// Garante usuários padrão ao iniciar
ensureAdminUser();
const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
    console.log(`Backend rodando em http://localhost:${port}`);
});
