/**
 * Thin Resend wrapper. Env-gated: when RESEND_API_KEY is absent, sending is a no-op
 * that reports `skipped` so local/free-tier flows work without an email provider.
 */
import { Resend } from "resend";
import { config, features } from "../config.ts";

let _resend: Resend | null = null;
function client(): Resend | null {
  if (!features.sending) return null;
  if (!_resend) _resend = new Resend(config.resendApiKey);
  return _resend;
}

export interface SendResult {
  delivered: boolean;
  skipped: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(opts: {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const resend = client();
  if (!resend) return { delivered: false, skipped: true };

  try {
    const { data, error } = await resend.emails.send({
      from: config.resendFromEmail,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      replyTo: opts.replyTo,
    });
    if (error) return { delivered: false, skipped: false, error: error.message };
    return { delivered: true, skipped: false, id: data?.id };
  } catch (err: any) {
    return { delivered: false, skipped: false, error: err?.message ?? String(err) };
  }
}
