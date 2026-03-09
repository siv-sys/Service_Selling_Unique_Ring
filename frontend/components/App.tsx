import { useEffect, useState } from 'react';
import { AuthScreen } from './types';
import { LoginScreen } from '../views/LoginView';
import { RegisterScreen } from '../views/RegisterView';
import { ResetPasswordScreen } from '../views/ResetPasswordView';
import { DashboardView } from '../views/DashboardView';
import { GoogleAccountSelector } from './GoogleAccountSelector';
import { api, type AuthUser } from '../lib/api';

export default function App() {
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const normalizeRole = (role: string | null | undefined): AuthUser['role'] => {
    return String(role || '').trim().toLowerCase() === 'admin' ? 'admin' : 'user';
  };

  const normalizeUser = (user: AuthUser): AuthUser => ({
    ...user,
    role: normalizeRole(user.role),
  });

  const goToDashboardByRole = (role: string | null | undefined) => {
    setScreen(normalizeRole(role) === 'admin' ? 'dashboard-admin' : 'dashboard-user');
  };

  const handleRegisterClick = () => {
    setRegisterError(null);
    setRegisterSuccess(null);
    setScreen('register');
  };
  const handleLoginClick = () => {
    setLoginError(null);
    setScreen('login');
  };
  const handleGoogleLoginClick = () => setScreen('google-select');
  const handleForgotPasswordClick = () => setScreen('reset-password');
  const handleBackFromGoogle = () => {
    setLoginError(null);
    setScreen('login');
  };
  
  const persistAuth = (user: AuthUser) => {
    const normalizedUser = normalizeUser(user);
    sessionStorage.setItem('auth_user_id', String(user.id));
    sessionStorage.setItem('auth_roles', normalizedUser.role);
    sessionStorage.setItem('auth_email', normalizedUser.email);
    sessionStorage.setItem('auth_name', normalizedUser.name || '');
  };

  const clearAuth = () => {
    sessionStorage.removeItem('auth_user_id');
    sessionStorage.removeItem('auth_roles');
    sessionStorage.removeItem('auth_email');
    sessionStorage.removeItem('auth_name');
    localStorage.removeItem('auth_remember_token');
  };

  useEffect(() => {
    const restoreAuth = async () => {
      const storedUserId = sessionStorage.getItem('auth_user_id');
      if (!storedUserId) {
        return;
      }

      try {
        const response = await api.me();
        const normalizedUser = normalizeUser(response.user);
        setAuthUser(normalizedUser);
        persistAuth(normalizedUser);
        goToDashboardByRole(normalizedUser.role);
      } catch {
        clearAuth();
        setAuthUser(null);
        setScreen('login');
      }
    };

    void restoreAuth();
  }, []);

  const handleLogin = async (payload: { email: string; password: string; remember: boolean }) => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const response = await api.login(payload);
      const normalizedUser = normalizeUser(response.user);
      setAuthUser(normalizedUser);
      persistAuth(normalizedUser);
      goToDashboardByRole(normalizedUser.role);

      if (payload.remember && response.rememberToken) {
        localStorage.setItem('auth_remember_token', response.rememberToken);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      setLoginError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAccountSelect = async (email: string) => {
    try {
      setIsGoogleLoggingIn(true);
      setLoginError(null);
      const response = await api.googleLogin({
        email,
        providerId: email,
        name: email.split('@')[0],
      });
      const normalizedUser = normalizeUser(response.user);
      setAuthUser(normalizedUser);
      persistAuth(normalizedUser);
      goToDashboardByRole(normalizedUser.role);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google login failed.';
      setLoginError(message);
      setScreen('login');
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
      const normalizedUser = normalizeUser(response.user);
      setAuthUser(normalizedUser);
      persistAuth(normalizedUser);
      goToDashboardByRole(normalizedUser.role);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Register failed.';
      setRegisterError(message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout API failures and continue local sign-out.
    }
    clearAuth();
    setAuthUser(null);
    setLoginError(null);
    setScreen('login');
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

  return (
    <div className="min-h-screen">
      {authUser && (
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Logged in as {authUser.email} ({authUser.role})
          </div>
        </div>
      )}

      {screen === 'login' && (
        <LoginScreen 
          onRegister={handleRegisterClick} 
          onGoogleLogin={handleGoogleLoginClick}
          onForgotPassword={handleForgotPasswordClick}
          onLogin={handleLogin}
          isLoggingIn={isLoggingIn || isGoogleLoggingIn}
          errorMessage={loginError}
        />
      )}
      
      {screen === 'register' && (
        <RegisterScreen 
          onLogin={handleLoginClick} 
          onGoogleLogin={handleGoogleLoginClick}
          onRegister={handleRegister}
          isSubmitting={isRegistering}
          errorMessage={registerError}
          successMessage={registerSuccess}
        />
      )}
      
      {screen === 'google-select' && (
        <GoogleAccountSelector 
          onBack={handleBackFromGoogle} 
          onSelect={handleAccountSelect}
        />
      )}

      {screen === 'reset-password' && (
        <ResetPasswordScreen
          onBackToLogin={handleLoginClick}
          onGoogleLogin={handleGoogleLoginClick}
          onResetPassword={handleResetPassword}
          isSubmitting={isResettingPassword}
          errorMessage={resetError}
          successMessage={resetSuccess}
        />
      )}

      {screen === 'dashboard-user' && (
        <DashboardView role="user" onBackToLogin={handleBackToLogin} />
      )}

      {screen === 'dashboard-admin' && (
        <DashboardView role="admin" onBackToLogin={handleBackToLogin} />
      )}
    </div>
  );
}
