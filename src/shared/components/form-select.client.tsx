'use client';

import type { SelectHTMLAttributes } from 'react';
import { FORM_CONTROL_CLASS, FORM_CONTROL_STYLE } from './form-styles';

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function FormSelect({
  className = '',
  style,
  children,
  ...rest
}: FormSelectProps) {
  return (
    <select
      className={`${FORM_CONTROL_CLASS} rounded-[6px] px-3 py-2 cursor-pointer ${className}`}
      style={{
        ...FORM_CONTROL_STYLE,
        appearance: 'none',
        ...style,
      }}
      {...rest}
    >
      {children}
    </select>
  );
}
