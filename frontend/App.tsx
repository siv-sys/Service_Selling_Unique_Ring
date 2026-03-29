import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ConfirmDialog from './components/ConfirmDialog';
import Layout from './components/Layout';
import UserShell from './components/UserShell';
import { GoogleAccountSelector } from './components/GoogleAccountSelector';
import { api, type AuthUser } from './lib/api';
import { THEME_EVENT, syncStoredTheme } from './lib/theme';
import AdminSeedView from './views/AdminSeedView';
import AdminDashboardView from './views/AdminDashboardView';
import CartView from './views/cardView';
import CoupleProfileView from './views/CoupleProfileView';
import CoupleShopView from './views/CoupleShopView';
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';
import { LoginScreen } from './views/LoginView';
import MemoriesView from './views/MemoriesView';
import MyRingView from './views/MyRingView';
import ProfileView from './views/ProfileView';
import PublicProfileView from './views/PublicProfileView';
import { RegisterScreen } from './views/RegisterView';
import RelationshipView from './views/RelationshipView';
import RingInformationView from './views/RingInformation';
import { ResetPasswordScreen } from './views/ResetPasswordView';
import SettingsView from './views/SettingsView';
import UserPairMgmt from './views/UserPairMgmt';

const USER_HOME_PATH = '/dashboard';
const ADMIN_HOME_PATH = '/admindashboard';

function normalizeRole(role: string | null | undefined): AuthUser['role'] {
  return String(role || '').trim().toLowerCase() === 'admin' ? 'admin' : 'user';
}

function getRoleHomePath(role: string | null | undefined) {
  return normalizeRole(role) === 'admin' ? ADMIN_HOME_PATH : USER_HOME_PATH;
}

function buildUserFromStorage(): AuthUser | null {
  const rawId = sessionStorage.getItem('auth_user_id');
  const role = sessionStorage.getItem('auth_roles');
  const email = sessionStorage.getItem('auth_email');
  const name = sessionStorage.getItem('auth_name') || '';
  const id = Number(rawId);

  if (!rawId || !email || (role !== 'admin' && role !== 'user') || !Number.isInteger(id) || id <= 0) {
    return null;
  }

  return { id, email, name, role };
}

function normalizeUser(user: AuthUser): AuthUser {
  return {
    ...user,
    role: normalizeRole(user.role),
  };
}

function getStoredAccessToken(): string | null {
  return sessionStorage.getItem('auth_access_token') || localStorage.getItem('auth_access_token');
}

function persistAuth(user: AuthUser, accessToken: string, remember: boolean, rememberToken?: string | null) {
  sessionStorage.setItem('auth_user_id', String(user.id));
  sessionStorage.setItem('auth_roles', user.role);
  sessionStorage.setItem('auth_email', user.email);
  sessionStorage.setItem('auth_name', user.name || '');
  sessionStorage.setItem('auth_access_token', accessToken);

  if (remember) {
    localStorage.setItem('auth_access_token', accessToken);
    if (rememberToken) {
      localStorage.setItem('auth_remember_token', rememberToken);
    }
  } else {
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_remember_token');
  }
}

