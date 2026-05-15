
export enum AppView {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  DASHBOARD = 'DASHBOARD',
  COUPLE_SHOP = 'COUPLE_SHOP',
  MY_RING = 'MY_RING',
  COUPLE_PROFILE = 'COUPLE_PROFILE',
  RELATIONSHIP = 'RELATIONSHIP',
  USER_MGMT = 'USER_MGMT',
  INVENTORY = 'INVENTORY',
  SECURITY_LOGS = 'SECURITY_LOGS',
  ADMIN_SEED = 'ADMIN_SEED',
  SETTINGS = 'SETTINGS',
  MEMORIES = 'MEMORIES',
  RING_SCAN = 'RING_SCAN'
}

export enum ThemeType {
  LIGHT = 'light',
  DARK = 'dark'
}

export enum Role {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  USER = 'USER'
}

export interface Pair {
  id: string;
  user1: { id: string; name: string; handle: string; avatar: string };
  user2: { id: string; name: string; handle: string; avatar: string };
  ringId: string;
  status: string;
  lastActive: string;
  access: string;
}

export interface InventoryItem {
  id: string;
  model: string;
  batch: string;
  material: string;
  location: string;
  status: string;
  size: string;
}

export interface SecurityLog {
  timestamp: string;
  event: string;
  admin: string;
  ip: string;
  severity: string;
}
