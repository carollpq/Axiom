import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/** Standard constrained page wrapper used across detail/form pages. */
export function PageContainer({
  children,
  className = '',
}: PageContainerProps) {
  return (
    <div className={`max-w-[1200px] mx-auto px-10 py-8 ${className}`}>
      {children}
    </div>
  );
}
