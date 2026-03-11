'use server';

import { z } from 'zod';
import { after } from 'next/server';
import { verifyMessage } from 'viem';
import { requireSession } from '@/src/shared/lib/auth/auth';
import { anchorToHcs } from '@/src/shared/lib/hedera/hcs';
import { ROUTES } from '@/src/shared/lib/routes';
import {
  createContract,
  addContributor,
  removeContributor,
  signContributor,
  resetContractSignatures,
  generateInviteToken,
  updateContractHedera,
  updateContractSchedule,
} from '@/src/features/contracts/mutations';
import {
  getContractById,
  listUserContracts,
} from '@/src/features/contracts/queries';
import { getUserByWallet } from '@/src/features/users/queries';
import { createNotification } from '@/src/features/notifications/mutations';
import { displayNameOrWallet } from '@/src/features/users/lib';
import {
  createContractSchedule,
  signScheduleAsOperator,
} from '@/src/shared/lib/hedera/schedule';
import {
  EVM_ADDRESS_REGEX,
  HEX_SIGNATURE_REGEX,
} from '@/src/shared/lib/validation';
import { db } from '@/src/shared/lib/db';
import { authorshipContracts } from '@/src/shared/lib/db/schema';
import { eq } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createContractSchema = z.object({
  paperTitle: z.string().trim().min(1).max(500),
  paperId: z.string().uuid().nullish(),
});

const addContributorSchema = z.object({
  contractId: z.string().uuid(),
  contributorWallet: z
    .string()
    .regex(EVM_ADDRESS_REGEX, 'Invalid wallet address'),
  contributionPct: z.number().int().min(0).max(100),
  contributorName: z.string().trim().max(200).nullish(),
  roleDescription: z.string().trim().max(500).nullish(),
  isCreator: z.boolean().optional(),
});

