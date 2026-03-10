'use client';

interface AgreeDisagreeToggleProps {
  value: string | undefined;
  onChange: (position: 'agree' | 'disagree') => void;
}

export function AgreeDisagreeToggle({
  value,
  onChange,
}: AgreeDisagreeToggleProps) {
  return (
    <div className="flex gap-2 mb-3">
      {(['agree', 'disagree'] as const).map((pos) => (
        <button
          key={pos}
          onClick={() => onChange(pos)}
          className="flex-1 py-2 rounded text-[12px] font-serif cursor-pointer transition-colors"
          style={{
            background:
              value === pos
                ? pos === 'agree'
                  ? 'rgba(120,180,120,0.2)'
                  : 'rgba(200,100,90,0.2)'
                : 'rgba(45,42,38,0.5)',
            border: `1px solid ${
              value === pos
                ? pos === 'agree'
                  ? 'rgba(120,180,120,0.4)'
                  : 'rgba(200,100,90,0.4)'
                : 'rgba(120,110,95,0.2)'
            }`,
            color:
              value === pos
                ? pos === 'agree'
                  ? '#8fbc8f'
                  : '#d4645a'
                : '#8a8070',
          }}
        >
          {pos === 'agree' ? 'Agree' : 'Disagree'}
        </button>
      ))}
    </div>
  );
}
