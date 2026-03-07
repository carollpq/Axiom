'use client';

import { getLitClient } from './client';
import type { ConditionList } from './access-control';
import type { AccessControlConditions } from '@lit-protocol/types';

/**
 * Retrieves Lit session signatures by having the user sign a SIWE message.
 * Required for decryption. Session sigs are cached for ~24 hours.
 *
 * @param walletAddress - Connected wallet address
 * @param signMessage   - Signs a plain-text message (from Thirdweb account)
 */
async function getSessionSigs(
  walletAddress: string,
  signMessage: (message: string) => Promise<string>,
) {
  const {
    LitAccessControlConditionResource,
    createSiweMessageWithResources,
    generateAuthSig,
  } = await import('@lit-protocol/auth-helpers');
  const { LIT_ABILITY } = await import('@lit-protocol/constants');

  const litClient = await getLitClient();

  const resource = new LitAccessControlConditionResource('*');

  return litClient.getSessionSigs({
    chain: 'ethereum',
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    resourceAbilityRequests: [
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resource: resource as any,
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any,
    authNeededCallback: async ({
      uri,
      expiration,
      resourceAbilityRequests,
    }) => {
      const nonce = await litClient.getLatestBlockhash();
      const toSign = await createSiweMessageWithResources({
        uri: uri ?? '',
        expiration:
          expiration ?? new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resources: (resourceAbilityRequests ?? []) as any,
        walletAddress,
        nonce,
        litNodeClient: litClient,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const signature = await signMessage(toSign);

      // Minimal ethers-compatible signer required by generateAuthSig
      const signer = {
        signMessage: async () => signature,
        getAddress: async () => walletAddress,
      };
      return generateAuthSig({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        signer: signer as any,
        toSign,
      });
    },
  });
}

/**
 * Decrypts a Lit-encrypted ciphertext.
 * The user's wallet must prove it meets the access conditions.
 *
 * @param ciphertext            - The base64 string retrieved from IPFS
 * @param dataToEncryptHash     - Hash stored in DB at encryption time
 * @param accessControlConditions - Conditions stored in DB at encryption time
 * @param walletAddress         - Connected wallet address
 * @param signMessage           - Signing function from Thirdweb account
 */
export async function decryptFileWithLit(
  ciphertext: string,
  dataToEncryptHash: string,
  accessControlConditions: ConditionList,
  walletAddress: string,
  signMessage: (message: string) => Promise<string>,
): Promise<Uint8Array> {
  const litClient = await getLitClient();

  const sessionSigs = await getSessionSigs(walletAddress, signMessage);

  const { decryptedData } = await litClient.decrypt({
    chain: 'ethereum',
    ciphertext,
    dataToEncryptHash,
    accessControlConditions:
      accessControlConditions as unknown as AccessControlConditions,
    sessionSigs,
  });

  return decryptedData;
}
