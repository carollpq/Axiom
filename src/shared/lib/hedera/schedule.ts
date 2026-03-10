import {
  ScheduleCreateTransaction,
  ScheduleSignTransaction,
  ScheduleInfoQuery,
  ScheduleId,
  TopicMessageSubmitTransaction,
  TopicId,
} from '@hashgraph/sdk';
import { getHederaClient, isHederaConfigured } from './client';
import { canonicalJson } from '@/src/shared/lib/hashing';

export interface ScheduleResult {
  scheduleId: string;
  txId: string;
}

/**
 * Create a scheduled transaction that wraps an HCS topic message.
 * The schedule will execute once enough signatures are collected
 * (in our case, the operator signs immediately after creation).
 *
 * Returns null if Hedera is not configured.
 */
export async function createContractSchedule(
  topicId: string,
  message: object,
  memo?: string,
): Promise<ScheduleResult | null> {
  if (!isHederaConfigured()) return null;

  try {
    const client = getHederaClient();

    // The inner transaction: submit the fully-signed contract to HCS
    const innerTx = new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(topicId))
      .setMessage(canonicalJson(message));

    const scheduleTx = new ScheduleCreateTransaction()
      .setScheduledTransaction(innerTx)
      .setScheduleMemo(memo ?? 'Axiom authorship contract');

    const response = await scheduleTx.execute(client);
    const receipt = await response.getReceipt(client);

    const scheduleId = receipt.scheduleId?.toString() ?? '';
    const txId = response.transactionId.toString();

    return { scheduleId, txId };
  } catch (err) {
    console.error('[Schedule] createContractSchedule failed:', err);
    return null;
  }
}

/**
 * Sign a scheduled transaction as the operator.
 * Returns the tx ID and whether the schedule has executed.
 */
export async function signScheduleAsOperator(
  scheduleId: string,
): Promise<{ txId: string; executed: boolean } | null> {
  if (!isHederaConfigured()) return null;

  try {
    const client = getHederaClient();

    const signTx = new ScheduleSignTransaction().setScheduleId(
      ScheduleId.fromString(scheduleId),
    );

    const response = await signTx.execute(client);
    await response.getReceipt(client);
    const txId = response.transactionId.toString();

    // Check if the schedule executed
    const info = await getScheduleInfo(scheduleId);
    const executed = info?.executed ?? false;

    return { txId, executed };
  } catch (err) {
    console.error('[Schedule] signScheduleAsOperator failed:', err);
    return null;
  }
}

/**
 * Query schedule info to check execution status.
 */
async function getScheduleInfo(
  scheduleId: string,
): Promise<{ executed: boolean; executedAt: string | null } | null> {
  if (!isHederaConfigured()) return null;

  try {
    const client = getHederaClient();

    const info = await new ScheduleInfoQuery()
      .setScheduleId(ScheduleId.fromString(scheduleId))
      .execute(client);

    // ScheduleInfo.executed is a Timestamp | null
    const executedTimestamp = info.executed;
    const executedAt = executedTimestamp?.toDate()?.toISOString() ?? null;
    return {
      executed: executedAt !== null,
      executedAt,
    };
  } catch (err) {
    console.error('[Schedule] getScheduleInfo failed:', err);
    return null;
  }
}
