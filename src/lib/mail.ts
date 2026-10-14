/**
 * Mail boundary. The MVP only simulates sending; replace the body of
 * `sendMatchEmail` with Resend/SES/Postmark and nothing else changes.
 */
export interface OutgoingMail {
  to: string;
  subject: string;
  body: string;
}
export interface SentReceipt extends OutgoingMail {
  messageId: string;
  sentAt: string;
  simulated: true;
}

export async function sendMatchEmail(mail: OutgoingMail): Promise<SentReceipt> {
  return {
    ...mail,
    messageId: `sim_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    sentAt: new Date().toISOString(),
    simulated: true,
  };
}
