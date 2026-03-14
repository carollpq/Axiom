import { AlertBanner } from '@/src/shared/components/alert-banner';

interface ModificationWarningProps {
  visible: boolean;
}

export function ModificationWarning({ visible }: ModificationWarningProps) {
  if (!visible) return null;

  return (
    <AlertBanner
      variant="warning"
      title="Signatures collected"
      className="mb-6"
    >
      Modifying any field will invalidate all existing signatures. All
      contributors will need to re-sign. Previous versions are retained
      on-chain.
    </AlertBanner>
  );
}
