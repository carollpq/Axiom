import type { ProtocolRatings } from '../types/review';

export const PROTOCOL_SHORT_LABELS: {
  key: keyof ProtocolRatings;
  label: string;
}[] = [
  { key: 'actionableFeedback', label: 'Actionable Feedback' },
  { key: 'deepEngagement', label: 'Deep Engagement' },
  { key: 'fairObjective', label: 'Fair & Objective' },
  { key: 'justifiedRecommendation', label: 'Justified Recommendation' },
  { key: 'appropriateExpertise', label: 'Appropriate Expertise' },
];

export const PROTOCOL_FULL_LABELS: {
  key: keyof ProtocolRatings;
  label: string;
}[] = [
  {
    key: 'actionableFeedback',
    label: 'The review provides clear, actionable feedback.',
  },
  {
    key: 'deepEngagement',
    label: 'The reviewer demonstrated deep engagement with the manuscript.',
  },
  { key: 'fairObjective', label: 'The review was fair and objective.' },
  {
    key: 'justifiedRecommendation',
    label: 'The recommendation was clearly justified.',
  },
  {
    key: 'appropriateExpertise',
    label: 'The reviewer demonstrated appropriate expertise.',
  },
];

export const DEFAULT_RATINGS: ProtocolRatings = {
  actionableFeedback: 3,
  deepEngagement: 3,
  fairObjective: 3,
  justifiedRecommendation: 3,
  appropriateExpertise: 3,
};
