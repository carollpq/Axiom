const variants = {
  success: {
    background: 'rgba(120,180,120,0.06)',
    border: '1px solid rgba(120,180,120,0.2)',
    iconColor: '#8fbc8f',
  },
  warning: {
    background: 'rgba(200,160,100,0.08)',
    border: '1px solid rgba(200,160,100,0.2)',
    iconColor: '#c4956a',
  },
  error: {
    background: 'rgba(200,100,90,0.1)',
    border: '1px solid rgba(200,100,90,0.3)',
    iconColor: '#d4645a',
  },
} as const;

type Variant = keyof typeof variants;

interface AlertBannerProps {
  variant: Variant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function AlertBanner({
  variant,
  title,
  children,
  className = '',
}: AlertBannerProps) {
  const v = variants[variant];
  return (
    <div
      className={`py-3 px-4 rounded-md flex items-start gap-2.5 ${className}`}
      style={{ background: v.background, border: v.border }}
    >
      <span
        className="text-base shrink-0 leading-none"
        style={{ color: v.iconColor }}
      >
        {variant === 'success' ? '\u2713' : '\u26A0'}
      </span>
      <div>
        {title && (
          <div
            className="text-xs font-semibold mb-0.5"
            style={{ color: v.iconColor }}
          >
            {title}
          </div>
        )}
        <div className="text-[11px] text-[#8a8070]">{children}</div>
      </div>
    </div>
  );
}
