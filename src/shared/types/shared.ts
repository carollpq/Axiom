// Shared type definitions used across multiple domains
import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/src/features/auth/types';

/** Unified badge color config — replaces StageColorConfig and StatusColor */
export interface BadgeColorConfig {
  bg: string;
  text: string;
  border: string;
}

/** Generic tab configuration */
export interface TabConfig<K extends string = string> {
  key: K;
  label: string;
  count: number | null;
}

/** Shared stat card props — superset of author (icon) and journal (sub/alert) variants */
export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  sub?: string;
  alert?: boolean;
}

/** Navigation item data — icon is a string name resolved on the client */
export interface NavItemData {
  label: string;
  href: string;
  icon?: string;
  badge?: boolean;
}

/** User profile for TopBar display */
export interface UserProfile {
  displayName: string | null;
  initials: string;
  wallet: string;
  role: Role;
  roles: Role[];
}
