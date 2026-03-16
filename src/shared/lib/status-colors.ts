import type { BadgeColorConfig } from '@/src/shared/types/shared';

export const statusColors: Record<string, BadgeColorConfig> = {
  // --- Shared / paper-level ---
  Published: {
    bg: 'rgba(120,180,120,0.15)',
    text: '#8fbc8f',
    border: 'rgba(120,180,120,0.3)',
  },
  'Under Review': {
    bg: 'rgba(180,180,120,0.15)',
    text: '#c9b458',
    border: 'rgba(180,180,120,0.3)',
  },
  'Contract Pending': {
    bg: 'rgba(180,140,100,0.15)',
    text: '#c4956a',
    border: 'rgba(180,140,100,0.3)',
  },
  'Revision Requested': {
    bg: 'rgba(200,130,100,0.15)',
    text: '#d4845a',
    border: 'rgba(200,130,100,0.3)',
  },
  Draft: {
    bg: 'rgba(150,150,170,0.15)',
    text: '#9a9aad',
    border: 'rgba(150,150,170,0.3)',
  },
  Submitted: {
    bg: 'rgba(130,160,200,0.15)',
    text: '#7a9fc7',
    border: 'rgba(130,160,200,0.3)',
  },
  Registered: {
    bg: 'rgba(130,160,200,0.15)',
    text: '#7a9fc7',
    border: 'rgba(130,160,200,0.3)',
  },
  Retracted: {
    bg: 'rgba(200,100,90,0.15)',
    text: '#d4645a',
    border: 'rgba(200,100,90,0.3)',
  },
  'Reviews Complete': {
    bg: 'rgba(143,188,143,0.2)',
    text: '#8fbc8f',
    border: 'rgba(143,188,143,0.3)',
  },
  'Viewed By Editor': {
    bg: 'rgba(201,164,74,0.15)',
    text: '#c9a44a',
    border: 'rgba(201,164,74,0.3)',
  },

  // --- Reviewer statuses ---
  Late: {
    bg: 'rgba(200,100,90,0.15)',
    text: '#d4645a',
    border: 'rgba(200,100,90,0.3)',
  },
  'In Progress': {
    bg: 'rgba(130,160,200,0.15)',
    text: '#7a9fc7',
    border: 'rgba(130,160,200,0.3)',
  },
  Pending: {
    bg: 'rgba(150,150,170,0.15)',
    text: '#9a9aad',
    border: 'rgba(150,150,170,0.3)',
  },
  Complete: {
    bg: 'rgba(120,180,120,0.15)',
    text: '#8fbc8f',
    border: 'rgba(120,180,120,0.3)',
  },

  // --- Editor stages ---
  New: {
    bg: 'rgba(150,150,170,0.15)',
    text: '#9a9aad',
    border: 'rgba(150,150,170,0.3)',
  },
  'Criteria Published': {
    bg: 'rgba(130,160,200,0.15)',
    text: '#7a9fc7',
    border: 'rgba(130,160,200,0.3)',
  },
  'Reviewers Assigned': {
    bg: 'rgba(160,140,200,0.15)',
    text: '#a98fc7',
    border: 'rgba(160,140,200,0.3)',
  },
  'Decision Pending': {
    bg: 'rgba(200,160,100,0.15)',
    text: '#c4956a',
    border: 'rgba(200,160,100,0.3)',
  },
  Rejected: {
    bg: 'rgba(200,100,90,0.15)',
    text: '#d4645a',
    border: 'rgba(200,100,90,0.3)',
  },

  // --- Researcher statuses ---
  'Paper Submitted': {
    bg: 'rgba(90,122,154,0.2)',
    text: '#5a7a9a',
    border: 'rgba(90,122,154,0.3)',
  },
  'Desk Reject': {
    bg: 'rgba(212,100,90,0.15)',
    text: '#d4645a',
    border: 'rgba(212,100,90,0.3)',
  },
  'All Reviews Completed': {
    bg: 'rgba(143,188,143,0.2)',
    text: '#8fbc8f',
    border: 'rgba(143,188,143,0.3)',
  },
  'Rebuttal Phase': {
    bg: 'rgba(212,100,90,0.15)',
    text: '#d4645a',
    border: 'rgba(212,100,90,0.3)',
  },
  'Reviews Sent to Editor': {
    bg: 'rgba(90,122,154,0.2)',
    text: '#5a7a9a',
    border: 'rgba(90,122,154,0.3)',
  },
  Accepted: {
    bg: 'rgba(143,188,143,0.2)',
    text: '#8fbc8f',
    border: 'rgba(143,188,143,0.3)',
  },

  // --- Author response statuses ---
  'Accepted Reviews': {
    bg: 'rgba(120,180,120,0.15)',
    text: '#8fbc8f',
    border: 'rgba(120,180,120,0.3)',
  },
  'Rebuttal Requested': {
    bg: 'rgba(180,160,120,0.15)',
    text: '#c9a44a',
    border: 'rgba(180,160,120,0.3)',
  },

  // --- Rebuttal resolutions ---
  Upheld: {
    bg: 'rgba(212,100,90,0.2)',
    text: '#d4645a',
    border: 'rgba(212,100,90,0.3)',
  },
  'Rebuttal Rejected': {
    bg: 'rgba(143,188,143,0.2)',
    text: '#8fbc8f',
    border: 'rgba(143,188,143,0.3)',
  },
  Partial: {
    bg: 'rgba(201,164,74,0.2)',
    text: '#c9a44a',
    border: 'rgba(201,164,74,0.3)',
  },

  // --- Positions ---
  Agree: {
    bg: 'rgba(120,180,120,0.15)',
    text: '#8fbc8f',
    border: 'rgba(120,180,120,0.3)',
  },
  Disagree: {
    bg: 'rgba(200,100,90,0.15)',
    text: '#d4645a',
    border: 'rgba(200,100,90,0.3)',
  },

  // --- Criterion ratings ---
  Yes: {
    bg: 'rgba(143,188,143,0.15)',
    text: '#8fbc8f',
    border: 'rgba(143,188,143,0.4)',
  },
  No: {
    bg: 'rgba(212,100,90,0.15)',
    text: '#d4645a',
    border: 'rgba(212,100,90,0.4)',
  },
  Partially: {
    bg: 'rgba(212,164,90,0.15)',
    text: '#d4a45a',
    border: 'rgba(212,164,90,0.4)',
  },
};

