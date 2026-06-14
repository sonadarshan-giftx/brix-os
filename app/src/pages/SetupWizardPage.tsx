import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Zap,
  Building2,
  Globe,
  Users,
  Shield,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Lock,
  Server,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   SetupWizard — First-time instance configuration
   Runs once when enterprise IT deploys Brixstac
   on their infrastructure.
   ═══════════════════════════════════════════ */

export default function SetupWizardPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [industry, setIndustry] = useState('Software & SaaS');
  const [licenseKey, setLicenseKey] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [allowedDomains, setAllowedDomains] = useState('');
  const [vpnOnly, setVpnOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleCompanyChange = (name: string) => {
    setCompanyName(name);
    setCompanySlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30)
    );
  };

  const handleStep1 = () => {
    if (!companyName.trim() || !companySlug.trim()) {
      setError('Company name and slug are required');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleStep2 = () => {
    if (!licenseKey.trim() || licenseKey.length < 20) {
      setError('Valid license key required');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleStep3 = () => {
    if (!adminEmail.trim() || !adminName.trim() || !adminPassword.trim()) {
      setError('All admin fields are required');
      return;
    }
    if (adminPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (adminPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setStep(4);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/instance/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          companySlug,
          industry,
          licenseKey,
          adminEmail,
          adminName,
          adminPassword,
          allowedDomains: allowedDomains.split(/[,\n]/).map((d) => d.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Setup failed');
        setLoading(false);
        return;
      }

      setResult(data);
      setStep(5);
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: '#0a0a0a', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div className="mb-8 flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 40, height: 40, backgroundColor: '#5b5fc7' }}
        >
          <Zap size={22} color="#fff" />
        </div>
        <div>
          <span className="text-lg font-bold text-white">BrixOS</span>
          <span className="ml-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: '#1a1a1a', color: '#a0a0a0' }}>
            Enterprise
          </span>
        </div>
      </div>

      <div
        className="w-full max-w-[560px] rounded-2xl px-8 py-8"
        style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a' }}
      >
        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-all"
              style={{ backgroundColor: s <= step ? '#5b5fc7' : '#2a2a2a' }}
            />
          ))}
        </div>

        {step < 5 && (
          <>
            <h1 className="mb-1 text-xl font-bold text-white">
              {step === 1 && 'Instance Configuration'}
              {step === 2 && 'License Activation'}
              {step === 3 && 'Create Admin Account'}
              {step === 4 && 'Network & Access'}
            </h1>
            <p className="mb-6 text-sm" style={{ color: '#888' }}>
              {step === 1 && 'Configure your company workspace on this instance.'}
              {step === 2 && 'Enter the license key provided by BrixOS sales.'}
              {step === 3 && 'Create the owner account for this instance.'}
              {step === 4 && 'Review settings and activate the instance.'}
            </p>
          </>
        )}

        {error && (
          <div className="mb-4 rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(196,49,75,0.15)', color: '#ff6b7a', border: '1px solid rgba(196,49,75,0.3)' }}>
            {error}
          </div>
        )}

        {/* Step 1: Company */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Company Name</label>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#2a2a2a', backgroundColor: '#1a1a1a' }}>
                <Building2 size={16} color="#666" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  placeholder="Acme Software"
                  className="w-full bg-transparent text-sm text-white outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Instance Slug</label>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#2a2a2a', backgroundColor: '#1a1a1a' }}>
                <Globe size={16} color="#666" />
                <input
                  type="text"
                  value={companySlug}
                  onChange={(e) => setCompanySlug(e.target.value)}
                  placeholder="acme-software"
                  className="w-full bg-transparent text-sm text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
                style={{ borderColor: '#2a2a2a', backgroundColor: '#1a1a1a' }}
              >
                {['Software & SaaS', 'Fintech', 'Healthcare', 'E-commerce', 'AI / ML', 'Manufacturing', 'Government', 'Defense'].map((i) => (
                  <option key={i} value={i} style={{ backgroundColor: '#1a1a1a' }}>{i}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStep1}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#5b5fc7', border: 'none', fontSize: 14 }}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: License */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>License Key</label>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#2a2a2a', backgroundColor: '#1a1a1a' }}>
                <KeyRound size={16} color="#666" />
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="OPTER-ENT-XXXXXXXX-XXXX-XXXX"
                  className="w-full bg-transparent text-sm text-white outline-none font-mono"
                  autoFocus
                />
              </div>
              <p className="mt-1 text-[11px]" style={{ color: '#666' }}>
                Contact sales@brixos.io if you need a license key.
              </p>
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(91,95,199,0.08)', border: '1px solid rgba(91,95,199,0.2)' }}>
              <div className="flex items-start gap-2">
                <Shield size={14} color="#5b5fc7" className="mt-0.5 shrink-0" />
                <p className="text-[11px]" style={{ color: '#888', lineHeight: 1.5 }}>
                  This license key is tied to your company domain and instance ID. It cannot be transferred. Offline validation is supported.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border py-3 text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ borderColor: '#2a2a2a', backgroundColor: 'transparent' }}
              >
                Back
              </button>
              <button
                onClick={handleStep2}
                className="flex-[2] flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#5b5fc7', border: 'none', fontSize: 14 }}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Admin */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Admin Name</label>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: '#2a2a2a', backgroundColor: '#1a1a1a' }}>
                <Users size={16} color="#666" />
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full bg-transparent text-sm text-white outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Admin Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="jane@acmesoftware.com"
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
                style={{ borderColor: '#2a2a2a', backgroundColor: '#1a1a1a' }}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
                style={{ borderColor: '#2a2a2a', backgroundColor: '#1a1a1a' }}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
                style={{ borderColor: '#2a2a2a', backgroundColor: '#1a1a1a' }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border py-3 text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ borderColor: '#2a2a2a', backgroundColor: 'transparent' }}
              >
                Back
              </button>
              <button
                onClick={handleStep3}
                className="flex-[2] flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#5b5fc7', border: 'none', fontSize: 14 }}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Network */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Allowed Email Domains</label>
              <textarea
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                placeholder="acmesoftware.com&#10;acme.com"
                rows={3}
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
                style={{ borderColor: '#2a2a2a', backgroundColor: '#1a1a1a', resize: 'vertical' }}
              />
              <p className="mt-1 text-[11px]" style={{ color: '#666' }}>
                Only users with these email domains can auto-provision accounts.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-lg p-3" style={{ backgroundColor: 'rgba(35,123,75,0.1)', border: '1px solid rgba(35,123,75,0.2)' }}>
              <Lock size={16} color="#237b4b" />
              <div>
                <p className="text-sm font-medium" style={{ color: '#7add9e' }}>VPN-Only Mode</p>
                <p className="text-[11px]" style={{ color: '#888' }}>This instance will only accept connections from your corporate VPN. Users authenticate via VPN identity headers.</p>
              </div>
              <input
                type="checkbox"
                checked={vpnOnly}
                onChange={(e) => setVpnOnly(e.target.checked)}
                className="ml-auto h-4 w-4 rounded"
                style={{ accentColor: '#237b4b' }}
              />
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <h3 className="mb-3 text-sm font-semibold text-white flex items-center gap-2">
                <Server size={14} /> Instance Summary
              </h3>
              <div className="space-y-1.5 text-[11px]" style={{ color: '#888' }}>
                <div className="flex justify-between"><span>Company</span><span className="text-white">{companyName || '—'}</span></div>
                <div className="flex justify-between"><span>Slug</span><span className="text-white">{companySlug || '—'}</span></div>
                <div className="flex justify-between"><span>License</span><span className="text-white">{licenseKey.slice(0, 15)}...</span></div>
                <div className="flex justify-between"><span>Admin</span><span className="text-white">{adminName || '—'} ({adminEmail || '—'})</span></div>
                <div className="flex justify-between"><span>VPN Only</span><span className="text-white">{vpnOnly ? 'Yes' : 'No'}</span></div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-xl border py-3 text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ borderColor: '#2a2a2a', backgroundColor: 'transparent' }}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#237b4b', border: 'none', fontSize: 14 }}
              >
                {loading ? 'Activating...' : (
                  <>
                    <CheckCircle2 size={16} />
                    Activate Instance
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && result && (
          <div className="flex flex-col items-center py-6">
            <div
              className="mb-4 flex items-center justify-center rounded-full"
              style={{ width: 64, height: 64, backgroundColor: 'rgba(35,123,75,0.15)' }}
            >
              <CheckCircle2 size={32} color="#237b4b" />
            </div>

            <h2 className="mb-1 text-center text-lg font-bold text-white">
              {result.instance?.companyName} is Active
            </h2>
            <p className="mb-6 text-center text-sm" style={{ color: '#888' }}>
              Instance activated with {result.instance?.licenseType} license.
              Expires {result.instance?.expiresAt ? new Date(result.instance.expiresAt).toLocaleDateString() : 'never'}.
            </p>

            <div className="mb-6 w-full rounded-lg p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Next Steps for IT Admin</p>
              <ol className="list-decimal space-y-1 pl-4 text-[11px]" style={{ color: '#888' }}>
                <li>Configure your VPN to inject identity headers (X-Forwarded-User, X-Forwarded-Email)</li>
                <li>Add allowed email domains to user provisioning rules</li>
                <li>Share the instance URL with your team</li>
                <li>Configure LDAP/AD integration in Admin Settings if needed</li>
                <li>Download the IT admin guide from Settings &rarr; Security</li>
              </ol>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#5b5fc7', border: 'none', fontSize: 14 }}
            >
              Go to Login
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-[11px]" style={{ color: '#444' }}>
        BrixOS Enterprise — Air-gapped, single-tenant deployment.
        Zero shared infrastructure. Complete data isolation.
      </p>
    </div>
  );
}
