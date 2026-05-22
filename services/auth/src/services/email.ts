import { Resend } from 'resend';
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@brixstac.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://brixstac.com';

export async function sendVerificationEmail(email: string, name: string, code: string): Promise<void> {
  if (!resend) { console.log(`[MOCK] Verification code for ${email}: ${code}`); return; }
  await resend.emails.send({ from: FROM_EMAIL, to: email, subject: 'Verify your Brixstac account',
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto"><h2>Welcome to Brixstac, ${name}!</h2><p>Your verification code:</p><div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#4F6EF7;padding:20px;background:#f5f5f3;border-radius:8px;text-align:center;margin:20px 0">${code}</div><p>Expires in 30 minutes.</p></div>` });
}
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${FRONTEND_URL}/#/reset-password?token=${token}`;
  if (!resend) { console.log(`[MOCK] Reset link for ${email}: ${url}`); return; }
  await resend.emails.send({ from: FROM_EMAIL, to: email, subject: 'Reset your Brixstac password',
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto"><h2>Password Reset</h2><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4F6EF7;color:white;text-decoration:none;border-radius:8px;margin:20px 0">Reset Password</a></div>` });
}
export async function sendWorkspaceInviteEmail(email: string, inviterName: string, workspaceName: string, token: string): Promise<void> {
  const url = `${FRONTEND_URL}/#/invite/${token}`;
  if (!resend) { console.log(`[MOCK] Invite for ${email}: ${url}`); return; }
  await resend.emails.send({ from: FROM_EMAIL, to: email, subject: `${inviterName} invited you to ${workspaceName}`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto"><h2>You're invited to ${workspaceName}</h2><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4F6EF7;color:white;text-decoration:none;border-radius:8px;margin:20px 0">Accept Invitation</a></div>` });
}
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  if (!resend) { console.log(`[MOCK] Welcome email for ${email}`); return; }
  await resend.emails.send({ from: FROM_EMAIL, to: email, subject: 'Welcome to Brixstac!',
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto"><h2>Welcome, ${name}!</h2><p>Your Brixstac workspace is ready.</p><a href="${FRONTEND_URL}" style="display:inline-block;padding:12px 24px;background:#4F6EF7;color:white;text-decoration:none;border-radius:8px;margin:20px 0">Get Started</a></div>` });
}
