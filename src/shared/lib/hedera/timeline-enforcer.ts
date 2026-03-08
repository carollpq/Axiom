import { ethers } from 'ethers';

const TIMELINE_ENFORCER_ABI = [
  'function registerDeadline(bytes32 submissionHash, uint256 dueTimestamp, address responsible) external',
  'function markCompleted(bytes32 submissionHash, uint256 index) external',
  'function checkDeadline(bytes32 submissionHash, uint256 index) external view returns (bool isOverdue, uint256 dueTimestamp, address responsible)',
  'event DeadlineRegistered(bytes32 indexed submissionHash, uint256 index, uint256 dueTimestamp, address indexed responsible)',
];

/** True when the TimelineEnforcer contract env vars are present. */
export function isTimelineEnforcerConfigured(): boolean {
  return !!(
    process.env.TIMELINE_ENFORCER_ADDRESS && process.env.HEDERA_EVM_PRIVATE_KEY
  );
}

let _contract: ethers.Contract | null = null;

function getContract(): ethers.Contract {
  if (_contract) return _contract;

  const network = process.env.HEDERA_NETWORK ?? 'testnet';
  const rpcUrl =
    network === 'mainnet'
      ? 'https://mainnet.hashio.io/api'
      : 'https://testnet.hashio.io/api';
  const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
    batchMaxCount: 1,
  });
  const wallet = new ethers.Wallet(
    process.env.HEDERA_EVM_PRIVATE_KEY!,
    provider,
  );
  _contract = new ethers.Contract(
    process.env.TIMELINE_ENFORCER_ADDRESS!,
    TIMELINE_ENFORCER_ABI,
    wallet,
  );
  return _contract;
}

/** Convert a submission UUID to a bytes32 hash for the contract. */
export function submissionToHash(submissionId: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(submissionId));
}

/**
 * Register a deadline on-chain for a reviewer assignment.
 * Returns the tx hash and the on-chain array index, or null if not configured.
 */
export async function registerDeadline(
  submissionId: string,
  deadlineIso: string,
  reviewerEvmAddress: string,
): Promise<{ txHash: string; index: number } | null> {
  if (!isTimelineEnforcerConfigured()) return null;

  try {
    const contract = getContract();
    const subHash = submissionToHash(submissionId);
    const dueTimestamp = Math.floor(new Date(deadlineIso).getTime() / 1000);

    const tx = await contract.registerDeadline(
      subHash,
      dueTimestamp,
      reviewerEvmAddress,
    );
    const receipt = await tx.wait();

    // Parse DeadlineRegistered event to get the index
    let index = 0;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed?.name === 'DeadlineRegistered') {
          index = Number(parsed.args.index);
          break;
        }
      } catch {
        // skip logs from other contracts
      }
    }

    console.log(
      `[TimelineEnforcer] Registered deadline: submission=${submissionId}, index=${index}, tx=${receipt.hash}`,
    );
    return { txHash: receipt.hash, index };
  } catch (err) {
    console.error('[TimelineEnforcer] registerDeadline failed:', err);
    return null;
  }
}

/**
 * Mark a deadline as completed on-chain.
 * Returns the tx hash, or null if not configured.
 */
export async function markDeadlineCompleted(
  submissionId: string,
  index: number,
): Promise<string | null> {
  if (!isTimelineEnforcerConfigured()) return null;

  try {
    const contract = getContract();
    const subHash = submissionToHash(submissionId);

    const tx = await contract.markCompleted(subHash, index);
    const receipt = await tx.wait();

    console.log(
      `[TimelineEnforcer] Marked completed: submission=${submissionId}, index=${index}, tx=${receipt.hash}`,
    );
    return receipt.hash;
  } catch (err) {
    console.error('[TimelineEnforcer] markDeadlineCompleted failed:', err);
    return null;
  }
}

/**
 * Check a deadline's status on-chain.
 * Returns overdue status and details, or null if not configured.
 */
export async function checkDeadline(
  submissionId: string,
  index: number,
): Promise<{
  isOverdue: boolean;
  dueTimestamp: number;
  responsible: string;
} | null> {
  if (!isTimelineEnforcerConfigured()) return null;

  try {
    const contract = getContract();
    const subHash = submissionToHash(submissionId);

    const [isOverdue, dueTimestamp, responsible] = await contract.checkDeadline(
      subHash,
      index,
    );
    return {
      isOverdue,
      dueTimestamp: Number(dueTimestamp),
      responsible,
    };
  } catch (err) {
    console.error('[TimelineEnforcer] checkDeadline failed:', err);
    return null;
  }
}
