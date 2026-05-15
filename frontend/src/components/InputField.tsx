import React from 'react';

interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  rightElement?: React.ReactNode;
  autoFocus?: boolean;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
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

export function InputField({
  label,
  type = 'text',
  placeholder,
  icon: Icon,
  rightElement,
  autoFocus = false,
  value,
  onChange,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider dark:text-slate-300">
          {label}
        </label>
        {rightElement}
      </div>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="size-4 text-slate-400" />
          </div>
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          autoFocus={autoFocus}
          value={value}
          onChange={onChange}
          className={`
            block w-full rounded-lg border border-slate-200 bg-white py-3 pr-4 text-slate-900 transition-all
            focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none
            dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100
            ${Icon ? 'pl-11' : 'pl-4'}
            ${isPasswordField ? 'pr-11' : ''}
          `}
        />
        {isPasswordField && (
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-0 pr-4 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          >
            {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
