"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// Middleware to get authenticated user (same as subscription)
async function getAuthUser(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token)
        return res.status(401).json({ error: "Token ausente" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user)
            return res.status(404).json({ error: "Usuário não encontrado" });
        req.user = user;
        next();
    }
    catch {
        res.status(401).json({ error: "Token inválido ou expirado" });
    }
}
// Helper: Calculate cycle dates based on cycleDay
function getCycleDates(cycleDay, date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    let startYear = year;
    let startMonth = month;
    if (date.getDate() < cycleDay) {
        startMonth = month - 1;
        if (startMonth < 0) {
            startMonth = 11;
            startYear = year - 1;
        }
    }
    const startDate = new Date(startYear, startMonth, cycleDay, 0, 0, 0, 0);
    let endYear = startYear;
    let endMonth = startMonth + 1;
    if (endMonth > 11) {
        endMonth = 0;
        endYear = startYear + 1;
    }
    const endDate = new Date(endYear, endMonth, cycleDay, 0, 0, 0, 0);
    return { startDate, endDate };
}
// Helper: Aggregate expenses for a user in a given date range
async function getExpensesForPeriod(userId, startDate, endDate) {
    const purchases = await prisma_1.prisma.purchase.findMany({
        where: {
            userId,
            status: "completed",
            completedAt: {
                gte: startDate,
                lt: endDate,
            },
        },
    });
    let debito = 0;
    let credito = 0;
    let alimentacao = 0;
    let outros = 0;
    for (const purchase of purchases) {
        if (purchase.paymentMethod === "a_vista") {
            debito += purchase.totalAmount;
        }
        else if (purchase.paymentMethod === "credito") {
            credito += purchase.totalAmount;
        }
        else if (purchase.paymentMethod === "alimentacao") {
            alimentacao += purchase.totalAmount;
        }
        else if (purchase.paymentMethod === "misto") {
            try {
                const details = JSON.parse(purchase.paymentDetails || "{}");
                const dVal = Number(details.a_vista) || 0;
                const cVal = Number(details.credito) || 0;
                const aVal = Number(details.alimentacao) || 0;
                debito += dVal;
                credito += cVal;
                alimentacao += aVal;
                // Se a soma for menor que o total da compra (excedente ou erro de arredondamento)
                const diff = purchase.totalAmount - (dVal + cVal + aVal);
                if (diff > 0.01) {
                    outros += diff;
                }
            }
            catch {
                outros += purchase.totalAmount;
            }
        }
        else {
            outros += purchase.totalAmount;
        }
    }
    return { debito, credito, alimentacao, outros, total: debito + credito + alimentacao + outros };
}
// GET /wallet/status
router.get("/status", getAuthUser, async (req, res) => {
    const user = req.user;
    const now = new Date();
    const { startDate, endDate } = getCycleDates(user.walletCycleDay, now);
    // Find WalletLimit for current cycle
    const activeLimit = await prisma_1.prisma.walletLimit.findFirst({
        where: {
            userId: user.id,
            cycleStartDate: startDate,
        },
    });
    if (!activeLimit) {
        // Check if we need to prompt the user
        // If walletLastPrompted is null or before the start of the current cycle, we should prompt
        const shouldPrompt = !user.walletLastPrompted || new Date(user.walletLastPrompted) < startDate;
        return res.json({ configured: false, shouldPrompt, cycleStartDate: startDate, cycleEndDate: endDate });
    }
    // Calculate actual expenses for this cycle
    const expenses = await getExpensesForPeriod(user.id, startDate, endDate);
    // Calculate stats per category
    const categories = [
        {
            id: "debito",
            label: "Débito / Dinheiro",
            limit: activeLimit.limitDebito,
            spent: expenses.debito,
            remaining: Math.max(0, activeLimit.limitDebito - expenses.debito),
            exceeded: expenses.debito > activeLimit.limitDebito ? expenses.debito - activeLimit.limitDebito : 0,
        },
        {
            id: "credito",
            label: "Crédito",
            limit: activeLimit.limitCredito,
            spent: expenses.credito,
            remaining: Math.max(0, activeLimit.limitCredito - expenses.credito),
            exceeded: expenses.credito > activeLimit.limitCredito ? expenses.credito - activeLimit.limitCredito : 0,
        },
        {
            id: "alimentacao",
            label: "Alimentação",
            limit: activeLimit.limitAlimentacao,
            spent: expenses.alimentacao,
            remaining: Math.max(0, activeLimit.limitAlimentacao - expenses.alimentacao),
            exceeded: expenses.alimentacao > activeLimit.limitAlimentacao ? expenses.alimentacao - activeLimit.limitAlimentacao : 0,
        },
        {
            id: "outros",
            label: "Outros / Misto",
            limit: activeLimit.limitOutros,
            spent: expenses.outros,
            remaining: Math.max(0, activeLimit.limitOutros - expenses.outros),
            exceeded: expenses.outros > activeLimit.limitOutros ? expenses.outros - activeLimit.limitOutros : 0,
        },
    ];
    // Calculate MoM variation
    // Find the previous cycle's limits and expenses
    const prevCycleStart = new Date(startDate);
    prevCycleStart.setMonth(prevCycleStart.getMonth() - 1);
    const { startDate: prevStart, endDate: prevEnd } = getCycleDates(user.walletCycleDay, prevCycleStart);
    const prevExpenses = await getExpensesForPeriod(user.id, prevStart, prevEnd);
    let momVariation = 0;
    if (prevExpenses.total > 0) {
        momVariation = ((expenses.total - prevExpenses.total) / prevExpenses.total) * 100;
    }
    // Find top expensive products in current cycle (vilões de consumo)
    const items = await prisma_1.prisma.purchaseItem.findMany({
        where: {
            purchase: {
                userId: user.id,
                status: "completed",
                completedAt: {
                    gte: startDate,
                    lt: endDate,
                },
            },
        },
        include: {
            product: true,
        },
    });
    const productAggregates = {};
    for (const item of items) {
        if (!productAggregates[item.productId]) {
            productAggregates[item.productId] = { name: item.product.name, amount: 0 };
        }
        productAggregates[item.productId].amount += item.subtotal;
    }
    const topProducts = Object.values(productAggregates)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);
    // Recommendations and alerts
    const totalLimit = activeLimit.limitDebito + activeLimit.limitCredito + activeLimit.limitAlimentacao + activeLimit.limitOutros;
    const totalSpent = expenses.total;
    const spentPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
    let advice = "Seu ritmo de consumo está ótimo! Continue acompanhando os seus limites.";
    if (spentPercent > 100) {
        advice = "⚠️ Você já ultrapassou o orçamento consolidado definido para este mês. Tente frear compras supérfluas.";
    }
    else if (spentPercent > 85) {
        advice = "⚠️ Orçamento consolidado acima de 85%. Recomendamos evitar novas compras parceladas ou não essenciais.";
    }
    else {
        // Check if any individual category exceeded
        const exceededCat = categories.find((c) => c.spent > c.limit && c.limit > 0);
        if (exceededCat) {
            advice = `⚠️ Você estourou o limite da categoria ${exceededCat.label}. Tente compensar economizando nas outras carteiras.`;
        }
    }
    res.json({
        configured: true,
        cycleStartDate: startDate,
        cycleEndDate: endDate,
        walletCycleDay: user.walletCycleDay,
        totalLimit,
        totalSpent,
        spentPercent,
        momVariation,
        categories,
        topProducts,
        advice,
    });
});
// POST /wallet/limits
router.post("/limits", getAuthUser, async (req, res) => {
    const user = req.user;
    const { limitDebito, limitCredito, limitAlimentacao, limitOutros, cycleDay } = req.body;
    const cDay = Number(cycleDay) || user.walletCycleDay || 5;
    const now = new Date();
    // Update cycleDay on User
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: {
            walletCycleDay: cDay,
            walletLastPrompted: now
        },
    });
    const { startDate, endDate } = getCycleDates(cDay, now);
    // Verify if there was a previous cycle to calculate rollover sobra
    const prevCycleStart = new Date(startDate);
    prevCycleStart.setMonth(prevCycleStart.getMonth() - 1);
    const { startDate: prevStart, endDate: prevEnd } = getCycleDates(cDay, prevCycleStart);
    const prevLimit = await prisma_1.prisma.walletLimit.findFirst({
        where: {
            userId: user.id,
            cycleStartDate: prevStart,
        },
    });
    let rollDebito = 0;
    let rollCredito = 0;
    let rollAlimentacao = 0;
    let rollOutros = 0;
    if (prevLimit) {
        const prevExpenses = await getExpensesForPeriod(user.id, prevStart, prevEnd);
        // Sobras são acumuladas apenas se sobra > 0 (não pune estouros)
        rollDebito = Math.max(0, prevLimit.limitDebito - prevExpenses.debito);
        rollCredito = Math.max(0, prevLimit.limitCredito - prevExpenses.credito);
        rollAlimentacao = Math.max(0, prevLimit.limitAlimentacao - prevExpenses.alimentacao);
        rollOutros = Math.max(0, prevLimit.limitOutros - prevExpenses.outros);
    }
    const finalDebito = (Number(limitDebito) || 0) + rollDebito;
    const finalCredito = (Number(limitCredito) || 0) + rollCredito;
    const finalAlimentacao = (Number(limitAlimentacao) || 0) + rollAlimentacao;
    const finalOutros = (Number(limitOutros) || 0) + rollOutros;
    // Find or create limits record for this cycle
    const existing = await prisma_1.prisma.walletLimit.findFirst({
        where: {
            userId: user.id,
            cycleStartDate: startDate,
        },
    });
    let walletLimit;
    if (existing) {
        walletLimit = await prisma_1.prisma.walletLimit.update({
            where: { id: existing.id },
            data: {
                limitDebito: finalDebito,
                limitCredito: finalCredito,
                limitAlimentacao: finalAlimentacao,
                limitOutros: finalOutros,
            },
        });
    }
    else {
        walletLimit = await prisma_1.prisma.walletLimit.create({
            data: {
                userId: user.id,
                cycleStartDate: startDate,
                cycleEndDate: endDate,
                limitDebito: finalDebito,
                limitCredito: finalCredito,
                limitAlimentacao: finalAlimentacao,
                limitOutros: finalOutros,
            },
        });
    }
    res.json({
        message: "Limites de carteira atualizados com sucesso!",
        walletLimit,
    });
});
// GET /wallet/history
router.get("/history", getAuthUser, async (req, res) => {
    const user = req.user;
    // Get last 6 cycle records
    const limits = await prisma_1.prisma.walletLimit.findMany({
        where: { userId: user.id },
        orderBy: { cycleStartDate: "desc" },
        take: 6,
    });
    // Reverse to chronological order
    limits.reverse();
    const history = [];
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    for (const limit of limits) {
        const expenses = await getExpensesForPeriod(user.id, limit.cycleStartDate, limit.cycleEndDate);
        const totalLimit = limit.limitDebito + limit.limitCredito + limit.limitAlimentacao + limit.limitOutros;
        // Label as Month Year (e.g. Jul 2026)
        const monthIndex = limit.cycleStartDate.getMonth();
        const label = `${monthNames[monthIndex]} ${limit.cycleStartDate.getFullYear().toString().slice(-2)}`;
        history.push({
            label,
            credito: totalLimit, // estimated budget (incoming credit)
            debito: expenses.total, // actual spent (debit)
        });
    }
    res.json({ history });
});
exports.default = router;
