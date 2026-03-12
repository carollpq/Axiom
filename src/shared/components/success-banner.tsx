interface Props {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const bannerStyle = {
  background: 'rgba(143,188,143,0.08)',
  border: '1px solid rgba(143,188,143,0.3)',
} as const;

export function SuccessBanner({ title, subtitle, children }: Props) {
  return (
    <div className="p-4">
      <div className="rounded-lg p-4 text-center" style={bannerStyle}>
        <div className="text-[14px] text-[#8fbc8f] font-serif mb-1">
          {title}
        </div>
        {subtitle && (
          <div className="text-[11px] text-[#6a6050] font-serif">
            {subtitle}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
