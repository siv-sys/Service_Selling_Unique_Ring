import { AuthLayout } from '../components/AuthLayout';
import { InputField } from '../components/InputField';
import { GoogleLoginButton } from '../components/GoogleLoginButton';

interface RegisterScreenProps {
  onLogin: () => void;
  onGoogleLogin: () => void;
}

export function RegisterScreen({ onLogin, onGoogleLogin }: RegisterScreenProps) {
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

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <InputField label="Full Name" placeholder="Enter your full name" />

        <InputField
          label="Email or Phone Number"
          placeholder="name@example.com or +1 (555) 000-0000"
        />

        <InputField label="Password" type="password" placeholder="........" />

        <InputField label="Confirm Password" type="password" placeholder="........" />

        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-brand px-4 py-3 font-bold text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-dark active:scale-[0.98]"
          >
            Register
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
