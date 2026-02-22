import { TopicMessageSubmitTransaction, TopicId } from "@hashgraph/sdk";
import { getHederaClient } from "./client";

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
  const epochSeconds = match ? parseInt(match[1], 10) : Math.floor(Date.now() / 1000);
  const consensusTimestamp = new Date(epochSeconds * 1000).toISOString();

  return { txId, consensusTimestamp };
}
