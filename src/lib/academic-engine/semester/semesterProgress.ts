export interface SemesterMetricsParams {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  currentDate?: Date;
  totalWeeks?: number;
}

export interface SemesterMetricsResult {
  currentWeek: number; // 1 a 16
  totalWeeks: number;
  progressPercentage: number; // 0 a 100
  daysElapsed: number;
  totalDays: number;
  daysRemaining: number;
  isFinished: boolean;
  hasStarted: boolean;
}

function parseLocalDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }
  const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
  }
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getCalendarDaysDiff(start: Date, target: Date): number {
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.floor((utcTarget - utcStart) / (1000 * 60 * 60 * 24));
}

export function calculateSemesterMetrics({
  startDate,
  endDate,
  currentDate = new Date(),
  totalWeeks = 16,
}: SemesterMetricsParams): SemesterMetricsResult {
  const startDay = parseLocalDate(startDate);
  const endDay = parseLocalDate(endDate);
  const currentDay = parseLocalDate(currentDate);

  const totalDays = Math.max(1, getCalendarDaysDiff(startDay, endDay));
  const daysElapsed = Math.max(0, getCalendarDaysDiff(startDay, currentDay));
  const daysRemaining = Math.max(0, getCalendarDaysDiff(currentDay, endDay));

  const hasStarted = currentDay >= startDay;
  const isFinished = currentDay > endDay;

  let progressPercentage = 0;
  if (isFinished) {
    progressPercentage = 100;
  } else if (hasStarted) {
    progressPercentage = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
  }

  // Cálculo de semana actual
  let currentWeek = 1;
  if (hasStarted) {
    currentWeek = Math.min(totalWeeks, Math.floor(daysElapsed / 7) + 1);
  }

  return {
    currentWeek,
    totalWeeks,
    progressPercentage,
    daysElapsed,
    totalDays,
    daysRemaining,
    isFinished,
    hasStarted,
  };
}
