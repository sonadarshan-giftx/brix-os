import { Resend } from 'resend';
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@brixstac.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://brixstac.com';

export async function sendWorkspaceInviteEmail(email: string, inviterName: string, workspaceName: string, token: string): Promise<void> {
  const url = `${FRONTEND_URL}/#/invite/${token}`;
  if (!resend) { console.log(`[MOCK] Invite for ${email}: ${url}`); return; }
  await resend.emails.send({ from: FROM_EMAIL, to: email, subject: `${inviterName} invited you to ${workspaceName}`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto"><h2>You're invited to ${workspaceName}</h2><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4F6EF7;color:white;text-decoration:none;border-radius:8px;margin:20px 0">Accept Invitation</a></div>` });
}
