import type { BadgeColorConfig } from "@/src/shared/types/shared";
import { getStatusColors as sharedGetStatusColors } from "@/src/shared/lib/status-colors";

export function getStatusColors(status: string): BadgeColorConfig {
  return sharedGetStatusColors(status);
}
