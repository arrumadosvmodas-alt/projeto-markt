"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../prisma");
const cpf_1 = require("../services/cpf");
const email_1 = require("../services/email");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    cpf: zod_1.z.string(),
    name: zod_1.z.string().min(2),
    password: zod_1.z.string().min(6),
    email: zod_1.z.string().email("E-mail inválido"),
    planType: zod_1.z.enum(["free_trial", "monthly", "yearly"]).optional(),
});
const loginSchema = zod_1.z.object({
    cpf: zod_1.z.string(),
    password: zod_1.z.string(),
});
function signToken(userId) {
    return jsonwebtoken_1.default.sign({ sub: userId }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
}
async function checkAndSerializeUser(user) {
    let activeUser = user;
    const now = new Date();
    if (now > user.subscriptionEnd && user.queuedPlan && user.queuedPlanEnd) {
        activeUser = await prisma_1.prisma.user.update({
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
        email: activeUser.email,
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
        const cpf = (0, cpf_1.normalizeCpf)(parsed.data.cpf);
        if (!(0, cpf_1.isValidCpf)(cpf)) {
            return res.status(400).json({ error: "CPF inválido" });
        }
        const existing = await prisma_1.prisma.user.findUnique({ where: { cpf } });
        if (existing) {
            return res.status(409).json({ error: "CPF já cadastrado" });
        }
        const now = new Date();
        let durationDays = 7;
        if (planType === "monthly")
            durationDays = 30;
        if (planType === "yearly")
            durationDays = 365;
        const subscriptionEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                cpf,
                name,
                passwordHash,
                email: parsed.data.email,
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
    }
    catch (error) {
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
        const cpf = (0, cpf_1.normalizeCpf)(parsed.data.cpf);
        const user = await prisma_1.prisma.user.findUnique({ where: { cpf } });
        if (!user) {
            return res.status(401).json({ error: "CPF ou senha incorretos" });
        }
        const valid = await bcryptjs_1.default.compare(parsed.data.password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: "CPF ou senha incorretos" });
        }
        const token = signToken(user.id);
        const serializedUser = await checkAndSerializeUser(user);
        res.json({ token, user: serializedUser });
    }
    catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: error.message ?? "Erro interno no servidor" });
    }
});
router.get("/me", async (req, res) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token)
        return res.status(401).json({ error: "Token ausente" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user)
            return res.status(404).json({ error: "Usuário não encontrado" });
        const serializedUser = await checkAndSerializeUser(user);
        res.json({ user: serializedUser });
    }
    catch {
        res.status(401).json({ error: "Token inválido ou expirado" });
    }
});
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    avatarUrl: zod_1.z.string().nullable().optional(),
});
router.put("/profile", async (req, res) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token)
        return res.status(401).json({ error: "Token ausente" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const parsed = updateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Dados inválidos" });
        }
        const data = {};
        if (parsed.data.name !== undefined)
            data.name = parsed.data.name;
        if (parsed.data.avatarUrl !== undefined)
            data.avatarUrl = parsed.data.avatarUrl;
        const user = await prisma_1.prisma.user.update({
            where: { id: payload.sub },
            data,
        });
        const serializedUser = await checkAndSerializeUser(user);
        res.json({ user: serializedUser });
    }
    catch (error) {
        res.status(500).json({ error: error.message ?? "Erro ao atualizar perfil" });
    }
});
router.delete("/profile", async (req, res) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token)
        return res.status(401).json({ error: "Token ausente" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userId = payload.sub;
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }
        // Executa a exclusão em lote de todas as informações em uma transação
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.purchaseItem.deleteMany({
                where: { purchase: { userId } }
            }),
            prisma_1.prisma.purchase.deleteMany({
                where: { userId }
            }),
            prisma_1.prisma.walletLimit.deleteMany({
                where: { userId }
            }),
            prisma_1.prisma.market.updateMany({
                where: { createdByUserId: userId },
                data: { createdByUserId: null }
            }),
            prisma_1.prisma.user.delete({
                where: { id: userId }
            })
        ]);
        res.json({ message: "Conta excluída com sucesso" });
    }
    catch (error) {
        console.error("Erro ao excluir conta:", error);
        res.status(500).json({ error: error.message ?? "Erro ao excluir conta" });
    }
});
router.post("/forgot-password", async (req, res) => {
    try {
        const { cpf } = req.body;
        if (!cpf)
            return res.status(400).json({ error: "CPF obrigatório" });
        const normalized = (0, cpf_1.normalizeCpf)(cpf);
        const user = await prisma_1.prisma.user.findUnique({ where: { cpf: normalized } });
        if (!user) {
            return res.status(404).json({ error: "Usuário com este CPF não foi encontrado" });
        }
        if (!user.email) {
            return res.status(400).json({ error: "Este usuário não possui e-mail cadastrado. Entre em contato com o administrador." });
        }
        const token = crypto_1.default.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de validade
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExpires: expires,
            },
        });
        await (0, email_1.sendResetEmail)(user.email, user.name, token);
        res.json({ message: "E-mail de recuperação enviado com sucesso!" });
    }
    catch (error) {
        console.error("Erro no esqueci a senha:", error);
        res.status(500).json({ error: error.message ?? "Erro interno no servidor" });
    }
});
router.post("/reset-password", async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ error: "Token e senha são obrigatórios" });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" });
        }
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpires: { gte: new Date() },
            },
        });
        if (!user) {
            return res.status(400).json({ error: "Token inválido ou expirado" });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpires: null,
            },
        });
        res.json({ message: "Senha redefinida com sucesso! Você já pode entrar." });
    }
    catch (error) {
        console.error("Erro na redefinição de senha:", error);
        res.status(500).json({ error: error.message ?? "Erro interno no servidor" });
    }
});
exports.default = router;
