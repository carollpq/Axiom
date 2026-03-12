import type {
  SubmissionStage,
  StageFilter,
  BadgeColorConfig,
} from '@/src/features/editor/types';
import { getStatusColors } from '@/src/shared/lib/status-colors';

export const pipelineStages: SubmissionStage[] = [
  'New',
  'Criteria Published',
  'Reviewers Assigned',
  'Under Review',
  'Decision Pending',
  'Published',
  'Rejected',
];

export const stages: StageFilter[] = ['All', ...pipelineStages];

export const stageColors = Object.fromEntries(
  pipelineStages.map((stage) => [stage, getStatusColors(stage)]),
) as Record<SubmissionStage, BadgeColorConfig>;

export const reviewCriteria: { label: string; type: string }[] = [
  { label: 'Methodology is reproducible', type: 'Yes / No / Partially' },
  {
    label: 'Statistical analysis is appropriate',
    type: 'Yes / No / Partially',
  },
  {
    label: 'Dataset is accessible and described',
    type: 'Yes / No / Partially',
  },
  { label: 'Claims are supported by evidence', type: 'Yes / No / Partially' },
  { label: 'Related work is adequately cited', type: 'Yes / No / Partially' },
];
