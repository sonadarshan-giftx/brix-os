import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import https from 'https';
import { prisma } from './utils/prisma';
import { authenticateToken, AuthRequest } from './middleware/auth';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from './services/email';
import { generateTOTPSecret, verifyTOTP, getTOTPQRUrl, getTOTPUri } from './totp';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'brixstac-dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'brixstac-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '4h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// ─── Google OAuth2 Config ──────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost/api/auth/oauth/google/callback';

// ─── TOTP temp storage (pending verification before writing to DB) ─────────
const totpSecrets = new Map<string, { secret: string; verified: boolean }>();

// ─── OAuth state store (CSRF prevention) ──────────────────────────────────
const oauthStates = new Map<string, { createdAt: number }>();

function generateTokens(userId: string, email: string, role: string) {
  const accessToken = jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
  const refreshToken = jwt.sign({ userId, email, role }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as any });
  return { accessToken, refreshToken };
}

function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
}

// Helper: make HTTPS GET request and return parsed JSON
function httpsGet(url: string, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = { hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers };
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

// Helper: make HTTPS POST request with form-encoded body and return parsed JSON
function httpsPost(url: string, body: Record<string, string>): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = new URLSearchParams(body).toString();
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// POST /auth/register
router.post('/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, companyName } = req.body;
    if (!email || !password || !name) { res.status(400).json({ error: 'Email, password, name required' }); return; }
    if (password.length < 12) { res.status(400).json({ error: 'Password must be at least 12 characters' }); return; }
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) { res.status(409).json({ error: 'Email already registered' }); return; }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = crypto.randomInt(100000, 999999).toString();

    // Create user (no verificationCode on User model — that's in EmailVerification)
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashedPassword, name },
      select: { id: true, email: true, name: true, role: true, emailVerified: true, createdAt: true },
    });

    // Store verification code in EmailVerification table
    await prisma.emailVerification.create({
      data: {
        code: verificationCode,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    });

    await sendVerificationEmail(user.email, name, verificationCode).catch(console.error);
    res.status(201).json({ user, message: 'Account created. Check your email for verification code.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Registration failed' }); }
});

// POST /auth/verify-email
router.post('/auth/verify-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;
    if (!email || !code) { res.status(400).json({ error: 'Email and code required' }); return; }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    if (user.emailVerified) { res.json({ success: true, message: 'Email already verified' }); return; }

    // Look up the verification record
    const verification = await prisma.emailVerification.findFirst({
      where: { userId: user.id, code, used: false, expiresAt: { gt: new Date() } },
    });

    if (!verification) {
      res.status(400).json({ error: 'Invalid or expired verification code' }); return;
    }

    // Mark verification as used and set email as verified
    await prisma.$transaction([
      prisma.emailVerification.update({ where: { id: verification.id }, data: { used: true } }),
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
    ]);

    await sendWelcomeEmail(user.email, user.name).catch(console.error);
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Verification failed' }); }
});

// POST /auth/resend-verification
router.post('/auth/resend-verification', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'Email required' }); return; }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || user.emailVerified) {
      res.json({ success: true, message: 'If your email is registered and unverified, you will receive a code.' }); return;
    }

    // Invalidate existing codes
    await prisma.emailVerification.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });

    const code = crypto.randomInt(100000, 999999).toString();
    await prisma.emailVerification.create({
      data: { code, userId: user.id, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    });

    await sendVerificationEmail(email, user.name, code).catch(console.error);
    res.json({ success: true, message: 'Verification code sent' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to resend verification' }); }
});

// POST /auth/login
router.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: 'Email and password required' }); return; }
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !await bcrypt.compare(password, user.password)) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    if (user.status !== 'ACTIVE') { res.status(403).json({ error: 'Account suspended or deactivated' }); return; }

    // If MFA is enabled, issue a short-lived temp token instead of full tokens
    if (user.mfaEnabled) {
      const tempToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '5m' as any });
      res.json({ requiresMFA: true, userId: user.id, tempToken });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified, avatar: user.avatar },
      accessToken,
      refreshToken,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Login failed' }); }
});

