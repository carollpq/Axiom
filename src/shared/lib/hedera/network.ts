/** Hedera network from env, defaulting to testnet. Zero-dependency so mirror.ts stays SDK-free. */
export const HEDERA_NETWORK = process.env.HEDERA_NETWORK ?? 'testnet';
