import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Mail,
  Lock,
  User,
  Building2,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Chrome,
  ChromeIcon,
} from 'lucide-react';

// ------------------------------------------------------------------
// Inline Toast
// ------------------------------------------------------------------
function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const bg =
    type === 'success'
      ? '#237b4b'
      : type === 'error'
      ? '#c4314b'
      : '#5b5fc7';

  return (
    <div
      style={{ backgroundColor: bg }}
      className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-white shadow-lg"
    >
      {type === 'success' && <Check className="h-4 w-4" />}
      {type === 'error' && <X className="h-4 w-4" />}
      {type === 'info' && <ShieldCheck className="h-4 w-4" />}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

// ------------------------------------------------------------------
// Password Strength
// ------------------------------------------------------------------
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map = [
    { label: 'Too weak', color: '#c4314b' },
    { label: 'Weak', color: '#c4314b' },
    { label: 'Medium', color: '#c47a31' },
    { label: 'Strong', color: '#237b4b' },
    { label: 'Very strong', color: '#237b4b' },
  ];
  return map[score];
}

// ------------------------------------------------------------------
// Signup Page
// ------------------------------------------------------------------
export default function SignupPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Validation helpers
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordValid = useMemo(
    () => password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password),
    [password]
  );
  const confirmValid = useMemo(() => confirmPassword === password && confirmPassword !== '', [confirmPassword, password]);

  const formValid =
    emailValid &&
    passwordValid &&
    confirmValid &&
    fullName.trim().length > 0 &&
    companyName.trim().length > 0 &&
    agreeTerms;

  const showError = (field: string, condition: boolean) => touched[field] && !condition;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setTouched({ email: true, password: true, confirmPassword: true, fullName: true, companyName: true, terms: true });

      if (!formValid) {
        setToast({ message: 'Please fix the errors before submitting.', type: 'error' });
        return;
      }

      setLoading(true);
      // Simulate API call
      await new Promise((r) => setTimeout(r, 1500));
      setLoading(false);

      setToast({ message: 'Account created successfully!', type: 'success' });
      setTimeout(() => navigate('/create-workspace'), 1200);
    },
    [formValid, navigate]
  );

  const handleSocialSignup = useCallback((provider: string) => {
    setToast({ message: `${provider} OAuth coming soon`, type: 'info' });
  }, []);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#f5f5f3', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div
        className="w-full max-w-md rounded-xl p-8 shadow-lg"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: '#5b5fc7' }}
          >
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: '#242424' }}>
            Create your account
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#616161' }}>
            Get started with Brixstac
          </p>
        </div>

        {/* Social Buttons */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSocialSignup('Google')}
            className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: '#d1d1d1', color: '#242424', borderRadius: '8px' }}
          >
            <Chrome className="h-4 w-4" />
            Google
          </button>
          <button
            type="button"
            onClick={() => handleSocialSignup('Microsoft')}
            className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: '#d1d1d1', color: '#242424', borderRadius: '8px' }}
          >
            <ChromeIcon className="h-4 w-4" />
            Microsoft
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1" style={{ backgroundColor: '#d1d1d1' }} />
          <span className="text-xs font-medium" style={{ color: '#616161' }}>
            OR
          </span>
          <div className="h-px flex-1" style={{ backgroundColor: '#d1d1d1' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: '#242424' }}>
              Full name
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: '#616161' }}
              />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, fullName: true }))}
                placeholder="John Doe"
                className="w-full rounded-md border py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                style={{
                  borderColor: showError('fullName', fullName.trim().length > 0) ? '#c4314b' : '#d1d1d1',
                  color: '#242424',
                  borderRadius: '6px',
                }}
              />
            </div>
            {showError('fullName', fullName.trim().length > 0) && (
              <p className="mt-1 text-xs" style={{ color: '#c4314b' }}>
                Full name is required
              </p>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: '#242424' }}>
              Company name
            </label>
            <div className="relative">
              <Building2
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: '#616161' }}
              />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, companyName: true }))}
                placeholder="Acme Inc."
                className="w-full rounded-md border py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                style={{
                  borderColor: showError('companyName', companyName.trim().length > 0) ? '#c4314b' : '#d1d1d1',
                  color: '#242424',
                  borderRadius: '6px',
                }}
              />
            </div>
            {showError('companyName', companyName.trim().length > 0) && (
              <p className="mt-1 text-xs" style={{ color: '#c4314b' }}>
                Company name is required
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: '#242424' }}>
              Email address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: '#616161' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                placeholder="you@company.com"
                className="w-full rounded-md border py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                style={{
                  borderColor: showError('email', emailValid) ? '#c4314b' : '#d1d1d1',
                  color: '#242424',
                  borderRadius: '6px',
                }}
              />
            </div>
            {showError('email', emailValid) && (
              <p className="mt-1 text-xs" style={{ color: '#c4314b' }}>
                Please enter a valid email address
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: '#242424' }}>
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: '#616161' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                placeholder="Create a strong password"
                className="w-full rounded-md border py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                style={{
                  borderColor: showError('password', passwordValid) ? '#c4314b' : '#d1d1d1',
                  color: '#242424',
                  borderRadius: '6px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#616161' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength indicator */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(passwordStrength.score / 4) * 100}%`,
                        backgroundColor: passwordStrength.color,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {[
                    { label: '8+ characters', ok: password.length >= 8 },
                    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
                    { label: 'Number', ok: /[0-9]/.test(password) },
                    { label: 'Symbol', ok: /[^A-Za-z0-9]/.test(password) },
                  ].map((r) => (
                    <span
                      key={r.label}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: r.ok ? '#237b4b' : '#616161' }}
                    >
                      <Check className={`h-3 w-3 ${r.ok ? 'opacity-100' : 'opacity-40'}`} />
                      {r.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {showError('password', passwordValid) && (
              <p className="mt-1 text-xs" style={{ color: '#c4314b' }}>
                Password must be 8+ characters with uppercase, number, and symbol
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: '#242424' }}>
              Confirm password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: '#616161' }}
              />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
                placeholder="Confirm your password"
                className="w-full rounded-md border py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                style={{
                  borderColor: showError('confirmPassword', confirmValid) ? '#c4314b' : '#d1d1d1',
                  color: '#242424',
                  borderRadius: '6px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#616161' }}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {showError('confirmPassword', confirmValid) && (
              <p className="mt-1 text-xs" style={{ color: '#c4314b' }}>
                Passwords do not match
              </p>
            )}
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2.5">
            <button
              type="button"
              onClick={() => {
                setAgreeTerms((p) => !p);
                setTouched((p) => ({ ...p, terms: true }));
              }}
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
              style={{
                borderColor: agreeTerms ? '#5b5fc7' : '#d1d1d1',
                backgroundColor: agreeTerms ? '#5b5fc7' : '#ffffff',
                borderRadius: '4px',
              }}
            >
              {agreeTerms && <Check className="h-3 w-3 text-white" />}
            </button>
            <span className="text-xs leading-relaxed" style={{ color: '#616161' }}>
              I agree to the{' '}
              <a href="#" className="font-medium hover:underline" style={{ color: '#5b5fc7' }}>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="font-medium hover:underline" style={{ color: '#5b5fc7' }}>
                Privacy Policy
              </a>
            </span>
          </div>
          {touched.terms && !agreeTerms && (
            <p className="-mt-2 text-xs" style={{ color: '#c4314b' }}>
              You must agree to the terms
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: '#5b5fc7', borderRadius: '8px' }}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Sign up
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm" style={{ color: '#616161' }}>
          Already have an account?{' '}
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            className="font-medium hover:underline"
            style={{ color: '#5b5fc7' }}
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
