import { useState } from 'react';
import type { FC, SVGProps } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { InputField } from '../components/InputField'; 
import { GoogleLoginButton } from '../components/GoogleLoginButton';

interface LoginScreenProps {
  onRegister: () => void;
  onGoogleLogin: () => void;
  onForgotPassword: () => void;
  onLogin: (payload: { email: string; password: string; remember: boolean }) => Promise<void>;
  isLoggingIn?: boolean;
  errorMessage?: string | null;
}

const MailIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

const LockIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export function LoginScreen({
  onRegister,
  onGoogleLogin,
  onForgotPassword,
  onLogin,
  isLoggingIn = false,
  errorMessage = null,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  return (
    <AuthLayout
      title="A Promise of Forever"
      subtitle="Your journey starts here."
      image="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1920&h=1080"
    >
      <div className="mb-5 flex flex-col items-start">
        <div className="mb-4 flex items-center gap-2">
          <div className="size-8 rounded-full bg-brand flex items-center justify-center">
            <div className="size-4 rotate-45 rounded-sm border-2 border-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">Unique Ring</span>
        </div>
        <h2 className="mb-1 text-3xl font-bold text-slate-900">Sign In</h2>
        <p className="text-sm text-slate-500">Welcome back! Please enter your details.</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onLogin({ email, password, remember });
        }}
      >
        <InputField
          label="Email Address"
          placeholder="name@company.com"
          icon={MailIcon}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <InputField
          label="Password"
          type="password"
          placeholder="Enter your password "
          icon={LockIcon}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          rightElement={
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-semibold text-brand transition-colors hover:text-brand-dark"
            >
              Forgot Password?
            </button>
          }
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="size-4 cursor-pointer rounded border-slate-300 text-brand focus:ring-brand"
          />
          <label htmlFor="remember" className="cursor-pointer text-xs font-semibold text-slate-600">
            Remember for 30 days
          </label>
        </div>

        {errorMessage && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full rounded-xl bg-brand px-4 py-3 font-bold text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
        >
          {isLoggingIn ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 font-medium text-slate-500">Or continue with</span>
        </div>
      </div>

      <GoogleLoginButton onClick={onGoogleLogin} />

      <p className="mt-5 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <button onClick={onRegister} className="font-bold text-brand transition-colors hover:text-brand-dark">
          Register
        </button>
      </p>
    </AuthLayout>
  );
}
