export interface ReviewCriterionInput {
  id: string;
  label: string;
  evaluationType: 'yes_no_partially' | 'scale_1_5';
  description?: string;
  required: boolean;
}
