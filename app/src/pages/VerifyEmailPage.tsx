import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { authApi } from '@/utils/api';
import {
  Mail,
  ArrowRight,
  Check,
  X,
  ShieldCheck,
  RefreshCw,
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
// Verify Email Page
// ------------------------------------------------------------------
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read email from URL or fallback
  const emailFromUrl = searchParams.get('email') || '';
  const [email] = useState(emailFromUrl || 'user@example.com');

  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    setCanResend(false);
    const t = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const fullCode = code.join('');
  const codeComplete = fullCode.length === 6;

  const handleChange = useCallback(
    (index: number, value: string) => {
      // Only allow single digit
      const digit = value.replace(/\D/g, '').slice(-1);
      if (!digit && value !== '') return;

      setCode((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });

      // Auto-focus next input
      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (code[index] === '' && index > 0) {
          // Move to previous if current is empty
          inputRefs.current[index - 1]?.focus();
        } else {
          // Clear current
          setCode((prev) => {
            const next = [...prev];
            next[index] = '';
            return next;
          });
        }
      }
      if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === 'ArrowRight' && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      if (!pasted) return;

      const digits = pasted.split('');
      setCode((prev) => {
        const next = [...prev];
        digits.forEach((d, i) => {
          if (i < 6) next[i] = d;
        });
        return next;
      });

      // Focus last filled or first empty
      const focusIndex = Math.min(digits.length, 5);
      setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0);
    },
    []
  );

  const handleResend = useCallback(async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(60);
    try {
      await authApi.resendVerification(email);
      setToast({ message: `Verification code resent to ${email}`, type: 'info' });
    } catch {
      setToast({ message: 'Failed to resend. Please try again.', type: 'error' });
    }
  }, [canResend, email]);

  const handleVerify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!codeComplete) {
        setToast({ message: 'Please enter the 6-digit code.', type: 'error' });
        return;
      }

      setLoading(true);
      try {
        await authApi.verifyEmail(email, fullCode);
        setLoading(false);
        setToast({ message: 'Email verified successfully!', type: 'success' });
        setTimeout(() => navigate('/login'), 1200);
      } catch (err: any) {
        setLoading(false);
        setToast({ message: err.message || 'Invalid or expired code. Please try again.', type: 'error' });
      }
    },
    [codeComplete, fullCode, email, navigate]
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
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: '#242424' }}>
            Verify your email
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#616161' }}>
            Enter the 6-digit code we sent to
          </p>
          <p className="mt-0.5 text-sm font-medium" style={{ color: '#242424' }}>
            {email}
          </p>
        </div>

        {/* Code Input */}
        <form onSubmit={handleVerify} className="space-y-6" noValidate>
          <div className="flex justify-center gap-2 sm:gap-3">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="h-12 w-12 rounded-md border text-center text-lg font-semibold outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:h-14 sm:w-14 sm:text-xl"
                style={{
                  borderColor: digit ? '#5b5fc7' : '#d1d1d1',
                  color: '#242424',
                  borderRadius: '6px',
                  caretColor: '#5b5fc7',
                }}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={loading || !codeComplete}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: '#5b5fc7', borderRadius: '8px' }}
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Verify
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: '#616161' }}>
            Didn't receive the code?{' '}
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="inline-flex items-center gap-1 font-medium hover:underline"
                style={{ color: '#5b5fc7' }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Resend code
              </button>
            ) : (
              <span className="font-medium" style={{ color: '#616161' }}>
                Resend in {countdown}s
              </span>
            )}
          </p>
        </div>

        {/* Change email hint */}
        <div className="mt-4 text-center">
          <p className="text-xs" style={{ color: '#616161' }}>
            Wrong email?{' '}
            <a
              href="/signup"
              onClick={(e) => {
                e.preventDefault();
                navigate('/signup');
              }}
              className="font-medium hover:underline"
              style={{ color: '#5b5fc7' }}
            >
              Sign up again
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
