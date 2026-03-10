'use server';

import { z } from 'zod';
import {
  requireAuth,
  anchorToHcs,
} from '@/src/shared/lib/server-action-helpers';
import {
  createPaper,
  updatePaper,
  createPaperVersion,
  updatePaperVersionHedera,
  createSubmission,
  updateSubmissionHedera,
} from '@/src/features/papers/mutations';
import { getPaperById } from '@/src/features/papers/queries';
import { getContractById } from '@/src/features/contracts/queries';
import { db } from '@/src/shared/lib/db';
import {
  paperVersions,
  users,
  type PaperStatusDb,
} from '@/src/shared/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { SHA256_REGEX } from '@/src/shared/lib/validation';
import {
  STUDY_TYPE_VALUES,
  PAPER_LIMITS,
} from '@/src/features/researcher/config/upload';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createPaperSchema = z.object({
  title: z
    .string()
    .trim()
    .min(
      PAPER_LIMITS.title.min,
      `Title must be at least ${PAPER_LIMITS.title.min} characters`,
    )
    .max(
      PAPER_LIMITS.title.max,
      `Title must be at most ${PAPER_LIMITS.title.max} characters`,
    ),
  abstract: z
    .string()
    .trim()
    .min(
      PAPER_LIMITS.abstract.min,
      `Abstract must be at least ${PAPER_LIMITS.abstract.min} characters`,
    )
    .max(
      PAPER_LIMITS.abstract.max,
      `Abstract must be at most ${PAPER_LIMITS.abstract.max} characters`,
    ),
  studyType: z.enum(STUDY_TYPE_VALUES).optional(),
  litDataToEncryptHash: z.string().nullish(),
  litAccessConditionsJson: z.string().nullish(),
});

const createVersionSchema = z.object({
  paperId: z.string().uuid(),
  paperHash: z.string().regex(SHA256_REGEX, 'Invalid SHA-256 hash'),
  datasetHash: z.string().regex(SHA256_REGEX, 'Invalid SHA-256 hash').nullish(),
  codeRepoUrl: z.string().url().max(2000).nullish(),
  codeCommitHash: z.string().max(200).nullish(),
  envSpecHash: z.string().regex(SHA256_REGEX, 'Invalid SHA-256 hash').nullish(),
  fileStorageKey: z.string().max(500).nullish(),
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createPaperAction(
  input: z.infer<typeof createPaperSchema>,
) {
  const wallet = await requireAuth();
  const parsed = createPaperSchema.parse(input);

  const paper = await createPaper({ ...parsed, wallet });
  if (!paper) throw new Error('User not found');

  return paper;
}

export async function updatePaperAction(
  id: string,
  input: { title?: string; abstract?: string; status?: PaperStatusDb },
) {
  await requireAuth();

  const updated = await updatePaper(id, input);
  if (!updated) throw new Error('Not found or no valid fields');

  return updated;
}

export async function registerVersionAction(
  input: z.infer<typeof createVersionSchema>,
) {
  await requireAuth();
  const parsed = createVersionSchema.parse(input);

  const {
    paperId,
    paperHash,
    datasetHash,
    codeRepoUrl,
    codeCommitHash,
    envSpecHash,
    fileStorageKey,
  } = parsed;

  const version = await createPaperVersion({
    paperId,
    paperHash,
    datasetHash: datasetHash ?? null,
    codeRepoUrl: codeRepoUrl ?? null,
    codeCommitHash: codeCommitHash ?? null,
    envSpecHash: envSpecHash ?? null,
    fileStorageKey: fileStorageKey ?? null,
  });

  if (!version) throw new Error('Paper not found');

  // Anchor on Hedera HCS
  const { txId, consensusTimestamp } = await anchorToHcs('HCS_TOPIC_PAPERS', {
    type: 'register',
    paperHash,
    paperId,
    versionId: version.id,
    versionNumber: version.versionNumber,
    ...(datasetHash && { datasetHash }),
    ...(codeCommitHash && { codeCommitHash }),
    ...(envSpecHash && { envSpecHash }),
    timestamp: new Date().toISOString(),
  });

  if (txId && consensusTimestamp) {
    const updated = await updatePaperVersionHedera(
      version.id,
      txId,
      consensusTimestamp,
    );
    return updated ?? version;
  }

  return version;
}

export async function submitPaperAction(input: {
  paperId: string;
  journalId: string;
  contractId?: string;
  versionId?: string;
}) {
  const session = await requireAuth();

  const { paperId, journalId, contractId, versionId } = input;

  if (!journalId) throw new Error('journalId is required');

  const paper = await getPaperById(paperId);
  if (!paper) throw new Error('Paper not found');

  // Verify ownership via session wallet
  const owner = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.walletAddress, session.toLowerCase()))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!owner || paper.ownerId !== owner.id) {
    throw new Error('Forbidden');
  }

  // Validate authorship contract
  const contract = contractId
    ? await getContractById(contractId)
    : (paper.contracts?.[0] ?? null);

  if (!contract) {
    throw new Error(
      'No authorship contract found. Please create and sign one first.',
    );
  }

  if (contract.status !== 'fully_signed') {
    const unsigned =
      contract.contributors?.filter((c) => c.status !== 'signed') ?? [];
    throw new Error(
      `All co-authors must sign the authorship contract before submission. Unsigned: ${unsigned.map((c) => c.contributorName || c.contributorWallet).join(', ')}`,
    );
  }

  if (paper.status !== 'registered') {
    throw new Error('Paper must be registered before submitting');
  }

  // Resolve version
  let resolvedVersionId = versionId;
  if (!resolvedVersionId) {
    const latestVersion = await db
      .select()
      .from(paperVersions)
      .where(eq(paperVersions.paperId, paperId))
      .orderBy(desc(paperVersions.versionNumber))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!latestVersion) throw new Error('No paper version found');
    resolvedVersionId = latestVersion.id;
  }

  const submission = await createSubmission({
    paperId,
    journalId,
    versionId: resolvedVersionId,
  });

  if (!submission) throw new Error('Failed to create submission');

  const { txId: hederaTxId, consensusTimestamp: hederaTimestamp } =
    await anchorToHcs('HCS_TOPIC_SUBMISSIONS', {
      type: 'submitted',
      paperId,
      journalId,
      versionId: resolvedVersionId,
      submissionId: submission.id,
      submittedAt: new Date().toISOString(),
    });

  if (hederaTxId && hederaTimestamp) {
    await updateSubmissionHedera(submission.id, hederaTxId, hederaTimestamp);
  }

  await updatePaper(paperId, { status: 'submitted' });

  return {
    submissionId: submission.id,
    hederaTxId,
    hederaTimestamp,
  };
}
