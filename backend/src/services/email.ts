import nodemailer from "nodemailer";

export async function sendResetEmail(to: string, userName: string, token: string) {
  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  const resetUrl = `https://markt-frontend.onrender.com/reset-password?token=${token}`;

  console.log(`[EMAIL DISPATCH] Solicitado envio de redefinição para ${userName} (${to})`);

  if (!host || !user || !pass) {
    console.error("[EMAIL DISPATCH] ❌ Erro: Variáveis SMTP_HOST, SMTP_USER e SMTP_PASS não estão configuradas no servidor.");
    throw new Error(
      "O servidor de e-mails (SMTP) ainda não foi configurado nas variáveis de ambiente do Railway. Entre em contato com o suporte."
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false, // Evita rejeição por certificado autoassinado/proxies
      },
    });

    const mailOptions = {
      from: `"Markt Suporte" <${user}>`,
      to,
      subject: "Recuperação de Senha - Markt",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #1b4332; margin-top: 0;">Olá, ${userName}!</h2>
          <p style="color: #374151; font-size: 14px; line-height: 1.5;">Você solicitou a recuperação de sua senha no aplicativo Markt.</p>
          <p style="color: #374151; font-size: 14px; line-height: 1.5;">Para redefinir sua senha de forma segura, clique no botão abaixo:</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #1b4332; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
              Redefinir Minha Senha
            </a>
          </div>
          <p style="color: #6b7280; font-size: 11px; line-height: 1.4; margin-bottom: 0;">
            Este link é válido por 1 hora. Se você não solicitou a alteração da sua senha, pode ignorar este e-mail com segurança.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL DISPATCH] ✅ E-mail enviado com sucesso para ${to}`);
  } catch (err: any) {
    console.error(`[EMAIL DISPATCH] ❌ Falha ao enviar e-mail via SMTP (${host}:${port}):`, err);
    throw new Error(`Falha no servidor de e-mail ao enviar a mensagem: ${err?.message || "Erro de conexão SMTP"}`);
  }
}

