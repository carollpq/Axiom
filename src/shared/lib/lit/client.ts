'use client';

import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';

/**
 * Maps the NEXT_PUBLIC_LIT_NETWORK env value to the LIT_NETWORK enum.
 * Falls back to NagaDev (testnet) when not configured.
 */
function resolveNetwork() {
  const envVal = process.env.NEXT_PUBLIC_LIT_NETWORK;
  const networkMap: Record<
    string,
    (typeof LIT_NETWORK)[keyof typeof LIT_NETWORK]
  > = {
    naga: LIT_NETWORK.Naga,
    'naga-dev': LIT_NETWORK.NagaDev,
    'naga-test': LIT_NETWORK.NagaTest,
  };
  return envVal && networkMap[envVal]
    ? networkMap[envVal]
    : LIT_NETWORK.NagaDev;
}

let _client: LitNodeClient | null = null;
let _connectPromise: Promise<LitNodeClient> | null = null;

/**
 * Returns a connected LitNodeClient singleton.
 * Connection is established once; subsequent calls return the cached instance.
 */
export async function getLitClient(): Promise<LitNodeClient> {
  if (_client?.ready) return _client;

  // Deduplicate concurrent connect() calls
  if (_connectPromise) return _connectPromise;

  _connectPromise = (async () => {
    const client = new LitNodeClient({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      litNetwork: resolveNetwork() as any,
      debug: false,
    });
    await client.connect();
    _client = client;
    _connectPromise = null;
    return client;
  })();

  return _connectPromise;
}
