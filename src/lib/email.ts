import nodemailer from "nodemailer";

export interface EmailConfig {
  email: string;
  appPassword: string;
  enabled: boolean;
}

export async function sendEmail(
  config: EmailConfig,
  to: string,
  subject: string,
  text: string,
  attachments?: { filename: string; content: Buffer }[]
) {
  if (!config.enabled || !config.email || !config.appPassword) {
    return { error: "Email not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: config.email, pass: config.appPassword },
  });

  await transporter.sendMail({
    from: `"EAVI College" <${config.email}>`,
    to,
    subject,
    text,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });

  return { success: true };
}
