import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { authApi } from '@/utils/api';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  ShieldCheck,
  Inbox,
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
// Forgot Password Page
// ------------------------------------------------------------------
export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!emailValid) {
        setToast({ message: 'Please enter a valid email address.', type: 'error' });
        return;
      }

      setLoading(true);
      try {
        await authApi.forgotPassword(email);
      } catch {
        // Always show success to prevent email enumeration
      }
      setLoading(false);
      setSubmitted(true);
      setToast({ message: 'If this email is registered, you will receive a reset link.', type: 'success' });
    },
    [emailValid]
  );

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
            Reset password
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#616161' }}>
            {submitted
              ? 'We have sent you instructions to reset your password.'
              : 'Enter your email and we will send you a reset link.'}
          </p>
        </div>

        {submitted ? (
          /* Success State */
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 rounded-lg border p-6" style={{ borderColor: '#d1d1d1' }}>
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: '#e8f5ee' }}
              >
                <Inbox className="h-8 w-8" style={{ color: '#237b4b' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: '#242424' }}>
                  Check your email
                </p>
                <p className="mt-1 text-xs" style={{ color: '#616161' }}>
                  A password reset link has been sent to{' '}
                  <span className="font-medium" style={{ color: '#242424' }}>
                    {email}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
              className="w-full rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: '#d1d1d1', color: '#242424', borderRadius: '8px' }}
            >
              Didn't receive it? Try again
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                  placeholder="you@company.com"
                  className="w-full rounded-md border py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  style={{
                    borderColor: '#d1d1d1',
                    color: '#242424',
                    borderRadius: '6px',
                  }}
                />
              </div>
            </div>

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
                  Send reset link
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to login */}
        <div className="mt-6 text-center">
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            style={{ color: '#5b5fc7' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
