/**
 * Utilidades de tiempo puras para el Motor Académico.
 * Zero dependencias de React/Next/DB.
 */

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  // Soporta "HH:mm" o "HH:mm:ss"
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(totalMinutes, 24 * 60 - 1));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function formatMinutesHuman(minutes: number): string {
  if (minutes <= 0) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}
