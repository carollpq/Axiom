"use client";

import { useState } from "react";

interface RoleSelectorProps {
  onSelect: (role: "researcher" | "editor" | "reviewer") => void;
}

const ROLES = [
  {
    id: "researcher",
    label: "Researcher",
    description: "Submit papers and manage authorship",
    icon: "📄",
  },
  {
    id: "editor",
    label: "Journal Editor",
    description: "Manage review process and criteria",
    icon: "📋",
  },
  {
    id: "reviewer",
    label: "Peer Reviewer",
    description: "Evaluate papers and build reputation",
    icon: "✓",
  },
];

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = (roleId: string) => {
    setSelected(roleId);
    onSelect(roleId as "researcher" | "editor" | "reviewer");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm mb-4" style={{ color: "#b0a898" }}>
        Join as:
      </p>

      {ROLES.map(role => (
        <button
          key={role.id}
          onClick={() => handleClick(role.id)}
          className="w-full p-4 rounded border-2 transition-all text-left"
          style={{
            borderColor: selected === role.id ? "#c9a44a" : "#5a4a3a",
            backgroundColor:
              selected === role.id ? "rgba(201, 164, 74, 0.1)" : "transparent",
          }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{role.icon}</span>
            <div>
              <p className="font-semibold" style={{ color: "#d4ccc0" }}>
                {role.label}
              </p>
              <p className="text-xs mt-1" style={{ color: "#8a8070" }}>
                {role.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
