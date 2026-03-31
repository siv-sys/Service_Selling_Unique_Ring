import { useState } from 'react';
import type { FC, FormEvent, SVGProps } from 'react';
import { ACCOUNTS } from './constants';
import { GoogleIcon } from './GoogleIcon';

interface GoogleAccountSelectorProps {
  onBack: () => void;
  onSelect: (email: string, name?: string) => void;
}

const ArrowLeftIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);

const ChevronRightIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const UserPlusIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6" />
    <path d="M22 11h-6" />
  </svg>
);

export function GoogleAccountSelector({ onBack, onSelect }: GoogleAccountSelectorProps) {
  const [isCustomEmailMode, setIsCustomEmailMode] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [showEmailError, setShowEmailError] = useState(false);

  const handleCustomEmailSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = customEmail.trim();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    if (!isEmailValid) {
      setShowEmailError(true);
      return;
    }

    setShowEmailError(false);
    const inferredName = value.split('@')[0];
    onSelect(value, inferredName);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-brand"
          >
            <ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-1" />
            Back to Sign In
          </button>
        </div>

        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full border border-slate-200 bg-white p-3">
              <GoogleIcon />
            </div>
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-900">Sign in with Google</h1>
          <p className="text-slate-500">Choose an account to continue to Unique Ring</p>
        </div>

        <div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {ACCOUNTS.map((account) => (
              <button
                key={account.id}
                onClick={() => onSelect(account.email, account.name)}
                className="group flex w-full items-center gap-5 border-b border-slate-100 px-6 py-5 text-left transition-all hover:bg-neutral-50"
              >
                <img
                  src={account.avatar}
                  alt={account.name}
                  className="size-12 rounded-full border border-black/10 object-cover ring-2 ring-black/[0.03]"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-grow">
                  <div className="text-base font-semibold text-neutral-900">{account.name}</div>
                  <div className="text-sm text-neutral-500">{account.email}</div>
                </div>
                <ChevronRightIcon className="size-5 text-brand transition-transform group-hover:translate-x-1" />
              </button>
            ))}

            {!isCustomEmailMode && (
              <button
                onClick={() => {
                  setIsCustomEmailMode(true);
                  setShowEmailError(false);
                }}
                className="group flex w-full items-center gap-5 border-t border-slate-100 bg-gradient-to-r from-brand/[0.08] to-transparent px-6 py-5 text-left transition-all hover:from-brand/[0.14]"
              >
                <div className="flex size-12 items-center justify-center rounded-full border border-brand/25 bg-white">
                  <UserPlusIcon className="size-5 text-brand" />
                </div>
                <div className="flex-grow">
                  <div className="text-base font-semibold text-slate-800">Use another account</div>
                  <div className="text-sm text-slate-500">Sign in with a different email</div>
                </div>
                <ChevronRightIcon className="size-5 text-brand transition-transform group-hover:translate-x-1" />
              </button>
            )}

            {isCustomEmailMode && (
              <form onSubmit={handleCustomEmailSubmit} className="space-y-3 border-t border-slate-100 bg-slate-50 px-6 py-5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Email Address</label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(event) => {
                    setCustomEmail(event.target.value);
                    if (showEmailError) setShowEmailError(false);
                  }}
                  placeholder="Enter another email"
                  autoFocus
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
                {showEmailError && <p className="text-xs font-medium text-rose-500">Please enter a valid email address.</p>}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-dark"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomEmailMode(false);
                      setCustomEmail('');
                      setShowEmailError(false);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
