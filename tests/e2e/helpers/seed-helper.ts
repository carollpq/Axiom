/**
 * E2E seed helper — seeds and cleans up test data via the test API endpoints.
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

export type ScenarioName =
  | 'empty-researcher'
  | 'researcher-with-papers'
  | 'researcher-with-contract'
  | 'submitted-paper'
  | 'editor-with-journal'
  | 'criteria-published'
  | 'reviewers-assigned'
  | 'reviews-completed'
  | 'rebuttal-open'
  | 'reviewer-with-badges';

export interface SeedResult {
  testRunId: string;
  [key: string]: unknown;
}

let counter = 0;

/** Generate a unique testRunId for test isolation. */
export function generateTestRunId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  counter++;
  return `e2e${ts}${rand}${counter}`;
}

/** Seed a scenario via the test API. Returns the seeded data. */
export async function seedScenario(
  scenario: ScenarioName,
  testRunId?: string,
): Promise<SeedResult> {
  const id = testRunId ?? generateTestRunId();

  const response = await fetch(`${BASE_URL}/api/test/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, testRunId: id }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Seed failed (${response.status}): ${text}`);
  }

  const json = await response.json();
  return json.data as SeedResult;
}

/** Clean up seeded data by testRunId. */
export async function cleanup(testRunId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/test/cleanup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testRunId }),
  });

  if (!response.ok) {
    console.warn(`Cleanup failed for ${testRunId}: ${response.status}`);
  }
}
