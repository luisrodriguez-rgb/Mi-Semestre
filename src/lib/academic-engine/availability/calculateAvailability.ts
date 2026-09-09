import { ScheduleBlock, FixedRoutine, TimeSlot, DayOfWeek } from '@/types';
import { timeToMinutes, minutesToTime, intervalsOverlap } from '../utils/timeHelpers';

export interface DailyAvailabilityParams {
  dayOfWeek: DayOfWeek;
  classes: ScheduleBlock[];
  routines: FixedRoutine[];
  wakeTime?: string; // ej. "06:30"
  sleepTime?: string; // ej. "23:00"
  minUsableSlotMinutes?: number; // ej. 30 min
}

export interface DayAvailabilityReport {
  dayOfWeek: DayOfWeek;
  totalAwakeMinutes: number;
  classMinutes: number;
  routineMinutes: number;
  freeMinutes: number;
  usableStudyMinutes: number;
  utilizationPercentage: number; // % del día ocupado
  slots: TimeSlot[];
}

export function calculateDailyAvailability({
  dayOfWeek,
  classes,
  routines,
  wakeTime = '06:30',
  sleepTime = '22:30',
  minUsableSlotMinutes = 30,
}: DailyAvailabilityParams): DayAvailabilityReport {
  const wakeMin = timeToMinutes(wakeTime);
  const sleepMin = timeToMinutes(sleepTime);
  const totalAwakeMinutes = Math.max(0, sleepMin - wakeMin);

  const todayClasses = classes.filter((c) => c.dayOfWeek === dayOfWeek);
  const todayRoutines = routines.filter((r) => r.dayOfWeek === dayOfWeek);

  let classMinutes = 0;
  for (const c of todayClasses) {
    classMinutes += Math.max(0, timeToMinutes(c.endTime) - timeToMinutes(c.startTime));
  }

  let routineMinutes = 0;
  for (const r of todayRoutines) {
    routineMinutes += Math.max(0, timeToMinutes(r.endTime) - timeToMinutes(r.startTime));
  }

  // Generar timeline segmentado minuto a minuto o por bloques
  const allEvents = [
    ...todayClasses.map((c) => ({
      start: timeToMinutes(c.startTime),
      end: timeToMinutes(c.endTime),
      category: 'BLOCKED' as const,
      reason: 'Clase',
    })),
    ...todayRoutines.map((r) => ({
      start: timeToMinutes(r.startTime),
      end: timeToMinutes(r.endTime),
      category: 'BLOCKED' as const,
      reason: r.title,
    })),
  ].sort((a, b) => a.start - b.start);

  const slots: TimeSlot[] = [];
  let cursor = wakeMin;

  for (const ev of allEvents) {
    if (ev.start > cursor) {
      const duration = ev.start - cursor;
      const isUsable = duration >= minUsableSlotMinutes;
      slots.push({
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(ev.start),
        durationMinutes: duration,
        category: isUsable ? 'USABLE' : 'FREE',
        reason: isUsable ? 'Hueco utilizable para estudio' : 'Margen breve de transición',
        dayOfWeek,
      });
    }

    // Bloque ocupado
    slots.push({
      startTime: minutesToTime(ev.start),
      endTime: minutesToTime(ev.end),
      durationMinutes: ev.end - ev.start,
      category: 'BLOCKED',
      reason: ev.reason,
      dayOfWeek,
    });

    cursor = Math.max(cursor, ev.end);
  }

  if (cursor < sleepMin) {
    const duration = sleepMin - cursor;
    const isUsable = duration >= minUsableSlotMinutes;
    slots.push({
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(sleepMin),
      durationMinutes: duration,
      category: isUsable ? 'USABLE' : 'FREE',
      reason: isUsable ? 'Tiempo utilizable nocturno' : 'Descanso previo a dormir',
      dayOfWeek,
    });
  }

  const usableStudyMinutes = slots
    .filter((s) => s.category === 'USABLE')
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const freeMinutes = slots
    .filter((s) => s.category === 'FREE' || s.category === 'USABLE')
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const occupiedMinutes = classMinutes + routineMinutes;
  const utilizationPercentage = totalAwakeMinutes > 0 
    ? Math.round((occupiedMinutes / totalAwakeMinutes) * 100) 
    : 0;

  return {
    dayOfWeek,
    totalAwakeMinutes,
    classMinutes,
    routineMinutes,
    freeMinutes,
    usableStudyMinutes,
    utilizationPercentage,
    slots,
  };
}
