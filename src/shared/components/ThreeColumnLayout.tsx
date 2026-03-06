interface ThreeColumnLayoutProps {
  list: React.ReactNode;
  viewer: React.ReactNode;
  sidebar: React.ReactNode;
  title?: string;
  subtitle?: string;
  countLabel?: string;
  sidebarTitle?: string;
}

export function ThreeColumnLayout({
  list,
  viewer,
  sidebar,
  title,
  subtitle,
  countLabel,
  sidebarTitle,
}: ThreeColumnLayoutProps) {
  const hasHeader = !!title;
  const contentHeight = hasHeader ? "calc(100vh - 56px - 56px)" : "calc(100vh - 56px)";

  return (
    <div>
      {hasHeader && (
        <div
          className="flex items-center justify-between px-5"
          style={{
            height: 56,
            borderBottom: "1px solid rgba(120,110,95,0.15)",
          }}
        >
          <div className="flex flex-col justify-center">
            <h2 className="text-[20px] font-serif text-[#e8e0d4] tracking-[0.5px] leading-tight">
              {title}
            </h2>
            {subtitle && (
              <span className="text-[13px] text-[#6a6050] italic">
                {subtitle}
              </span>
            )}
          </div>
          {countLabel && (
            <span className="font-serif text-[12px] text-[#8a8070]">
              {countLabel}
            </span>
          )}
        </div>
      )}

      <div className="flex" style={{ height: contentHeight }}>
        {/* Left – paper list */}
        <div
          className="overflow-y-auto"
          style={{
            width: 360,
            minWidth: 300,
            borderRight: "1px solid rgba(120,110,95,0.15)",
          }}
        >
          {list}
        </div>

        {/* Center – viewer */}
        <div className="flex-1 overflow-y-auto">{viewer}</div>

        {/* Right – sidebar */}
        <div
          className="shrink-0"
          style={{
            width: 320,
            overflowY: "auto",
            overflowX: "clip",
            borderLeft: "1px solid rgba(120,110,95,0.15)",
          }}
        >
          {sidebarTitle && (
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid rgba(120,110,95,0.12)" }}
            >
              <span className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px]">
                {sidebarTitle}
              </span>
            </div>
          )}
          {sidebar}
        </div>
      </div>
    </div>
  );
}
