"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LIST_CATEGORIES = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.use(auth_1.requireActiveSubscription);
exports.DEFAULT_LIST_CATEGORIES = [
    {
        category: "Não Perecíveis",
        items: [
            "Arroz", "Feijão", "Farinha de trigo", "Açúcar", "Sal", "Óleo de cozinha", "Vinagre", "Café", "Chá",
            "Biscoitos e bolachas", "Cereais", "Milho", "Ervilha", "Atum", "Sardinha", "Leite em pó ou longa vida",
            "Achocolatado", "Amido de milho", "Molho de tomate", "Molho inglês", "Molho de soja",
            "Temperos (orégano, pimenta, cominho, etc.)", "Azeitonas", "Palmito", "Farinha de mandioca ou polvilho",
            "Óleo", "Azeite de oliva", "Milho para pipoca", "Fermento em pó", "Aveia", "Farinha de mandioca",
            "Extrato de tomate", "Macarrão", "Queijo ralado", "Bolachas", "Maionese", "Ketchup", "Mostarda",
            "Frios", "Manteiga", "Requeijão", "Geleias ou doces pastosos", "Mel"
        ]
    },
    {
        category: "Produtos Perecíveis",
        items: [
            "Frutas (banana, maçã, laranja, etc.)", "Legumes (cenoura, batata, tomate, cebola, etc.)",
            "Verduras (alface, rúcula, espinafre, etc.)", "Carnes (frango, carne bovina, carne suína, etc.)",
            "Peixes e frutos do mar", "Ovos", "Queijos (mussarela, queijo branco, requeijão, etc.)",
            "Iogurte", "Manteiga ou margarina", "Leite"
        ]
    },
    {
        category: "Produtos de Limpeza",
        items: [
            "Detergente", "Sabão em pó ou líquido", "Desinfetante", "Limpador multiuso", "Esponjas",
            "Panos de limpeza", "Papel toalha", "Papel higiênico", "Sacos de lixo", "Amaciante de roupas", "Água sanitária"
        ]
    },
    {
        category: "Produtos de Higiene",
        items: [
            "Shampoo", "Condicionador", "Sabonete", "Creme dental", "Escova de dentes", "Desodorante",
            "Papel higiênico", "Lenços umedecidos", "Absorventes ou produtos de higiene íntima"
        ]
    }
];
// GET /shopping-lists - List all user custom lists and return default categories list
router.get("/", async (req, res) => {
    try {
        const customLists = await prisma_1.prisma.shoppingList.findMany({
            where: { userId: req.userId },
            include: { items: true },
            orderBy: { createdAt: "desc" }
        });
        res.json({
            defaultList: exports.DEFAULT_LIST_CATEGORIES,
            customLists
        });
    }
    catch (err) {
        res.status(500).json({ error: "Erro ao carregar listas de compras" });
    }
});
// GET /shopping-lists/suggest-price - Get last and lowest price for a product keyword
router.get("/suggest-price", async (req, res) => {
    const name = req.query.name;
    if (!name || name.trim() === "") {
        return res.json({ lastPrice: null, minPrice: null });
    }
    try {
        // 1. Busca produtos que contenham o termo de busca no nome (ex: "Feijão")
        const matchingProducts = await prisma_1.prisma.product.findMany({
            where: {
                name: {
                    contains: name.trim(),
                    mode: "insensitive"
                }
            },
            select: { id: true }
        });
        const productIds = matchingProducts.map(p => p.id);
        if (productIds.length === 0) {
            return res.json({ lastPrice: null, minPrice: null });
        }
        // 2. Busca o histórico de compras desse usuário para esses produtos
        const purchaseItems = await prisma_1.prisma.purchaseItem.findMany({
            where: {
                productId: { in: productIds },
                purchase: { userId: req.userId }
            },
            orderBy: { createdAt: "desc" },
            select: { price: true }
        });
        if (purchaseItems.length === 0) {
            return res.json({ lastPrice: null, minPrice: null });
        }
        const lastPrice = purchaseItems[0].price;
        const minPrice = Math.min(...purchaseItems.map(pi => pi.price));
        res.json({ lastPrice, minPrice });
    }
    catch (err) {
        console.error("Erro ao sugerir preço:", err);
        res.status(500).json({ error: "Erro ao buscar histórico de preços" });
    }
});
const createListSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    items: zod_1.z.array(zod_1.z.string().min(1))
});
// POST /shopping-lists - Create custom list
router.post("/", async (req, res) => {
    const parsed = createListSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Nome e itens são obrigatórios" });
    }
    try {
        const newList = await prisma_1.prisma.shoppingList.create({
            data: {
                userId: req.userId,
                name: parsed.data.name,
                items: {
                    create: parsed.data.items.map(name => ({ name }))
                }
            },
            include: { items: true }
        });
        res.status(201).json({ list: newList });
    }
    catch (err) {
        res.status(500).json({ error: "Erro ao criar lista de compras" });
    }
});
// PUT /shopping-lists/:id - Update custom list items or name
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const parsed = createListSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Nome e itens são obrigatórios" });
    }
    try {
        // Check ownership
        const existing = await prisma_1.prisma.shoppingList.findFirst({
            where: { id, userId: req.userId }
        });
        if (!existing) {
            return res.status(444).json({ error: "Lista não encontrada" });
        }
        // Delete existing items
        await prisma_1.prisma.shoppingListItem.deleteMany({
            where: { shoppingListId: id }
        });
        // Update list details and insert new items
        const updatedList = await prisma_1.prisma.shoppingList.update({
            where: { id },
            data: {
                name: parsed.data.name,
                items: {
                    create: parsed.data.items.map(name => ({ name }))
                }
            },
            include: { items: true }
        });
        res.json({ list: updatedList });
    }
    catch (err) {
        res.status(500).json({ error: "Erro ao atualizar lista de compras" });
    }
});
// DELETE /shopping-lists/:id - Delete custom list
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const existing = await prisma_1.prisma.shoppingList.findFirst({
            where: { id, userId: req.userId }
        });
        if (!existing) {
            return res.status(444).json({ error: "Lista não encontrada" });
        }
        await prisma_1.prisma.shoppingList.delete({ where: { id } });
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: "Erro ao excluir lista de compras" });
    }
});
exports.default = router;
