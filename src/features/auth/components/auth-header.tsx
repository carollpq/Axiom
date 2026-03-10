interface AuthHeaderProps {
  subtitle: string;
}

export function AuthHeader({ subtitle }: AuthHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="font-serif text-4xl mb-2" style={{ color: '#d4ccc0' }}>
        Axiom
      </h1>
      <p className="text-sm" style={{ color: '#b0a898' }}>
        {subtitle}
      </p>
    </div>
  );
}
