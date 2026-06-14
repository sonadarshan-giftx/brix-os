import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '@/components/shared/Card';
import { Avatar } from '@/components/shared/Avatar';
import { StatusChip } from '@/components/shared/StatusChip';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Globe,
  Shield,
  Bot,
  FolderKanban,
  Users,
  Plug,
  X,
  HelpCircle,
  Copy,
  CheckCircle2,
  Sparkles,
  Code2,
  Palette,
  Wrench,
  Github,
  MessageSquare,
  BookText,
  Settings,
} from 'lucide-react';

/* ── types ── */
type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/* ── step labels ── */
const stepMeta = [
  { num: 1, label: 'Signup', icon: User },
  { num: 2, label: 'Company', icon: Building2 },
  { num: 3, label: 'Domain', icon: Globe },
  { num: 4, label: 'Security', icon: Shield },
  { num: 5, label: 'First Hire', icon: Bot },
  { num: 6, label: 'Project', icon: FolderKanban },
  { num: 7, label: 'Invite', icon: Users },
  { num: 8, label: 'Connect', icon: Plug },
];

/* ── AI archetypes for Step 5 ── */
const aiArchetypes = [
  {
    id: 'pm',
    name: 'AI Project Manager',
    avatar: '/avatar-manager.jpg',
    role: 'Project Manager',
    level: 'Senior',
    cost: 800,
    model: 'Claude Sonnet',
    benchmark: '94% ticket completion rate',
    description: 'Plans sprints, tracks progress, identifies risks, runs ceremonies',
    skills: ['Sprint Planning', 'Risk Analysis', 'Reporting', 'Facilitation'],
    recommended: true,
  },
  {
    id: 'be-dev',
    name: 'AI Senior Developer (Backend)',
    avatar: '/avatar-sage.jpg',
    role: 'Backend Developer',
    level: 'Senior',
    cost: 2000,
    model: 'Claude Opus',
    benchmark: '99.2% API reliability',
    description: 'Designs APIs, manages data, ensures system reliability',
    skills: ['Node.js', 'PostgreSQL', 'Microservices', 'API Design'],
    recommended: false,
  },
  {
    id: 'fe-dev',
    name: 'AI Senior Developer (Frontend)',
    avatar: '/avatar-aria.jpg',
    role: 'Frontend Developer',
    level: 'Senior',
    cost: 2000,
    model: 'Claude Opus',
    benchmark: '92% code review approval',
    description: 'Builds UIs, reviews code, writes tests, and mentors the team',
    skills: ['React', 'TypeScript', 'Architecture', 'Code Review'],
    recommended: false,
  },
  {
    id: 'qa',
    name: 'AI QA Engineer',
    avatar: '/avatar-priya.jpg',
    role: 'QA Engineer',
    level: 'IC4',
    cost: 600,
    model: 'Claude Sonnet',
    benchmark: '97% bug detection rate',
    description: 'Writes test plans, automates testing, ensures quality',
    skills: ['Test Automation', 'Cypress', 'CI/CD', 'Playwright'],
    recommended: false,
  },
  {
    id: 'designer',
    name: 'AI Designer',
    avatar: '/avatar-pixel.jpg',
    role: 'Designer',
    level: 'IC4',
    cost: 1200,
    model: 'Claude Sonnet',
    benchmark: '4.8/5 design consistency',
    description: 'Creates UI/UX, maintains design systems, prototypes',
    skills: ['UI Design', 'Figma', 'Design Systems', 'Accessibility'],
    recommended: false,
  },
  {
    id: 'devops',
    name: 'AI DevOps Engineer',
    avatar: '/avatar-echo.jpg',
    role: 'DevOps Engineer',
    level: 'IC4',
    cost: 1500,
    model: 'Claude Sonnet',
    benchmark: '99.9% deployment success',
    description: 'Manages infrastructure, CI/CD, monitoring, security',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    recommended: false,
  },
];

