"use client";

import { getLitClient } from "./client";
import type { ConditionList } from "./access-control";
import type { AccessControlConditions } from "@lit-protocol/types";

export interface LitEncryptResult {
  /**
   * Lit-encrypted ciphertext as a base64 string — upload this to IPFS.
   * When decrypting, pass this value back to litClient.decrypt().
   */
  ciphertext: string;
  /**
   * Hash of the original plaintext — required for decryption.
   * Store this in the database.
   */
  dataToEncryptHash: string;
  /** JSON-serialised access conditions — store in DB for later decryption. */
  accessConditionsJson: string;
}

/**
 * Encrypts a File using Lit Protocol IBE (Identity Based Encryption).
 *
 * IMPORTANT: The SHA-256 of the original plaintext must be computed BEFORE
 * calling this. That hash goes on-chain and in the DB as `paperHash`.
 * The `ciphertext` returned here is a separate artifact stored on IPFS.
 */
export async function encryptFileWithLit(
  file: File,
  accessControlConditions: ConditionList,
): Promise<LitEncryptResult> {
  const litClient = await getLitClient();

  const buffer = await file.arrayBuffer();
  const dataToEncrypt = new Uint8Array(buffer);

  const { ciphertext, dataToEncryptHash } = await litClient.encrypt({
    dataToEncrypt,
    // Cast: our ConditionList structure is compatible at runtime
    accessControlConditions:
      accessControlConditions as unknown as AccessControlConditions,
  });

  return {
    ciphertext,
    dataToEncryptHash,
    accessConditionsJson: JSON.stringify(accessControlConditions),
  };
}
