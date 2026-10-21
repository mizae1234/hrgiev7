/**
 * Formats a duration in minutes as a human-readable Thai string.
 *
 * Examples:
 *   formatDuration(45)  => "45 นาที"
 *   formatDuration(60)  => "1 ชม."
 *   formatDuration(814) => "13 ชม. 34 นาที"
 */
export function formatDuration(totalMinutes: number | null | undefined): string {
  const minutes = Math.max(0, Math.round(totalMinutes || 0));
  if (minutes < 60) return `${minutes} นาที`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} ชม.` : `${hours} ชม. ${rest} นาที`;
}