/* ── integrations for Step 8 ── */
const integrations = [
  { id: 'github', name: 'GitHub', desc: 'Connect repositories for code tracking', icon: Github, connected: false },
  { id: 'linear', name: 'Linear', desc: 'Sync issues and project tracking', icon: Settings, connected: false },
  { id: 'slack', name: 'Slack', desc: 'Get notifications in your channels', icon: MessageSquare, connected: false, recommended: true },
  { id: 'notion', name: 'Notion', desc: 'Link documentation and wikis', icon: BookText, connected: false },
  { id: 'jira', name: 'Jira', desc: 'Two-way ticket synchronization', icon: FolderKanban, connected: false },
];

/* ═══════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════ */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(5);
  const [hired, setHired] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('A tax filing platform');
  const [invites, setInvites] = useState([
    { id: 'i1', email: 'maya@acme-brixos.com', name: 'Maya', role: 'Manager' as const },
    { id: 'i2', email: 'raj@acme-brixos.com', name: 'Raj', role: 'Member' as const },
    { id: 'i3', email: 'priya@acme-brixos.com', name: 'Priya', role: 'Member' as const },
  ]);
  const [connectedInts, setConnectedInts] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const completedSteps = step - 1;

  function goBack() {
    if (step > 1) setStep(((step - 1) as WizardStep));
  }

  function goNext() {
    if (step < 8) {
      setStep(((step + 1) as WizardStep));
    } else {
      setShowConfetti(true);
      setTimeout(() => navigate('/mission'), 2500);
    }
  }

  function hireAi(id: string) {
    if (!hired.includes(id)) {
      setHired([...hired, id]);
      // Auto-advance after hiring PM
      if (id === 'pm') {
        setTimeout(() => setStep(6), 800);
      }
    }
  }

  function toggleIntegration(id: string) {
    setConnectedInts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function isStepClickable(s: number) {
    return s <= completedSteps + 1;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#ffffff' }}>
      {/* Confetti keyframes */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {/* ── Progress Header ── */}
      <header
        className="flex items-center justify-between flex-shrink-0"
        style={{
          height: 64,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e1e1e1',
          padding: '0 24px',
        }}
      >
        {/* Left: logo */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded font-bold text-white"
            style={{ width: 28, height: 28, backgroundColor: '#D97757', fontSize: 14 }}
          >
            I
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>Setup</span>
        </div>

        {/* Center: step indicators */}
        <div className="flex items-center gap-0">
          {stepMeta.map((s, idx) => {
            const StepIcon = s.icon;
            const isCompleted = s.num <= completedSteps;
            const isCurrent = s.num === step;
            const isClickable = isStepClickable(s.num);

            return (
              <div key={s.num} className="flex items-center">
                {/* Connector line */}
                {idx > 0 && (
                  <div
                    style={{
                      width: 24,
                      height: 2,
                      backgroundColor: isCompleted ? '#D97757' : '#e1e1e1',
                      margin: '0 4px',
                    }}
                  />
                )}
                {/* Circle */}
                <button
                  onClick={() => isClickable && setStep(s.num as WizardStep)}
                  className="flex items-center justify-center rounded-full transition-all"
                  disabled={!isClickable}
                  style={{
                    width: 28,
                    height: 28,
                    border: isCompleted || isCurrent ? 'none' : '2px solid #d1d1d1',
                    backgroundColor: isCompleted
                      ? '#D97757'
                      : isCurrent
                        ? '#D97757'
                        : '#ffffff',
                    color: isCompleted || isCurrent ? '#ffffff' : '#616161',
                    cursor: isClickable ? 'pointer' : 'default',
                    opacity: isClickable ? 1 : 0.5,
                  }}
                >
                  {isCompleted ? (
                    <Check size={14} />
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{s.num}</span>
                  )}
                </button>
                {/* Label */}
                <span
                  className="ml-1 hidden lg:inline"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isCurrent ? '#D97757' : isCompleted ? '#242424' : '#a0a0a0',
                  }}
                >
                  {s.label}
                  {isCompleted && <span className="ml-0.5">✓</span>}
                  {isCurrent && <span className="ml-0.5">→</span>}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button onClick={() => showToast("Help docs: brixos.io/docs", "info")} className="flex items-center gap-1 cursor-pointer" style={{ fontSize: 12, color: '#616161' }}>
            <HelpCircle size={14} />
            <span className="hidden sm:inline">Need help?</span>
          </button>
          <button
            className="cursor-pointer"
            onClick={() => navigate('/mission')}
            style={{ color: '#616161' }}
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* ── Step Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
          {step === 1 && <Step1Signup />}
          {step === 2 && <Step2Company />}
          {step === 3 && <Step3Domain />}
          {step === 4 && <Step4Security />}
          {step === 5 && <Step5Hire hired={hired} onHire={hireAi} />}
          {step === 6 && <Step6Project projectName={projectName} setProjectName={setProjectName} />}
          {step === 7 && <Step7Invite invites={invites} setInvites={setInvites} />}
          {step === 8 && (
            <Step8Integrations
              connected={connectedInts}
              toggle={toggleIntegration}
            />
          )}
        </div>
      </main>

      {/* ── Confetti overlay ── */}
      {showConfetti && <ConfettiOverlay />}

      {/* ── Navigation Footer ── */}
      <footer
        className="flex items-center justify-between flex-shrink-0"
        style={{
          height: 56,
          borderTop: '1px solid #e1e1e1',
          padding: '0 24px',
          backgroundColor: '#ffffff',
        }}
      >
        <button
          onClick={goBack}
          disabled={step === 1}
          className="flex items-center gap-1 rounded px-3 font-medium cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            height: 32,
            fontSize: 13,
            color: '#242424',
            border: '1px solid #d1d1d1',
            backgroundColor: 'transparent',
          }}
        >
          <ChevronLeft size={14} />
          Back
        </button>

        <span style={{ fontSize: 11, color: '#616161' }}>
          Step {step} of 8
        </span>

        <div className="flex items-center gap-2">
          {step < 8 && (
            <button
              onClick={goNext}
              className="cursor-pointer"
              style={{
                height: 32,
                fontSize: 13,
                color: '#616161',
                backgroundColor: 'transparent',
                border: 'none',
                padding: '0 8px',
              }}
            >
              Skip
            </button>
          )}
          <button
            onClick={goNext}
            className="flex items-center gap-1 rounded px-4 font-medium cursor-pointer"
            style={{
              height: 32,
              fontSize: 13,
              backgroundColor: '#D97757',
              color: '#ffffff',
              border: 'none',
            }}
          >
            {step === 8 ? 'Finish Setup' : 'Continue'}
            <ChevronRight size={14} />
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 1: Signup (completed display)
   ═══════════════════════════════════════════════ */
function Step1Signup() {
  return (
    <div className="mx-auto" style={{ maxWidth: 400 }}>
      <div className="text-center mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#242424' }}>Create your account</h1>
        <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>
          Start building your AI-powered engineering team
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#616161', display: 'block', marginBottom: 4 }}>
            Work email
          </label>
          <input
            type="email"
            value="alex@acme-brixos.com"
            disabled
            className="w-full rounded"
            style={{
              height: 32,
              padding: '0 12px',
              fontSize: 13,
              border: '1px solid #d1d1d1',
              backgroundColor: '#f0f0f0',
              color: '#616161',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#616161', display: 'block', marginBottom: 4 }}>
            Password
          </label>
          <input
            type="password"
            value="••••••••••••"
            disabled
            className="w-full rounded"
            style={{
              height: 32,
              padding: '0 12px',
              fontSize: 13,
              border: '1px solid #d1d1d1',
              backgroundColor: '#f0f0f0',
              color: '#616161',
            }}
          />
        </div>

        <button
          disabled
          className="w-full rounded font-medium cursor-not-allowed"
          style={{
            height: 32,
            fontSize: 13,
            backgroundColor: '#D97757',
            color: '#ffffff',
            opacity: 0.6,
          }}
        >
          Create Account
        </button>

        <div className="flex items-center gap-3 my-3">
          <div className="flex-1" style={{ height: 1, backgroundColor: '#e1e1e1' }} />
          <span style={{ fontSize: 11, color: '#767676' }}>or</span>
          <div className="flex-1" style={{ height: 1, backgroundColor: '#e1e1e1' }} />
        </div>

        <button
          disabled
          className="w-full flex items-center justify-center gap-2 rounded cursor-not-allowed"
          style={{
            height: 32,
            fontSize: 13,
            border: '1px solid #d1d1d1',
            backgroundColor: '#f0f0f0',
            color: '#616161',
          }}
        >
          Continue with Google
        </button>
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 rounded cursor-not-allowed"
          style={{
            height: 32,
            fontSize: 13,
            border: '1px solid #d1d1d1',
            backgroundColor: '#f0f0f0',
            color: '#616161',
          }}
        >
          Continue with Microsoft
        </button>

        <div className="flex items-center gap-2 mt-4" style={{ padding: 12, backgroundColor: '#e8eaf6', borderRadius: 6 }}>
          <CheckCircle2 size={16} color="#237b4b" />
          <span style={{ fontSize: 12, color: '#237b4b', fontWeight: 600 }}>Account created successfully</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 2: Company Profile (completed)
   ═══════════════════════════════════════════════ */
function Step2Company() {
  return (
    <div className="mx-auto" style={{ maxWidth: 500 }}>
      <div className="text-center mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#242424' }}>Tell us about your company</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#616161', display: 'block', marginBottom: 4 }}>
            Company name
          </label>
          <input
            type="text"
            value="Acme Software"
            disabled
            className="w-full rounded"
            style={{
              height: 32,
              padding: '0 12px',
              fontSize: 13,
              border: '1px solid #d1d1d1',
              backgroundColor: '#f0f0f0',
              color: '#242424',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#616161', display: 'block', marginBottom: 4 }}>
            Industry
          </label>
          <input
            type="text"
            value="Financial Technology"
            disabled
            className="w-full rounded"
            style={{
              height: 32,
              padding: '0 12px',
              fontSize: 13,
              border: '1px solid #d1d1d1',
              backgroundColor: '#f0f0f0',
              color: '#242424',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#616161', display: 'block', marginBottom: 4 }}>
            Team size
          </label>
          <input
            type="text"
            value="10-50"
            disabled
            className="w-full rounded"
            style={{
              height: 32,
              padding: '0 12px',
              fontSize: 13,
              border: '1px solid #d1d1d1',
              backgroundColor: '#f0f0f0',
              color: '#242424',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#616161', display: 'block', marginBottom: 4 }}>
            Description
          </label>
          <textarea
            value="Acme Software builds financial technology solutions for tax filing, payments, and compliance. We're a team of 12 people looking to scale our engineering capacity with AI."
            disabled
            className="w-full rounded"
            style={{
              padding: 12,
              fontSize: 13,
              border: '1px solid #d1d1d1',
              backgroundColor: '#f0f0f0',
              color: '#242424',
              minHeight: 80,
              resize: 'vertical',
            }}
          />
        </div>

        <div className="flex items-center gap-2 mt-4" style={{ padding: 12, backgroundColor: '#e8eaf6', borderRadius: 6 }}>
          <CheckCircle2 size={16} color="#237b4b" />
          <span style={{ fontSize: 12, color: '#237b4b', fontWeight: 600 }}>Company profile saved</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 3: Domain Verification (completed)
   ═══════════════════════════════════════════════ */
function Step3Domain() {
  const dnsRecords = [
    { type: 'TXT', name: '@', value: 'brixos-verification=abc123xyz789', status: 'verified' as const },
    { type: 'MX', name: '@', value: 'mx1.acme-brixos.com', status: 'verified' as const },
    { type: 'SPF', name: '@', value: 'v=spf1 include:_spf.acme-brixos.com ~all', status: 'verified' as const },
  ];

  return (
    <div className="mx-auto" style={{ maxWidth: 560 }}>
      <div className="text-center mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#242424' }}>Verify your domain</h1>
        <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>
          This ensures only people from your organization can join
        </p>
      </div>

      <div className="mb-4">
        <label style={{ fontSize: 12, fontWeight: 600, color: '#616161', display: 'block', marginBottom: 4 }}>
          Domain
        </label>
        <input
          type="text"
          value="acme-brixos.com"
          disabled
          className="w-full rounded"
          style={{
            height: 32,
            padding: '0 12px',
            fontSize: 13,
            border: '1px solid #d1d1d1',
            backgroundColor: '#f0f0f0',
            color: '#242424',
          }}
        />
      </div>

      <Card padding="md" className="mb-4">
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
          DNS Records
        </h4>
        <table className="w-full" style={{ fontSize: 13 }}>
          <thead>
            <tr style={{ color: '#616161', fontSize: 11, fontWeight: 600, textAlign: 'left' }}>
              <th style={{ paddingBottom: 8 }}>Type</th>
              <th style={{ paddingBottom: 8 }}>Name</th>
              <th style={{ paddingBottom: 8 }}>Value</th>
              <th style={{ paddingBottom: 8 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {dnsRecords.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={{ padding: '8px 0', fontFamily: 'monospace', fontSize: 12 }}>{r.type}</td>
                <td style={{ padding: '8px 0' }}>{r.name}</td>
                <td
                  style={{
                    padding: '8px 0',
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: '#616161',
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.value}
                </td>
                <td style={{ padding: '8px 0' }}>
                  <span className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: '#237b4b' }}>
                    <Check size={12} />
                    Verified
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center gap-2" style={{ padding: 12, backgroundColor: '#e8eaf6', borderRadius: 6 }}>
        <CheckCircle2 size={16} color="#237b4b" />
        <span style={{ fontSize: 12, color: '#237b4b', fontWeight: 600 }}>Domain verified</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 4: Security Baseline (completed)
   ═══════════════════════════════════════════════ */
function Step4Security() {
  return (
    <div className="mx-auto" style={{ maxWidth: 500 }}>
      <div className="text-center mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#242424' }}>Secure your workspace</h1>
      </div>

      <div className="space-y-4">
        <Card padding="md" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={18} color="#D97757" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>Two-Factor Authentication</div>
              <div style={{ fontSize: 11, color: '#616161' }}>Require 2FA for all team members</div>
            </div>
          </div>
          <StatusChip status="ai-active" label="Enabled" />
        </Card>

        <Card padding="md" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings size={18} color="#D97757" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>Session Length</div>
              <div style={{ fontSize: 11, color: '#616161' }}>Auto-logout after inactivity</div>
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>8 hours</span>
        </Card>

        <Card padding="md" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe size={18} color="#D97757" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>WireGuard VPN</div>
              <div style={{ fontSize: 11, color: '#616161' }}>Optional secure network access</div>
            </div>
          </div>
          <button
            className="rounded px-3 cursor-pointer"
            style={{
              height: 28,
              fontSize: 12,
              border: '1px solid #d1d1d1',
              backgroundColor: 'transparent',
              color: '#616161',
            }}
          >
            Set up later
          </button>
        </Card>

        <div className="flex items-center gap-2 mt-4" style={{ padding: 12, backgroundColor: '#e8eaf6', borderRadius: 6 }}>
          <CheckCircle2 size={16} color="#237b4b" />
          <span style={{ fontSize: 12, color: '#237b4b', fontWeight: 600 }}>Security baseline configured</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 5: First AI Hire (ACTIVE)
   ═══════════════════════════════════════════════ */
function Step5Hire({ hired, onHire }: { hired: string[]; onHire: (id: string) => void }) {
  return (
    <div>
      <div className="text-center mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#242424' }}>Hire your first AI employee</h1>
        <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>
          AI employees work alongside your team 24/7. Choose your first hire.
        </p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {aiArchetypes.map((ai) => {
          const isHired = hired.includes(ai.id);
          return (
            <Card
              key={ai.id}
              padding="lg"
              className="relative"
              hoverable={!isHired}
              onClick={() => {if(isHired){setHired(hired.filter(id=>id!==ai.id))}else{setHired([...hired,ai.id])}}}
            >
              {ai.recommended && (
                <div
                  className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1"
                  style={{
                    height: 24,
                    backgroundColor: '#e8eaf6',
                    borderRadius: '6px 6px 0 0',
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#D97757',
                  }}
                >
                  <Sparkles size={10} />
                  RECOMMENDED
                </div>
              )}
              <div className={ai.recommended ? 'mt-4' : ''}>
                <div className="flex items-start justify-between mb-3">
                  <Avatar src={ai.avatar} alt={ai.name} size="lg" isAi={true} />
                  <div className="text-right">
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#242424' }}>
                      ${ai.cost.toLocaleString()}
                      <span style={{ fontSize: 11, fontWeight: 400, color: '#616161' }}>/mo</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#767676' }}>{ai.model}</div>
                  </div>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 2 }}>
                  {ai.name}
                </h3>
                <p style={{ fontSize: 12, color: '#616161', marginBottom: 8 }}>{ai.description}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {ai.skills.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="rounded-full px-2"
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        height: 18,
                        lineHeight: '18px',
                        backgroundColor: '#f0f0f0',
                        color: '#616161',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div
                  className="flex items-center gap-1 mb-3"
                  style={{ fontSize: 11, color: '#237b4b', fontWeight: 500 }}
                >
                  <Zap size={12} />
                  {ai.benchmark}
                </div>

                <button
                  onClick={() => onHire(ai.id)}
                  disabled={isHired}
                  className="w-full rounded font-medium cursor-pointer disabled:cursor-default"
                  style={{
                    height: 32,
                    fontSize: 13,
                    backgroundColor: isHired ? '#e8eaf6' : '#D97757',
                    color: isHired ? '#D97757' : '#ffffff',
                    border: 'none',
                  }}
                >
                  {isHired ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check size={14} />
                      Hired
                    </span>
                  ) : (
                    'Hire'
                  )}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 6: First Project
   ═══════════════════════════════════════════════ */
function Step6Project({
  projectName,
  setProjectName,
}: {
  projectName: string;
  setProjectName: (v: string) => void;
}) {
  const goals = [
    { id: 'g1', text: 'Launch MVP with core tax filing workflows', complete: true },
    { id: 'g2', text: 'Integrate with IRS e-File API', complete: false },
    { id: 'g3', text: 'Pass SOC 2 Type II audit', complete: false },
  ];

  const krs = [
    { id: 'kr1', text: 'Process 10K+ tax returns', current: 8400, target: 10000, unit: 'returns' },
    { id: 'kr2', text: 'Achieve 99.9% uptime', current: 99.7, target: 99.9, unit: '%' },
    { id: 'kr3', text: '< 2hr average support response', current: 1.8, target: 2, unit: 'hours' },
  ];

  return (
    <div className="mx-auto" style={{ maxWidth: 600 }}>
      <div className="text-center mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#242424' }}>Create your first project</h1>
      </div>

      <div className="mb-4">
        <label style={{ fontSize: 12, fontWeight: 600, color: '#616161', display: 'block', marginBottom: 4 }}>
          What do you want to build?
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full rounded"
          style={{
            height: 32,
            padding: '0 12px',
            fontSize: 13,
            border: '1px solid #d1d1d1',
            color: '#242424',
          }}
        />
      </div>

      <Card padding="lg" className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} color="#D97757" />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>AI-Generated Plan Preview</h3>
        </div>

        {/* Goals */}
        <div className="mb-4">
          <h4 style={{ fontSize: 12, fontWeight: 600, color: '#616161', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Goals
          </h4>
          <div className="space-y-2">
            {goals.map((g) => (
              <div key={g.id} className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: g.complete ? '#237b4b' : '#d1d1d1',
                  }}
                >
                  <Check size={10} color="#ffffff" />
                </div>
                <span style={{ fontSize: 13, color: '#242424' }}>{g.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Results */}
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: '#616161', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Key Results
          </h4>
          <div className="space-y-3">
            {krs.map((kr) => {
              const pct = Math.min(100, Math.round((kr.current / kr.target) * 100));
              return (
                <div key={kr.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 13, color: '#242424' }}>{kr.text}</span>
                    <span style={{ fontSize: 11, color: '#616161' }}>
                      {kr.current.toLocaleString()} / {kr.target.toLocaleString()} {kr.unit}
                    </span>
                  </div>
                  <div className="w-full rounded-full" style={{ height: 6, backgroundColor: '#f0f0f0' }}>
                    <div
                      className="rounded-full"
                      style={{
                        height: 6,
                        width: `${pct}%`,
                        backgroundColor: pct >= 80 ? '#92c353' : '#ffaa44',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="text-center">
        <button
          className="rounded px-6 font-medium cursor-pointer"
          style={{
            height: 36,
            fontSize: 14,
            backgroundColor: '#D97757',
            color: '#ffffff',
            border: 'none',
          }}
        >
          Commit Project
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 7: Invite Humans
   ═══════════════════════════════════════════════ */
function Step7Invite({
  invites,
  setInvites,
}: {
  invites: { id: string; email: string; name: string; role: 'Manager' | 'Member' }[];
  setInvites: React.Dispatch<React.SetStateAction<{ id: string; email: string; name: string; role: 'Manager' | 'Member' }[]>>;
}) {
  const [newEmail, setNewEmail] = useState('');

  function addInvite() {
    if (!newEmail.trim()) return;
    const name = newEmail.split('@')[0];
    setInvites([...invites, { id: `i-${Date.now()}`, email: newEmail, name: name.charAt(0).toUpperCase() + name.slice(1), role: 'Member' }]);
    setNewEmail('');
  }

  function updateRole(id: string, role: 'Manager' | 'Member') {
    setInvites(invites.map((inv) => (inv.id === id ? { ...inv, role } : inv)));
  }

  function removeInvite(id: string) {
    setInvites(invites.filter((inv) => inv.id !== id));
  }

  return (
    <div className="mx-auto" style={{ maxWidth: 500 }}>
      <div className="text-center mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#242424' }}>Invite your team</h1>
        <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>
          Add the human engineers who will work alongside your AI team
        </p>
      </div>

      {/* Add email */}
      <div className="flex gap-2 mb-4">
        <input
          type="email"
          placeholder="Enter email address"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addInvite()}
          className="flex-1 rounded"
          style={{
            height: 32,
            padding: '0 12px',
            fontSize: 13,
            border: '1px solid #d1d1d1',
            color: '#242424',
          }}
        />
        <button
          onClick={addInvite}
          className="rounded px-3 font-medium cursor-pointer"
          style={{
            height: 32,
            fontSize: 13,
            backgroundColor: '#D97757',
            color: '#ffffff',
            border: 'none',
          }}
        >
          Add
        </button>
      </div>

      {/* Invites list */}
      <div className="space-y-2 mb-6">
        {invites.map((inv) => (
          <Card key={inv.id} padding="md" className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar initials={inv.name.charAt(0)} alt={inv.name} size="sm" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>{inv.name}</div>
                <div style={{ fontSize: 11, color: '#616161' }}>{inv.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={inv.role}
                onChange={(e) => updateRole(inv.id, e.target.value as 'Manager' | 'Member')}
                className="rounded cursor-pointer"
                style={{
                  height: 28,
                  fontSize: 12,
                  border: '1px solid #d1d1d1',
                  padding: '0 8px',
                  color: '#242424',
                }}
              >
                <option value="Manager">Manager</option>
                <option value="Member">Member</option>
              </select>
              <button
                onClick={() => removeInvite(inv.id)}
                className="cursor-pointer"
                style={{ color: '#c4314b', padding: 4 }}
              >
                <X size={14} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <p style={{ fontSize: 12, color: '#616161', marginBottom: 12 }}>
          {invites.length} invitation{invites.length !== 1 ? 's' : ''} will be sent
        </p>
        <button
          className="rounded px-6 font-medium cursor-pointer"
          style={{
            height: 36,
            fontSize: 14,
            backgroundColor: '#D97757',
            color: '#ffffff',
            border: 'none',
          }}
        >
          Send Invites
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Step 8: Integrations
   ═══════════════════════════════════════════════ */
function Step8Integrations({
  connected,
  toggle,
}: {
  connected: string[];
  toggle: (id: string) => void;
}) {
  return (
    <div className="mx-auto" style={{ maxWidth: 600 }}>
      <div className="text-center mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#242424' }}>Connect your tools</h1>
        <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>
          Integrations let your AI team work with your existing toolchain
        </p>
      </div>

      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {integrations.map((intg) => {
          const isConnected = connected.includes(intg.id);
          const IntgIcon = intg.icon;
          return (
            <Card key={intg.id} padding="md" className="flex items-start gap-3">
              <div
                className="flex items-center justify-center rounded flex-shrink-0"
                style={{ width: 36, height: 36, backgroundColor: '#e8eaf6' }}
              >
                <IntgIcon size={18} color="#D97757" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>{intg.name}</span>
                  {(intg as { recommended?: boolean }).recommended && (
                    <StatusChip status="ai-active" label="Rec." />
                  )}
                </div>
                <p style={{ fontSize: 11, color: '#616161', marginBottom: 8 }}>{intg.desc}</p>
                <button
                  onClick={() => toggle(intg.id)}
                  className="rounded px-3 font-medium cursor-pointer"
                  style={{
                    height: 28,
                    fontSize: 12,
                    backgroundColor: isConnected ? '#e8eaf6' : '#ffffff',
                    color: isConnected ? '#D97757' : '#242424',
                    border: isConnected ? '1px solid #D97757' : '1px solid #d1d1d1',
                  }}
                >
                  {isConnected ? (
                    <span className="flex items-center gap-1">
                      <Check size={12} />
                      Connected
                    </span>
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <p style={{ fontSize: 12, color: '#767676' }} className="mb-4">
          Skip for now — you can add these later
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Confetti Overlay
   ═══════════════════════════════════════════════ */
function ConfettiOverlay() {
  // Simple CSS confetti
  const colors = ['#D97757', '#92c353', '#ffaa44', '#c4314b', '#237b4b'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none" style={{ overflow: 'hidden' }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : 2,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <div className="flex flex-col items-center justify-center h-full">
        <div
          className="flex items-center justify-center rounded-full mb-4"
          style={{ width: 80, height: 80, backgroundColor: '#e8eaf6' }}
        >
          <Check size={40} color="#237b4b" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#242424' }}>You&apos;re all set!</h1>
        <p style={{ fontSize: 14, color: '#616161', marginTop: 8 }}>Launching BrixOS...</p>
      </div>
    </div>
  );
}

/* ── Missing icon imports ── */
function Zap({ size, color }: { size: number; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
