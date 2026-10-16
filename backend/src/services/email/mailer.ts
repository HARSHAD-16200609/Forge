import { env } from "../../config/env";
import { loggers } from "../../utility/logger/serviceLoggers";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

async function getClient() {
  if (!env.RESEND_API_KEY) return null;

  const { Resend } = await import("resend");
  return new Resend(env.RESEND_API_KEY);
}

class MailerService {
  get enabled() {
    return env.EMAIL_ENABLED === "true" && Boolean(env.RESEND_API_KEY);
  }

  async sendEmail(input: SendEmailInput): Promise<boolean> {
    if (!this.enabled) {
      loggers.email.info("EMAIL_SKIPPED_MAIL_DISABLED", {
        to: input.to,
        subject: input.subject,
      });
      return false;
    }

    try {
      const client = await getClient();
      if (!client) return false;

      const { data, error } = await client.emails.send({
        from: env.MAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      });

      if (error) {
        loggers.email.error("EMAIL_SEND_FAILED", {
          to: input.to,
          subject: input.subject,
          error: error.message,
        });
        return false;
      }

      loggers.email.info("EMAIL_SENT", {
        to: input.to,
        subject: input.subject,
        emailId: data?.id,
      });
      return true;
    } catch (err) {
      loggers.email.error("EMAIL_SEND_FAILED", {
        to: input.to,
        subject: input.subject,
        error: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }
}

export const mailerService = new MailerService();
