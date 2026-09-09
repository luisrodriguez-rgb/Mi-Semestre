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

export function calculateSemesterMetrics({
  startDate,
  endDate,
  currentDate = new Date(),
  totalWeeks = 16,
}: SemesterMetricsParams): SemesterMetricsResult {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const current = currentDate.getTime();

  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, Math.round((current - start) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.round((end - current) / (1000 * 60 * 60 * 24)));

  const hasStarted = current >= start;
  const isFinished = current > end;

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
