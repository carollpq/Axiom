/** ORCID iD format: four groups of four digits, last character may be X (checksum). */
export const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;

export const SHA256_REGEX = /^[a-f0-9]{64}$/;
export const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
export const HEX_SIGNATURE_REGEX = /^0x[a-fA-F0-9]+$/;
