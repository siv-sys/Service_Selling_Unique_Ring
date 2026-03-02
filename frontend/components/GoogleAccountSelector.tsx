import type { FC, SVGProps } from 'react';
import { ACCOUNTS } from './constants';
import { GoogleIcon } from './GoogleIcon';

interface GoogleAccountSelectorProps {
  onBack: () => void;
  onSelect: (email: string) => void;
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
                onClick={() => onSelect(account.email)}
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

            <button className="group flex w-full items-center gap-5 px-6 py-5 text-left transition-all hover:bg-neutral-50">
              <div className="flex size-12 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
                <UserPlusIcon className="size-5 text-neutral-400" />
              </div>
              <div className="flex-grow">
                <div className="text-base font-medium text-neutral-700">Use another account</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
