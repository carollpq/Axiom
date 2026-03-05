interface ThreeColumnLayoutProps {
  list: React.ReactNode;
  viewer: React.ReactNode;
  sidebar: React.ReactNode;
}

export function ThreeColumnLayout({ list, viewer, sidebar }: ThreeColumnLayoutProps) {
  return (
    <div className="flex" style={{ height: "calc(100vh - 56px)" }}>
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
        {sidebar}
      </div>
    </div>
  );
}