function clearAuth() {
  sessionStorage.removeItem('auth_user_id');
  sessionStorage.removeItem('auth_roles');
  sessionStorage.removeItem('auth_email');
  sessionStorage.removeItem('auth_name');
  sessionStorage.removeItem('auth_access_token');
  localStorage.removeItem('auth_access_token');
  localStorage.removeItem('auth_remember_token');
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => buildUserFromStorage());
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isHydratingAuth, setIsHydratingAuth] = useState(true);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const role = authUser?.role || null;
  const isAdmin = role === 'admin';
  const isUser = role === 'user';
  const isAuthenticated = role !== null;
  const roleHomePath = isAuthenticated ? getRoleHomePath(role) : '/login';
  const isPublicProfileRoute = /^\/u\/[^/]+\/?$/.test(location.pathname);

  useEffect(() => {
    syncStoredTheme(role);

    const handleThemeChange = () => {
      syncStoredTheme(role);
    };

    window.addEventListener('storage', handleThemeChange);
    window.addEventListener(THEME_EVENT, handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener(THEME_EVENT, handleThemeChange);
    };
  }, [role]);

  useEffect(() => {
    async function restoreAuth() {
      const accessToken = getStoredAccessToken();
      if (!accessToken) {
        clearAuth();
        setAuthUser(null);
        setIsHydratingAuth(false);
        return;
      }

      try {
        const response = await api.me();
        const user = normalizeUser(response.user);
        setAuthUser(user);
        persistAuth(user, accessToken, Boolean(localStorage.getItem('auth_access_token')));
      } catch {
        clearAuth();
        setAuthUser(null);
      } finally {
        setIsHydratingAuth(false);
      }
    }

    void restoreAuth();
  }, []);

  const goToRoleHome = (user: AuthUser, accessToken: string, remember: boolean, rememberToken?: string | null) => {
    const normalizedUser = normalizeUser(user);
    setAuthUser(normalizedUser);
    persistAuth(normalizedUser, accessToken, remember, rememberToken);
    navigate(getRoleHomePath(normalizedUser.role), { replace: true });
  };

  const handleLogin = async (payload: { email: string; password: string; remember: boolean }) => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const response = await api.login(payload);
      goToRoleHome(response.user, response.accessToken, payload.remember, response.rememberToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async (email: string, name?: string) => {
    try {
      setIsGoogleLoggingIn(true);
      setLoginError(null);
      const response = await api.googleLogin({
        email,
        providerId: email,
        name: String(name || '').trim() || email.split('@')[0],
      });
      goToRoleHome(response.user, response.accessToken, false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google login failed.';
      setLoginError(message);
      navigate('/login', { replace: true });
    } finally {
      setIsGoogleLoggingIn(false);
    }
  };

  const handleRegister = async (payload: { name: string; email: string; password: string }) => {
    try {
      setIsRegistering(true);
      setRegisterError(null);
      setRegisterSuccess(null);
      await api.register(payload);
      clearAuth();
      setAuthUser(null);
      setRegisterSuccess(`Registration completed for ${payload.email}.`);
      setLoginError(null);
      navigate('/login', {
        replace: true,
        state: { successMessage: 'Registration succeeded. Please log in.' },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Register failed.';
      setRegisterError(message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleResetPassword = async (payload: { email: string; newPassword: string }) => {
    try {
      setIsResettingPassword(true);
      setResetError(null);
      setResetSuccess(null);
      const response = await api.resetPassword(payload);
      setResetSuccess(response.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reset password failed.';
      setResetError(message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const requestLogout = useCallback(() => {
    setIsLogoutConfirmOpen(true);
  }, []);

  const closeLogoutConfirm = useCallback(() => {
    setIsLogoutConfirmOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLogoutConfirmOpen(false);
    try {
      await api.logout();
    } catch {
      // Ignore logout API failures and continue local sign-out.
    }

    clearAuth();
    setAuthUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const adminLayout = useMemo(
    () =>
      (view: ReactElement) =>
        isAdmin ? <Layout onLogout={requestLogout}>{view}</Layout> : <Navigate to={isAuthenticated ? roleHomePath : '/login'} replace />,
    [requestLogout, isAdmin, isAuthenticated, roleHomePath],
  );
  const userLayout = useMemo(
    () =>
      (view: ReactElement) =>
        isUser ? <UserShell>{view}</UserShell> : <Navigate to={isAuthenticated ? roleHomePath : '/login'} replace />,
    [isAuthenticated, isUser, roleHomePath],
  );

  if (isHydratingAuth && !isPublicProfileRoute) {
    return null;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? roleHomePath : '/login'} replace />} />
        <Route path="/u/:handle" element={<PublicProfileView />} />

      <Route
        path="/login"
        element={
          role ? (
            <Navigate to={roleHomePath} replace />
          ) : (
            <LoginScreen
              onRegister={() => navigate('/register')}
              onGoogleLogin={() => navigate('/login/google')}
              onForgotPassword={() => navigate('/reset-password')}
              onLogin={handleLogin}
              isLoggingIn={isLoggingIn || isGoogleLoggingIn}
              errorMessage={loginError}
              successMessage={(location.state as { successMessage?: string } | null)?.successMessage ?? null}
            />
          )
        }
      />

      <Route
        path="/login/google"
        element={
          role ? (
            <Navigate to={roleHomePath} replace />
          ) : (
            <GoogleAccountSelector onBack={() => navigate('/login')} onSelect={handleGoogleLogin} />
          )
        }
      />

      <Route
        path="/register"
        element={
          role ? (
            <Navigate to={roleHomePath} replace />
          ) : (
            <RegisterScreen
              onLogin={() => navigate('/login')}
              onGoogleLogin={() => navigate('/login/google')}
              onRegister={handleRegister}
              isSubmitting={isRegistering}
              errorMessage={registerError}
              successMessage={registerSuccess}
            />
          )
        }
      />

      <Route
        path="/reset-password"
        element={
          role ? (
            <Navigate to={roleHomePath} replace />
          ) : (
            <ResetPasswordScreen
              onBackToLogin={() => navigate('/login')}
              onGoogleLogin={() => navigate('/login/google')}
              onResetPassword={handleResetPassword}
              isSubmitting={isResettingPassword}
              errorMessage={resetError}
              successMessage={resetSuccess}
            />
          )
        }
      />

      <Route path={USER_HOME_PATH} element={userLayout(<DashboardView />)} />
      <Route path="/member" element={<Navigate to={USER_HOME_PATH} replace />} />
      <Route path="/shop" element={userLayout(<CoupleShopView />)} />
      <Route path="/shop/rings/:ringId" element={userLayout(<RingInformationView />)} />
      <Route path="/couple-shop" element={<Navigate to="/shop" replace />} />
      <Route path="/myring" element={userLayout(<MyRingView />)} />
      <Route path="/ring-view" element={userLayout(<RingInformationView />)} />
      <Route path="/ring-view/:ringId" element={userLayout(<RingInformationView />)} />
      <Route path="/profile" element={userLayout(<ProfileView />)} />
      <Route path="/couple-profile" element={userLayout(<CoupleProfileView />)} />
      <Route path="/relationship" element={userLayout(<RelationshipView />)} />
      <Route path="/cart" element={userLayout(<CartView />)} />
      <Route path={ADMIN_HOME_PATH} element={adminLayout(<AdminDashboardView />)} />
      <Route path="/admin-dashboard" element={<Navigate to={ADMIN_HOME_PATH} replace />} />
      <Route path="/inventory" element={adminLayout(<InventoryView />)} />
      <Route path="/users" element={adminLayout(<UserPairMgmt />)} />
      <Route path="/catalog" element={adminLayout(<AdminSeedView />)} />
      <Route
        path="/settings"
        element={
          isAdmin
            ? adminLayout(<SettingsView />)
            : userLayout(<SettingsView />)
        }
      />
      <Route path="/memories" element={userLayout(<MemoriesView />)} />

        <Route path="*" element={<Navigate to={isAuthenticated ? roleHomePath : '/login'} replace />} />
      </Routes>

      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        title="Log Out?"
        message="Are you sure you want to log out?"
        confirmLabel="Log Out"
        cancelLabel="Stay Here"
        onConfirm={() => {
          void handleLogout();
        }}
        onClose={closeLogoutConfirm}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
