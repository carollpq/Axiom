import { SectionLabel } from "./SectionLabel";

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  bordered?: boolean;
}

export function SidebarSection({
  title,
  children,
  bordered = true,
}: SidebarSectionProps) {
  return (
    <div
      className="p-4 min-w-0"
      style={bordered ? { borderBottom: "1px solid rgba(120,110,95,0.1)" } : undefined}
    >
      <SectionLabel className="mb-3">{title}</SectionLabel>
      {children}
    </div>
  );
}
