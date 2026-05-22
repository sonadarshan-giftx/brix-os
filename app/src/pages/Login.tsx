import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '@/store/useStore';
import { authApi, workspaceApi } from '@/utils/api';
import {
  Zap,
  ArrowRight,
  Building2,
  Mail,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   Login — Real API Sign In
   Flow:
   1. Enter work email
   2. Enter password → POST /api/auth/login
   3. Load workspaces → GET /api/workspaces
   4. If multiple workspaces, pick one
   5. Redirect to /projects
   ═══════════════════════════════════════════ */

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function LoginPage() {
  const navigate = useNavigate();

  type Step = 'email' | 'password' | 'workspaces' | 'success';
  const [step, setStep] = useState<Step>('email');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid work email');
      return;
    }
    setError('');
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Step 1: Authenticate
      const loginRes = await authApi.login({ email: email.trim().toLowerCase(), password });

      const { user: apiUser, accessToken, refreshToken } = loginRes;

      // Map API user → store Employee format
      const storeUser = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role,
        initials: makeInitials(apiUser.name),
        avatar: apiUser.avatar || null,
        status: 'online' as const,
        bio: '',
        emailVerified: apiUser.emailVerified,
      };

      // Step 2: Load workspaces
      let userWorkspaces: any[] = [];
      try {
        userWorkspaces = await workspaceApi.list(accessToken);
      } catch {
        // Non-fatal — user might have no workspace yet
      }

      // Store user + tokens
      useStore.getState().setCurrentUser(storeUser as any, accessToken, refreshToken);

      if (userWorkspaces.length > 0) {
        // Store first workspace (or let user pick if multiple)
        if (userWorkspaces.length === 1) {
          useStore.getState().setWorkspace(userWorkspaces[0]);
          useStore.getState().createWorkspace(userWorkspaces[0]);
        } else {
          // Store all, let user pick
          useStore.setState((s: any) => { s.workspaces = userWorkspaces; });
          setWorkspaces(userWorkspaces);
          setStep('workspaces');
          setLoading(false);
          return;
        }
      }

      useStore.getState().setOnboardingComplete(true);
      setStep('success');
      setTimeout(() => navigate('/projects', { replace: true }), 800);
    } catch (err: any) {
      setLoading(false);
      if (err.status === 401) {
        setError('Incorrect email or password. Please try again.');
      } else if (err.status === 403) {
        if (err.message?.includes('suspended') || err.message?.includes('deactivated')) {
          setError('Your account has been suspended. Contact your workspace admin.');
        } else {
          setError('Please verify your email before signing in. Check your inbox for the verification code.');
        }
      } else if (err.status === 404) {
        setError('No account found with this email. Have you signed up?');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  const handleWorkspacePick = (ws: any) => {
    setSelectedWorkspace(ws);
    useStore.getState().setWorkspace(ws);
    useStore.getState().setOnboardingComplete(true);
    setStep('success');
    setTimeout(() => navigate('/projects', { replace: true }), 800);
  };

  const goBack = () => {
    setError('');
    if (step === 'password') setStep('email');
    else if (step === 'workspaces') setStep('password');
  };

  const stepIndex = { email: 0, password: 1, workspaces: 2, success: 2 };
  const currentStepIndex = stepIndex[step];

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: '#f5f5f3', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate('/', { replace: true })}
          className="flex items-center gap-2"
        >
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 32, height: 32, backgroundColor: '#D97757' }}
          >
            <Zap size={18} color="#fff" />
          </div>
          <span className="text-base font-semibold" style={{ color: '#1A1209', fontFamily: "'JetBrains Mono', monospace" }}>Brix OS</span>
        </button>

        <a
          href="/#/start"
          className="text-sm hover:underline"
          style={{ color: '#616161' }}
        >
          Create a workspace →
        </a>
      </div>

      <div
        className="w-full max-w-[440px] rounded-2xl px-8 py-10"
        style={{ backgroundColor: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}
      >
        {/* Step dots */}
        <div className="mb-6 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all"
                style={{
                  backgroundColor: i <= currentStepIndex ? '#D97757' : '#e1e1e1',
                  color: i <= currentStepIndex ? '#fff' : '#a0a0a0',
                }}
              >
                {i < currentStepIndex ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              {i < 2 && (
                <div
                  className="h-px w-8 transition-all"
                  style={{ backgroundColor: i < currentStepIndex ? '#D97757' : '#e1e1e1' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: EMAIL ── */}
        {step === 'email' && (
          <>
            <div className="mb-6 flex justify-center">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 56, height: 56, backgroundColor: '#D97757' }}
              >
                <Building2 size={28} color="#fff" />
              </div>
            </div>

            <h1 className="mb-1 text-center text-xl font-bold" style={{ color: '#1A1209' }}>
              Sign in to Brix OS
            </h1>
            <p className="mb-6 text-center text-sm" style={{ color: '#616161' }}>
              Enter your work email to continue
            </p>

            {error && (
              <div
                className="mb-4 flex items-start gap-2 rounded-lg p-3 text-sm"
                style={{ backgroundColor: '#fde8ec', color: '#c4314b' }}
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#616161' }}>
                  Work Email
                </label>
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#d1d1d1' }}>
                  <Mail size={16} color="#a0a0a0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full text-sm outline-none"
                    style={{ background: 'transparent' }}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  />
                </div>
              </div>

              <button
                onClick={handleEmailSubmit}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#D97757', border: 'none', fontSize: 14 }}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>

            <p className="mt-6 text-center text-xs" style={{ color: '#616161' }}>
              New to Brix OS?{' '}
              <a href="/#/start" className="font-medium hover:underline" style={{ color: '#D97757' }}>
                Create a workspace
              </a>
            </p>
          </>
        )}

        {/* ── STEP 2: PASSWORD ── */}
        {step === 'password' && (
          <>
            <button
              onClick={goBack}
              className="mb-4 flex items-center gap-1 text-sm hover:underline"
              style={{ color: '#616161' }}
            >
              <ChevronLeft size={16} /> Back
            </button>

            <div
              className="mb-6 flex items-center gap-3 rounded-xl p-3"
              style={{ backgroundColor: '#faf9f6', border: '1px solid #e8e8e8' }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: '#D97757' }}
              >
                <Mail size={18} color="#fff" />
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-semibold" style={{ color: '#1A1209' }}>{email}</p>
                <p className="text-xs" style={{ color: '#616161' }}>Signing in</p>
              </div>
            </div>

            <h1 className="mb-1 text-xl font-bold" style={{ color: '#1A1209' }}>
              Enter your password
            </h1>
            <p className="mb-6 text-sm" style={{ color: '#616161' }}>
              Welcome back! Enter your password to continue.
            </p>

            {error && (
              <div
                className="mb-4 flex items-start gap-2 rounded-lg p-3 text-sm"
                style={{ backgroundColor: '#fde8ec', color: '#c4314b' }}
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#616161' }}>
                    Password
                  </label>
                  <a href="/#/forgot-password" className="text-xs hover:underline" style={{ color: '#D97757' }}>
                    Forgot password?
                  </a>
                </div>
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#d1d1d1' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full text-sm outline-none"
                    style={{ background: 'transparent' }}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ color: '#a0a0a0' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#D97757', border: 'none', fontSize: 14 }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span
                      style={{
                        width: 16, height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    Signing in...
                  </span>
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-xs" style={{ color: '#616161' }}>
              Don&apos;t have an account?{' '}
              <a href="/#/start" className="font-medium hover:underline" style={{ color: '#D97757' }}>
                Create workspace
              </a>
            </p>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {/* ── STEP 3: PICK WORKSPACE (multiple) ── */}
        {step === 'workspaces' && (
          <>
            <button
              onClick={goBack}
              className="mb-4 flex items-center gap-1 text-sm hover:underline"
              style={{ color: '#616161' }}
            >
              <ChevronLeft size={16} /> Back
            </button>

            <h1 className="mb-1 text-xl font-bold" style={{ color: '#1A1209' }}>
              Select your workspace
            </h1>
            <p className="mb-6 text-sm" style={{ color: '#616161' }}>
              You are a member of {workspaces.length} workspaces. Pick one to continue.
            </p>

            <div className="space-y-3">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleWorkspacePick(ws)}
                  className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all hover:border-[#D97757]"
                  style={{ borderColor: '#d1d1d1', backgroundColor: '#fff' }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: '#D97757' }}
                  >
                    {ws.name?.[0]?.toUpperCase() || 'W'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-semibold" style={{ color: '#1A1209' }}>{ws.name}</p>
                    <p className="text-xs" style={{ color: '#616161' }}>{ws.memberCount} member{ws.memberCount !== 1 ? 's' : ''}</p>
                  </div>
                  <ArrowRight size={16} color="#a0a0a0" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 4: SUCCESS ── */}
        {step === 'success' && (
          <div className="flex flex-col items-center py-6">
            <div
              className="mb-4 flex items-center justify-center rounded-full"
              style={{ width: 64, height: 64, backgroundColor: '#e6f4ea' }}
            >
              <CheckCircle2 size={32} color="#237b4b" />
            </div>
            <h2 className="mb-1 text-center text-lg font-bold" style={{ color: '#1A1209' }}>
              Welcome back!
            </h2>
            <p className="text-center text-sm" style={{ color: '#616161' }}>
              Redirecting to your workspace…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
