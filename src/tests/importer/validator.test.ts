import { validateAndBuildIngestResult } from '../../lib/importer/universal/validator';
import { ParsedAcademicData, DetectionResult, UnresolvedField } from '../../lib/importer/universal/types';

function runValidatorTests() {
  console.log('--- Testing Universal Ingest Validator & Diagnostics ---');

  const sampleDetections: DetectionResult[] = [
    {
      container: 'pdf',
      documentType: 'academic_balance',
      confidence: 'high',
      signals: [
        { id: 'BANNER_HEADER', description: 'Header detected', weight: 1.0 },
        { id: 'GPA_FIELD', description: 'GPA field detected', weight: 0.8 },
      ],
    },
  ];

  // 1. Caso: Ausente vs Vacío (Evaluaciones NO evidenciadas)
  const unevidencedData: ParsedAcademicData = {
    subjects: [
      { id: 'sub-1', name: 'Estadística II', credits: 4 },
      { id: 'sub-2', name: 'Optimización', credits: 4 },
    ],
    scheduleBlocks: [
      { subjectId: 'sub-1', dayOfWeek: 1, startTime: '08:00', endTime: '10:00' }, // Sin salón
      { subjectId: 'sub-2', dayOfWeek: 2, startTime: '10:00', endTime: '12:00', location: 'Edificio C 102' },
    ],
    exams: undefined, // Explícitamente ausente / no evidenciado
  };

  const result1 = validateAndBuildIngestResult(unevidencedData, sampleDetections, []);

  // Verificar que examsCount sea null (ausente/no evidenciado), NO 0
  if (result1.summary.examsCount !== null) {
    throw new Error(`Se esperaba summary.examsCount === null para datos no evidenciados, pero se obtuvo ${result1.summary.examsCount}`);
  }

  // Verificar warning transparente de evaluaciones no evidenciadas
  const hasExamWarning = result1.warnings.some((w) => w.code === 'EXAMS_NOT_EVIDENCED');
  if (!hasExamWarning) {
    throw new Error('Falta advertencia transparente EXAMS_NOT_EVIDENCED');
  }

  // Verificar campo no resuelto reportado
  const hasExamUnresolved = result1.unresolved.some((u) => u.field === 'exams');
  if (!hasExamUnresolved) {
    throw new Error('El campo exams debería estar listado en unresolved para transparencia con el estudiante');
  }

  console.log('✓ Principio de Transparencia: Ausente/No evidenciado reflejado como null y advertencia clara');

  // 2. Caso: Salón faltante
  const missingRoomUnresolved = result1.unresolved.find((u) => u.field === 'location');
  if (!missingRoomUnresolved) {
    throw new Error('Debería detectar el salón pendiente en el bloque 1');
  }
  console.log(`✓ Detección de excepciones: Salón pendiente reportado ("${missingRoomUnresolved.message}")`);

  // 3. Caso: Ambigüedades que requieren confirmación humana
  const sampleAmbiguities: UnresolvedField[] = [
    {
      field: 'subject_conflict',
      label: 'Materia ambigua detectada',
      message: '¿Deseas vincular "Matemáticas para Negocios I" con "Matemáticas para Negocios II"?',
      severity: 'warning',
    },
  ];

  const resultWithAmbiguity = validateAndBuildIngestResult(unevidencedData, sampleDetections, sampleAmbiguities);
  const ambiguityUnresolved = resultWithAmbiguity.unresolved.find((u) => u.field === 'subject_conflict');
  if (!ambiguityUnresolved) {
    throw new Error('La ambigüedad debe reportarse explícitamente en unresolved');
  }
  if (!resultWithAmbiguity.warnings.some((w) => w.code === 'AMBIGUOUS_SUBJECT_MERGE')) {
    throw new Error('Debería registrar warning AMBIGUOUS_SUBJECT_MERGE');
  }

  console.log('✓ Ambigüedades retenidas como unresolved sin fusiones silenciosas');

  // 4. Caso: Evaluaciones explícitamente vacías (se examinó la sección pero no hay parciales)
  const emptyExamsData: ParsedAcademicData = {
    ...unevidencedData,
    exams: [], // Vacío explícito
  };
  const resultEmpty = validateAndBuildIngestResult(emptyExamsData, sampleDetections, []);
  if (resultEmpty.summary.examsCount !== 0) {
    throw new Error(`Se esperaba summary.examsCount === 0 cuando exams es [], pero se obtuvo ${resultEmpty.summary.examsCount}`);
  }
  if (resultEmpty.warnings.some((w) => w.code === 'EXAMS_NOT_EVIDENCED')) {
    throw new Error('No debe emitir EXAMS_NOT_EVIDENCED si el array fue explícitamente vacío');
  }

  console.log('✓ Distinción entre ausente (null) y vacío ([]) validada correctamente');
  console.log('ALL VALIDATOR TESTS PASSED! 🎉');
}

runValidatorTests();
