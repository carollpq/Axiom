'use client';

// Lit access control conditions are standard JSON objects.
// We use "ethereum" as the chain for wallet-address checks since Lit has
// first-class EVM support and these conditions are chain-agnostic
// (no contract call — just checks the connected wallet address).
export type AccessControlCondition = {
  contractAddress: string;
  standardContractType: string;
  chain: string;
  method: string;
  parameters: string[];
  returnValueTest: { comparator: string; value: string };
};

type OperatorCondition = { operator: 'or' };
export type ConditionList = (AccessControlCondition | OperatorCondition)[];

/**
 * Builds an OR list of wallet-address conditions.
 * Used for private drafts (author-only) and under-review (authors + reviewers + editor).
 */
export function buildWalletListConditions(wallets: string[]): ConditionList {
  if (wallets.length === 0) throw new Error('At least one wallet required');

  return wallets.flatMap(
    (wallet, i): (AccessControlCondition | OperatorCondition)[] => [
      ...(i > 0 ? [{ operator: 'or' as const }] : []),
      {
        contractAddress: '',
        standardContractType: '',
        chain: 'ethereum',
        method: '',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: wallet.toLowerCase(),
        },
      },
    ],
  );
}

/**
 * Extracts wallet addresses from an existing access conditions list.
 * Returns deduplicated lowercase wallet addresses.
 */
export function extractWalletsFromConditions(
  conditionList: ConditionList,
): string[] {
  const wallets = new Set<string>();
  for (const condition of conditionList) {
    if ('returnValueTest' in condition && condition.returnValueTest?.value) {
      wallets.add(condition.returnValueTest.value.toLowerCase());
    }
  }
  return Array.from(wallets);
}

/**
 * Adds reviewer wallets to existing Lit access conditions.
 * If the conditions JSON is invalid or empty, builds new conditions with all wallets.
 *
 * @param existingConditionsJson - Current litAccessConditionsJson from DB (or null)
 * @param reviewerWallets - New reviewer wallets to add
 * @returns Updated accessConditionsJson as a JSON string
 */
export function addReviewersToAccessConditions(
  existingConditionsJson: string | null | undefined,
  reviewerWallets: string[],
): string {
  if (!reviewerWallets || reviewerWallets.length === 0) {
    // No reviewers to add; return existing or empty
    return existingConditionsJson ?? '';
  }

  let existingWallets: string[] = [];

  if (existingConditionsJson) {
    try {
      const parsed = JSON.parse(existingConditionsJson);
      if (Array.isArray(parsed)) {
        existingWallets = extractWalletsFromConditions(parsed);
      }
    } catch {
      // If parsing fails, treat as empty and rebuild from scratch
      console.warn('[Lit] Failed to parse existing conditions, rebuilding');
    }
  }

  // Merge and deduplicate (case-insensitive)
  const walletSet = new Set(existingWallets.map((w) => w.toLowerCase()));
  reviewerWallets.forEach((w) => walletSet.add(w.toLowerCase()));
  const allWallets = Array.from(walletSet);

  // Rebuild conditions with all wallets
  const updatedConditions = buildWalletListConditions(allWallets);
  return JSON.stringify(updatedConditions);
}
