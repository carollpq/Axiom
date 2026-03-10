import type { EditorProfile } from '@/src/features/editor/types';

interface EditorProfileCardProps {
  editor: EditorProfile;
}

export function EditorProfileCard({ editor }: EditorProfileCardProps) {
  return (
    <div
      className="rounded-[6px] p-6 text-center"
      style={{
        background:
          'linear-gradient(145deg, rgba(45,42,38,0.9), rgba(35,32,28,0.9))',
        border: '1px solid rgba(120,110,95,0.25)',
      }}
    >
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-5">
        Editor Profile
      </div>

      {/* Avatar */}
      <div
        className="mx-auto mb-4 rounded-full flex items-center justify-center font-serif text-xl"
        style={{
          width: 80,
          height: 80,
          background:
            'linear-gradient(135deg, rgba(120,110,95,0.3), rgba(80,72,60,0.3))',
          border: '2px solid rgba(120,110,95,0.3)',
          color: '#c9b89e',
        }}
      >
        {editor.initials}
      </div>

      <div className="font-serif text-[#e8e0d4] text-sm mb-1">
        {editor.name}
      </div>
      <div className="text-[11px] text-[#8a8070] mb-1">
        {editor.affiliation}
      </div>
      <div className="text-[11px] text-[#6a6050]">{editor.journalName}</div>
    </div>
  );
}
