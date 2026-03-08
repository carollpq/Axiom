import { NextRequest, NextResponse, after } from 'next/server';
import { z } from 'zod';
import { getContractById } from '@/src/features/contracts/queries';
import {
  signContributor,
  updateContractHedera,
  updateContractSchedule,
} from '@/src/features/contracts/actions';
import { verifyMessage } from 'viem';
import {
  requireSession,
  anchorToHcs,
  validationError,
} from '@/src/shared/lib/api-helpers';
import {
  EVM_ADDRESS_REGEX,
  HEX_SIGNATURE_REGEX,
} from '@/src/shared/lib/validation';
import { createNotification } from '@/src/features/notifications/actions';
import { displayNameOrWallet } from '@/src/shared/lib/format';
import {
  createContractSchedule,
  signScheduleAsOperator,
} from '@/src/shared/lib/hedera/schedule';

const signSchema = z.object({
  contributorWallet: z
    .string()
    .regex(EVM_ADDRESS_REGEX, 'Invalid wallet address'),
  signature: z.string().regex(HEX_SIGNATURE_REGEX, 'Invalid signature format'),
  contractHash: z.string().optional(),
});

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await req.json();
  const parsed = signSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { contributorWallet, signature, contractHash } = parsed.data;

  if (contributorWallet.toLowerCase() !== session) {
    return NextResponse.json(
      { error: 'Session wallet does not match contributor wallet' },
      { status: 403 },
    );
  }

  if (contractHash) {
    try {
      const isValid = await verifyMessage({
        address: contributorWallet as `0x${string}`,
        message: contractHash,
        signature: signature as `0x${string}`,
      });
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  const result = await signContributor({
    contractId: id,
    contributorWallet,
    signature,
    contractHash,
  });

  if (!result) {
    return NextResponse.json(
      { error: 'Contributor not found or wallet mismatch' },
      { status: 404 },
    );
  }

  const contract = await getContractById(id);
  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }
  const isFullySigned = contract.status === 'fully_signed';

  // Non-blocking: Hedera anchoring + notifications run after response
  after(async () => {
    if (isFullySigned) {
      const hcsPayload = {
        type: 'fullySigned' as const,
        contractId: id,
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
          `Axiom contract ${id} fully signed`,
        );

        if (scheduleResult) {
          await updateContractSchedule(
            id,
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
          id,
          txId,
          consensusTimestamp ?? new Date().toISOString(),
        );
      }
    } else {
      await anchorToHcs('HCS_TOPIC_CONTRACTS', {
        type: 'signed',
        contractId: id,
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

    const contractLink = `/researcher/authorship-contracts?id=${id}`;

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

  return NextResponse.json(result);
}
