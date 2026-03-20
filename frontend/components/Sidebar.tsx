import React, { useEffect, useState } from 'react';
import { AppView, Role } from '../types';
import { api } from '../lib/api';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  role: Role;
  onSignOut: () => void;
}

interface CurrentUserProfile {
  fullName: string;
  avatarUrl: string | null;
}

interface StoredSettingsProfile {
  fullName?: string;
  avatarUrl?: string;
}

function getStoredAuthValue(key: string): string | null {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

function getStoredSettingsProfile(): StoredSettingsProfile {
  const raw = localStorage.getItem('settings_view_v1');
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as StoredSettingsProfile;
    return {
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : undefined,
      avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : undefined,
    };
  } catch {
    return {};
  }
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, role, onSignOut }) => {
  const isAdmin = role === Role.ADMIN;
  const storedProfile = getStoredSettingsProfile();
  const [profile, setProfile] = useState<CurrentUserProfile>({
    fullName: isAdmin ? storedProfile.fullName || 'Admin User' : 'Member User',
    avatarUrl: isAdmin ? storedProfile.avatarUrl || null : null,
  });

  useEffect(() => {
    const loadProfile = async () => {
      const localProfile = getStoredSettingsProfile();
      if (isAdmin && (localProfile.fullName || localProfile.avatarUrl)) {
        setProfile((previous) => ({
          fullName: localProfile.fullName || previous.fullName,
          avatarUrl: localProfile.avatarUrl || previous.avatarUrl,
        }));
      }

      const rawUserId = getStoredAuthValue('auth_user_id');
      if (!rawUserId) return;

      try {
        const user = await api.get<{ fullName: string; avatarUrl: string | null }>(`/users/${rawUserId}`);
        const stored = getStoredSettingsProfile();
        setProfile({
          fullName:
            (isAdmin ? stored.fullName : '') ||
            user.fullName ||
            (isAdmin ? 'Admin User' : 'Member User'),
          avatarUrl: (isAdmin ? stored.avatarUrl : '') || user.avatarUrl || null,
        });
      } catch (error) {
        console.error('Failed to load sidebar profile:', error);
      }
    };

    loadProfile();

    const syncStoredProfile = () => {
      if (!isAdmin) return;
      const localProfile = getStoredSettingsProfile();
      setProfile((previous) => ({
        fullName: localProfile.fullName || previous.fullName,
        avatarUrl: localProfile.avatarUrl || previous.avatarUrl,
      }));
    };

    window.addEventListener('admin-profile-updated', syncStoredProfile);
    window.addEventListener('storage', syncStoredProfile);

    return () => {
      window.removeEventListener('admin-profile-updated', syncStoredProfile);
      window.removeEventListener('storage', syncStoredProfile);
    };
  }, [isAdmin]);

  const NavItem: React.FC<{ view: AppView; icon: string; label: string }> = ({ view, icon, label }) => {
    const isActive = currentView === view;
    const activeClasses = 'bg-rose-50 text-primary-red dark:bg-rose-900/20 dark:text-rose-400 shadow-sm';

    return (
      <button
        onClick={() => setView(view)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left ${
          isActive 
            ? activeClasses + ' font-bold' 
            : 'text-slate-500 hover:bg-rose-50/50 dark:hover:bg-slate-800'
        }`}
      >
        <span className="material-symbols-outlined">{icon}</span>
        <span className="text-sm">{label}</span>
      </button>
    );
  };

  return (
    <aside className="w-72 hidden lg:flex flex-col border-r border-rose-100 dark:border-slate-800 bg-white dark:bg-charcoal h-full transition-all duration-300 shrink-0">
      <div className="p-6 border-b border-rose-50 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-primary-red shadow-rose-500/20`}>
            <span className="material-symbols-outlined">{isAdmin ? 'shield' : 'favorite'}</span>
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight">{isAdmin ? 'Admin Console' : 'BondKeeper'}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isAdmin ? 'Super Admin' : 'Premium Couple'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        <NavItem view={AppView.DASHBOARD} icon="dashboard" label="Dashboard" />
        
        {isAdmin ? (
          <>
            <NavItem view={AppView.USER_MGMT} icon="group" label="User & Pair Mgmt" />
            <NavItem view={AppView.INVENTORY} icon="inventory_2" label="Ring Inventory" />
            <NavItem view={AppView.SECURITY_LOGS} icon="security" label="Security Logs" />
            <NavItem view={AppView.ADMIN_SEED} icon="database_upload" label="Catalog Seed" />
          </>
        ) : (
          <>
            <NavItem view={AppView.COUPLE_PROFILE} icon="favorite" label="Couple Profile" />
            <NavItem view={AppView.RELATIONSHIP} icon="diamond" label="Relationship Cert" />
            <NavItem view={AppView.MEMORIES} icon="auto_stories" label="Shared Memories" />
          </>
        )}
        
        <div className="pt-6 mt-6 border-t border-rose-50 dark:border-slate-800">
          <NavItem view={AppView.SETTINGS} icon="settings" label="Settings" />
        </div>
      </nav>

      <div className="p-4 mt-auto border-t border-rose-50 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2 bg-rose-50/30 dark:bg-slate-800/50 rounded-2xl">
          <img 
            className="size-10 rounded-xl object-cover" 
            src={profile.avatarUrl || 'https://picsum.photos/seed/admin/100'} 
            alt="User avatar" 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{profile.fullName}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Connected Account</p>
          </div>
          <button 
            onClick={onSignOut}
            className="material-symbols-outlined text-slate-400 hover:text-primary-red transition-colors"
          >
            logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
