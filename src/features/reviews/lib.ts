/** Convert a 0–100 score to a 0.0–5.0 display scale. */
export function toFivePointScale(score100: number): number {
  return Math.round((score100 / 20) * 10) / 10;
}
