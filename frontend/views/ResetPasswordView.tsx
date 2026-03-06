import { useState } from 'react';
import { GoogleLoginButton } from '../components/GoogleLoginButton';

interface ResetPasswordScreenProps {
  onBackToLogin: () => void;
  onGoogleLogin: () => void;
  onResetPassword: (payload: { email: string; newPassword: string }) => Promise<void>;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
}

const EyeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M3 3l18 18" />
    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
    <path d="M9.4 5.5A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3 3.8" />
    <path d="M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10.7 10.7 0 0 0 5.4-1.5" />
  </svg>
);

export function ResetPasswordScreen({
  onBackToLogin,
  onGoogleLogin,
  onResetPassword,
  isSubmitting = false,
  errorMessage = null,
  successMessage = null,
}: ResetPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const canSubmit =
    email.trim().length > 0 &&
    hasMinLength &&
    hasNumber &&
    hasSpecial &&
    password === confirmPassword &&
    password.length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="mb-10 flex flex-col items-start">
          <h2 className="mb-2 text-4xl font-bold text-slate-900">Set New Password</h2>
          <p className="text-slate-500">Your new password must be different from previously used passwords.</p>
        </div>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            onResetPassword({ email, newPassword: password });
          }}
        >
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email Address</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="Enter your email"
              className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-4 pr-4 transition-all focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">New Password</label>
            <div className="relative w-full">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-4 pr-11 transition-all focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 pr-4 text-slate-400 transition hover:text-slate-600"
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Confirm New Password</label>
            <div className="relative">
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                className="block w-full rounded-lg border border-slate-200 bg-white py-3 pl-4 pr-11 transition-all focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 pr-4 text-slate-400 transition hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-xl bg-brand px-4 py-4 font-bold text-white shadow-lg shadow-brand/25 transition-all enabled:hover:bg-brand-dark enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 font-medium text-slate-500">Or continue with</span>
          </div>
        </div>

        <GoogleLoginButton onClick={onGoogleLogin} />

        <p className="mt-8 text-center text-slate-600">
          <button onClick={onBackToLogin} className="font-bold text-brand transition-colors hover:text-brand-dark">
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
}
