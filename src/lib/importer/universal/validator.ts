import {
  ParsedAcademicData,
  DetectionResult,
  IngestResult,
  IngestWarning,
  UnresolvedField,
  EvidenceItem,
  ConfidenceLevel,
} from './types';

export function validateAndBuildIngestResult(
  data: ParsedAcademicData,
  detections: DetectionResult[],
  ambiguities: UnresolvedField[] = [],
  evidenceGraph: EvidenceItem[] = []
): IngestResult {
  const warnings: IngestWarning[] = [];
  const unresolved: UnresolvedField[] = [...ambiguities];

  if (ambiguities.length > 0) {
    warnings.push({
      code: 'AMBIGUOUS_SUBJECT_MERGE',
      message: `Se detectaron ${ambiguities.length} posibles coincidencias de materias que requieren confirmación para no mezclar asignaturas distintas.`,
      severity: 'warning',
    });
  }

  const subjectsCount = data.subjects.length;
  const scheduleBlocksCount = data.scheduleBlocks.length;
  const examsCount = data.exams !== undefined ? data.exams.length : null;
  const assignmentsCount = data.assignments !== undefined ? data.assignments.length : null;

  // 1. Validar materias sin horario
  const subjectsWithBlocks = new Set(data.scheduleBlocks.map((b) => b.subjectId));
  const subjectsWithoutBlocks = data.subjects.filter((s) => !subjectsWithBlocks.has(s.id));

  if (subjectsWithoutBlocks.length > 0) {
    warnings.push({
      code: 'SUBJECTS_WITHOUT_SCHEDULE',
      message: `${subjectsWithoutBlocks.length} materia(s) (${subjectsWithoutBlocks.map((s) => s.name).slice(0, 2).join(', ')}${subjectsWithoutBlocks.length > 2 ? '...' : ''}) no tienen bloques de clase en esta evidencia.`,
      severity: 'warning',
    });
    unresolved.push({
      field: 'scheduleBlocks',
      label: 'Horario incompleto',
      message: `${subjectsWithoutBlocks.length} materias no tienen horario registrado.`,
      severity: 'warning',
      suggestedAction: 'Puedes agregar las clases manualmente o subir una captura de tu horario.',
    });
  }

  // 2. Validar salones faltantes
  const blocksMissingRoom = data.scheduleBlocks.filter((b) => !b.location || b.location === 'Aula Campus');
  if (blocksMissingRoom.length > 0) {
    warnings.push({
      code: 'MISSING_ROOMS',
      message: `${blocksMissingRoom.length} clase(s) no especifican salón o aula.`,
      severity: 'info',
    });
    unresolved.push({
      field: 'location',
      label: `${blocksMissingRoom.length} salón(es) pendiente(s)`,
      message: `${blocksMissingRoom.length} clase(s) no especifican salón o aula.`,
      severity: 'info',
      suggestedAction: 'Podrás ingresar el aula más adelante desde la vista de horario.',
    });
  }

  // 3. Validar evaluaciones (Principio clave: NO inventar datos, distinguir no evidenciado de vacío)
  if (examsCount === null) {
    warnings.push({
      code: 'EXAMS_NOT_EVIDENCED',
      message: 'Evaluaciones y parciales no encontrados en la evidencia cargada.',
      severity: 'info',
    });
    unresolved.push({
      field: 'exams',
      label: 'Evaluaciones pendientes',
      message: 'No encontradas en la evidencia cargada.',
      severity: 'info',
      suggestedAction: 'Puedes añadir tus parciales más tarde o importar el syllabus de cada materia.',
    });
  } else if (examsCount === 0) {
    warnings.push({
      code: 'ZERO_EXAMS_RECORDED',
      message: 'Se procesó la sección de evaluaciones pero no se registraron parciales.',
      severity: 'info',
    });
  }

  // 4. Calcular nivel de confianza global ponderado
  let confidence: ConfidenceLevel = 'high';
  if (subjectsCount === 0) {
    confidence = 'low';
    warnings.push({
      code: 'NO_SUBJECTS_FOUND',
      message: 'No se identificaron materias académicas válidas en la evidencia entregada.',
      severity: 'warning',
    });
  } else if (scheduleBlocksCount === 0 || subjectsWithoutBlocks.length > 0 || unresolved.some((u) => u.severity === 'warning')) {
    confidence = 'medium';
  }

  return {
    detections,
    data,
    unresolved,
    warnings,
    confidence,
    evidenceGraph,
    summary: {
      subjectsCount,
      scheduleBlocksCount,
      examsCount,
      assignmentsCount,
      missingRoomsCount: blocksMissingRoom.length,
      hasStudentProfile: Boolean(data.student?.name && data.student?.studentCode),
    },
  };
}
