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
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[520px] bg-[#f4f4f5] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5 overflow-hidden">
        <div className="pt-6 px-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-brand transition-colors text-[12px] font-semibold uppercase tracking-wider group"
          >
            <ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-1" />
            Back to Sign In
          </button>
        </div>

        <div className="pt-14 pb-10 px-12 text-center">
          <div className="flex justify-center mb-8">
            <div className="p-3 rounded-full bg-white shadow-sm border border-black/5">
              <GoogleIcon />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-black tracking-tight mb-6 accent-underline">Sign in with Google</h1>
          <p className="text-neutral-500 text-sm font-medium mt-8">Choose an account to continue to Lumina UI</p>
        </div>

        <div className="px-8 pb-10">
          <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
            {ACCOUNTS.map((account) => (
              <button
                key={account.id}
                onClick={() => onSelect(account.email)}
                className="w-full group flex items-center gap-5 px-8 py-6 hover:bg-neutral-50 transition-all text-left border-b border-neutral-100"
              >
                <img
                  src={account.avatar}
                  alt={account.name}
                  className="size-12 rounded-full object-cover ring-2 ring-black/[0.03] border border-black/10"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-grow">
                  <div className="text-[16px] font-semibold text-neutral-900">{account.name}</div>
                  <div className="text-sm text-neutral-500">{account.email}</div>
                </div>
                <ChevronRightIcon className="size-5 text-brand transition-transform group-hover:translate-x-1" />
              </button>
            ))}

            <button className="w-full group flex items-center gap-5 px-8 py-6 hover:bg-neutral-50 transition-all text-left">
              <div className="size-12 rounded-full flex items-center justify-center bg-neutral-50 border border-neutral-200">
                <UserPlusIcon className="size-5 text-neutral-400" />
              </div>
              <div className="flex-grow">
                <div className="text-[16px] font-medium text-neutral-700">Use another account</div>
              </div>
            </button>
          </div>
        </div>

        <div className="px-12 py-8 text-[11px] text-neutral-400 leading-relaxed border-t border-black/[0.03] text-center">
          To continue, Google will share your name, email address, language preference, and profile picture with Lumina UI.
          Before using this app, you can review Lumina UI's{' '}
          <a href="#" className="text-neutral-600 hover:text-black hover:underline font-semibold">privacy policy</a> and{' '}
          <a href="#" className="text-neutral-600 hover:text-black hover:underline font-semibold">terms of service</a>.
        </div>
      </div>

      <footer className="w-full max-w-[520px] mt-8 flex justify-between items-center px-6 text-[11px] font-medium text-neutral-400 uppercase tracking-widest">
        <div className="flex gap-4">
          <div className="flex items-center gap-1 cursor-pointer hover:text-black transition-colors">
            English (US)
            <ChevronRightIcon className="size-3 rotate-90" />
          </div>
        </div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-black transition-colors">Help</a>
          <a href="#" className="hover:text-black transition-colors">Privacy</a>
          <a href="#" className="hover:text-black transition-colors">Terms</a>
        </div>
      </footer>
    </div>
  );
}
