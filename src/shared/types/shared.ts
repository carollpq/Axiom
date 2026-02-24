// Shared type definitions used across multiple domains

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
  icon?: string;
  sub?: string;
  alert?: boolean;
}

/** Navigation item data */
export interface NavItemData {
  label: string;
  href: string;
}

/** User profile for TopBar display */
export interface UserProfile {
  name: string;
  initials: string;
  wallet: string;
  role: string;
  notificationCount: number;
}
