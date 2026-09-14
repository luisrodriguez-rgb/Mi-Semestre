import { AcademicDocumentType, ConfidenceLevel, DetectionSignal, InputContainer } from './types';

export interface DocumentClassificationResult {
  documentType: AcademicDocumentType;
  confidence: ConfidenceLevel;
  signals: DetectionSignal[];
}

/**
 * Clasifica el tipo de documento académico a partir del análisis multi-señal del contenido.
 */
export function classifyAcademicDocument(
  text: string,
  container: InputContainer
): DocumentClassificationResult {
  const signals: DetectionSignal[] = [];

  // Si el contenedor es un calendario ICS, el tipo de documento es schedule
  if (container === 'ics' || /BEGIN:VCALENDAR/i.test(text)) {
    signals.push({
      id: 'VCALENDAR_FORMAT',
      description: 'Estructura iCalendar RFC 5545 detectada',
      weight: 10,
    });
    return {
      documentType: 'schedule',
      confidence: 'high',
      signals,
    };
  }

  // 1. Evaluación de Señales de Balance Académico / Banner
  let balanceScore = 0;
  if (/sistema de registro acad[eé]mico/i.test(text)) {
    signals.push({ id: 'BANNER_HEADER', description: 'Cabecera de Sistema de Registro Académico', weight: 4 });
    balanceScore += 4;
  }
  if (/rrbanbalaca/i.test(text)) {
    signals.push({ id: 'JASPER_REPORT_CODE', description: 'Código de reporte institucional RRBANBALACA', weight: 4 });
    balanceScore += 4;
  }
  if (/balance acad[eé]mico/i.test(text)) {
    signals.push({ id: 'BALANCE_TITLE', description: 'Título oficial de Balance Académico', weight: 3 });
    balanceScore += 3;
  }
  if (/cohorte:\s*[0-9a-z]+/i.test(text)) {
    signals.push({ id: 'COHORT_FIELD', description: 'Campo de cohorte universitaria detectado', weight: 2 });
    balanceScore += 2;
  }
  if (/promedio:\s*[0-9]+[.,][0-9]+/i.test(text)) {
    signals.push({ id: 'GPA_FIELD', description: 'Promedio académico acumulado detectado', weight: 2 });
    balanceScore += 2;
  }
  if (/materias por aprobar|materias matriculadas/i.test(text)) {
    signals.push({ id: 'COURSE_LIST_SECTION', description: 'Sección de asignaturas matriculadas', weight: 3 });
    balanceScore += 3;
  }
  if (/\bA00\d{6}\b/i.test(text)) {
    signals.push({ id: 'STUDENT_CODE_PATTERN', description: 'Patrón de código estudiantil institucional', weight: 2 });
    balanceScore += 2;
  }

  if (balanceScore >= 5) {
    return {
      documentType: 'academic_balance',
      confidence: balanceScore >= 8 ? 'high' : 'medium',
      signals,
    };
  }

  // 2. Evaluación de Señales de Horario de Clases (Schedule)
  let scheduleScore = 0;
  const hasTimeRanges = /\b\d{1,2}(?::\d{2})?\s*(?:-|a|to)\s*\d{1,2}(?::\d{2})?\b/i.test(text);
  const hasDaysOfWeek = /\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|lun|mar|mie|jue|vie|sab)\b/i.test(text);
  const hasRooms = /(?:sal[oó]n|aula|lab|laboratorio|auditorio|edificio)\s*[a-z0-9-]+/i.test(text);

  if (hasTimeRanges) {
    signals.push({ id: 'TIME_RANGES', description: 'Rangos de hora de clase detectados', weight: 3 });
    scheduleScore += 3;
  }
  if (hasDaysOfWeek) {
    signals.push({ id: 'DAYS_OF_WEEK', description: 'Días de la semana identificados', weight: 3 });
    scheduleScore += 3;
  }
  if (hasRooms) {
    signals.push({ id: 'ROOM_IDENTIFIERS', description: 'Salones o aulas especificadas', weight: 2 });
    scheduleScore += 2;
  }

  if (scheduleScore >= 6) {
    return {
      documentType: 'schedule',
      confidence: scheduleScore >= 8 ? 'high' : 'medium',
      signals,
    };
  }

  // 3. Evaluación de Señales de Syllabus o Programa de Asignatura
  let syllabusScore = 0;
  if (/syllabus|microcurr[ií]culo|programa de curso/i.test(text)) {
    signals.push({ id: 'SYLLABUS_HEADER', description: 'Identificador explícito de syllabus o programa', weight: 4 });
    syllabusScore += 4;
  }
  if (/corte\s*\d|evaluaci[oó]n|ponderaci[oó]n|porcentaje\s*%/i.test(text)) {
    signals.push({ id: 'GRADING_POLICY', description: 'Políticas o esquemas de evaluación porcentual', weight: 3 });
    syllabusScore += 3;
  }
  if (/objetivos de aprendizaje|metodolog[ií]a|competencias/i.test(text)) {
    signals.push({ id: 'PEDAGOGICAL_GOALS', description: 'Objetivos o competencias pedagógicas', weight: 2 });
    syllabusScore += 2;
  }

  if (syllabusScore >= 5) {
    return {
      documentType: 'syllabus',
      confidence: syllabusScore >= 7 ? 'high' : 'medium',
      signals,
    };
  }

  // 4. Evaluación de Señales de Calificaciones (Grades)
  if (/calificaci[oó]n|nota final|definitiva|notas del corte/i.test(text)) {
    signals.push({ id: 'GRADES_INDICATOR', description: 'Términos de calificaciones y notas', weight: 3 });
    return {
      documentType: 'grades',
      confidence: 'medium',
      signals,
    };
  }

  return {
    documentType: 'unknown',
    confidence: 'low',
    signals,
  };
}
