import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { GoogleAccountSelector } from './components/GoogleAccountSelector';
import type { AuthUser } from './lib/api';
import AdminSeedView from './views/AdminSeedView';
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';
import { LoginScreen } from './views/LoginView';
import MemoriesView from './views/MemoriesView';
import { RegisterScreen } from './views/RegisterView';
import { ResetPasswordScreen } from './views/ResetPasswordView';
import SettingsView from './views/SettingsView';
import UserPairMgmt from './views/UserPairMgmt';

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

function getStoredAccessToken(): string | null {
  return sessionStorage.getItem('auth_access_token') || localStorage.getItem('auth_access_token');
}

function persistAuth(user: AuthUser, accessToken: string, remember: boolean) {
  sessionStorage.setItem('auth_user_id', String(user.id));
  sessionStorage.setItem('auth_roles', user.role);
  sessionStorage.setItem('auth_email', user.email);
  sessionStorage.setItem('auth_name', user.name || '');
  sessionStorage.setItem('auth_access_token', accessToken);

  if (remember) {
    localStorage.setItem('auth_access_token', accessToken);
  } else {
    localStorage.removeItem('auth_access_token');
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
    const accessToken = getStoredAccessToken();
    if (!accessToken) {
      clearAuth();
      setAuthUser(null);
    }
    setIsHydratingAuth(false);
  }, []);

  const goToRoleHome = (user: AuthUser, accessToken: string, remember: boolean) => {
    setAuthUser(user);
    persistAuth(user, accessToken, remember);
    navigate('/dashboard', { replace: true });
  };

  const handleLogin = async (payload: { email: string; password: string; remember: boolean }) => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const user: AuthUser = {
        id: 1,
        email: payload.email || 'guest@example.com',
        name: payload.email ? payload.email.split('@')[0] : 'Guest',
        role: 'admin',
      };
      goToRoleHome(user, 'local-session-token', payload.remember);
    } catch {
      setLoginError('Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async (email: string) => {
    try {
      setIsGoogleLoggingIn(true);
      setLoginError(null);
      const user: AuthUser = {
        id: 1,
        email,
        name: email.split('@')[0],
        role: 'admin',
        provider: 'google',
      };
      goToRoleHome(user, 'local-google-session-token', false);
    } catch {
      setLoginError('Google login failed.');
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
      clearAuth();
      setAuthUser(null);
      setRegisterSuccess(`Registration completed for ${payload.email}.`);
      setLoginError(null);
      navigate('/login', {
        replace: true,
        state: { successMessage: 'Registration succeeded. Please log in.' },
      });
    } catch {
      setRegisterError('Register failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleResetPassword = async (payload: { email: string; newPassword: string }) => {
    try {
      setIsResettingPassword(true);
      setResetError(null);
      setResetSuccess(null);
      setResetSuccess(`Password reset completed for ${payload.email}.`);
    } catch {
      setResetError('Reset password failed.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const adminLayout = useMemo(
    () => (view: JSX.Element) => (isAdmin ? <Layout>{view}</Layout> : <Navigate to="/login" replace />),
    [isAdmin],
  );
  const authLayout = useMemo(
    () => (view: JSX.Element) => (isAuthenticated ? <Layout>{view}</Layout> : <Navigate to="/login" replace />),
    [isAuthenticated],
  );
  const userOnly = useMemo(
    () => (view: JSX.Element) => (isUser ? view : <Navigate to={isAdmin ? '/dashboard' : '/login'} replace />),
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

      <Route path="/dashboard" element={authLayout(<DashboardView />)} />
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
