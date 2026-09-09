import { Exam, TimeSlot, StudySession } from '@/types';
import { timeToMinutes, minutesToTime } from '../utils/timeHelpers';

export interface DistributeStudySessionsParams {
  exam: Exam;
  neededHours: number; // ej. 4 horas
  availableSlots: Array<TimeSlot & { date: string }>;
  preferredSessionMinutes?: number; // 45 o 60 min
}

export function distributeStudySessions({
  exam,
  neededHours,
  availableSlots,
  preferredSessionMinutes = 45,
}: DistributeStudySessionsParams): StudySession[] {
  let minutesToAllocate = Math.round(neededHours * 60);
  const plannedSessions: StudySession[] = [];

  // Ordenar huecos cronológicamente
  const sortedSlots = [...availableSlots].sort((a, b) => {
    return new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime();
  });

  const examTime = new Date(exam.date).getTime();

  for (const slot of sortedSlots) {
    if (minutesToAllocate <= 0) break;

    const slotDateTime = new Date(`${slot.date}T${slot.startTime}`).getTime();
    // Solo asignar antes del examen
    if (slotDateTime >= examTime) continue;

    // Solo huecos utilizables con al menos 30 min
    if (slot.durationMinutes < 30) continue;

    let slotStartMin = timeToMinutes(slot.startTime);
    const slotEndMin = timeToMinutes(slot.endTime);

    while (slotEndMin - slotStartMin >= 30 && minutesToAllocate > 0) {
      const sessionDuration = Math.min(
        preferredSessionMinutes,
        slotEndMin - slotStartMin,
        minutesToAllocate
      );

      const sessionEndMin = slotStartMin + sessionDuration;

      plannedSessions.push({
        id: `study-${exam.id}-${slot.date}-${slotStartMin}`,
        subjectId: exam.subjectId,
        title: `Sesión de repaso: ${exam.title}`,
        startAt: `${slot.date}T${minutesToTime(slotStartMin)}:00`,
        endAt: `${slot.date}T${minutesToTime(sessionEndMin)}:00`,
        durationMinutes: sessionDuration,
        status: 'planned',
      });

      minutesToAllocate -= sessionDuration;
      slotStartMin = sessionEndMin;
    }
  }

  return plannedSessions;
}
