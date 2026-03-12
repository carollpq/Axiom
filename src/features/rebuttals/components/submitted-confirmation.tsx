import { SuccessBanner } from '@/src/shared/components/success-banner';

export function SubmittedConfirmation() {
  return (
    <SuccessBanner
      title="Rebuttal Submitted"
      subtitle="Your responses have been submitted. The editor will review them."
    />
  );
}
