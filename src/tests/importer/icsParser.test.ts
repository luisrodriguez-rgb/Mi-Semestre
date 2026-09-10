import { parseIcsCalendar } from '../../lib/importer/icsParser';
import { generateIcsCalendar } from '../../lib/importer/calendarExporter';

function testIcsParser() {
  console.log('--- Testing iCalendar Parser & Exporter (ICAL.js adapter) ---');

  const sampleIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART;TZID=America/Bogota:20260914T070000
DTEND;TZID=America/Bogota:20260914T090000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE
UID:google_event_123456@google.com
SUMMARY:Matemáticas Aplicadas III
DESCRIPTION:Profesor: Dr. Hector Fabio Sanchez
LOCATION:Edificio E - Salón 301
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=America/Bogota:20260924T140000
DTEND;TZID=America/Bogota:20260924T160000
UID:exam_event_789@google.com
SUMMARY:Parcial 1: Intervalos de Confianza
DESCRIPTION:Peso 20%
LOCATION:Auditorio Varela
END:VEVENT
END:VCALENDAR`;

  const events = parseIcsCalendar(sampleIcs, { sourceCalendar: 'Google Calendar' });
  console.log(`Parsed ${events.length} events from sample ICS.`);

  if (events.length < 2) {
    throw new Error(`Expected at least 2 events, got ${events.length}`);
  }

  const classEvents = events.filter((e) => e.suggestedType === 'class');
  const examEvents = events.filter((e) => e.suggestedType === 'exam');

  console.log(`- Detected ${classEvents.length} class occurrences`);
  console.log(`- Detected ${examEvents.length} exam events`);

  if (classEvents.length === 0) {
    throw new Error('Expected at least one class event to be classified');
  }

  if (examEvents.length === 0 || !examEvents[0].title.includes('Parcial 1')) {
    throw new Error('Expected exam event to be classified with title Parcial 1');
  }

  // Test Exporter
  const exportedIcs = generateIcsCalendar({
    semesterName: 'Segundo Semestre 2026',
    subjectsMap: {
      'sub-1': {
        id: 'sub-1',
        semesterId: 'sem-1',
        name: 'Optimización',
        code: '05359',
        credits: 4,
        color: '#0d9488',
        maxAbsences: 4,
        passingGrade: 3.0,
      },
    },
    blocks: [
      {
        id: 'b-1',
        subjectId: 'sub-1',
        dayOfWeek: 2,
        startTime: '07:00',
        endTime: '09:00',
        location: 'Salón 201',
      },
    ],
    exams: [
      {
        id: 'ex-1',
        subjectId: 'sub-1',
        title: 'Parcial 1 Simplex',
        date: '2026-09-16T07:00:00',
        weight: 20,
      },
    ],
  });

  if (!exportedIcs.includes('BEGIN:VCALENDAR') || !exportedIcs.includes('Optimización (05359)')) {
    throw new Error('Exporter failed to generate standard RFC 5545 format');
  }

  console.log('✓ Exporter generated valid RFC 5545 string successfully');
  console.log('ALL ICS PARSER TESTS PASSED SUCCESSFULLY!\n');
}

testIcsParser();
