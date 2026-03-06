import type { FC } from 'react';

interface DashboardViewProps {
  onBackToLogin?: () => void;
  role?: 'admin' | 'user';
}

export const DashboardView: FC<DashboardViewProps> = ({ onBackToLogin, role = 'user' }) => {
  const isAdmin = role === 'admin';
};

export default DashboardView;
