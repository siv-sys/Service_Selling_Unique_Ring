export type AuthScreen =
  | 'login'
  | 'register'
  | 'google-select'
  | 'reset-password'
  | 'dashboard-user'
  | 'dashboard-admin';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar: string;
}
