interface ListRowProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "gold";
}

export function ListRow({
  children,
  className = "",
  variant = "default",
}: ListRowProps) {
  const borderColor =
    variant === "gold"
      ? "rgba(180,160,120,0.2)"
      : "rgba(120,110,95,0.15)";

  return (
    <div
      className={`flex items-center justify-between px-3 py-2.5 rounded min-w-0 ${className}`}
      style={{
        background: "rgba(45,42,38,0.5)",
        border: `1px solid ${borderColor}`,
      }}
    >
      {children}
    </div>
  );
}
