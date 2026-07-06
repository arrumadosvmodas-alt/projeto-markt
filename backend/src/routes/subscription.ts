import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

const router = Router();

// Middleware to get authenticated user
async function getAuthUser(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token ausente" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    
    // Auto transition expired plan if queued plan exists
    const now = new Date();
    const subEnd = new Date(user.subscriptionEnd);
    if (now.getTime() > subEnd.getTime() && user.queuedPlan && user.queuedPlanEnd) {
      const qPlanEnd = new Date(user.queuedPlanEnd);
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionType: user.queuedPlan,
          subscriptionStart: user.subscriptionEnd,
          subscriptionEnd: user.queuedPlanEnd,
          queuedPlan: null,
          queuedPlanEnd: null,
        },
      });
      req.user = updated;
    } else {
      req.user = user;
    }
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// Create Mercado Pago Preference
router.post("/create-preference", getAuthUser, async (req: any, res) => {
  const { planType } = req.body;
  if (planType !== "monthly" && planType !== "yearly") {
    return res.status(400).json({ error: "Plano inválido" });
  }

  const price = planType === "monthly" ? 9.90 : 99.00;
  const title = planType === "monthly" ? "Plano Markt Mensal" : "Plano Markt Anual";

  const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (mpToken) {
    try {
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mpToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: [
            {
              title,
              quantity: 1,
              unit_price: price,
              currency_id: "BRL"
            }
          ],
          back_urls: {
            success: "markt-app://payment-callback?status=success&plan=" + planType,
            failure: "markt-app://payment-callback?status=failure&plan=" + planType,
            pending: "markt-app://payment-callback?status=pending&plan=" + planType
          },
          auto_return: "approved"
        })
      });
      const data = (await response.json()) as any;
      if (data.init_point) {
        return res.json({ initPoint: data.init_point });
      }
    } catch (err) {
      console.error("Erro ao integrar com Mercado Pago:", err);
    }
  }

  // Fallback simulator URL
  res.json({
    initPoint: `http://localhost/checkout-simulado?plan=${planType}&price=${price}`
  });
});

// Confirm Payment and activate plan
router.post("/confirm-payment", getAuthUser, async (req: any, res) => {
  const { planType } = req.body;
  const user = req.user;

  if (planType !== "monthly" && planType !== "yearly") {
    return res.status(400).json({ error: "Plano inválido" });
  }

  const now = new Date();
  
  // Decide starting point
  const subscriptionEnd = new Date(user.subscriptionEnd);
  const queuedPlanEnd = user.queuedPlanEnd ? new Date(user.queuedPlanEnd) : null;
  const currentMaxEnd = queuedPlanEnd ? queuedPlanEnd : subscriptionEnd;
  const startDate = currentMaxEnd.getTime() > now.getTime() ? currentMaxEnd : now;
  const durationDays = planType === "yearly" ? 365 : 30;
  const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  let updatedUser;

  if (startDate === now) {
    // Starts immediately
    updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionType: planType,
        subscriptionStart: now,
        subscriptionEnd: endDate,
        queuedPlan: null,
        queuedPlanEnd: null
      }
    });
  } else {
    // Queued plan
    updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        queuedPlan: planType,
        queuedPlanEnd: endDate
      }
    });
  }

  res.json({
    message: "Pagamento confirmado e plano ativado!",
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      cpf: updatedUser.cpf,
      avatarUrl: updatedUser.avatarUrl,
      subscriptionType: updatedUser.subscriptionType,
      subscriptionStart: updatedUser.subscriptionStart,
      subscriptionEnd: updatedUser.subscriptionEnd,
      queuedPlan: updatedUser.queuedPlan,
      queuedPlanEnd: updatedUser.queuedPlanEnd
    }
  });
});

export default router;