const GREEN: BadgeColorConfig = {
  bg: 'rgba(143,188,143,0.15)',
  text: '#8fbc8f',
  border: 'rgba(143,188,143,0.3)',
};
const GOLD: BadgeColorConfig = {
  bg: 'rgba(201,164,74,0.15)',
  text: '#c9a44a',
  border: 'rgba(201,164,74,0.3)',
};
const DEFAULT: BadgeColorConfig = {
  bg: 'rgba(90,122,154,0.2)',
  text: '#5a7a9a',
  border: 'rgba(90,122,154,0.3)',
};

export function getStatusColors(status: string): BadgeColorConfig {
  if (statusColors[status]) return statusColors[status];
  // Researcher dynamic fallbacks
  if (status.startsWith('Assigned')) return GREEN;
  if (status.includes('Reviews Completed') && !status.startsWith('All'))
    return GOLD;
  return DEFAULT;
}

/* ── Shared label maps (DB enum → display string) ────────────────────── */

import type { AuthorResponseStatusDb } from '@/src/shared/lib/db/schema';
import type { AssignmentDisplayStatus } from '@/src/features/editor/types';

export const reviewAssignmentLabels: Record<AssignmentDisplayStatus, string> = {
  complete: 'Complete',
  in_progress: 'In Progress',
  late: 'Late',
  rejected: 'Rejected',
  pending: 'Pending',
};

export const authorStatusLabels: Record<AuthorResponseStatusDb, string> = {
  pending: 'Pending',
  accepted: 'Accepted Reviews',
  rebuttal_requested: 'Rebuttal Requested',
};

export const rebuttalResolutionLabels: Record<string, string> = {
  upheld: 'Upheld',
  rejected: 'Rebuttal Rejected',
  partial: 'Partial',
};

/* ── Pre-resolved urgency colors (module-level constants) ─────────── */

export const URGENCY_LATE = getStatusColors('Late').text;
export const URGENCY_WARNING = getStatusColors('Partially').text;
export const URGENCY_OK = getStatusColors('Accepted').text;
