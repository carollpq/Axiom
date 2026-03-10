import { Client, AccountId, PrivateKey } from '@hashgraph/sdk';

/** Parse a private key string — supports DER, ED25519 hex, and ECDSA hex. */
function parsePrivateKey(keyStr: string): PrivateKey {
  try {
    return PrivateKey.fromStringDer(keyStr);
  } catch {
    try {
      return PrivateKey.fromStringED25519(keyStr);
    } catch {
      return PrivateKey.fromStringECDSA(keyStr);
    }
  }
}

import { HEDERA_NETWORK } from './network';

let _client: Client | null = null;

export function getHederaClient(): Client {
  if (_client) return _client;

  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    throw new Error(
      'HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY env vars must be set',
    );
  }

  _client =
    HEDERA_NETWORK === 'mainnet' ? Client.forMainnet() : Client.forTestnet();

  _client.setOperator(
    AccountId.fromString(operatorId),
    parsePrivateKey(operatorKey),
  );

  return _client;
}

/** True when Hedera credentials are present in the environment. */
export function isHederaConfigured(): boolean {
  return !!(process.env.HEDERA_OPERATOR_ID && process.env.HEDERA_OPERATOR_KEY);
}
