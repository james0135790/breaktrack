/**
 * Format seconds into MM:SS display
 */
export function formatTimeDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate percentage of time used
 */
export function calculateTimePercentage(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.min((used / total) * 100, 100);
}

/**
 * Check if break time is exceeded
 */
export function isBreakTimeExceeded(usedTime: number, allocatedTime: number): boolean {
  return usedTime > allocatedTime;
}
