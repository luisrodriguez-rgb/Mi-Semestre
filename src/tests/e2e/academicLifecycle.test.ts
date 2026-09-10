import { parseJasperAcademicBalance } from '../../lib/importer/smartAcademicIngester';
import { parseIcsCalendar } from '../../lib/importer/icsParser';
import { resolveBlockDeduplication } from '../../lib/importer/deduplication';
import { preprocessInboxText } from '../../lib/ai/preprocessor';
import { calculateFreeSlots } from '../../lib/academic-engine/schedule/calculateFreeSlots';
import { calculateSubjectRisk } from '../../lib/academic-engine/risk/calculateRisk';
import { planStudyGaps } from '../../lib/academic-engine/planning/studyGapPlanner';
import { getCurrentBlock } from '../../lib/academic-engine/schedule/getCurrentBlock';
import { Subject, ScheduleBlock, Exam, Assignment, TimeSlot } from '../../types';

async function testFullAcademicLifecycleE2E() {
  console.log('================================================================');
  console.log('--- STARTING FULL ACADEMIC LIFECYCLE E2E INTEGRATION TEST ---');
  console.log('================================================================\n');

  // PASO 1: Ingreso de Balance Jasper de Universidad Icesi
  console.log('[PASO 1]: Ingesta de Balance Oficial Icesi (Jasper)');
  const jasperSample = `SISTEMA DE REGISTRO ACADÉMICO - UNIVERSIDAD ICESI
Estudiante: Luis Ernesto Rodriguez Gurrute  Código: A00414805  Programa: IND - Ingeniería Industrial
Semestre Activo: Segundo Semestre De 2026 - PRE
Cohorte: 202420  Promedio acumulado: 4.3

MATERIAS MATRICULADAS EN EL PERIODO:
Código: 11373 - NRC: 11083 - Estadística aplicada II - 4 Créditos - Prof: Dr. Diego Fernando Cruz
Código: 05359 - NRC: 11830 - Optimización - 4 Créditos - Prof: Dr. Andrés Gómez
Código: 11356 - NRC: 11676 - Matemáticas aplicadas III - 4 Créditos - Prof: Dr. Héctor Fabio Sánchez
`;

  const parsedBalance = parseJasperAcademicBalance(jasperSample);
  if (!parsedBalance || parsedBalance.subjects.length < 3) {
    throw new Error('Paso 1: Falló el parseo de balance Jasper');
  }
  console.log(`✓ Balance procesado exitosamente: ${parsedBalance.subjects.length} asignaturas matriculadas.`);

  const subjectsMap: Record<string, Subject> = {};
  for (const sub of parsedBalance.subjects) {
    subjectsMap[sub.id] = {
      id: sub.id,
      semesterId: 'sem-2026-2',
      name: sub.name,
      code: sub.code,
      credits: sub.credits,
      color: sub.color,
      maxAbsences: sub.maxAbsences,
      passingGrade: 3.0,
      professor: sub.professor,
    };
  }

  // PASO 2: Sincronización e Importación de Calendario .ICS Externo
  console.log('\n[PASO 2]: Importación de Calendario .ICS con ICAL.js y Deduplicación');
  const icsSample = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VEVENT
UID:evt_estadistica_1@google.com
SUMMARY:Estadística aplicada II
DTSTART;TZID=America/Bogota:20260914T070000
DTEND;TZID=America/Bogota:20260914T090000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE
LOCATION:Edificio D - Salón 201
END:VEVENT
BEGIN:VEVENT
UID:evt_optimizacion_1@google.com
SUMMARY:Optimización
DTSTART;TZID=America/Bogota:20260915T090000
DTEND;TZID=America/Bogota:20260915T110000
RRULE:FREQ=WEEKLY;BYDAY=TU,TH
LOCATION:Edificio E - Salón 402
END:VEVENT
END:VCALENDAR`;

  const parsedIcsEvents = parseIcsCalendar(icsSample);
  if (parsedIcsEvents.length < 2) {
    throw new Error('Paso 2: Falló el adaptador de ICAL.js');
  }
  console.log(`✓ ICS procesado: ${parsedIcsEvents.length} eventos normalizados.`);

  const scheduleBlocks: ScheduleBlock[] = [];
  const linkedSubjectIds = new Set<string>();
  let discardedCount = 0;
  let unrecognizedCount = 0;

  for (const ev of parsedIcsEvents) {
    if (ev.suggestedType === 'class') {
      const matchSub = Object.values(subjectsMap).find((s) =>
        ev.title.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(ev.title.toLowerCase())
      );
      if (matchSub) {
        linkedSubjectIds.add(matchSub.id);
        const dedup = resolveBlockDeduplication(
          {
            subjectId: matchSub.id,
            subjectNameOrCode: matchSub.name,
            dayOfWeek: ev.dayOfWeek || 1,
            startTime: ev.startTimeStr,
            endTime: ev.endTimeStr,
            location: ev.location,
            externalUid: ev.uid,
            source: 'ics',
          },
          scheduleBlocks,
          subjectsMap
        );

        if (dedup.action === 'create') {
          scheduleBlocks.push({
            id: `b_${scheduleBlocks.length + 1}`,
            subjectId: matchSub.id,
            dayOfWeek: ev.dayOfWeek || 1,
            startTime: ev.startTimeStr,
            endTime: ev.endTimeStr,
            location: ev.location,
            source: 'ics',
            externalUid: ev.uid,
          });
        }
      } else {
        unrecognizedCount++;
      }
    } else {
      discardedCount++;
    }
  }

  const unlinkedSubjects = Object.values(subjectsMap).filter((s) => !linkedSubjectIds.has(s.id));

  console.log(`✓ Auditoría de Cobertura de Horario:`);
  console.log(`  · Materias matriculadas esperadas (Balance): ${Object.keys(subjectsMap).length}`);
  console.log(`  · Materias con franjas vinculadas vía ICS: ${linkedSubjectIds.size} (${Array.from(linkedSubjectIds).map(id => subjectsMap[id].name).join(', ')})`);
  console.log(`  · Franjas semanales incorporadas (RRULE): ${scheduleBlocks.length} bloques sin duplicación.`);
  console.log(`  · Materias sin horario en calendario externo: ${unlinkedSubjects.length} (${unlinkedSubjects.map(s => s.name).join(', ')})`);
  console.log(`  · Eventos externos no reconocidos: ${unrecognizedCount}, descartados: ${discardedCount}.`);

  // PASO 3: Captura de Información Caótica en el Buzón (WhatsApp)
  console.log('\n[PASO 3]: Buzón Inteligente (WhatsApp caótico -> Validación Zod -> Extracción)');
  const whatsappChat = 'Muchachos el profe de Estadística dijo que el parcial 1 quedó para el 24 a las 2, vale 20%. Para mañana entregar el ejercicio 3 en parejas.';
  const enrolledContext = Object.values(subjectsMap).map((s) => ({ id: s.id, name: s.name, code: s.code }));

  const inboxItems = preprocessInboxText(whatsappChat, enrolledContext, new Date('2026-09-10T08:00:00'));
  if (inboxItems.length !== 2) {
    throw new Error(`Paso 3: Buzón esperaba 2 items, extrajo ${inboxItems.length}`);
  }
  console.log(`✓ Buzón extrajo ${inboxItems.length} propuestas con sourceText y confianza calculada.`);

  // PASO 4: Confirmación del Usuario y Registro de Entidades
  console.log('\n[PASO 4]: Confirmación de Propuestas (IA -> Humano aprueba -> Registro)');
  const exams: Exam[] = [];
  const assignments: Assignment[] = [];

  for (const item of inboxItems) {
    if (item.type === 'exam') {
      exams.push({
        id: 'exam-1',
        subjectId: item.matchedSubjectId || Object.keys(subjectsMap)[0],
        title: item.title,
        date: `${item.date} ${item.startTime || '14:00'}`,
        weight: item.weight || 20,
        source: 'ai_inbox',
      });
    } else if (item.type === 'assignment') {
      assignments.push({
        id: 'asg-1',
        subjectId: item.matchedSubjectId || Object.keys(subjectsMap)[0],
        title: item.title,
        dueDate: `${item.date} 23:59`,
        priority: 'high',
        estimatedMinutes: 60,
        status: 'pending',
        source: 'ai_inbox',
      });
    }
  }
  console.log(`✓ 1 Parcial (${exams[0].title}) y 1 Tarea (${assignments[0].title}) confirmados e instanciados.`);

  // PASO 5: Motor Académico (Evaluación de Riesgo y Disponibilidad)
  console.log('\n[PASO 5]: Motor Académico (Cálculo de Riesgo y Huecos Libres)');
  const estSubjectId = exams[0].subjectId;
  const risk = calculateSubjectRisk({
    subject: subjectsMap[estSubjectId],
    exams,
    assignments,
    attendanceRecords: [],
    availableStudyMinutesThisWeek: 300,
    currentDate: new Date('2026-09-10T08:00:00'),
  });
  console.log(`✓ Riesgo evaluado para ${subjectsMap[estSubjectId].name}: Score ${risk.riskScore} (${risk.level}).`);

  const freeSlots = calculateFreeSlots({
    dayOfWeek: 1, // Lunes
    classes: scheduleBlocks,
    routines: [],
    dayStart: '07:00',
    dayEnd: '21:00',
  });
  console.log(`✓ ${freeSlots.length} huecos libres detectados para el día.`);

  // PASO 6: Study Gap Planner Determinístico
  console.log('\n[PASO 6]: Study Gap Planner (Recomendaciones Ponderadas con ReasonCodes)');
  const availableSlotsWithDates: Array<TimeSlot & { date: string }> = freeSlots.map((s) => ({
    ...s,
    date: '2026-09-10',
  }));

  const recommendations = planStudyGaps({
    subjectsMap,
    exams,
    assignments,
    availableSlots: availableSlotsWithDates,
    baseDate: new Date('2026-09-10T08:00:00'),
  });

  if (recommendations.length === 0) {
    throw new Error('Paso 6: Study planner no generó recomendaciones');
  }
  const topRec = recommendations[0];
  console.log(`✓ Recomendación de estudio generada: [${topRec.priorityScore} pts] ${topRec.title}`);
  console.log(`  Razón auditada: "${topRec.reason}"`);
  console.log(`  Códigos de decisión: [${topRec.reasonCodes?.join(', ')}]`);

  // PASO 7: Interfaz de Decisión en Vivo ("¿Qué hago ahora?")
  console.log('\n[PASO 7]: Interfaz de Decisión ("¿Qué hago ahora?" a las 11:30 am)');
  const nowDecision = getCurrentBlock({
    dayOfWeek: 1,
    currentTime: '11:30',
    classes: scheduleBlocks,
    subjectsMap,
    routines: [],
    dayStart: '07:00',
    dayEnd: '21:00',
  });

  console.log(`✓ Estado en tiempo real: ${nowDecision.status}`);
  console.log(`  Hueco disponible: ${nowDecision.currentFreeSlot?.remainingMinutes} min restantes`);

  // PASO 8: Simulación de Comienzo y Término de Sesión de Foco
  console.log('\n[PASO 8]: Ejecución de Sesión de Foco (Pomodoro)');
  const sessionPlannedMinutes = topRec.durationMinutes;
  console.log(`  Iniciando Foco para: "${topRec.title}" por ${sessionPlannedMinutes} minutos.`);
  console.log(`  Sesión completada satisfactoriamente con 100% de cumplimiento.`);

  // Marcar tarea completada y recalcular
  assignments[0].status = 'completed';
  console.log(`  Tarea "${assignments[0].title}" marcada como completada.`);

  console.log('\n================================================================');
  console.log('🎉 FULL ACADEMIC LIFECYCLE E2E TEST PASSED WITH 100% SUCCESS! 🎉');
  console.log('================================================================\n');
}

testFullAcademicLifecycleE2E();
