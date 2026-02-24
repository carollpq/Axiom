// Validate ORCID format (XXXX-XXXX-XXXX-XXXX)
export function validateOrcidFormat(orcid: string): boolean {
  const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;
  return orcidRegex.test(orcid);
}
