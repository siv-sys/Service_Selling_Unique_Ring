export type AuthScreen = 'login' | 'register' | 'google-select' | 'reset-password';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar: string;
}
