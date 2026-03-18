import type { BadgeTypeDb } from '@/src/shared/lib/db/schema';

export interface BadgeDefinition {
  type: BadgeTypeDb;
  name: string;
  description: string;
  icon: string;
  /** Check whether this badge should be awarded given the reviewer's current stats. */
  check: (stats: ReviewerStats) => boolean;
}

export interface ReviewerStats {
  reviewCount: number;
  overallScore: number;
  timelinessScore: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type: 'first_review',
    name: 'First Review Completed',
    description: 'Completed your first peer review on Axiom.',
    icon: '1',
    check: (s) => s.reviewCount >= 1,
  },
  {
    type: 'five_reviews',
    name: '5 Reviews Completed',
    description: 'Completed 5 peer reviews on Axiom.',
    icon: '5',
    check: (s) => s.reviewCount >= 5,
  },
  {
    type: 'ten_reviews',
    name: '10 Reviews Completed',
    description: 'Completed 10 peer reviews on Axiom.',
    icon: '10',
    check: (s) => s.reviewCount >= 10,
  },
  {
    type: 'twentyfive_reviews',
    name: '25 Reviews Completed',
    description: 'Completed 25 peer reviews on Axiom.',
    icon: '25',
    check: (s) => s.reviewCount >= 25,
  },
  {
    type: 'high_reputation',
    name: 'High Reputation Reviewer',
    description: 'Achieved an overall reputation score of 80 or above.',
    icon: 'S',
    check: (s) => s.overallScore >= 80,
  },
  {
    type: 'timely_reviewer',
    name: 'Timely Reviewer',
    description: 'Maintained a timeliness score of 90 or above.',
    icon: 'T',
    check: (s) => s.timelinessScore >= 90,
  },
];
