import { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { InputField } from '../components/InputField';
import { GoogleLoginButton } from '../components/GoogleLoginButton';

interface RegisterScreenProps {
  onLogin: () => void;
  onGoogleLogin: () => void;
  onRegister: (payload: { name: string; email: string; password: string }) => Promise<void>;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
}

export function RegisterScreen({
  onLogin,
  onGoogleLogin,
  onRegister,
  isSubmitting = false,
  errorMessage = null,
  successMessage = null,
}: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const passwordMatch = password.length > 0 && password === confirmPassword;

  return (
    <AuthLayout
      title="Begin Your Legacy"
      subtitle="Create your account to preserve what matters."
      image="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1920&h=1080"
    >
      <div className="mb-5 flex flex-col items-start">
        <h2 className="mb-1 text-3xl font-bold text-slate-900">Create Account</h2>
        <p className="text-sm text-slate-500">Please fill in your details to get started.</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!passwordMatch) return;
          onRegister({ name, email, password });
        }}
      >
        <InputField
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <InputField
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <InputField
          label="Password"
          type="password"
          placeholder="........"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <InputField
          label="Confirm Password"
          type="password"
          placeholder="........"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        {!passwordMatch && confirmPassword.length > 0 && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
            Password and confirm password do not match.
          </p>
        )}

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

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !passwordMatch}
            className="w-full rounded-xl bg-brand px-4 py-3 font-bold text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </div>
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
        Already have an account?{' '}
        <button
          onClick={onLogin}
          className="font-bold text-brand transition-colors hover:text-brand-dark"
        >
          Log in
        </button>
      </p>
    </AuthLayout>
  );
}
