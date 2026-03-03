import React from 'react';
import { AppView } from '../../types';

interface NavbarProps {
  currentView?: AppView;
  onNavigate?: (view: AppView) => void;
  userName?: string;
  userAvatarUrl?: string;
  notificationCount?: number;
}

const navItems: Array<{ label: string; view: AppView }> = [
  { label: 'Dashboard', view: AppView.DASHBOARD },
  { label: 'Couple Shop', view: AppView.COUPLE_SHOP },
  { label: 'My Ring', view: AppView.MY_RING },
  { label: 'Couple Profile', view: AppView.COUPLE_PROFILE },
];

const iconButtonClass =
  'relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800';

const Navbar: React.FC<NavbarProps> = ({
  currentView = AppView.DASHBOARD,
  onNavigate,
  userName = 'Alex & Jamie',
  userAvatarUrl,
  notificationCount = 1,
}) => {
  const userInitial = userName.trim().charAt(0).toUpperCase();

  return (
    <header className="w-full border-y border-[#eee8eb] bg-white">
      <div className="mx-auto flex h-[92px] max-w-[1600px] items-center justify-between px-4 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-6 lg:gap-10">
          <button
            type="button"
            onClick={() => onNavigate?.(AppView.DASHBOARD)}
            className="inline-flex items-center gap-2.5 whitespace-nowrap"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3h12l3 5-9 13L3 8l3-5z" />
              <path d="M3 8h18M9 3l3 5 3-5M8.5 8L12 21l3.5-13" />
            </svg>
            <span className="text-[22px] leading-none text-pink-500" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              BondKeeper
            </span>
          </button>

          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => onNavigate?.(item.view)}
                  className={`relative whitespace-nowrap pb-1 text-[17px] leading-none transition-colors ${
                    isActive ? 'font-semibold text-pink-500' : 'font-medium text-[#3b3b3b] hover:text-pink-500'
                  }`}
                >
                  {item.label}
                  {isActive && <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-pink-500" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-pink-200 hover:text-pink-500"
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4a5 5 0 00-5 5v2.7c0 .7-.2 1.3-.7 1.8L5 15h14l-1.3-1.5a2.7 2.7 0 01-.7-1.8V9a5 5 0 00-5-5z" />
              <path d="M10 18a2 2 0 004 0" />
              <path d="M18.5 6.5a3 3 0 011 2.2" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-pink-500 px-1 text-[10px] font-bold leading-none text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <button type="button" className={iconButtonClass} aria-label="Theme">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
            </svg>
          </button>

          <button type="button" className={iconButtonClass} aria-label="Cart">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="17" cy="20" r="1.5" />
              <path d="M3 4h2l2.2 10.2a2 2 0 002 1.6h8.6a2 2 0 001.9-1.4L22 7H7.2" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold leading-none text-white">
              4
            </span>
          </button>

          <div className="mx-2 hidden h-10 w-px bg-[#ece7ea] sm:block" />

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#2b2b2b] bg-[#ececef] py-1 pl-1 pr-1 text-left transition-colors hover:bg-[#e5e5ea]"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-100 text-sm font-semibold text-slate-600">
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt={userName} className="h-full w-full object-cover" />
              ) : (
                userInitial
              )}
            </span>
            
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
