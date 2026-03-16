/**
 * One-time script to create HCS topics on Hedera testnet.
 * Run with: npx tsx scripts/create-hcs-topics.ts
 *
 * Paste the printed topic IDs into .env.local.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { Client, AccountId, PrivateKey, TopicCreateTransaction } from "@hashgraph/sdk";

const TOPICS = [
  "PAPERS",
  "CONTRACTS",
  "SUBMISSIONS",
  "CRITERIA",
  "REVIEWS",
  "DECISIONS",
  "EARNINGS",
] as const;

async function main() {
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    console.error("Set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY in .env.local");
    process.exit(1);
  }

  const client = Client.forTestnet();

  // Try key formats in order
  let key: PrivateKey;
  try {
    key = PrivateKey.fromStringDer(operatorKey);
  } catch {
    try {
      key = PrivateKey.fromStringED25519(operatorKey);
    } catch {
      key = PrivateKey.fromStringECDSA(operatorKey);
    }
  }

  client.setOperator(AccountId.fromString(operatorId), key);

  console.log("Creating HCS topics on testnet...\n");

  const results: Record<string, string> = {};

  for (const name of TOPICS) {
    const tx = await new TopicCreateTransaction()
      .setTopicMemo(`ResearchChain ${name.toLowerCase()} topic`)
      .execute(client);
    const receipt = await tx.getReceipt(client);
    const topicId = receipt.topicId!.toString();
    results[name] = topicId;
    console.log(`HCS_TOPIC_${name}=${topicId}`);
  }

  console.log("\nAdd these to your .env.local:");
  for (const [name, id] of Object.entries(results)) {
    console.log(`HCS_TOPIC_${name}=${id}`);
  }

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
