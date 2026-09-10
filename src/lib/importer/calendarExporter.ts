import { ScheduleBlock, Exam, FixedRoutine, Subject } from '@/types';

const DAY_CODES = ['', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

function formatIcsDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function formatIcsTime(dayOfWeek: number, timeStr: string, baseDate: Date): string {
  // Ajusta la baseDate al día de la semana correspondiente
  const currentDay = baseDate.getDay() === 0 ? 7 : baseDate.getDay();
  const diff = dayOfWeek - currentDay;
  const target = new Date(baseDate);
  target.setDate(target.getDate() + diff);

  const [hours, minutes] = timeStr.split(':').map(Number);
  target.setHours(hours, minutes, 0, 0);

  return formatIcsDateTime(target);
}

export function generateIcsCalendar(params: {
  semesterName: string;
  subjectsMap: Record<string, Subject>;
  blocks: ScheduleBlock[];
  exams?: Exam[];
  routines?: FixedRoutine[];
  untilDate?: Date;
}): string {
  const { semesterName, subjectsMap, blocks, exams = [], routines = [], untilDate } = params;

  const now = new Date();
  const untilStr = untilDate ? formatIcsDateTime(untilDate) : formatIcsDateTime(new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000));

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mi Semestre//Sistema Operativo Academico//ES',
    `X-WR-CALNAME:Mi Semestre - ${semesterName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  // 1. Clases Recurrentes
  for (const block of blocks) {
    const subject = subjectsMap[block.subjectId];
    const title = subject ? `${subject.name} (${subject.code})` : 'Clase Universitaria';
    const dayCode = DAY_CODES[block.dayOfWeek] || 'MO';
    const startDateTime = formatIcsTime(block.dayOfWeek, block.startTime, now);
    const endDateTime = formatIcsTime(block.dayOfWeek, block.endTime, now);

    lines.push(
      'BEGIN:VEVENT',
      `UID:class_${block.id}@misemestre.app`,
      `DTSTAMP:${formatIcsDateTime(now)}`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${dayCode};UNTIL=${untilStr}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:Profesor: ${subject?.professor || 'Por asignar'} | Creditos: ${subject?.credits || 3}`,
      `LOCATION:${block.location || 'Campus Universitario'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  }

  // 2. Parciales / Evaluaciones
  for (const exam of exams) {
    const subject = subjectsMap[exam.subjectId];
    const title = `[PARCIAL ${exam.weight}%] ${exam.title} - ${subject?.name || ''}`;
    const examDate = new Date(exam.date);
    const endDate = new Date(examDate.getTime() + 120 * 60 * 1000); // 2 horas por defecto

    lines.push(
      'BEGIN:VEVENT',
      `UID:exam_${exam.id}@misemestre.app`,
      `DTSTAMP:${formatIcsDateTime(now)}`,
      `DTSTART:${formatIcsDateTime(examDate)}`,
      `DTEND:${formatIcsDateTime(endDate)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:Ponderacion: ${exam.weight}% | Temas: ${exam.topics?.join(', ') || 'No especificados'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  }

  // 3. Rutinas Fijas
  for (const routine of routines) {
    const dayCode = DAY_CODES[routine.dayOfWeek] || 'MO';
    const startDateTime = formatIcsTime(routine.dayOfWeek, routine.startTime, now);
    const endDateTime = formatIcsTime(routine.dayOfWeek, routine.endTime, now);

    lines.push(
      'BEGIN:VEVENT',
      `UID:routine_${routine.id}@misemestre.app`,
      `DTSTAMP:${formatIcsDateTime(now)}`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${dayCode};UNTIL=${untilStr}`,
      `SUMMARY:${routine.title}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Dispara la descarga del archivo .ics en el navegador del usuario
 */
export function downloadIcsFile(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
