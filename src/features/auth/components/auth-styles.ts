import type { CSSProperties, MouseEventHandler } from 'react';

/* ── Color palette (mirrors CLAUDE.md dark theme) ─────────────────────── */

export const AUTH_COLORS = {
  bg: { page: '#1a1816', card: 'rgba(45, 42, 38, 0.6)' },
  text: { primary: '#d4ccc0', secondary: '#b0a898', muted: '#8a8070' },
  border: {
    base: '#5a4a3a',
    error: '#d4645a',
    hoverGold: 'rgba(201, 164, 74, 0.5)',
  },
  accent: {
    gold: '#c9a44a',
    goldHover: '#d4b45a',
    goldSubtle: 'rgba(201, 164, 74, 0.1)',
    goldFaint: 'rgba(201, 164, 74, 0.05)',
  },
  success: '#8fbc8f',
  error: '#d4645a',
} as const;

/* ── Pre-computed input style variants (stable refs, zero per-render alloc) */

export const INPUT_STYLE: CSSProperties = {
  backgroundColor: AUTH_COLORS.bg.page,
  color: AUTH_COLORS.text.primary,
  border: `1px solid ${AUTH_COLORS.border.base}`,
};

export const INPUT_STYLE_ERROR: CSSProperties = {
  backgroundColor: AUTH_COLORS.bg.page,
  color: AUTH_COLORS.text.primary,
  border: `1px solid ${AUTH_COLORS.border.error}`,
};

/* ── Button hover helpers ─────────────────────────────────────────────── */

export const secondaryBtnHover: {
  onMouseEnter: MouseEventHandler<HTMLButtonElement>;
  onMouseLeave: MouseEventHandler<HTMLButtonElement>;
} = {
  onMouseEnter: (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.borderColor = AUTH_COLORS.border.hoverGold;
    e.currentTarget.style.color = AUTH_COLORS.text.primary;
  },
  onMouseLeave: (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.borderColor = AUTH_COLORS.border.base;
    e.currentTarget.style.color = AUTH_COLORS.text.secondary;
  },
};

export const SECONDARY_BTN_STYLE: CSSProperties = {
  backgroundColor: 'transparent',
  color: AUTH_COLORS.text.secondary,
  border: `1px solid ${AUTH_COLORS.border.base}`,
};

export const primaryBtnHover: {
  onMouseEnter: MouseEventHandler<HTMLButtonElement>;
  onMouseLeave: MouseEventHandler<HTMLButtonElement>;
} = {
  onMouseEnter: (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.backgroundColor = AUTH_COLORS.accent.goldHover;
  },
  onMouseLeave: (e) => {
    if (e.currentTarget.disabled) return;
    e.currentTarget.style.backgroundColor = AUTH_COLORS.accent.gold;
  },
};

export const PRIMARY_BTN_STYLE: CSSProperties = {
  backgroundColor: AUTH_COLORS.accent.gold,
  color: AUTH_COLORS.bg.page,
};
