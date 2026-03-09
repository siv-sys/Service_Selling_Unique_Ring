import { useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { GoogleAccountSelector } from './components/GoogleAccountSelector';
import { api, type AuthUser } from './lib/api';
import AdminSeedView from './views/AdminSeedView';
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';
import { LoginScreen } from './views/LoginView';
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

function persistAuth(user: AuthUser) {
  sessionStorage.setItem('auth_user_id', String(user.id));
  sessionStorage.setItem('auth_roles', user.role);
  sessionStorage.setItem('auth_email', user.email);
  sessionStorage.setItem('auth_name', user.name || '');
}

function clearAuth() {
  sessionStorage.removeItem('auth_user_id');
  sessionStorage.removeItem('auth_roles');
  sessionStorage.removeItem('auth_email');
  sessionStorage.removeItem('auth_name');
  localStorage.removeItem('auth_remember_token');
}

function AppRoutes() {
  const navigate = useNavigate();
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

  const isAdmin = authUser?.role === 'admin';

  const goToAdminDashboard = (user: AuthUser) => {
    setAuthUser(user);
    persistAuth(user);
    navigate('/dashboard', { replace: true });
  };

  const handleNonAdminAccess = (role: AuthUser['role']) => {
    clearAuth();
    setAuthUser(null);
    setLoginError(`Access denied. Admin role required (current role: ${role}).`);
    navigate('/login', { replace: true });
  };

  const handleLogin = async (payload: { email: string; password: string; remember: boolean }) => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const response = await api.login(payload);

      if (response.user.role !== 'admin') {
        handleNonAdminAccess(response.user.role);
        return;
      }

      goToAdminDashboard(response.user);

      if (payload.remember && response.rememberToken) {
        localStorage.setItem('auth_remember_token', response.rememberToken);
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed.');
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

      if (response.user.role !== 'admin') {
        handleNonAdminAccess(response.user.role);
        return;
      }

      goToAdminDashboard(response.user);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Google login failed.');
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
      const response = await api.register(payload);
      setRegisterSuccess(response.message);

      if (response.user.role !== 'admin') {
        setLoginError('Registration completed, but only admin users can access this console.');
        navigate('/login', { replace: true });
        return;
      }

      goToAdminDashboard(response.user);
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Register failed.');
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
      setResetError(error instanceof Error ? error.message : 'Reset password failed.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const adminLayout = useMemo(
    () => (view: JSX.Element) => (isAdmin ? <Layout>{view}</Layout> : <Navigate to="/login" replace />),
    [isAdmin],
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAdmin ? '/dashboard' : '/login'} replace />} />

      <Route
        path="/login"
        element={
          isAdmin ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginScreen
              onRegister={() => navigate('/register')}
              onGoogleLogin={() => navigate('/login/google')}
              onForgotPassword={() => navigate('/reset-password')}
              onLogin={handleLogin}
              isLoggingIn={isLoggingIn || isGoogleLoggingIn}
              errorMessage={loginError}
            />
          )
        }
      />

      <Route
        path="/login/google"
        element={
          isAdmin ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <GoogleAccountSelector onBack={() => navigate('/login')} onSelect={handleGoogleLogin} />
          )
        }
      />

      <Route
        path="/register"
        element={
          isAdmin ? (
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
          isAdmin ? (
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

      <Route path="/dashboard" element={adminLayout(<DashboardView />)} />
      <Route path="/inventory" element={adminLayout(<InventoryView />)} />
      <Route path="/users" element={adminLayout(<UserPairMgmt />)} />
      <Route path="/catalog" element={adminLayout(<AdminSeedView />)} />
      <Route path="/settings" element={adminLayout(<SettingsView />)} />

      <Route path="*" element={<Navigate to={isAdmin ? '/dashboard' : '/login'} replace />} />
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
