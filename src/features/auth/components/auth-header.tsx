import { AUTH_COLORS } from './auth-styles';

interface AuthHeaderProps {
  subtitle: string;
}

export function AuthHeader({ subtitle }: AuthHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1
        className="font-serif text-4xl mb-2"
        style={{ color: AUTH_COLORS.text.primary }}
      >
        Axiom
      </h1>
      <p className="text-sm" style={{ color: AUTH_COLORS.text.secondary }}>
        {subtitle}
      </p>
    </div>
  );
}
