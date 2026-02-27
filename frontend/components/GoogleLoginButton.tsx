import { GoogleIcon } from './GoogleIcon';

interface GoogleLoginButtonProps {
  onClick?: () => void;
  label?: string;
}

export function GoogleLoginButton({ onClick, label = 'Google' }: GoogleLoginButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-all shadow-sm active:scale-[0.98]"
    >
      <GoogleIcon />
      {label}
    </button>
  );
}
