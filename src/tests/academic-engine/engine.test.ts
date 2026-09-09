import {
  calculateFreeSlots,
  detectConflicts,
  getCurrentBlock,
  calculateSubjectRisk,
  calculateSemesterMetrics,
} from '../../lib/academic-engine';
import { Subject, ScheduleBlock, Exam, Assignment } from '../../types';

// Simple lightweight test runner
function runTests() {
  console.log('--- Testing Academic Engine ---');

  // Test 1: Calculate Free Slots
  const sampleClasses: ScheduleBlock[] = [
    { id: 'c1', subjectId: 's1', dayOfWeek: 2, startTime: '08:00', endTime: '10:00' },
    { id: 'c2', subjectId: 's2', dayOfWeek: 2, startTime: '12:00', endTime: '14:00' },
  ];

  const slots = calculateFreeSlots({
    dayOfWeek: 2,
    classes: sampleClasses,
    dayStart: '07:00',
    dayEnd: '18:00',
  });

  console.assert(slots.length === 3, `Expected 3 slots, got ${slots.length}`);
  console.assert(slots[0].startTime === '07:00' && slots[0].endTime === '08:00', 'Slot 1 bounds');
  console.assert(slots[1].startTime === '10:00' && slots[1].endTime === '12:00', 'Slot 2 (gap 2h)');
  console.assert(slots[1].category === 'USABLE', 'Slot 2 should be USABLE (120 min)');
  console.log('✓ calculateFreeSlots passed');

  // Test 2: Detect Conflicts
  const subjectsMap: Record<string, Subject> = {
    s1: { id: 's1', semesterId: 'sem1', name: 'Cálculo', code: 'MAT101', credits: 4, color: '#6366f1', maxAbsences: 4, passingGrade: 3.0 },
    s2: { id: 's2', semesterId: 'sem1', name: 'Física', code: 'FIS101', credits: 4, color: '#3b82f6', maxAbsences: 4, passingGrade: 3.0 },
  };

  const conflictingClasses: ScheduleBlock[] = [
    { id: 'c1', subjectId: 's1', dayOfWeek: 1, startTime: '08:00', endTime: '10:00' },
    { id: 'c2', subjectId: 's2', dayOfWeek: 1, startTime: '09:00', endTime: '11:00' },
  ];

  const conflicts = detectConflicts({ classes: conflictingClasses, subjectsMap });
  console.assert(conflicts.length === 1, `Expected 1 conflict, got ${conflicts.length}`);
  console.assert(conflicts[0].overlapMinutes === 60, `Expected 60m overlap, got ${conflicts[0].overlapMinutes}`);
  console.log('✓ detectConflicts passed');

  // Test 3: Get Current Block during class
  const blockResultInClass = getCurrentBlock({
    dayOfWeek: 2,
    currentTime: '09:00',
    classes: sampleClasses,
    subjectsMap,
  });
  console.assert(blockResultInClass.status === 'in_class', `Expected in_class, got ${blockResultInClass.status}`);
  console.assert(blockResultInClass.currentClass?.remainingMinutes === 60, 'Expected 60 min remaining');
  console.log('✓ getCurrentBlock (in_class) passed');

  // Test 4: Get Current Block during free slot
  const blockResultInSlot = getCurrentBlock({
    dayOfWeek: 2,
    currentTime: '10:30',
    classes: sampleClasses,
    subjectsMap,
  });
  console.assert(blockResultInSlot.status === 'in_free_slot', `Expected in_free_slot, got ${blockResultInSlot.status}`);
  console.assert(blockResultInSlot.currentFreeSlot?.remainingMinutes === 90, 'Expected 90m remaining in gap');
  console.log('✓ getCurrentBlock (in_free_slot) passed');

  // Test 5: Calculate Risk with near exam
  const exam: Exam = {
    id: 'e1',
    subjectId: 's1',
    title: 'Parcial 1',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    weight: 25,
  };
  const tasks: Assignment[] = [
    { id: 't1', subjectId: 's1', title: 'Taller 1', dueDate: '2026-09-10', priority: 'high', estimatedMinutes: 60, status: 'pending' },
    { id: 't2', subjectId: 's1', title: 'Taller 2', dueDate: '2026-09-11', priority: 'high', estimatedMinutes: 60, status: 'pending' },
    { id: 't3', subjectId: 's1', title: 'Taller 3', dueDate: '2026-09-12', priority: 'medium', estimatedMinutes: 90, status: 'pending' },
  ];

  const risk = calculateSubjectRisk({
    subject: subjectsMap.s1,
    exams: [exam],
    assignments: tasks,
    attendanceRecords: [],
    availableStudyMinutesThisWeek: 120, // Only 2 hours free vs 210 min tasks
  });

  console.assert(risk.level === 'CRÍTICO', `Expected CRÍTICO, got ${risk.level}`);
  console.assert(risk.signals.pendingTasksCount === 3, 'Expected 3 pending tasks');
  console.log('✓ calculateSubjectRisk passed with signal breakdown');

  // Test 6: Semester Progress
  const metrics = calculateSemesterMetrics({
    startDate: '2026-08-01',
    endDate: '2026-11-30',
    currentDate: new Date('2026-09-08'),
  });
  console.assert(metrics.currentWeek >= 5 && metrics.currentWeek <= 7, `Expected week ~6, got ${metrics.currentWeek}`);
  console.log('✓ calculateSemesterMetrics passed');

  console.log('ALL ACADEMIC ENGINE TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests();
