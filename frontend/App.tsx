import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { GoogleAccountSelector } from './components/GoogleAccountSelector';
import { api, type AuthUser } from './lib/api';
import AdminSeedView from './views/AdminSeedView';
import AdminDashboardView from './views/AdminDashboardView';
import InventoryView from './views/InventoryView';
import { LoginScreen } from './views/LoginView';
import MemoriesView from './views/MemoriesView';
import { RegisterScreen } from './views/RegisterView';
import { ResetPasswordScreen } from './views/ResetPasswordView';
import SettingsView from './views/SettingsView';
import UserPairMgmt from './views/UserPairMgmt';

function normalizeRole(role: string | null | undefined): AuthUser['role'] {
  return String(role || '').trim().toLowerCase() === 'admin' ? 'admin' : 'user';
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

  const role = authUser?.role || null;
  const isAdmin = role === 'admin';
  const isUser = role === 'user';
  const isAuthenticated = role !== null;

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
    navigate('/dashboard', { replace: true });
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

  const handleGoogleLogin = async (email: string) => {
    try {
      setIsGoogleLoggingIn(true);
      setLoginError(null);
      const response = await api.googleLogin({
        email,
        providerId: email,
        name: email.split('@')[0],
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

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout API failures and continue local sign-out.
    }

    clearAuth();
    setAuthUser(null);
    navigate('/login', { replace: true });
  };

  const adminLayout = useMemo(
    () => (view: ReactElement) => (isAdmin ? <Layout>{view}</Layout> : <Navigate to="/login" replace />),
    [isAdmin],
  );
  const authLayout = useMemo(
    () => (view: ReactElement) => (isAuthenticated ? <Layout>{view}</Layout> : <Navigate to="/login" replace />),
    [isAuthenticated],
  );
  const userOnly = useMemo(
    () => (view: ReactElement) => (isUser ? view : <Navigate to={isAdmin ? '/dashboard' : '/login'} replace />),
    [isAdmin, isUser],
  );

  if (isHydratingAuth) {
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />

      <Route
        path="/login"
        element={
          role ? (
            <Navigate to="/dashboard" replace />
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
            <Navigate to="/dashboard" replace />
          ) : (
            <GoogleAccountSelector onBack={() => navigate('/login')} onSelect={handleGoogleLogin} />
          )
        }
      />

      <Route
        path="/register"
        element={
          role ? (
            <Navigate to="/dashboard" replace />
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
            <Navigate to="/dashboard" replace />
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

      <Route path="/dashboard" element={authLayout(<AdminDashboardView />)} />
      <Route path="/inventory" element={adminLayout(<InventoryView />)} />
      <Route path="/users" element={adminLayout(<UserPairMgmt />)} />
      <Route path="/catalog" element={adminLayout(<AdminSeedView />)} />
      <Route path="/settings" element={adminLayout(<SettingsView />)} />
      <Route path="/memories" element={userOnly(<MemoriesView />)} />

      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
