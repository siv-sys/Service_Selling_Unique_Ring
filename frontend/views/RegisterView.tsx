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
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Create Account</h2>
        <p className="text-slate-500">Please fill in your details to get started.</p>
      </div>

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
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
            className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3.5 rounded-lg shadow-md transition-colors duration-200 uppercase tracking-wider text-sm"
          >
            Register
          </button>
        </div>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-xs font-semibold text-slate-400 tracking-widest uppercase">
            Or continue with
          </span>
        </div>
      </div>

      <GoogleLoginButton onClick={onGoogleLogin} label="Login with Google" />

      <p className="mt-8 text-center text-slate-500">
        Already have an account?{' '}
        <button
          onClick={onLogin}
          className="text-brand font-semibold hover:underline decoration-2 underline-offset-4"
        >
          Log in
        </button>
      </p>
    </AuthLayout>
  );
}
