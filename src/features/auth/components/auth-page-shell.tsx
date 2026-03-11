import { AUTH_COLORS } from './auth-styles';

/**
 * Shared wrapper for login & register pages.
 * Provides the common dark-themed centered card layout.
 * Post-auth redirects are handled by each child (Login, Registration).
 */
export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: AUTH_COLORS.bg.page }}
    >
      <div
        className="w-full max-w-md p-8 rounded-lg border"
        style={{
          backgroundColor: AUTH_COLORS.bg.card,
          borderColor: 'rgba(120,110,95,0.2)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
