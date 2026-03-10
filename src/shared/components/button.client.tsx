'use client';

import type { ButtonHTMLAttributes } from 'react';

const variants = {
  gold: {
    background:
      'linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))',
    border: '1px solid rgba(180,160,120,0.4)',
    color: '#d4c8a8',
  },
  red: {
    background:
      'linear-gradient(135deg, rgba(200,100,90,0.25), rgba(180,80,70,0.15))',
    border: '1px solid rgba(200,100,90,0.4)',
    color: '#d4645a',
  },
  green: {
    background:
      'linear-gradient(135deg, rgba(120,180,120,0.25), rgba(100,160,100,0.15))',
    border: '1px solid rgba(120,180,120,0.4)',
    color: '#8fbc8f',
  },
  blue: {
    background: 'rgba(90,122,154,0.15)',
    border: '1px solid rgba(90,122,154,0.3)',
    color: '#5a7a9a',
  },
  ghost: {
    background: 'none',
    border: '1px solid rgba(120,110,95,0.2)',
    color: '#6a6050',
  },
} as const;

type Variant = keyof typeof variants;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({
  variant = 'gold',
  fullWidth,
  className = '',
  style,
  children,
  ...rest
}: ButtonProps) {
  const v = variants[variant];
  return (
    <button
      className={`px-4 py-2 rounded text-[12px] font-serif cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ ...v, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
