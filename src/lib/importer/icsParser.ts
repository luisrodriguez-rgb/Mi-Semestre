import ICAL from 'ical.js';
import { NormalizedCalendarEvent, DayOfWeek, EventType } from '@/types';

/**
 * Clasifica heurísticamente el tipo de evento a partir del título, descripción y recurrencia
 */
export function inferEventType(title: string, description?: string, isRecurring: boolean = false): EventType {
  const text = `${title} ${description || ''}`.toLowerCase();

  if (text.includes('parcial') || text.includes('examen') || text.includes('quiz') || text.includes('evaluacion') || text.includes('midterm') || text.includes('final exam')) {
    return 'exam';
  }

  if (text.includes('entrega') || text.includes('taller') || text.includes('tarea') || text.includes('proyecto') || text.includes('homework') || text.includes('assignment')) {
    return 'assignment';
  }

  if (text.includes('almuerzo') || text.includes('gimnasio') || text.includes('gym') || text.includes('desayuno') || text.includes('cena') || text.includes('rutina')) {
    return 'routine';
  }

  if (isRecurring || text.includes('clase') || text.includes('laboratorio') || text.includes('lab') || text.includes('curso') || text.includes('catedra') || text.includes('profesor') || text.includes('docente') || text.includes('salon') || text.includes('aula')) {
    return 'class';
  }

  return 'personal';
}

/**
 * Convierte un ICAL.Time a objeto Date de JavaScript
 */
function icalTimeToDate(icalTime: ICAL.Time): Date {
  return icalTime.toJSDate();
}

/**
 * Formatea Date a "HH:mm" en hora local
 */
export function formatTimeHHmm(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Obtiene el DayOfWeek (1=Lunes, ..., 7=Domingo) a partir de un Date
 */
export function getDayOfWeekFromDate(date: Date): DayOfWeek {
  const day = date.getDay(); // 0 es Domingo, 1 es Lunes
  return (day === 0 ? 7 : day) as DayOfWeek;
}

/**
 * Mapeo de días iCalendar (MO, TU, WE, TH, FR, SA, SU) a DayOfWeek (1-7)
 */
export const ICAL_DAY_MAP: Record<string, DayOfWeek> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 7,
};

/**
 * Adaptador principal que parsea contenido iCalendar (RFC 5545) utilizando ICAL.js
 */
export function parseIcsCalendar(
  icsContent: string,
  options: { sourceCalendar?: string } = {}
): NormalizedCalendarEvent[] {
  if (!icsContent || !icsContent.trim()) {
    return [];
  }

  const results: NormalizedCalendarEvent[] = [];

  try {
    const jcalData = ICAL.parse(icsContent);
    const vcalendar = new ICAL.Component(jcalData);
    const vevents = vcalendar.getAllSubcomponents('vevent');

    for (const vevent of vevents) {
      try {
        const event = new ICAL.Event(vevent);
        const uid = event.uid || `evt_${Math.random().toString(36).slice(2, 10)}`;
        const title = event.summary || 'Sin Título';
        const description = event.description || '';
        const location = event.location || '';
        const isRecurring = event.isRecurring();

        const startDate = icalTimeToDate(event.startDate);
        const endDate = icalTimeToDate(event.endDate);

        const startTimeStr = formatTimeHHmm(startDate);
        const endTimeStr = formatTimeHHmm(endDate);
        const dayOfWeek = getDayOfWeekFromDate(startDate);
        const suggestedType = inferEventType(title, description, isRecurring);

        let recurrence: NormalizedCalendarEvent['recurrence'] = undefined;

        if (isRecurring) {
          const rruleProp = vevent.getFirstProperty('rrule');
          if (rruleProp) {
            const rrule = rruleProp.getFirstValue() as ICAL.Recur;
            const byDay = rrule.parts?.BYDAY ? (Array.isArray(rrule.parts.BYDAY) ? rrule.parts.BYDAY : [rrule.parts.BYDAY]) : undefined;
            const until = rrule.until ? icalTimeToDate(rrule.until) : undefined;

            recurrence = {
              freq: rrule.freq,
              byDay,
              until,
            };

            // Si tiene múltiples días en BYDAY (ej. Lunes y Miércoles), generamos eventos por cada día
            if (byDay && byDay.length > 1) {
              for (const dayCode of byDay) {
                const mappedDay = ICAL_DAY_MAP[dayCode.replace(/[^A-Z]/g, '')];
                if (mappedDay) {
                  results.push({
                    uid: `${uid}_${dayCode}`,
                    title,
                    description,
                    location,
                    start: startDate,
                    end: endDate,
                    dayOfWeek: mappedDay,
                    startTimeStr,
                    endTimeStr,
                    recurrence,
                    source: 'ics',
                    sourceCalendar: options.sourceCalendar,
                    suggestedType,
                  });
                }
              }
              continue;
            }
          }
        }

        results.push({
          uid,
          title,
          description,
          location,
          start: startDate,
          end: endDate,
          dayOfWeek,
          startTimeStr,
          endTimeStr,
          recurrence,
          source: 'ics',
          sourceCalendar: options.sourceCalendar,
          suggestedType,
        });
      } catch (err) {
        console.warn('Error parsing single VEVENT in ICS:', err);
      }
    }
  } catch (err) {
    console.error('Failed to parse iCalendar data with ICAL.js:', err);
    throw new Error('El archivo o texto suministrado no es un calendario iCalendar válido.');
  }

  return results;
}