// POST /auth/refresh
router.post('/auth/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400).json({ error: 'Refresh token required' }); return; }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string; email: string; role: string };
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) { res.status(401).json({ error: 'Invalid or expired refresh token' }); return; }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId, status: 'ACTIVE' } });
    if (!user) { res.status(403).json({ error: 'User not found' }); return; }

    const tokens = generateTokens(user.id, user.email, user.role);

    // Delete old token, create new one (rotation)
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token: refreshToken } }),
      prisma.refreshToken.create({
        data: { token: tokens.refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    res.json(tokens);
  } catch (err) {
    if ((err as any).name === 'JsonWebTokenError' || (err as any).name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Invalid refresh token' }); return;
    }
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// POST /auth/logout
router.post('/auth/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ success: true });
  } catch { res.json({ success: true }); }
});

// GET /auth/me
router.get('/auth/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, avatar: true, bio: true, emailVerified: true, mfaEnabled: true, department: true, title: true, createdAt: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch { res.status(500).json({ error: 'Failed to fetch profile' }); }
});

// PATCH /auth/me
router.patch('/auth/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, bio, avatar, department, title } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        ...(department !== undefined && { department }),
        ...(title !== undefined && { title }),
      },
      select: { id: true, email: true, name: true, role: true, avatar: true, bio: true, emailVerified: true, department: true, title: true },
    });
    res.json(user);
  } catch { res.status(500).json({ error: 'Failed to update profile' }); }
});

// POST /auth/forgot-password
router.post('/auth/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email?.toLowerCase() } });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      // Store in password_resets table (not on user)
      await prisma.passwordReset.create({
        data: { token, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });
      await sendPasswordResetEmail(email, token).catch(console.error);
    }
    res.json({ success: true, message: 'If this email is registered, you will receive a reset link.' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to process request' }); }
});

// POST /auth/reset-password
router.post('/auth/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 12) {
      res.status(400).json({ error: 'Valid token and password (12+ chars) required' }); return;
    }

    // Look up the password reset record
    const reset = await prisma.passwordReset.findFirst({
      where: { token, used: false, expiresAt: { gt: new Date() } },
    });
    if (!reset) { res.status(400).json({ error: 'Invalid or expired reset token' }); return; }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { password: hashed } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
      // Revoke all refresh tokens for security
      prisma.refreshToken.deleteMany({ where: { userId: reset.userId } }),
    ]);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to reset password' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 2FA / TOTP  (feature #63)
// ─── ═══════════════════════════════════════════════════════════════ ─────────

// POST /auth/2fa/setup — generate a new TOTP secret for the authenticated user
router.post('/auth/2fa/setup', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const secret = generateTOTPSecret();
    totpSecrets.set(userId, { secret, verified: false });

    res.json({
      secret,
      qrUrl: getTOTPQRUrl(secret, user.email),
      uri: getTOTPUri(secret, user.email),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to set up 2FA' }); }
});

// POST /auth/2fa/verify — confirm TOTP token and enable MFA on the account
router.post('/auth/2fa/verify', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { token } = req.body;
    if (!token) { res.status(400).json({ error: 'Token required' }); return; }

    const pending = totpSecrets.get(userId);
    if (!pending) { res.status(400).json({ error: 'No 2FA setup in progress. Call /auth/2fa/setup first.' }); return; }

    if (!verifyTOTP(token, pending.secret)) {
      res.status(400).json({ error: 'Invalid TOTP token' }); return;
    }

    // Persist secret and enable MFA
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaSecret: pending.secret },
    });

    totpSecrets.set(userId, { secret: pending.secret, verified: true });

    const backupCodes = generateBackupCodes();
    res.json({ success: true, backupCodes });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to verify 2FA' }); }
});

// POST /auth/2fa/disable — disable MFA (requires valid current TOTP token)
router.post('/auth/2fa/disable', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { token } = req.body;
    if (!token) { res.status(400).json({ error: 'Current TOTP token required to disable 2FA' }); return; }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { mfaEnabled: true, mfaSecret: true } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    if (!user.mfaEnabled || !user.mfaSecret) { res.status(400).json({ error: '2FA is not enabled' }); return; }

    if (!verifyTOTP(token, user.mfaSecret)) {
      res.status(401).json({ error: 'Invalid TOTP token' }); return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    totpSecrets.delete(userId);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to disable 2FA' }); }
});

