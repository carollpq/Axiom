"use client";

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

type OperatorCondition = { operator: "or" };
export type ConditionList = (AccessControlCondition | OperatorCondition)[];

/**
 * Builds an OR list of wallet-address conditions.
 * Used for private drafts (author-only) and under-review (authors + reviewers + editor).
 */
export function buildWalletListConditions(wallets: string[]): ConditionList {
  if (wallets.length === 0) throw new Error("At least one wallet required");

  return wallets.flatMap((wallet, i): (AccessControlCondition | OperatorCondition)[] => [
    ...(i > 0 ? [{ operator: "or" as const }] : []),
    {
      contractAddress: "",
      standardContractType: "",
      chain: "ethereum",
      method: "",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: "=",
        value: wallet.toLowerCase(),
      },
    },
  ]);
}

/**
 * Access condition that no one can ever satisfy — used for retracted papers.
 */
export function buildNoAccessCondition(): ConditionList {
  return [
    {
      contractAddress: "",
      standardContractType: "",
      chain: "ethereum",
      method: "",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: "=",
        value: "0x0000000000000000000000000000000000000000", // no real address
      },
    },
  ];
}
