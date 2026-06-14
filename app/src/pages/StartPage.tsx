import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '@/store/useStore';
import { authApi, workspaceApi } from '@/utils/api';
import {
  Zap,
  ArrowRight,
  Building2,
  Mail,
  Globe,
  Users,
  Shield,
  Layers,
  Rocket,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   Start — Company-First Onboarding (Real API)
   Steps:
   1. Company info (name, slug, industry)
   2. Your details (name, email, password)
   3. Email verification (6-digit code)
   4. Create workspace + invite team
   5. Success → Dashboard
   ═══════════════════════════════════════════ */

const INDUSTRIES = [
  'Software & SaaS',
  'Fintech',
  'Healthcare',
  'E-commerce',
  'AI / Machine Learning',
  'Enterprise IT',
  'Consulting',
  'Media & Entertainment',
  'Manufacturing',
  'Other',
];

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function PasswordStrength({ password }: { password: string }) {
  const score = password.length >= 12 ? (password.match(/[A-Z]/) && password.match(/[0-9]/) && password.match(/[^A-Za-z0-9]/) ? 3 : 2) : password.length >= 8 ? 1 : 0;
  const labels = ['Too short', 'Weak', 'Good', 'Strong'];
  const colors = ['#e1e1e1', '#c4314b', '#d97706', '#237b4b'];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ backgroundColor: i < score ? colors[score] : '#e1e1e1' }} />
        ))}
      </div>
      {password.length > 0 && (
        <p className="text-[11px]" style={{ color: colors[score] }}>{labels[score]}</p>
      )}
    </div>
  );
}

