import { planStudyGaps } from '../../lib/academic-engine/planning/studyGapPlanner';
import { Subject, Exam, Assignment, TimeSlot } from '../../types';

function testAcademicScenarios() {
  console.log('--- Testing Academic Scenarios & Reasoning Engine ---');

  const subjectsMap: Record<string, Subject> = {
    'sub-calc': {
      id: 'sub-calc',
      semesterId: 'sem-1',
      name: 'Cálculo Multivariado',
      code: 'MAT201',
      credits: 4,
      color: '#3b3abf',
      maxAbsences: 4,
      passingGrade: 3.0,
    },
    'sub-fis': {
      id: 'sub-fis',
      semesterId: 'sem-1',
      name: 'Física y Laboratorio',
      code: 'FIS102',
      credits: 3,
      color: '#0d9488',
      maxAbsences: 4,
      passingGrade: 3.0,
    },
  };

  const baseDate = new Date('2026-09-10T08:00:00');

  // ==========================================
  // ESCENARIO A:
  // Parcial en 2 días (20%, 5h req) vs Tarea de 5% que vence mañana
  // Un parcial de alto peso a 48h requiere preparación profunda
  // ==========================================
  console.log('\n[Escenario A]: Parcial en 2 días (20%) vs Tarea menor mañana (5%)');
  const examsA: Exam[] = [
    {
      id: 'ex-calc',
      subjectId: 'sub-calc',
      title: 'Parcial 1: Integrales Múltiples',
      date: '2026-09-12T07:00:00', // en 2 días
      weight: 20,
    },
  ];
  const assignmentsA: Assignment[] = [
    {
      id: 'task-fis',
      subjectId: 'sub-fis',
      title: 'Taller de Vectores 1',
      dueDate: '2026-09-11T12:00:00', // mañana
      priority: 'low',
      estimatedMinutes: 45,
      status: 'pending',
    },
  ];

  const slotsA: Array<TimeSlot & { date: string }> = [
    {
      date: '2026-09-10',
      startTime: '10:00',
      endTime: '12:00',
      durationMinutes: 120,
      transitionBufferMinutes: 15,
      effectiveStudyMinutes: 90,
      category: 'FREE',
    },
  ];

  const recsA = planStudyGaps({
    subjectsMap,
    exams: examsA,
    assignments: assignmentsA,
    availableSlots: slotsA,
    baseDate,
  });

  if (recsA.length === 0) throw new Error('Escenario A failed to generate recommendations');
  const topA = recsA[0];
  console.log('Recomendación A:', {
    title: topA.title,
    score: topA.priorityScore,
    reason: topA.reason,
    reasonCodes: topA.reasonCodes,
  });

  if (topA.subjectId !== 'sub-calc') {
    throw new Error('Escenario A: Debería priorizar el Parcial de Cálculo por peso y déficit');
  }
  if (!topA.reasonCodes?.includes('EXAM_SOON') || !topA.reasonCodes?.includes('HIGH_WEIGHT')) {
    throw new Error('Escenario A: Faltan reasonCodes esperados (EXAM_SOON o HIGH_WEIGHT)');
  }
  console.log('✓ Escenario A pasó: priorizó parcial urgente de 20% con reasonCodes correctos');

  // ==========================================
  // ESCENARIO B:
  // Parcial en 14 días (40%) vs Quiz mañana (5%, 30min)
  // Mañana hay un evaluable inminente que requiere acción hoy
  // ==========================================
  console.log('\n[Escenario B]: Parcial a 14 días (40%) vs Quiz mañana (5%)');
  const examsB: Exam[] = [
    {
      id: 'ex-calc-far',
      subjectId: 'sub-calc',
      title: 'Parcial Final Cálculo',
      date: '2026-09-24T07:00:00', // a 14 días
      weight: 40,
    },
    {
      id: 'quiz-fis-tomorrow',
      subjectId: 'sub-fis',
      title: 'Quiz de Cinemática',
      date: '2026-09-11T08:00:00', // mañana a las 8am
      weight: 5,
    },
  ];

  const recsB = planStudyGaps({
    subjectsMap,
    exams: examsB,
    assignments: [],
    availableSlots: slotsA,
    baseDate,
  });

  if (recsB.length === 0) throw new Error('Escenario B failed to generate recommendations');
  const topB = recsB[0];
  console.log('Recomendación B:', {
    title: topB.title,
    score: topB.priorityScore,
    reason: topB.reason,
    reasonCodes: topB.reasonCodes,
  });

  if (topB.subjectId !== 'sub-fis') {
    throw new Error('Escenario B: Debería priorizar el Quiz inminente de mañana frente a examen a 14 días');
  }
  console.log('✓ Escenario B pasó: priorizó quiz inminente de mañana con razón auditable');

  console.log('\nALL ACADEMIC SCENARIOS PASSED SUCCESSFULLY!\n');
}

testAcademicScenarios();
