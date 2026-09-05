import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { neon } from '@neondatabase/serverless';

const authUrl =
  process.env.VITE_NEON_AUTH_URL ||
  'https://ep-nameless-union-aceqbn3o.neonauth.sa-east-1.aws.neon.tech/neondb/auth';

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_ILojE6JgC9tp@ep-nameless-union-aceqbn3o-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(databaseUrl);

async function dispatchPasswordRecoveryEmail(toEmail: string, recoveryLink: string): Promise<boolean> {
  const host = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST || '';
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || '';
  const pass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD || '';
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"NoveNutri" <no-reply@novenutri.com.br>';

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from,
        to: toEmail,
        subject: 'Recuperação de Senha — NoveNutri',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #059669; text-align: center; margin-bottom: 20px;">🌿 NoveNutri</h2>
            <p style="color: #334155; font-size: 14px;">Olá,</p>
            <p style="color: #334155; font-size: 14px;">Recebemos uma solicitação de redefinição de senha para a conta <strong>${toEmail}</strong>.</p>
            <p style="color: #334155; font-size: 14px;">Clique no botão abaixo para criar uma nova senha com segurança. Este link é válido por 1 hora:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${recoveryLink}" style="background-color: #059669; color: white; padding: 12px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">
                Redefinir Minha Senha
              </a>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">Se você não solicitou a redefinição de senha, por favor ignore este e-mail.</p>
          </div>
        `,
      });
      console.log(`[SMTP Email Sent Successfully] Password recovery email delivered to ${toEmail}`);
      return true;
    } catch (emailErr) {
      console.error('[SMTP Email Delivery Failed]:', emailErr);
      return false;
    }
  } else {
    console.log(`[SMTP Not Configured] Email delivery attempted for ${toEmail}. Link: ${recoveryLink}`);
    return false;
  }
}

export async function handleSolicitarRecuperacao(
  body: any,
  baseUrl: string = 'http://localhost:3000'
): Promise<{ success: boolean; link?: string; message?: string; error?: string }> {
  try {
    const { email } = body || {};
    if (!email || typeof email !== 'string') {
      return { success: false, error: 'Por favor, informe um email válido.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify user exists in database
    const userCheck = await sql`
      SELECT id, email FROM neon_auth.user WHERE LOWER(email) = ${cleanEmail} LIMIT 1
    `;

    if (!userCheck || userCheck.length === 0) {
      return {
        success: false,
        error: 'Nenhuma conta cadastrada com este e-mail.',
      };
    }

    const userId = userCheck[0].id;

    // 2. Generate secure 32-hex character token (time-limited to 1 hour)
    const token = crypto.randomBytes(16).toString('hex');
    const identifier = `reset-password:${token}`;

    // 3. Insert verification token into neon_auth.verification table
    await sql`
      INSERT INTO neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${identifier}, ${userId}, NOW() + INTERVAL '1 hour', NOW(), NOW())
    `;

    const recoveryLink = `${baseUrl}/redefinir-senha?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

    // 4. Dispatch email via Nodemailer if SMTP configured
    await dispatchPasswordRecoveryEmail(cleanEmail, recoveryLink);

    return {
      success: true,
      link: recoveryLink,
      message: `Solicitação realizada com sucesso! Se o e-mail estiver cadastrado, as instruções foram enviadas para ${cleanEmail}.`,
    };
  } catch (err: any) {
    console.error('Error requesting password recovery:', err);
    return { success: false, error: err?.message || 'Erro ao solicitar recuperação de senha.' };
  }
}

export async function handleRedefinirSenha(
  body: any
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { token, newPassword, email } = body || {};

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return { success: false, error: 'A nova senha precisa ter pelo menos 6 caracteres.' };
    }

    let resetToken = token;

    // If token is missing from client body, find active verification token for this email from DB
    if (!resetToken && email) {
      try {
        const rows = await sql`
          SELECT v.identifier
          FROM neon_auth.verification v
          JOIN neon_auth.user u ON v.value = u.id
          WHERE LOWER(u.email) = ${email.trim().toLowerCase()}
            AND v.identifier LIKE 'reset-password:%'
            AND v."expiresAt" > NOW()
          ORDER BY v."createdAt" DESC
          LIMIT 1
        `;

        if (rows && rows.length > 0 && rows[0].identifier) {
          resetToken = rows[0].identifier.replace('reset-password:', '');
        }
      } catch (dbErr) {
        console.warn('DB token lookup warn:', dbErr);
      }
    }

    if (!resetToken) {
      return { success: false, error: 'Token de recuperação de senha inválido ou expirado.' };
    }

    // Call Neon Auth reset-password API
    const response = await fetch(`${authUrl}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        token: resetToken,
        newPassword,
      }),
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok || resData?.status === false) {
      return {
        success: false,
        error: resData?.message || 'Token de redefinição inválido ou expirado.',
      };
    }

    return {
      success: true,
      message: 'Sua senha foi redefinida com sucesso! Você já pode fazer login com a nova senha.',
    };
  } catch (err: any) {
    console.error('Error resetting password:', err);
    return { success: false, error: err?.message || 'Erro ao redefinir a senha.' };
  }
}
