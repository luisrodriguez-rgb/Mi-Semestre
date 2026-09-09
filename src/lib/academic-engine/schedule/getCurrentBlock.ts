import { ScheduleBlock, FixedRoutine, Subject, DayOfWeek, TimeSlot } from '@/types';
import { timeToMinutes } from '../utils/timeHelpers';
import { calculateFreeSlots } from './calculateFreeSlots';

export interface GetCurrentBlockParams {
  dayOfWeek: DayOfWeek;
  currentTime: string; // "16:20"
  classes: ScheduleBlock[];
  subjectsMap: Record<string, Subject>;
  routines?: FixedRoutine[];
  dayStart?: string;
  dayEnd?: string;
}

export interface CurrentBlockResult {
  status: 'in_class' | 'in_routine' | 'in_free_slot' | 'off_hours';
  currentClass?: {
    id: string;
    subjectId: string;
    name: string;
    code: string;
    color: string;
    location?: string;
    startTime: string;
    endTime: string;
    remainingMinutes: number;
  };
  currentRoutine?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    remainingMinutes: number;
  };
  currentFreeSlot?: TimeSlot & {
    remainingMinutes: number;
  };
  nextBlock?: {
    title: string;
    startTime: string;
    location?: string;
    type: 'class' | 'routine';
    startsInMinutes: number;
  };
}

export function getCurrentBlock({
  dayOfWeek,
  currentTime,
  classes,
  subjectsMap,
  routines = [],
  dayStart = '07:00',
  dayEnd = '21:30',
}: GetCurrentBlockParams): CurrentBlockResult {
  const currentMin = timeToMinutes(currentTime);
  const startMin = timeToMinutes(dayStart);
  const endMin = timeToMinutes(dayEnd);

  const todayClasses = classes
    .filter((c) => c.dayOfWeek === dayOfWeek)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const todayRoutines = routines
    .filter((r) => r.dayOfWeek === dayOfWeek)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // 1. ¿Estamos en clase?
  for (const c of todayClasses) {
    const sMin = timeToMinutes(c.startTime);
    const eMin = timeToMinutes(c.endTime);
    if (currentMin >= sMin && currentMin < eMin) {
      const subject = subjectsMap[c.subjectId];
      // Buscar siguiente bloque después de esta clase
      const nextClass = todayClasses.find((other) => timeToMinutes(other.startTime) >= eMin);
      return {
        status: 'in_class',
        currentClass: {
          id: c.id,
          subjectId: c.subjectId,
          name: subject?.name || 'Clase',
          code: subject?.code || '',
          color: subject?.color || '#6366f1',
          location: c.location,
          startTime: c.startTime,
          endTime: c.endTime,
          remainingMinutes: eMin - currentMin,
        },
        nextBlock: nextClass
          ? {
              title: subjectsMap[nextClass.subjectId]?.name || 'Clase',
              startTime: nextClass.startTime,
              location: nextClass.location,
              type: 'class',
              startsInMinutes: timeToMinutes(nextClass.startTime) - currentMin,
            }
          : undefined,
      };
    }
  }

  // 2. ¿Estamos en rutina fija (ej. Almuerzo, Transporte)?
  for (const r of todayRoutines) {
    const sMin = timeToMinutes(r.startTime);
    const eMin = timeToMinutes(r.endTime);
    if (currentMin >= sMin && currentMin < eMin) {
      return {
        status: 'in_routine',
        currentRoutine: {
          id: r.id,
          title: r.title,
          startTime: r.startTime,
          endTime: r.endTime,
          remainingMinutes: eMin - currentMin,
        },
      };
    }
  }

  // 3. ¿Estamos dentro del horario diario pero en un hueco libre?
  if (currentMin >= startMin && currentMin < endMin) {
    const freeSlots = calculateFreeSlots({
      dayOfWeek,
      classes: todayClasses,
      routines: todayRoutines,
      dayStart,
      dayEnd,
    });

    const activeSlot = freeSlots.find((slot) => {
      const sMin = timeToMinutes(slot.startTime);
      const eMin = timeToMinutes(slot.endTime);
      return currentMin >= sMin && currentMin < eMin;
    });

    // Próxima clase hoy
    const nextClass = todayClasses.find((c) => timeToMinutes(c.startTime) > currentMin);

    if (activeSlot) {
      const slotEndMin = timeToMinutes(activeSlot.endTime);
      return {
        status: 'in_free_slot',
        currentFreeSlot: {
          ...activeSlot,
          remainingMinutes: slotEndMin - currentMin,
        },
        nextBlock: nextClass
          ? {
              title: subjectsMap[nextClass.subjectId]?.name || 'Clase',
              startTime: nextClass.startTime,
              location: nextClass.location,
              type: 'class',
              startsInMinutes: timeToMinutes(nextClass.startTime) - currentMin,
            }
          : undefined,
      };
    }
  }

  // 4. Fuera de jornada
  const nextClass = todayClasses.find((c) => timeToMinutes(c.startTime) > currentMin);
  return {
    status: 'off_hours',
    nextBlock: nextClass
      ? {
          title: subjectsMap[nextClass.subjectId]?.name || 'Clase',
          startTime: nextClass.startTime,
          location: nextClass.location,
          type: 'class',
          startsInMinutes: timeToMinutes(nextClass.startTime) - currentMin,
        }
      : undefined,
  };
}
