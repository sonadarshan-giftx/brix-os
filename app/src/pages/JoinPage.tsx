import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useStore } from '@/store/useStore';
import {
  Zap,
  Building2,
  ArrowRight,
  Mail,
  Users,
  CheckCircle2,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   Join — Join a workspace via invite link or slug
   For employees joining an existing company
   ═══════════════════════════════════════════ */

export default function JoinPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const workspace = useStore((s) => s.workspaces.find((w) => w.slug === slug));

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If workspace not found, show "request access" flow
  const workspaceExists = !!workspace;

  const handleJoin = async () => {
    if (!email.trim() || !name.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    // Simulate: create user + add to workspace
    const newUser = {
      id: `u-${Date.now()}`,
      name,
      email,
      role: 'MEMBER' as const,
      initials: name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      avatar: null,
      status: 'online' as const,
      bio: `Member at ${workspace?.name || slug}`,
    };

    if (workspaceExists && workspace) {
      // Add to workspace members
      const store = useStore.getState();
      store.addWorkspaceMember(workspace.id, {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: 'MEMBER',
        status: 'active',
        joinedAt: new Date().toISOString(),
      });
      store.setCurrentUser(newUser, 'mock-token', 'mock-refresh');
      store.setWorkspace(workspace);
    } else {
      // No workspace found — just set user, they will need to be approved
      useStore.getState().setCurrentUser(newUser, 'mock-token', 'mock-refresh');
    }

    setLoading(false);
    setStep(2);
  };

  const enterDashboard = () => {
    navigate('/projects', { replace: true });
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
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
          <span className="text-base font-semibold" style={{ color: '#242424' }}>Brixstac</span>
        </div>
      </div>

      <div
        className="w-full max-w-[440px] rounded-2xl px-8 py-10"
        style={{ backgroundColor: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}
      >
        {step === 1 && (
          <>
            {/* Workspace card */}
            <div
              className="mb-6 flex items-center gap-3 rounded-xl p-4"
              style={{ backgroundColor: '#f8f8f7', border: '1px solid #e8e8e8' }}
            >
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: 44, height: 44, backgroundColor: workspaceExists ? '#5b5fc7' : '#e1e1e1' }}
              >
                <Building2 size={20} color="#fff" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#242424' }}>
                  {workspaceExists ? workspace?.name : 'Workspace'}
                </p>
                <p className="text-[11px]" style={{ color: '#616161' }}>
                  {slug}.brixstac.io
                </p>
              </div>
              {workspaceExists && (
                <span
                  className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: '#e6f4ea', color: '#237b4b' }}
                >
                  Active
                </span>
              )}
            </div>

            <h1 className="mb-1 text-xl font-bold" style={{ color: '#242424' }}>
              {workspaceExists ? `Join ${workspace?.name}` : 'Request Access'}
            </h1>
            <p className="mb-6 text-sm" style={{ color: '#616161' }}>
              {workspaceExists
                ? 'Create your account to join the team workspace.'
                : 'This workspace is private. Request access by creating an account.'}
            </p>

            {error && (
              <div className="mb-4 rounded-lg p-3 text-sm" style={{ backgroundColor: '#fde8ec', color: '#c4314b' }}>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#616161' }}>
                  Full Name
                </label>
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#d1d1d1' }}>
                  <Users size={16} color="#a0a0a0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`jane@${slug}.com`}
                    className="w-full text-sm outline-none"
                    style={{ background: 'transparent' }}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#616161' }}>
                  Create Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-[#5b5fc7]"
                  style={{ borderColor: '#d1d1d1', backgroundColor: '#fff' }}
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={loading}
                className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#5b5fc7', border: 'none', fontSize: 14 }}
              >
                {loading ? 'Creating account...' : (
                  <>
                    {workspaceExists ? 'Join Workspace' : 'Request Access'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            <p className="mt-4 text-center text-[11px]" style={{ color: '#a0a0a0' }}>
              Already have an account? <a href="/#/login" className="font-medium hover:underline" style={{ color: '#5b5fc7' }}>Sign in</a>
            </p>
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center py-6">
            <div
              className="mb-4 flex items-center justify-center rounded-full"
              style={{ width: 64, height: 64, backgroundColor: '#e6f4ea' }}
            >
              <CheckCircle2 size={32} color="#237b4b" />
            </div>

            <h2 className="mb-1 text-center text-lg font-bold" style={{ color: '#242424' }}>
              {workspaceExists ? `Welcome to ${workspace?.name}` : 'Request Submitted'}
            </h2>
            <p className="mb-6 text-center text-sm" style={{ color: '#616161' }}>
              {workspaceExists
                ? 'Your account is ready. Your workspace admin has been notified.'
                : 'The workspace admin will review your request and send an invite.'}
            </p>

            <button
              onClick={enterDashboard}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#5b5fc7', border: 'none', fontSize: 14 }}
            >
              Go to Dashboard
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
