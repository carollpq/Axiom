/** ORCID iD format: four groups of four digits, last character may be X (checksum). */
export const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;

export function validateOrcidFormat(orcid: string): boolean {
  return ORCID_REGEX.test(orcid);
}
