type PasswordChangedEmailInput = {
  user: {
    name: string;
    email: string;
  };
};

type TransactionalEmailInput = {
  to: {
    name: string;
    email: string;
  };
  subject: string;
  htmlContent: string;
  textContent: string;
};

const BREVO_REQUEST_TIMEOUT_MS = 15_000;

function createRequestSignal(): AbortSignal {
  return AbortSignal.timeout(BREVO_REQUEST_TIMEOUT_MS);
}

function getBrevoConfig(): {
  apiKey: string;
  senderEmail: string;
  senderName: string;
} {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_FROM_EMAIL?.trim();
  const senderName = process.env.BREVO_FROM_NAME?.trim() || "Serbia Latina";

  if (!apiKey || !senderEmail) {
    throw new Error("Brevo is not configured. Set BREVO_API_KEY and BREVO_FROM_EMAIL.");
  }

  return { apiKey, senderEmail, senderName };
}

export async function sendTransactionalEmail(input: TransactionalEmailInput): Promise<void> {
  const { apiKey, senderEmail, senderName } = getBrevoConfig();
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: input.to.email,
          name: input.to.name,
        },
      ],
      subject: input.subject,
      htmlContent: input.htmlContent,
      textContent: input.textContent,
    }),
    cache: "no-store",
    signal: createRequestSignal(),
  });

  if (!response.ok) {
    throw new Error("Brevo could not send the email.");
  }
}

export async function sendPasswordChangedEmail(input: PasswordChangedEmailInput): Promise<void> {
  await sendTransactionalEmail({
    to: input.user,
    subject: "Tu contraseña de Serbia Latina fue actualizada",
    htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6; max-width: 620px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 28px; margin: 0 0 16px;">Contraseña actualizada</h1>
          <p>Hola ${input.user.name},</p>
          <p>Confirmamos que la contraseña de tu cuenta en Serbia Latina fue cambiada correctamente.</p>
          <p>Si fuiste tú, no necesitas hacer nada más. Si no reconoces este cambio, responde a este correo o contacta con Serbia Latina cuanto antes.</p>
          <p style="color: #666; font-size: 14px;">Este mensaje se envió automáticamente por seguridad.</p>
        </div>
      `,
    textContent: `Hola ${input.user.name},\n\nConfirmamos que la contraseña de tu cuenta en Serbia Latina fue cambiada correctamente.\n\nSi no reconoces este cambio, contacta con Serbia Latina cuanto antes.`,
  });
}