// POST /auth/2fa/validate — called during login flow when mfaEnabled=true
// Body: { userId: string, token: string }
router.post('/auth/2fa/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, token, tempToken } = req.body;
    if (!userId || !token) { res.status(400).json({ error: 'userId and token required' }); return; }

    // Verify the short-lived temp token issued during login
    if (tempToken) {
      try {
        const decoded = jwt.verify(tempToken, JWT_SECRET) as any;
        if (decoded.userId !== userId) { res.status(401).json({ error: 'Invalid temp token' }); return; }
      } catch {
        res.status(401).json({ error: 'Invalid or expired temp token' }); return;
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, avatar: true, emailVerified: true, mfaEnabled: true, mfaSecret: true, status: true },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      res.status(400).json({ error: 'MFA not configured for this user' }); return;
    }

    if (user.status !== 'ACTIVE') { res.status(403).json({ error: 'Account suspended or deactivated' }); return; }

    if (!verifyTOTP(token, user.mfaSecret)) {
      res.status(401).json({ error: 'Invalid 2FA code' }); return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified, avatar: user.avatar },
      accessToken,
      refreshToken,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to validate 2FA' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// SSO / OAuth2  (feature #58)
// ─── ═══════════════════════════════════════════════════════════════ ─────────

// GET /auth/oauth/config — returns which OAuth providers are configured
router.get('/auth/oauth/config', (req: Request, res: Response) => {
  res.json({
    googleEnabled: !!GOOGLE_CLIENT_ID,
    providers: GOOGLE_CLIENT_ID ? ['google'] : [],
  });
});

// GET /auth/oauth/google — redirect to Google OAuth2 authorization page
router.get('/auth/oauth/google', (req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID) {
    res.status(503).json({ error: 'Google OAuth is not configured' }); return;
  }

  const state = crypto.randomBytes(16).toString('hex');
  oauthStates.set(state, { createdAt: Date.now() });

  // Clean up old states (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, val] of oauthStates.entries()) {
    if (val.createdAt < tenMinutesAgo) oauthStates.delete(key);
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// GET /auth/oauth/google/callback — handle Google OAuth2 callback
router.get('/auth/oauth/google/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error } = req.query as Record<string, string>;

    if (error) {
      res.redirect(`/#/oauth-callback?error=${encodeURIComponent(error)}`); return;
    }

    if (!state || !oauthStates.has(state)) {
      res.status(400).json({ error: 'Invalid OAuth state. Possible CSRF attack.' }); return;
    }
    oauthStates.delete(state);

    if (!code) { res.status(400).json({ error: 'Authorization code missing' }); return; }

    // Exchange code for tokens
    const tokenResponse = await httpsPost('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    if (tokenResponse.error) {
      console.error('Google token exchange error:', tokenResponse);
      res.status(401).json({ error: 'Failed to exchange OAuth code' }); return;
    }

    const { access_token } = tokenResponse;

    // Fetch user info from Google
    const googleUser = await httpsGet(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { Authorization: `Bearer ${access_token}` },
    );

    if (!googleUser.email) {
      res.status(400).json({ error: 'Could not retrieve email from Google' }); return;
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: googleUser.email.toLowerCase() } });

    if (!user) {
      // Create new user from Google profile
      const nameParts = (googleUser.name || googleUser.email).split(' ');
      user = await prisma.user.create({
        data: {
          email: googleUser.email.toLowerCase(),
          name: googleUser.name || googleUser.email,
          password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12), // random unusable password
          avatar: googleUser.picture || null,
          emailVerified: true, // Google already verified the email
        },
      });
    } else if (!user.emailVerified) {
      // If existing user had unverified email, mark it verified via Google
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    }

    if (user.status !== 'ACTIVE') {
      res.redirect(`/#/oauth-callback?error=account_suspended`); return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.redirect(`/#/oauth-callback?token=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(`/#/oauth-callback?error=server_error`);
  }
});

// POST /auth/saml/callback — SAML assertion endpoint stub (enterprise)
router.post('/auth/saml/callback', (req: Request, res: Response) => {
  // TODO: Implement SAML XML parsing when enterprise SAML config is provided.
  // Steps to complete:
  //   1. Parse the SAMLResponse field from req.body (base64-decoded XML)
  //   2. Validate the XML signature against the IdP's X.509 certificate
  //   3. Extract NameID (email) and attributes from the assertion
  //   4. Find or create user by email, issue JWT tokens
  //   5. Redirect to frontend with tokens
  res.status(501).json({ error: 'SAML requires enterprise configuration. Contact support.' });
});

export default router;