export default function StartPage() {
  const navigate = useNavigate();

  // Steps 1–5
  const [step, setStep] = useState(1);

  // Step 1: Company info
  const [companyName, setCompanyName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [industry, setIndustry] = useState('');

  // Step 2: Admin details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Step 3: Verification
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 4: Invite team
  const [inviteEmails, setInviteEmails] = useState('');

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authTokens, setAuthTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null);

  const handleCompanyChange = (name: string) => {
    setCompanyName(name);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
    setWorkspaceSlug(slug);
  };

  // Step 1 → 2
  const handleStep1 = () => {
    if (!companyName.trim()) { setError('Please enter your company name'); return; }
    if (!workspaceSlug.trim() || workspaceSlug.length < 2) { setError('Workspace URL must be at least 2 characters'); return; }
    if (!/^[a-z0-9]([a-z0-9-]{0,28}[a-z0-9])?$/.test(workspaceSlug)) { setError('Workspace URL must be lowercase letters, numbers, and hyphens only'); return; }
    if (!industry) { setError('Please select your industry'); return; }
    setError('');
    setStep(2);
  };

  // Step 2 → 3: Register with real API
  const handleStep2 = async () => {
    if (!adminName.trim()) { setError('Please enter your full name'); return; }
    if (!adminEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) { setError('Please enter a valid work email'); return; }
    if (password.length < 12) { setError('Password must be at least 12 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setError('');
    setLoading(true);

    try {
      await authApi.register({
        email: adminEmail.trim().toLowerCase(),
        password,
        name: adminName.trim(),
        companyName: companyName.trim(),
      });
      setLoading(false);
      setStep(3);
    } catch (err: any) {
      setLoading(false);
      if (err.status === 409) {
        setError('This email is already registered. Try signing in instead.');
      } else if (err.status === 400) {
        setError(err.message || 'Please check your details and try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  // Step 3: Verify email
  const handleStep3 = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) { setError('Enter the 6-digit verification code'); return; }

    setError('');
    setLoading(true);

    try {
      await authApi.verifyEmail(adminEmail.trim().toLowerCase(), code);

      // Auto-login after verification
      const loginRes = await authApi.login({ email: adminEmail.trim().toLowerCase(), password });
      setAuthTokens({ accessToken: loginRes.accessToken, refreshToken: loginRes.refreshToken });

      // Store user immediately
      const storeUser = {
        id: loginRes.user.id,
        name: loginRes.user.name,
        email: loginRes.user.email,
        role: loginRes.user.role,
        initials: makeInitials(loginRes.user.name),
        avatar: loginRes.user.avatar || null,
        status: 'online' as const,
        bio: '',
      };
      useStore.getState().setCurrentUser(storeUser as any, loginRes.accessToken, loginRes.refreshToken);

      setLoading(false);
      setStep(4);
    } catch (err: any) {
      setLoading(false);
      if (err.status === 400) {
        setError('Invalid or expired verification code. Please try again.');
      } else {
        setError('Verification failed. Please try again.');
      }
    }
  };

  // Resend verification code
  const handleResend = async () => {
    try {
      await authApi.resendVerification(adminEmail.trim().toLowerCase());
      setError('');
    } catch {
      // Silently fail - server returns same message regardless
    }
  };

  // Step 4: Create workspace + invite team
  const handleStep4 = async () => {
    if (!authTokens) { setError('Session expired. Please start over.'); return; }

    setError('');
    setLoading(true);

    try {
      // Create workspace
      const workspace = await workspaceApi.create(
        { name: companyName.trim(), slug: workspaceSlug, industry },
        authTokens.accessToken
      );

      // Send invites (best-effort, non-blocking)
      const emails = inviteEmails
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter((e) => e.includes('@') && e !== adminEmail);

      await Promise.allSettled(
        emails.map((email) =>
          workspaceApi.invite(workspace.id, { email, role: 'MEMBER' }, authTokens.accessToken)
        )
      );

      // Store workspace
      useStore.getState().createWorkspace(workspace);
      useStore.getState().setWorkspace(workspace);
      useStore.getState().setOnboardingComplete(true);

      setLoading(false);
      setStep(5);
    } catch (err: any) {
      setLoading(false);
      if (err.status === 409) {
        setError('This workspace URL is already taken. Please choose a different one.');
        setStep(1);
      } else {
        setError('Failed to create workspace. Please try again.');
      }
    }
  };

  const progressSteps = 4;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-16"
      style={{ backgroundColor: '#f5f5f3', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, backgroundColor: '#5b5fc7' }}
          >
            <Zap size={18} color="#fff" />
          </div>
          <span className="text-base font-semibold" style={{ color: '#1A1209', fontFamily: "'JetBrains Mono', monospace" }}>Brix OS</span>
        </div>
        <a href="/#/login" className="text-sm hover:underline" style={{ color: '#616161' }}>
          Already have a workspace? Sign in →
        </a>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-[520px] rounded-2xl px-8 py-8"
        style={{ backgroundColor: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}
      >
        {/* Progress bar */}
        {step < 5 && (
          <div className="mb-6 flex items-center gap-2">
            {Array.from({ length: progressSteps }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all"
                style={{ backgroundColor: i < step ? '#5b5fc7' : '#e1e1e1' }}
              />
            ))}
          </div>
        )}

        {/* Step heading */}
        {step < 5 && (
          <>
            <h1 className="mb-1 text-xl font-bold" style={{ color: '#1A1209' }}>
              {step === 1 && 'Create your workspace'}
              {step === 2 && 'Set up your account'}
              {step === 3 && 'Verify your email'}
              {step === 4 && 'Invite your team'}
            </h1>
            <p className="mb-6 text-sm" style={{ color: '#616161', lineHeight: 1.5 }}>
              {step === 1 && 'Tell us about your company. You will be the workspace owner.'}
              {step === 2 && 'Create your admin account to manage this workspace.'}
              {step === 3 && `We sent a 6-digit code to ${adminEmail}. It expires in 30 minutes.`}
              {step === 4 && 'Add teammates by email. You can always invite more later.'}
            </p>
          </>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg p-3 text-sm" style={{ backgroundColor: '#fde8ec', color: '#c4314b' }}>
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: Company Info ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#616161' }}>
                Company Name
              </label>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#d1d1d1' }}>
                <Building2 size={16} color="#a0a0a0" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  placeholder="Acme Software"
                  className="w-full text-sm outline-none"
                  style={{ background: 'transparent' }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#616161' }}>
                Workspace URL
              </label>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#d1d1d1' }}>
                <Globe size={16} color="#a0a0a0" />
                <input
                  type="text"
                  value={workspaceSlug}
                  onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="acme-software"
                  className="w-full text-sm outline-none"
                  style={{ background: 'transparent' }}
                />
              </div>
              <p className="mt-1 text-[11px]" style={{ color: '#a0a0a0' }}>
                Unique identifier: <span style={{ color: '#5b5fc7' }}>{workspaceSlug || 'your-company'}</span>
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#616161' }}>
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: '#d1d1d1', backgroundColor: '#fff' }}
              >
                <option value="">Select your industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStep1}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#5b5fc7', border: 'none', fontSize: 14 }}
            >
              Continue <ArrowRight size={16} />
            </button>

            <p className="text-center text-[11px]" style={{ color: '#a0a0a0' }}>
              By continuing, you agree to our{' '}
              <a href="/#/terms" className="hover:underline" style={{ color: '#5b5fc7' }}>Terms</a>
              {' '}and{' '}
              <a href="/#/privacy" className="hover:underline" style={{ color: '#5b5fc7' }}>Privacy Policy</a>
            </p>
          </div>
        )}

        {/* ── STEP 2: Account Details ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#616161' }}>
                Your Full Name
              </label>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#d1d1d1' }}>
                <Users size={16} color="#a0a0a0" />
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full text-sm outline-none"
                  style={{ background: 'transparent' }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#616161' }}>
                Work Email
              </label>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#d1d1d1' }}>
                <Mail size={16} color="#a0a0a0" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full text-sm outline-none"
                  style={{ background: 'transparent' }}
                />
              </div>
              <p className="mt-1 text-[11px]" style={{ color: '#a0a0a0' }}>
                We will send a verification code to this address.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#616161' }}>
                Password
              </label>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#d1d1d1' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 12 characters"
                  className="w-full text-sm outline-none"
                  style={{ background: 'transparent' }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ color: '#a0a0a0' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#616161' }}>
                Confirm Password
              </label>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#d1d1d1' }}>
                <input
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full text-sm outline-none"
                  style={{ background: 'transparent' }}
                />
                <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} style={{ color: '#a0a0a0' }}>
                  {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-[11px]" style={{ color: '#c4314b' }}>Passwords do not match</p>
              )}
            </div>

            <div className="rounded-lg p-3" style={{ backgroundColor: '#faf9f6', border: '1px solid #e8e8e8' }}>
              <div className="flex items-start gap-2">
                <Shield size={14} color="#237b4b" className="mt-0.5 shrink-0" />
                <p className="text-[11px]" style={{ color: '#616161', lineHeight: 1.5 }}>
                  <strong>You will be the workspace owner</strong> with full admin access and billing control.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setError(''); setStep(1); }}
                className="flex-1 rounded-xl border py-3 text-sm font-medium transition-all hover:opacity-90"
                style={{ borderColor: '#d1d1d1', color: '#616161', backgroundColor: '#fff' }}
              >
                Back
              </button>
              <button
                onClick={handleStep2}
                disabled={loading}
                className="flex-[2] flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#5b5fc7', border: 'none', fontSize: 14 }}
              >
                {loading ? 'Creating account…' : <><span>Send Verification Code</span> <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Verify Email ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {verificationCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { codeRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const newCode = [...verificationCode];
                    newCode[i] = val;
                    setVerificationCode(newCode);
                    if (val && i < 5) codeRefs.current[i + 1]?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && i > 0) {
                      codeRefs.current[i - 1]?.focus();
                    }
                  }}
                  className="h-14 w-12 rounded-lg border text-center text-xl font-bold outline-none focus:border-[#5b5fc7]"
                  style={{ borderColor: '#d1d1d1', backgroundColor: '#fff' }}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <p className="text-center text-xs" style={{ color: '#616161' }}>
              Didn&apos;t receive it?{' '}
              <button onClick={handleResend} className="font-medium hover:underline" style={{ color: '#5b5fc7' }}>
                Resend code
              </button>
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => { setError(''); setStep(2); }}
                className="flex-1 rounded-xl border py-3 text-sm font-medium transition-all hover:opacity-90"
                style={{ borderColor: '#d1d1d1', color: '#616161', backgroundColor: '#fff' }}
              >
                Back
              </button>
              <button
                onClick={handleStep3}
                disabled={loading}
                className="flex-[2] flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#5b5fc7', border: 'none', fontSize: 14 }}
              >
                {loading ? 'Verifying…' : <><span>Verify &amp; Continue</span> <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Invite Team + Create Workspace ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-lg p-3" style={{ backgroundColor: '#faf9f6', border: '1px solid #e8e8e8' }}>
              <div className="flex items-start gap-2">
                <Layers size={14} color="#5b5fc7" className="mt-0.5 shrink-0" />
                <p className="text-[11px]" style={{ color: '#616161', lineHeight: 1.5 }}>
                  Creating workspace: <strong>{companyName}</strong> at <strong style={{ color: '#5b5fc7' }}>{workspaceSlug}</strong>
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#616161' }}>
                Invite teammates by email (optional)
              </label>
              <textarea
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="dev@company.com&#10;design@company.com&#10;pm@company.com"
                rows={4}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[#5b5fc7]"
                style={{ borderColor: '#d1d1d1', backgroundColor: '#fff', resize: 'vertical' }}
              />
              <p className="mt-1 text-[11px]" style={{ color: '#a0a0a0' }}>
                Separate emails with commas or new lines. Invited users become Members by default.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleStep4}
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#237b4b', border: 'none', fontSize: 14 }}
              >
                {loading ? 'Creating workspace…' : <><Rocket size={16} /> Launch Workspace</>}
              </button>
            </div>

            <button
              onClick={() => { setInviteEmails(''); handleStep4(); }}
              disabled={loading}
              className="w-full text-center text-xs hover:underline disabled:opacity-40"
              style={{ color: '#a0a0a0' }}
            >
              Skip for now — invite later from Settings
            </button>
          </div>
        )}

        {/* ── STEP 5: Success ── */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="flex flex-col items-center py-4">
              <div
                className="mb-3 flex items-center justify-center rounded-full"
                style={{ width: 64, height: 64, backgroundColor: '#e6f4ea' }}
              >
                <CheckCircle2 size={32} color="#237b4b" />
              </div>
              <h2 className="text-center text-lg font-bold" style={{ color: '#1A1209' }}>
                {companyName} is live on Brix OS!
              </h2>
              <p className="text-center text-sm" style={{ color: '#616161' }}>
                Workspace: <strong style={{ color: '#5b5fc7' }}>{workspaceSlug}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg p-3" style={{ backgroundColor: '#faf9f6' }}>
                <CheckCircle2 size={18} color="#237b4b" />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1A1209' }}>Email verified</p>
                  <p className="text-[11px]" style={{ color: '#616161' }}>{adminEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg p-3" style={{ backgroundColor: '#faf9f6' }}>
                <Building2 size={18} color="#5b5fc7" />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1A1209' }}>Workspace created</p>
                  <p className="text-[11px]" style={{ color: '#616161' }}>{industry} · Starter plan</p>
                </div>
              </div>
              {inviteEmails.trim() && (
                <div className="flex items-center gap-3 rounded-lg p-3" style={{ backgroundColor: '#faf9f6' }}>
                  <Users size={18} color="#5b5fc7" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1209' }}>Team invited</p>
                    <p className="text-[11px]" style={{ color: '#616161' }}>
                      {inviteEmails.split(/[,\n]/).filter((e) => e.includes('@')).length} invites sent
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/projects', { replace: true })}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#5b5fc7', border: 'none', fontSize: 14 }}
            >
              <Rocket size={18} />
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
