interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <div
      className={`text-[10px] text-[#6a6050] uppercase tracking-[1.5px] ${className}`}
    >
      {children}
    </div>
  );
}
