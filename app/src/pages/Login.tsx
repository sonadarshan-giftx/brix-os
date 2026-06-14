import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '@/store/useStore';
import { authApi, workspaceApi } from '@/utils/api';
import {
  Zap, ArrowRight, Mail, ChevronLeft,
  CheckCircle2, AlertCircle, Eye, EyeOff,
  MessageSquare, FolderKanban, Bot, Shield,
  Users, Lock, Copy,
} from 'lucide-react';

const BRAND = '#5b5fc7';
const BRAND_DARK = '#464775';

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ── Feature list shown on left panel ── */
const FEATURES = [
  { icon: MessageSquare, text: 'Real-time messaging & video calls' },
  { icon: FolderKanban,  text: 'Project management with AI sprints' },
  { icon: Bot,           text: 'AI employees that actually work' },
  { icon: Shield,        text: 'Zero-trust enterprise security' },
  { icon: Users,         text: 'Full team & org chart management' },
];

export default function LoginPage() {
  const navigate = useNavigate();

  type Step = 'email' | 'password' | 'workspaces' | 'success';
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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
    if (!password.trim()) { setError('Please enter your password'); return; }
    setError('');
    setLoading(true);
    try {
      const loginRes = await authApi.login({ email: email.trim().toLowerCase(), password });
      const { user: apiUser, accessToken, refreshToken } = loginRes;
      const storeUser = {
        id: apiUser.id, name: apiUser.name, email: apiUser.email, role: apiUser.role,
        initials: makeInitials(apiUser.name), avatar: apiUser.avatar || null,
        status: 'online' as const, bio: '', emailVerified: apiUser.emailVerified,
      };
      let userWorkspaces: any[] = [];
      try { userWorkspaces = await workspaceApi.list(accessToken); } catch {}
      useStore.getState().setCurrentUser(storeUser as any, accessToken, refreshToken);
      if (userWorkspaces.length > 0) {
        if (userWorkspaces.length === 1) {
          useStore.getState().setWorkspace(userWorkspaces[0]);
          useStore.getState().createWorkspace(userWorkspaces[0]);
        } else {
          useStore.setState((s: any) => { s.workspaces = userWorkspaces; });
          setWorkspaces(userWorkspaces);
          setStep('workspaces');
          setLoading(false);
          return;
        }
      }
      useStore.getState().setOnboardingComplete(true);
      setStep('success');
      setTimeout(() => navigate('/projects', { replace: true }), 900);
    } catch (err: any) {
      setLoading(false);
      if (err.status === 401) setError('Incorrect email or password. Please try again.');
      else if (err.status === 403) setError('Please verify your email before signing in.');
      else if (err.status === 404) setError('No account found with this email.');
      else setError('Something went wrong. Please try again.');
    }
  };

  const handleWorkspacePick = (ws: any) => {
    useStore.getState().setWorkspace(ws);
    useStore.getState().setOnboardingComplete(true);
    setStep('success');
    setTimeout(() => navigate('/projects', { replace: true }), 900);
  };

  const fillDemo = () => {
    setEmail('investor@brixos.io');
    setPassword('InvestorDemo2024!');
    setStep('password');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflow: 'hidden',
    }}>
      {/* ── Left panel: Branding ── */}
      <div style={{
        width: '45%', flexShrink: 0,
        background: `linear-gradient(160deg, ${BRAND_DARK} 0%, #2d2f5e 50%, #1e1f42 100%)`,
        display: 'flex', flexDirection: 'column',
        padding: '48px 52px',
        position: 'relative', overflow: 'hidden',
      }}
        className="hidden lg:flex"
      >
        {/* Background glows */}
        <div style={{ position: 'absolute', top: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: `${BRAND}20`, filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: '#7c3aed18', filter: 'blur(60px)', pointerEvents: 'none' }} />

        {/* Logo */}
        <button
          onClick={() => navigate('/', { replace: true })}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 'auto' }}
        >
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #7c7ff0, #5b5fc7)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(91,95,199,0.5)',
          }}>
            <Zap size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            BrixOS
          </span>
        </button>

        {/* Main headline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 999, padding: '4px 12px',
            marginBottom: 24, width: 'fit-content',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Investor Demo
            </span>
          </div>

          <h1 style={{
            fontSize: 38, fontWeight: 900, color: '#fff',
            lineHeight: 1.1, letterSpacing: '-0.03em',
            margin: '0 0 16px',
          }}>
            The OS for<br />
            <span style={{ background: 'linear-gradient(135deg, #a5b4fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              modern teams
            </span>
          </h1>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 36px', maxWidth: 340 }}>
            Replace 12 tools with one unified platform. Chat, projects, AI agents, calls, docs and security — all in one.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 }}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} color="rgba(255,255,255,0.7)" />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Demo credentials card */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={12} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Demo Credentials
                </span>
              </div>
              <button
                onClick={fillDemo}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 6, padding: '3px 10px',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <Copy size={10} color={copied ? '#22c55e' : 'rgba(255,255,255,0.5)'} />
                <span style={{ fontSize: 10, fontWeight: 600, color: copied ? '#22c55e' : 'rgba(255,255,255,0.5)' }}>
                  {copied ? 'Filled!' : 'Use demo'}
                </span>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', width: 56, flexShrink: 0 }}>Email</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace' }}>investor@brixos.io</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', width: 56, flexShrink: 0 }}>Password</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace' }}>InvestorDemo2024!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: Form ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#fafafa',
        padding: '32px 24px',
        minHeight: '100vh',
      }}>
        {/* Mobile logo */}
        <button
          onClick={() => navigate('/', { replace: true })}
          className="lg:hidden"
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 32 }}
        >
          <div style={{ width: 32, height: 32, background: BRAND, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em' }}>BrixOS</span>
        </button>

        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Step: Email */}
          {step === 'email' && (
            <div style={{ animation: 'slideUp 0.25s ease' }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                Welcome back
              </h1>
              <p style={{ fontSize: 14, color: '#71717a', margin: '0 0 32px' }}>
                Sign in to your BrixOS workspace
              </p>

              {error && <ErrorBanner message={error} />}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3f3f46', marginBottom: 6 }}>
                  Work Email
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: '1.5px solid #e4e4e7', borderRadius: 10,
                  padding: '11px 14px', background: '#fff',
                  transition: 'border-color 0.15s',
                }}
                  onFocusCapture={(e) => (e.currentTarget.style.borderColor = BRAND)}
                  onBlurCapture={(e) => (e.currentTarget.style.borderColor = '#e4e4e7')}
                >
                  <Mail size={15} color="#a1a1aa" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                    style={{ flex: 1, fontSize: 14, border: 'none', outline: 'none', background: 'transparent', color: '#18181b', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              <PrimaryBtn onClick={handleEmailSubmit}>
                Continue <ArrowRight size={16} />
              </PrimaryBtn>

              {/* Mobile demo creds */}
              <button
                onClick={fillDemo}
                className="lg:hidden"
                style={{
                  width: '100%', marginTop: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '11px', borderRadius: 10,
                  border: '1.5px dashed #d4d4d8',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, color: '#71717a',
                }}
              >
                <Lock size={13} />
                Use demo credentials
              </button>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#71717a', marginTop: 20 }}>
                Don't have an account?{' '}
                <a href="/#/start" style={{ color: BRAND, fontWeight: 600, textDecoration: 'none' }}>
                  Create workspace
                </a>
              </p>
            </div>
          )}

          {/* Step: Password */}
          {step === 'password' && (
            <div style={{ animation: 'slideUp 0.25s ease' }}>
              <button
                onClick={() => { setError(''); setStep('email'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', fontSize: 13, fontWeight: 500, marginBottom: 24, padding: 0 }}
              >
                <ChevronLeft size={16} /> Back
              </button>

              {/* Email pill */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#f4f4f5', borderRadius: 10, padding: '10px 14px',
                marginBottom: 28,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mail size={15} color="#fff" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#18181b' }}>{email}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#71717a' }}>Signing in to BrixOS</p>
                </div>
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                Enter your password
              </h1>
              <p style={{ fontSize: 14, color: '#71717a', margin: '0 0 28px' }}>
                Welcome back! Secure your session.
              </p>

              {error && <ErrorBanner message={error} />}

              <form onSubmit={handlePasswordSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#3f3f46' }}>Password</label>
                    <a href="/#/forgot-password" style={{ fontSize: 12, color: BRAND, fontWeight: 500, textDecoration: 'none' }}>
                      Forgot password?
                    </a>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    border: '1.5px solid #e4e4e7', borderRadius: 10,
                    padding: '11px 14px', background: '#fff',
                    transition: 'border-color 0.15s',
                  }}
                    onFocusCapture={(e) => (e.currentTarget.style.borderColor = BRAND)}
                    onBlurCapture={(e) => (e.currentTarget.style.borderColor = '#e4e4e7')}
                  >
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      autoFocus
                      required
                      style={{ flex: 1, fontSize: 14, border: 'none', outline: 'none', background: 'transparent', color: '#18181b', fontFamily: 'inherit' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', padding: 0 }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <PrimaryBtn type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span style={{
                        width: 15, height: 15,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff', borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite', display: 'inline-block',
                      }} />
                      Signing in…
                    </>
                  ) : (
                    <>Sign In <ArrowRight size={16} /></>
                  )}
                </PrimaryBtn>
              </form>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#71717a', marginTop: 20 }}>
                Don't have an account?{' '}
                <a href="/#/start" style={{ color: BRAND, fontWeight: 600, textDecoration: 'none' }}>Create workspace</a>
              </p>
            </div>
          )}

          {/* Step: Pick workspace */}
          {step === 'workspaces' && (
            <div style={{ animation: 'slideUp 0.25s ease' }}>
              <button
                onClick={() => { setError(''); setStep('password'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', fontSize: 13, marginBottom: 24, padding: 0 }}
              >
                <ChevronLeft size={16} /> Back
              </button>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                Select workspace
              </h1>
              <p style={{ fontSize: 14, color: '#71717a', margin: '0 0 28px' }}>
                You're a member of {workspaces.length} workspaces.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleWorkspacePick(ws)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', borderRadius: 12, width: '100%', textAlign: 'left',
                      border: '1.5px solid #e4e4e7', background: '#fff', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.background = '#f5f5ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e4e4e7'; e.currentTarget.style.background = '#fff'; }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>
                      {ws.name?.[0]?.toUpperCase() || 'W'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#18181b' }}>{ws.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#71717a' }}>{ws.memberCount} members</p>
                    </div>
                    <ArrowRight size={15} color="#a1a1aa" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', animation: 'slideUp 0.3s ease' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, boxShadow: '0 0 0 8px #f0fdf4',
              }}>
                <CheckCircle2 size={36} color="#16a34a" strokeWidth={2} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#18181b', letterSpacing: '-0.02em', margin: '0 0 8px', textAlign: 'center' }}>
                Welcome back!
              </h2>
              <p style={{ fontSize: 14, color: '#71717a', margin: 0, textAlign: 'center' }}>
                Loading your workspace…
              </p>
              <div style={{ marginTop: 24, display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: BRAND,
                    animation: `pulse 1.2s ease ${i * 0.2}s infinite`,
                    opacity: 0.5,
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ position: 'fixed', bottom: 20, fontSize: 11, color: '#a1a1aa', textAlign: 'center' }}>
          © 2025 BrixOS — Enterprise AI Collaboration Platform
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
      `}</style>
    </div>
  );
}

/* ── Sub-components ── */

function PrimaryBtn({ children, onClick, type = 'button', disabled }: {
  children: React.ReactNode; onClick?: () => void;
  type?: 'button' | 'submit'; disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '13px', borderRadius: 10, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#a1a1aa' : `linear-gradient(135deg, #6366f1, #5b5fc7)`,
        color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
        boxShadow: disabled ? 'none' : '0 4px 14px rgba(91,95,199,0.35)',
        transition: 'all 0.15s', fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.boxShadow = '0 6px 20px rgba(91,95,199,0.45)'; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.boxShadow = '0 4px 14px rgba(91,95,199,0.35)'; }}
    >
      {children}
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: '#fef2f2', border: '1px solid #fecaca',
      borderRadius: 10, padding: '10px 14px', marginBottom: 18,
    }}>
      <AlertCircle size={15} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#dc2626', lineHeight: 1.4 }}>{message}</span>
    </div>
  );
}
