import { planStudyGaps } from '../../lib/academic-engine/planning/studyGapPlanner';
import { Subject, Exam, Assignment, DayOfWeek, TimeSlot } from '../../types';

function makeSlot(
  date: string,
  startTime: string,
  endTime: string,
  durationMinutes: number,
  dayOfWeek: DayOfWeek = 5
): TimeSlot & { date: string } {
  return {
    date,
    dayOfWeek,
    startTime,
    endTime,
    durationMinutes,
    transitionBufferMinutes: 15,
    effectiveStudyMinutes: Math.max(0, durationMinutes - 15),
    category: 'USABLE',
  };
}

function runBoundaryTests() {
  console.log('--- Testing Study Gap Planner Boundaries & Negative Guardrails ---');

  const subjectsMap: Record<string, Subject> = {
    'sub-calc': {
      id: 'sub-calc',
      semesterId: 'sem-2026-2',
      name: 'Cálculo Multivariado',
      code: 'MAT-301',
      credits: 4,
      color: '#3b3abf',
      maxAbsences: 6,
      passingGrade: 3.0,
    },
    'sub-fis': {
      id: 'sub-fis',
      semesterId: 'sem-2026-2',
      name: 'Física Mecánica',
      code: 'FIS-101',
      credits: 3,
      color: '#059669',
      maxAbsences: 5,
      passingGrade: 3.0,
    },
  };

  const baseDate = new Date('2026-09-10T08:00:00');

  // PRUEBA 1: EXAM_SOON (Negativo vs Positivo)
  const examDistant: Exam = {
    id: 'exam-distant',
    subjectId: 'sub-calc',
    title: 'Parcial 2 Lejano',
    date: '2026-09-20T10:00:00', // 10 días
    weight: 15,
  };
  const examImminent: Exam = {
    id: 'exam-imminent',
    subjectId: 'sub-calc',
    title: 'Parcial 1 Inminente',
    date: '2026-09-12T10:00:00', // 2 días
    weight: 15,
  };

  const recsDistant = planStudyGaps({
    subjectsMap,
    exams: [examDistant],
    assignments: [],
    availableSlots: [makeSlot('2026-09-11', '09:00', '10:30', 90, 5)],
    baseDate,
  });
  if (recsDistant.length === 0 || (recsDistant[0]?.reasonCodes?.includes('EXAM_SOON') ?? false)) {
    throw new Error('FALLO: Parcial a 10 días no debería tener código EXAM_SOON');
  }
  console.log('✓ Test negativo EXAM_SOON: Parcial a 10 días NO incluye EXAM_SOON');

  const recsImminent = planStudyGaps({
    subjectsMap,
    exams: [examImminent],
    assignments: [],
    availableSlots: [makeSlot('2026-09-11', '09:00', '10:30', 90, 5)],
    baseDate,
  });
  const firstImminent = recsImminent[0];
  if (!firstImminent || !(firstImminent.reasonCodes?.includes('EXAM_SOON') ?? false)) {
    throw new Error('FALLO: Parcial a 2 días debe incluir código EXAM_SOON');
  }
  console.log('✓ Test positivo EXAM_SOON: Parcial a 2 días SÍ incluye EXAM_SOON');

  // PRUEBA 2: HIGH_WEIGHT (Límite estricto 20.0% vs 19.9%)
  const exam19_9: Exam = {
    id: 'exam-19-9',
    subjectId: 'sub-calc',
    title: 'Quiz de 19.9%',
    date: '2026-09-15T10:00:00',
    weight: 19.9,
  };
  const exam20_0: Exam = {
    id: 'exam-20-0',
    subjectId: 'sub-calc',
    title: 'Parcial de 20.0%',
    date: '2026-09-15T10:00:00',
    weight: 20.0,
  };

  const recs19_9 = planStudyGaps({
    subjectsMap,
    exams: [exam19_9],
    assignments: [],
    availableSlots: [makeSlot('2026-09-11', '09:00', '10:30', 90, 5)],
    baseDate,
  });
  const first19_9 = recs19_9[0];
  if (!first19_9 || (first19_9.reasonCodes?.includes('HIGH_WEIGHT') ?? false)) {
    throw new Error('FALLO: Evaluación de 19.9% no debe calificar como HIGH_WEIGHT');
  }
  console.log('✓ Límite estricto HIGH_WEIGHT: 19.9% NO incluye HIGH_WEIGHT');

  const recs20_0 = planStudyGaps({
    subjectsMap,
    exams: [exam20_0],
    assignments: [],
    availableSlots: [makeSlot('2026-09-11', '09:00', '10:30', 90, 5)],
    baseDate,
  });
  const first20_0 = recs20_0[0];
  if (!first20_0 || !(first20_0.reasonCodes?.includes('HIGH_WEIGHT') ?? false)) {
    throw new Error('FALLO: Evaluación de 20.0% debe calificar como HIGH_WEIGHT');
  }
  console.log('✓ Límite estricto HIGH_WEIGHT: 20.0% SÍ incluye HIGH_WEIGHT');

  // PRUEBA 3: APPROACHING_DEADLINE (47 horas vs 50 horas)
  const task47h: Assignment = {
    id: 'task-47h',
    subjectId: 'sub-fis',
    title: 'Taller 47h',
    dueDate: new Date(baseDate.getTime() + 47 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    priority: 'medium',
    estimatedMinutes: 60,
  };
  const task50h: Assignment = {
    id: 'task-50h',
    subjectId: 'sub-fis',
    title: 'Taller 50h',
    dueDate: new Date(baseDate.getTime() + 50 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    priority: 'medium',
    estimatedMinutes: 60,
  };

  const recs47h = planStudyGaps({
    subjectsMap,
    exams: [],
    assignments: [task47h],
    availableSlots: [makeSlot('2026-09-10', '10:00', '11:30', 90, 4)],
    baseDate,
  });
  const first47h = recs47h[0];
  if (!first47h || !(first47h.reasonCodes?.includes('APPROACHING_DEADLINE') ?? false)) {
    throw new Error('FALLO: Tarea a 47 horas debe incluir APPROACHING_DEADLINE');
  }
  console.log('✓ Límite APPROACHING_DEADLINE: 47 horas SÍ incluye APPROACHING_DEADLINE');

  const recs50h = planStudyGaps({
    subjectsMap,
    exams: [],
    assignments: [task50h],
    availableSlots: [makeSlot('2026-09-10', '10:00', '11:30', 90, 4)],
    baseDate,
  });
  const first50h = recs50h[0];
  if (!first50h || (first50h.reasonCodes?.includes('APPROACHING_DEADLINE') ?? false)) {
    throw new Error('FALLO: Tarea a 50 horas NO debe incluir APPROACHING_DEADLINE');
  }
  console.log('✓ Límite APPROACHING_DEADLINE: 50 horas NO incluye APPROACHING_DEADLINE');

  // PRUEBA 4: RESTRICCIONES DURAS DE HUECOS (Anti-autoengaño y no saturación)

  // Caso A: Hueco de 50 min (35 min tras 15m buffer -> < 45m min) -> DEBE RECHAZARSE
  const recs50m = planStudyGaps({
    subjectsMap,
    exams: [examImminent],
    assignments: [],
    availableSlots: [makeSlot('2026-09-11', '10:00', '10:50', 50, 5)],
    baseDate,
  });
  if (recs50m.length !== 0) {
    throw new Error('FALLO: Hueco de 50 min debió ser rechazado por no alcanzar sesión mínima de 45m con buffer');
  }
  console.log('✓ Guardrail Anti-autoengaño: Hueco de 50 min rechazado correctamente (0 recomendaciones)');

  // Caso B: Hueco de 60 min -> Sesión debe ser exactamente 45m (nunca 75m)
  const recs60m = planStudyGaps({
    subjectsMap,
    exams: [examImminent],
    assignments: [],
    availableSlots: [makeSlot('2026-09-11', '10:00', '11:00', 60, 5)],
    baseDate,
  });
  const first60m = recs60m[0];
  if (!first60m || first60m.durationMinutes > 45) {
    throw new Error(`FALLO: Hueco de 60 min no debe superar 45 min de sesión efectiva. Obtuvo: ${first60m?.durationMinutes}`);
  }
  console.log(`✓ Guardrail de ajuste: Hueco de 60 min asignó sesión de exactamente ${first60m.durationMinutes} min con buffer`);

  // Caso C: Hueco de 3 horas (180 min) -> Debe topar en 75 min (regla de no saturación)
  const recs180m = planStudyGaps({
    subjectsMap,
    exams: [examImminent], // Requiere 180 min de estudio acumulado
    assignments: [],
    availableSlots: [makeSlot('2026-09-11', '14:00', '17:00', 180, 5)],
    baseDate,
  });
  const first180m = recs180m[0];
  if (!first180m || first180m.durationMinutes > 75) {
    throw new Error(`FALLO: Hueco de 180 min no debe saturar con maratones. Máximo permitido: 75 min. Obtuvo: ${first180m?.durationMinutes}`);
  }
  console.log(`✓ Regla de no saturación: Hueco de 180 min (3h) limitado a sesión saludable de ${first180m.durationMinutes} min`);

  console.log('\nALL PLANNER BOUNDARY & GUARDRAIL TESTS PASSED SUCCESSFULLY! 🎯\n');
}

runBoundaryTests();