const signSchema = z.object({
  contractId: z.string().uuid(),
  contributorWallet: z
    .string()
    .regex(EVM_ADDRESS_REGEX, 'Invalid wallet address'),
  signature: z.string().regex(HEX_SIGNATURE_REGEX, 'Invalid signature format'),
  contractHash: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createContractAction(
  input: z.infer<typeof createContractSchema>,
) {
  const wallet = await requireSession();
  const parsed = createContractSchema.parse(input);

  const contract = await createContract({ ...parsed, wallet });
  if (!contract) throw new Error('User not found');

  return contract;
}

export async function addContributorAction(
  input: z.infer<typeof addContributorSchema>,
) {
  const wallet = await requireSession();
  const parsed = addContributorSchema.parse(input);

  const contributor = await addContributor(parsed);

  // Non-blocking: notify the added contributor
  if (parsed.contributorWallet.toLowerCase() !== wallet.toLowerCase()) {
    after(async () => {
      const [row] = await db
        .select({ paperTitle: authorshipContracts.paperTitle })
        .from(authorshipContracts)
        .where(eq(authorshipContracts.id, parsed.contractId))
        .limit(1);

      const paperTitle = row?.paperTitle ?? 'Untitled';
      await createNotification({
        userWallet: parsed.contributorWallet,
        type: 'contributor_added',
        title: 'Added to authorship contract',
        body: `You have been added as a contributor on "${paperTitle}". Please review and sign the contract.`,
        link: ROUTES.researcher.contracts,
      });
    });
  }

  return contributor;
}

export async function removeContributorAction(
  contractId: string,
  contributorId: string,
) {
  await requireSession();

  const deleted = await removeContributor(contractId, contributorId);
  if (!deleted) throw new Error('Contributor not found');

  return { ok: true };
}

export async function resetSignaturesAction(contractId: string) {
  const sessionWallet = await requireSession();

  const contract = await getContractById(contractId);
  if (!contract) throw new Error('Contract not found');

  const user = await getUserByWallet(sessionWallet);
  if (!user || contract.creatorId !== user.id) {
    throw new Error('Only the contract creator can reset signatures');
  }

  const updated = await resetContractSignatures(contractId);
  if (!updated) throw new Error('Reset failed');

  return updated;
}

export async function generateInviteLinkAction(
  contractId: string,
  contributorId: string,
) {
  const sessionWallet = await requireSession();

  const contract = await getContractById(contractId);
  if (!contract) throw new Error('Contract not found');

  const user = await getUserByWallet(sessionWallet);
  if (!user || contract.creatorId !== user.id) {
    throw new Error('Only the contract creator can generate invite links');
  }

  const result = await generateInviteToken(contractId, contributorId);
  if (!result) throw new Error('Contributor not found');

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'localhost:3000';
  const protocol = domain.startsWith('localhost') ? 'http' : 'https';
  const inviteLink = `${protocol}://${domain}/invite/${result.token}`;

  return { inviteLink, expiresAt: result.expiresAt };
}

export async function signContractAction(input: z.infer<typeof signSchema>) {
  const session = await requireSession();
  const parsed = signSchema.parse(input);
  const { contractId, contributorWallet, signature, contractHash } = parsed;

  if (contributorWallet.toLowerCase() !== session) {
    throw new Error('Session wallet does not match contributor wallet');
  }

  if (contractHash) {
    try {
      const isValid = await verifyMessage({
        address: contributorWallet as `0x${string}`,
        message: contractHash,
        signature: signature as `0x${string}`,
      });
      if (!isValid) throw new Error('Invalid signature');
    } catch {
      throw new Error('Invalid signature');
    }
  }

  const result = await signContributor({
    contractId,
    contributorWallet,
    signature,
    contractHash,
  });

  if (!result) {
    throw new Error('Contributor not found or wallet mismatch');
  }

  const contract = await getContractById(contractId);
  if (!contract) throw new Error('Contract not found');
  const isFullySigned = contract.status === 'fully_signed';

  // Non-blocking: Hedera anchoring + notifications run after response
  after(async () => {
    if (isFullySigned) {
      const hcsPayload = {
        type: 'fullySigned' as const,
        contractId,
        contractHash: contractHash ?? contract.contractHash ?? null,
        signers: contract.contributors
          .filter((c) => c.status === 'signed')
          .map((c) => c.contributorWallet),
        timestamp: new Date().toISOString(),
      };

      const topicId = process.env.HCS_TOPIC_CONTRACTS;
      let txId: string | undefined;
      let consensusTimestamp: string | undefined;

      if (topicId) {
        const scheduleResult = await createContractSchedule(
          topicId,
          hcsPayload,
          `Axiom contract ${contractId} fully signed`,
        );

        if (scheduleResult) {
          await updateContractSchedule(
            contractId,
            scheduleResult.scheduleId,
            scheduleResult.txId,
          );
          const signResult = await signScheduleAsOperator(
            scheduleResult.scheduleId,
          );
          if (signResult) {
            txId = signResult.txId;
          }
        }
      }

      // Fallback: if schedule failed, anchor directly
      if (!txId) {
        const hcsResult = await anchorToHcs('HCS_TOPIC_CONTRACTS', hcsPayload);
        txId = hcsResult.txId;
        consensusTimestamp = hcsResult.consensusTimestamp;
      }

      if (txId) {
        await updateContractHedera(
          contractId,
          txId,
          consensusTimestamp ?? new Date().toISOString(),
        );
      }
    } else {
      await anchorToHcs('HCS_TOPIC_CONTRACTS', {
        type: 'signed',
        contractId,
        contractHash: contractHash ?? null,
        signerWallet: contributorWallet,
        timestamp: new Date().toISOString(),
      });
    }

    // Notifications
    const signerName = displayNameOrWallet(
      contract.contributors.find(
        (c) =>
          c.contributorWallet?.toLowerCase() ===
          contributorWallet.toLowerCase(),
      )?.contributorName,
      contributorWallet,
    );

    const contractLink = `${ROUTES.researcher.contracts}?id=${contractId}`;

    if (isFullySigned) {
      await Promise.all(
        contract.contributors
          .filter((c) => c.contributorWallet)
          .map((c) =>
            createNotification({
              userWallet: c.contributorWallet!,
              type: 'contract_fully_signed',
              title: 'Authorship contract fully signed',
              body: `All authors have signed the contract for "${contract.paperTitle}".`,
              link: contractLink,
            }),
          ),
      );
    } else {
      const ownerWallet = contract.creator?.walletAddress;
      if (
        ownerWallet &&
        ownerWallet.toLowerCase() !== contributorWallet.toLowerCase()
      ) {
        await createNotification({
          userWallet: ownerWallet,
          type: 'contract_signed',
          title: 'Co-author signed contract',
          body: `${signerName} signed the authorship contract for "${contract.paperTitle}".`,
          link: contractLink,
        });
      }
    }
  });

  return result;
}
