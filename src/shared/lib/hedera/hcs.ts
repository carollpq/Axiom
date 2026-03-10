import { TopicMessageSubmitTransaction, TopicId } from '@hashgraph/sdk';
import { getHederaClient, isHederaConfigured } from './client';

export interface HcsReceipt {
  txId: string;
  consensusTimestamp: string;
}

/**
 * Submit a JSON message to an HCS topic.
 * Returns the transaction ID and an approximate consensus timestamp.
 * Throws if the transaction fails or credentials are missing.
 */
export async function submitHcsMessage(
  topicId: string,
  payload: object,
): Promise<HcsReceipt> {
  const client = getHederaClient();
  const message = JSON.stringify(payload);

  const submitTx = await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(message)
    .execute(client);

  // Confirm the transaction reached consensus (throws on failure)
  await submitTx.getReceipt(client);

  const txId = submitTx.transactionId.toString();

  // The transaction ID encodes the valid-start time: "0.0.XXXXX@SECONDS.NANOS"
  // Use it as an approximate consensus timestamp (actual consensus is slightly later).
  const match = txId.match(/@(\d+)\./);
  const epochSeconds = match
    ? parseInt(match[1], 10)
    : Math.floor(Date.now() / 1000);
  const consensusTimestamp = new Date(epochSeconds * 1000).toISOString();

  return { txId, consensusTimestamp };
}

export type HcsTopicEnvVar =
  | 'HCS_TOPIC_PAPERS'
  | 'HCS_TOPIC_CONTRACTS'
  | 'HCS_TOPIC_SUBMISSIONS'
  | 'HCS_TOPIC_CRITERIA'
  | 'HCS_TOPIC_REVIEWS'
  | 'HCS_TOPIC_DECISIONS'
  | 'HCS_TOPIC_RETRACTIONS';

/**
 * Anchor a JSON payload to an HCS topic with graceful fallback.
 */
export async function anchorToHcs(
  topicEnvVar: HcsTopicEnvVar,
  payload: Record<string, unknown>,
  label = 'HCS',
): Promise<{ txId?: string; consensusTimestamp?: string }> {
  const topicId = process.env[topicEnvVar];
  if (!isHederaConfigured() || !topicId) return {};

  try {
    const { txId, consensusTimestamp } = await submitHcsMessage(
      topicId,
      payload,
    );
    return { txId, consensusTimestamp };
  } catch (err) {
    console.error(`[${label}] Anchor failed:`, err);
    return {};
  }
}
