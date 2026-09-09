import { ScheduleBlock, FixedRoutine, TimeSlot, DayOfWeek } from '@/types';
import { timeToMinutes, minutesToTime } from '../utils/timeHelpers';

export interface CalculateFreeSlotsParams {
  dayOfWeek: DayOfWeek;
  classes: ScheduleBlock[];
  routines?: FixedRoutine[];
  dayStart?: string; // Por defecto "07:00"
  dayEnd?: string;   // Por defecto "21:00"
  minUsefulMinutes?: number; // Por defecto 30 minutos
}

export function calculateFreeSlots({
  dayOfWeek,
  classes,
  routines = [],
  dayStart = '07:00',
  dayEnd = '21:00',
  minUsefulMinutes = 30,
}: CalculateFreeSlotsParams): TimeSlot[] {
  const startMin = timeToMinutes(dayStart);
  const endMin = timeToMinutes(dayEnd);

  // Filtrar bloques del día correspondiente
  const todayClasses = classes
    .filter((c) => c.dayOfWeek === dayOfWeek)
    .map((c) => ({
      start: timeToMinutes(c.startTime),
      end: timeToMinutes(c.endTime),
      title: 'Clase',
      isClass: true,
    }));

  const todayRoutines = routines
    .filter((r) => r.dayOfWeek === dayOfWeek)
    .map((r) => ({
      start: timeToMinutes(r.startTime),
      end: timeToMinutes(r.endTime),
      title: r.title,
      isClass: false,
    }));

  // Unificar y ordenar compromisos ocupados
  const busyBlocks = [...todayClasses, ...todayRoutines].sort((a, b) => a.start - b.start);

  // Mezclar bloques solapados o consecutivos
  const mergedBusy: { start: number; end: number }[] = [];
  for (const block of busyBlocks) {
    if (mergedBusy.length === 0) {
      mergedBusy.push({ start: block.start, end: block.end });
    } else {
      const last = mergedBusy[mergedBusy.length - 1];
      if (block.start <= last.end) {
        last.end = Math.max(last.end, block.end);
      } else {
        mergedBusy.push({ start: block.start, end: block.end });
      }
    }
  }

  const freeSlots: TimeSlot[] = [];
  let currentCursor = startMin;

  for (const busy of mergedBusy) {
    // Si hay un intervalo libre entre cursor y el inicio del bloque ocupado
    if (busy.start > currentCursor) {
      const gapMinutes = busy.start - currentCursor;
      const isUsable = gapMinutes >= minUsefulMinutes;
      // Buffer de fricción: 15m para traslados y cambio de contexto si el hueco es >= 60m, o 10m si es menor
      const buffer = isUsable ? (gapMinutes >= 60 ? 15 : 10) : 5;
      const effective = Math.max(0, gapMinutes - buffer);

      freeSlots.push({
        startTime: minutesToTime(currentCursor),
        endTime: minutesToTime(busy.start),
        durationMinutes: gapMinutes,
        transitionBufferMinutes: buffer,
        effectiveStudyMinutes: effective,
        category: isUsable ? 'USABLE' : 'FREE',
        reason: isUsable ? 'Hueco utilizable para estudio' : 'Pausa breve / traslado',
        dayOfWeek,
      });
    }
    currentCursor = Math.max(currentCursor, busy.end);
  }

  // Hueco final después de la última clase hasta dayEnd
  if (currentCursor < endMin) {
    const gapMinutes = endMin - currentCursor;
    const isUsable = gapMinutes >= minUsefulMinutes;
    const buffer = isUsable ? 15 : 5;
    const effective = Math.max(0, gapMinutes - buffer);

    freeSlots.push({
      startTime: minutesToTime(currentCursor),
      endTime: minutesToTime(endMin),
      durationMinutes: gapMinutes,
      transitionBufferMinutes: buffer,
      effectiveStudyMinutes: effective,
      category: isUsable ? 'USABLE' : 'FREE',
      reason: isUsable ? 'Tiempo libre de tarde/noche' : 'Pausa breve',
      dayOfWeek,
    });
  }

  return freeSlots;
}
