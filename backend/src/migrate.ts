import { Client } from "pg";

/**
 * Migra todos os dados do banco Render → Railway.
 * Executado automaticamente na inicialização quando RENDER_DATABASE_URL estiver definido.
 */
export async function migrateFromRender(sourceUrl: string, targetUrl: string) {
  console.log("[MIGRATION] Iniciando migração Render → Railway...");

  const source = new Client({ connectionString: sourceUrl, ssl: { rejectUnauthorized: false } });
  const target = new Client({ connectionString: targetUrl });

  try {
    await source.connect();
    await target.connect();
    console.log("[MIGRATION] Conectado aos dois bancos.");

    // ── 1. Usuários ──────────────────────────────────────────────────────────
    const { rows: users } = await source.query("SELECT * FROM \"User\"");
    console.log(`[MIGRATION] ${users.length} usuários encontrados.`);
    for (const u of users) {
      // Remove qualquer usuário no destino que tenha o mesmo CPF mas ID diferente (ex: admin/heitor gerados no startup)
      await target.query(`DELETE FROM "User" WHERE cpf = $1 AND id != $2`, [u.cpf, u.id]);

      await target.query(
        `INSERT INTO "User" (
          id, cpf, "passwordHash", name, email, "resetToken", "resetTokenExpires",
          "createdAt", "avatarUrl", "subscriptionType", "subscriptionStart",
          "subscriptionEnd", "queuedPlan", "queuedPlanEnd",
          "walletCycleDay", "walletLastPrompted"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        ON CONFLICT (id) DO UPDATE SET
          "passwordHash" = EXCLUDED."passwordHash",
          "subscriptionType" = EXCLUDED."subscriptionType",
          "subscriptionEnd" = EXCLUDED."subscriptionEnd",
          "avatarUrl" = EXCLUDED."avatarUrl",
          email = EXCLUDED.email`,
        [
          u.id, u.cpf, u.passwordHash, u.name, u.email,
          u.resetToken, u.resetTokenExpires, u.createdAt,
          u.avatarUrl, u.subscriptionType, u.subscriptionStart,
          u.subscriptionEnd, u.queuedPlan, u.queuedPlanEnd,
          u.walletCycleDay ?? 5, u.walletLastPrompted,
        ]
      );
    }
    console.log("[MIGRATION] ✅ Usuários migrados.");

    // ── 2. Mercados ──────────────────────────────────────────────────────────
    const { rows: markets } = await source.query("SELECT * FROM \"Market\"");
    console.log(`[MIGRATION] ${markets.length} mercados encontrados.`);
    for (const m of markets) {
      await target.query(
        `INSERT INTO "Market" (id, name, address, lat, lng, source, "externalId", "createdByUserId", "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO NOTHING`,
        [m.id, m.name, m.address, m.lat, m.lng, m.source, m.externalId, m.createdByUserId, m.createdAt]
      );
    }
    console.log("[MIGRATION] ✅ Mercados migrados.");

    // ── 3. Produtos ──────────────────────────────────────────────────────────
    const { rows: products } = await source.query("SELECT * FROM \"Product\"");
    console.log(`[MIGRATION] ${products.length} produtos encontrados.`);
    for (const p of products) {
      await target.query(
        `INSERT INTO "Product" (id, barcode, name, brand, category, "imageUrl", source, "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        [p.id, p.barcode, p.name, p.brand, p.category, p.imageUrl, p.source, p.createdAt]
      );
    }
    console.log("[MIGRATION] ✅ Produtos migrados.");

    // ── 4. Compras ───────────────────────────────────────────────────────────
    const { rows: purchases } = await source.query("SELECT * FROM \"Purchase\"");
    console.log(`[MIGRATION] ${purchases.length} compras encontradas.`);
    for (const p of purchases) {
      await target.query(
        `INSERT INTO "Purchase" (
          id, "userId", "marketId", "budgetLimit", status, "totalAmount",
          "startedAt", "completedAt", "paymentMethod", "paymentDetails"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO NOTHING`,
        [
          p.id, p.userId, p.marketId, p.budgetLimit, p.status,
          p.totalAmount, p.startedAt, p.completedAt, p.paymentMethod, p.paymentDetails,
        ]
      );
    }
    console.log("[MIGRATION] ✅ Compras migradas.");

    // ── 5. Itens de Compra ───────────────────────────────────────────────────
    const { rows: items } = await source.query("SELECT * FROM \"PurchaseItem\"");
    console.log(`[MIGRATION] ${items.length} itens encontrados.`);
    for (const i of items) {
      await target.query(
        `INSERT INTO "PurchaseItem" (id, "purchaseId", "productId", price, quantity, subtotal, "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        [i.id, i.purchaseId, i.productId, i.price, i.quantity, i.subtotal, i.createdAt]
      );
    }
    console.log("[MIGRATION] ✅ Itens de compra migrados.");

    // ── 6. Limites de Carteira ───────────────────────────────────────────────
    const { rows: limits } = await source.query("SELECT * FROM \"WalletLimit\"");
    console.log(`[MIGRATION] ${limits.length} limites de carteira encontrados.`);
    for (const l of limits) {
      await target.query(
        `INSERT INTO "WalletLimit" (
          id, "userId", "cycleStartDate", "cycleEndDate",
          "limitDebito", "limitCredito", "limitAlimentacao", "limitOutros", "createdAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO NOTHING`,
        [
          l.id, l.userId, l.cycleStartDate, l.cycleEndDate,
          l.limitDebito, l.limitCredito, l.limitAlimentacao, l.limitOutros, l.createdAt,
        ]
      );
    }
    console.log("[MIGRATION] ✅ Limites de carteira migrados.");

    console.log("[MIGRATION] 🎉 Migração concluída com sucesso!");

  } catch (err) {
    console.error("[MIGRATION] ❌ Erro durante a migração:", err);
    throw err;
  } finally {
    await source.end().catch(() => {});
    await target.end().catch(() => {});
  }
}
