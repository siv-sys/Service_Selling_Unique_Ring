export type AuthScreen = 'login' | 'register' | 'google-select';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar: string;
}
