import { GoogleIcon } from './GoogleIcon';

interface GoogleLoginButtonProps {
  onClick?: () => void;
  label?: string;
}

export function GoogleLoginButton({ onClick, label = 'Google' }: GoogleLoginButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition-all active:scale-[0.98] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
    >
      <GoogleIcon />
      {label}
    </button>
  );
}
