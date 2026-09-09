import { ScheduleBlock, FixedRoutine, ScheduleConflict, Subject } from '@/types';
import { timeToMinutes, intervalsOverlap } from '../utils/timeHelpers';

export interface DetectConflictsParams {
  classes: ScheduleBlock[];
  subjectsMap: Record<string, Subject>;
  routines?: FixedRoutine[];
}

export function detectConflicts({
  classes,
  subjectsMap,
  routines = [],
}: DetectConflictsParams): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  // Mapear elementos a formato genérico con tiempos en minutos
  const items = [
    ...classes.map((c) => ({
      id: c.id,
      dayOfWeek: c.dayOfWeek,
      start: timeToMinutes(c.startTime),
      end: timeToMinutes(c.endTime),
      title: subjectsMap[c.subjectId]?.name || 'Clase',
      timeStr: `${c.startTime} – ${c.endTime}`,
      type: 'class' as const,
    })),
    ...routines.map((r) => ({
      id: r.id,
      dayOfWeek: r.dayOfWeek,
      start: timeToMinutes(r.startTime),
      end: timeToMinutes(r.endTime),
      title: r.title,
      timeStr: `${r.startTime} – ${r.endTime}`,
      type: 'routine' as const,
    })),
  ];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];

      // Solo hay conflicto si caen en el mismo día
      if (a.dayOfWeek === b.dayOfWeek) {
        if (intervalsOverlap(a.start, a.end, b.start, b.end)) {
          const overlapStart = Math.max(a.start, b.start);
          const overlapEnd = Math.min(a.end, b.end);
          const overlapMinutes = overlapEnd - overlapStart;

          conflicts.push({
            id: `conflict-${a.id}-${b.id}`,
            itemA: { id: a.id, title: a.title, time: a.timeStr },
            itemB: { id: b.id, title: b.title, time: b.timeStr },
            dayOfWeek: a.dayOfWeek,
            overlapMinutes,
            description: `Conflicto de ${overlapMinutes}m entre "${a.title}" y "${b.title}" el mismo día.`,
          });
        }
      }
    }
  }

  return conflicts;
}
