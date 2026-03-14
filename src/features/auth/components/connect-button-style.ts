import { AUTH_COLORS } from './auth-styles';

/** Shared style for the primary ConnectButton across auth pages. */
export const CONNECT_BUTTON_STYLE = {
  backgroundColor: AUTH_COLORS.accent.gold,
  color: AUTH_COLORS.bg.page,
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  fontFamily: 'Georgia, serif',
  padding: '8px 24px',
  height: '38px',
  fontWeight: '600',
} as const;
