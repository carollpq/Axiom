'use client';

import type { TextareaHTMLAttributes } from 'react';
import { FORM_CONTROL_CLASS, FORM_CONTROL_STYLE } from './form-styles';

type FormTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function FormTextarea({
  className = '',
  style,
  ...rest
}: FormTextareaProps) {
  return (
    <textarea
      className={`${FORM_CONTROL_CLASS} rounded-[6px] p-3 resize-none ${className}`}
      style={{
        ...FORM_CONTROL_STYLE,
        ...style,
      }}
      {...rest}
    />
  );
}
