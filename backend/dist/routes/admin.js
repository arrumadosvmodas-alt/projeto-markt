"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// Middleware to authorize admin only
async function requireAdmin(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token)
        return res.status(401).json({ error: "Token ausente" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user)
            return res.status(404).json({ error: "Usuário não encontrado" });
        const isAdmin = user.cpf === "02129401473" || user.cpf === "00000000000";
        if (!isAdmin) {
            return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
        }
        req.user = user;
        next();
    }
    catch {
        res.status(401).json({ error: "Token inválido ou expirado" });
    }
}
// GET /admin/users - List all users
router.get("/users", requireAdmin, async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
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
    }
    catch (err) {
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
        const updated = await prisma_1.prisma.user.update({
            where: { id },
            data: {
                subscriptionType,
                subscriptionEnd: new Date(subscriptionEnd),
            },
        });
        res.json({ user: updated });
    }
    catch (err) {
        res.status(500).json({ error: "Erro ao atualizar assinatura do usuário" });
    }
});
exports.default = router;
