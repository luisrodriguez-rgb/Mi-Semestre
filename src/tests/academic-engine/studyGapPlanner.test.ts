import { planStudyGaps, calculateUrgencyScore, calculateWeightScore } from '../../lib/academic-engine/planning/studyGapPlanner';
import { Subject, Exam, Assignment, TimeSlot } from '../../types';

function testStudyGapPlanner() {
  console.log('--- Testing Deterministic Study Gap Planner ---');

  // 1. Validar Scores
  if (calculateUrgencyScore(1) !== 100 || calculateUrgencyScore(4) !== 75) {
    throw new Error('calculateUrgencyScore failed');
  }
  if (calculateWeightScore(25) !== 83 || calculateWeightScore(undefined, 'high') !== 85) {
    throw new Error('calculateWeightScore failed');
  }
  console.log('✓ Normalized metric scoring functions pass');

  // 2. Mock Data
  const subjectsMap: Record<string, Subject> = {
    'sub-opt': {
      id: 'sub-opt',
      semesterId: 'sem-1',
      name: 'Optimización',
      code: '05359',
      credits: 4,
      color: '#0d9488',
      maxAbsences: 4,
      passingGrade: 3.0,
    },
    'sub-est': {
      id: 'sub-est',
      semesterId: 'sem-1',
      name: 'Estadística aplicada II',
      code: '11373',
      credits: 4,
      color: '#d97706',
      maxAbsences: 4,
      passingGrade: 3.0,
    },
  };

  const baseDate = new Date('2026-09-10T08:00:00');

  const exams: Exam[] = [
    {
      id: 'ex-opt',
      subjectId: 'sub-opt',
      title: 'Parcial 1: Simplex',
      date: '2026-09-14T07:00:00', // 4 días restantes
      weight: 25,
      topics: ['Modelación', 'Método Simplex'],
    },
    {
      id: 'ex-est',
      subjectId: 'sub-est',
      title: 'Parcial 1: Intervalos',
      date: '2026-09-24T14:00:00', // 14 días restantes
      weight: 20,
    },
  ];

  const assignments: Assignment[] = [
    {
      id: 'task-1',
      subjectId: 'sub-opt',
      title: 'Taller Colab 1',
      dueDate: '2026-09-12T23:59:00', // 2 días restantes
      priority: 'high',
      estimatedMinutes: 60,
      status: 'pending',
    },
  ];

  const availableSlots: Array<TimeSlot & { date: string }> = [
    {
      date: '2026-09-10',
      startTime: '10:00',
      endTime: '12:00',
      durationMinutes: 120,
      transitionBufferMinutes: 15,
      effectiveStudyMinutes: 90,
      category: 'FREE',
    },
    {
      date: '2026-09-11',
      startTime: '15:00',
      endTime: '16:30',
      durationMinutes: 90,
      transitionBufferMinutes: 15,
      effectiveStudyMinutes: 60,
      category: 'FREE',
    },
  ];

  const recommendations = planStudyGaps({
    subjectsMap,
    exams,
    assignments,
    availableSlots,
    baseDate,
    maxSessionsPerDay: 1,
  });

  console.log(`Generated ${recommendations.length} study recommendations.`);
  for (const rec of recommendations) {
    console.log(`- [Score: ${rec.priorityScore}] ${rec.title} on ${rec.startTimeStr}-${rec.endTimeStr} (${rec.durationMinutes}m)`);
  }

  if (recommendations.length === 0) {
    throw new Error('Expected at least 1 study recommendation');
  }

  // Taller Colab o Parcial de Optimización deben tener la máxima prioridad por cercanía (Sept 12/14 vs Sept 24)
  const topRec = recommendations[0];
  if (topRec.subjectId !== 'sub-opt') {
    throw new Error(`Expected top priority for Optimización (deadline in 2-4 days), got ${topRec.subjectName}`);
  }

  console.log('✓ Priority sorting prioritized high urgency/weight targets correctly');
  console.log('ALL STUDY GAP PLANNER TESTS PASSED SUCCESSFULLY!\n');
}

testStudyGapPlanner();
