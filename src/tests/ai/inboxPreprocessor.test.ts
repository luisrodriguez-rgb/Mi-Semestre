import { preprocessInboxText } from '../../lib/ai/preprocessor';

function testInboxPreprocessor() {
  console.log('--- Testing Inbox Deterministic Preprocessor & Confidence Engine ---');

  const enrolledSubjects = [
    { id: 'sub-est', name: 'Estadística Aplicada II', code: '11373' },
    { id: 'sub-opt', name: 'Optimización', code: '05359' },
    { id: 'sub-mat', name: 'Matemáticas aplicadas III', code: '11356' },
  ];

  const raw = 'Muchachos el parcial de estadística quedó para el 24 a las 2, vale 20%. El ejercicio 3 se entrega mañana en parejas.';
  const baseDate = new Date(2026, 8, 10); // 10 de Septiembre de 2026

  const items = preprocessInboxText(raw, enrolledSubjects, baseDate);
  console.log(`Detected ${items.length} items from test prompt.`);

  if (items.length !== 2) {
    throw new Error(`Expected exactly 2 items, got ${items.length}`);
  }

  const [examItem, taskItem] = items;

  // 1. Validar Parcial
  console.log('Item 1 (Exam):', {
    type: examItem.type,
    subject: examItem.subjectName,
    date: examItem.date,
    time: examItem.startTime,
    weight: examItem.weight,
    confidence: examItem.confidence,
    sourceText: examItem.sourceText,
  });

  if (examItem.type !== 'exam') throw new Error(`Item 1 should be exam, got ${examItem.type}`);
  if (examItem.matchedSubjectId !== 'sub-est') throw new Error('Item 1 failed to match Estadística Aplicada II');
  if (examItem.weight !== 20) throw new Error(`Item 1 expected weight 20, got ${examItem.weight}`);
  if (examItem.startTime !== '14:00') throw new Error(`Item 1 expected 14:00, got ${examItem.startTime}`);
  if (examItem.confidence !== 'high') throw new Error(`Item 1 expected high confidence, got ${examItem.confidence}`);

  // 2. Validar Tarea
  console.log('Item 2 (Assignment):', {
    type: taskItem.type,
    title: taskItem.title,
    date: taskItem.date,
    confidence: taskItem.confidence,
    sourceText: taskItem.sourceText,
  });

  if (taskItem.type !== 'assignment') throw new Error(`Item 2 should be assignment, got ${taskItem.type}`);
  if (!taskItem.title.toLowerCase().includes('ejercicio 3')) throw new Error('Item 2 title should include ejercicio 3');
  if (taskItem.date !== '2026-09-11') throw new Error(`Item 2 expected tomorrow (2026-09-11), got ${taskItem.date}`);

  console.log('✓ Both items extracted with sourceText and calculated confidence successfully');
  console.log('ALL INBOX PREPROCESSOR TESTS PASSED SUCCESSFULLY!\n');
}

testInboxPreprocessor();
