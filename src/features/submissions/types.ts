/** A single review criterion provided by the editor when publishing criteria. */
export interface ReviewCriterionInput {
  id: string;
  label: string;
  evaluationType: 'yes_no_partially' | 'scale_1_5';
  description?: string;
  /** Must be "yes" for the paper to be considered criteria-met. */
  required: boolean;
}
