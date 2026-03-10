'use client';

import type { InputHTMLAttributes } from 'react';
import { FORM_CONTROL_CLASS, FORM_CONTROL_STYLE } from './form-styles';

type FormInputProps = InputHTMLAttributes<HTMLInputElement>;

export function FormInput({ className = '', style, ...rest }: FormInputProps) {
  return (
    <input
      className={`${FORM_CONTROL_CLASS} ${className}`}
      style={{
        ...FORM_CONTROL_STYLE,
        background: 'rgba(30,28,24,0.8)',
        border: '1px solid rgba(120,110,95,0.25)',
        padding: '7px 10px',
        boxSizing: 'border-box',
        ...style,
      }}
      {...rest}
    />
  );
}
