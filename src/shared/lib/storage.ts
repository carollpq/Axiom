import * as Client from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import * as Signer from "@ucanto/principal/ed25519";
import * as Delegation from "@ucanto/core/delegation";

export function isStorageConfigured(): boolean {
  return !!(
    process.env.W3_PRINCIPAL_KEY && process.env.W3_DELEGATION_PROOF
  );
}

let _clientPromise: Promise<Client.Client> | null = null;

async function initW3Client(): Promise<Client.Client> {
  const principal = Signer.parse(process.env.W3_PRINCIPAL_KEY!);
  const client = await Client.create({ principal, store: new StoreMemory() });

  const proofBytes = Buffer.from(process.env.W3_DELEGATION_PROOF!, "base64");
  const proof = await Delegation.extract(proofBytes);
  if (!proof.ok) throw new Error("Failed to parse delegation proof");

  await client.addProof(proof.ok);
  return client;
}

function getW3Client(): Promise<Client.Client> {
  if (!_clientPromise) {
    _clientPromise = initW3Client().catch((err) => {
      _clientPromise = null;
      throw err;
    });
  }
  return _clientPromise;
}

/**
 * Upload a file to IPFS via web3.storage and return the CID string.
 */
export async function uploadToIPFS(
  file: Blob & { name?: string },
  fileName: string,
): Promise<string> {
  const client = await getW3Client();
  const uploadable = Object.assign(file, { name: fileName });
  const cid = await client.uploadFile(uploadable);
  return cid.toString();
}

/**
 * Fetch a file from IPFS via the w3s.link gateway.
 */
export async function getFileFromIPFS(cid: string): Promise<Buffer> {
  const res = await fetch(`https://w3s.link/ipfs/${cid}`);
  if (!res.ok) throw new Error(`IPFS fetch failed: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
