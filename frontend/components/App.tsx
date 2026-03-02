import { useState } from 'react';
import { AuthScreen } from './types';
import { LoginScreen } from '../views/LoginView';
import { RegisterScreen } from '../views/RegisterView';
import { ResetPasswordScreen } from '../views/ResetPasswordView';
import { GoogleAccountSelector } from './GoogleAccountSelector';

export default function App() {
  const [screen, setScreen] = useState<AuthScreen>('login');

  const handleRegisterClick = () => setScreen('register');
  const handleLoginClick = () => setScreen('login');
  const handleGoogleLoginClick = () => setScreen('google-select');
  const handleForgotPasswordClick = () => setScreen('reset-password');
  const handleBackFromGoogle = () => setScreen('login');
  
  const handleAccountSelect = (email: string) => {
    console.log('Selected account:', email);
    alert(`Successfully signed in with ${email}`);
    setScreen('login');
  };

  return (
    <div className="min-h-screen">
      {screen === 'login' && (
        <LoginScreen 
          onRegister={handleRegisterClick} 
          onGoogleLogin={handleGoogleLoginClick}
          onForgotPassword={handleForgotPasswordClick}
        />
      )}
      
      {screen === 'register' && (
        <RegisterScreen 
          onLogin={handleLoginClick} 
          onGoogleLogin={handleGoogleLoginClick} 
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
        />
      )}
    </div>
  );
}
