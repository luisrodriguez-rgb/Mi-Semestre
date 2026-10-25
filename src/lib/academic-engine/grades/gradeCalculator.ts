import { Subject, Exam, Grade } from '@/types';

export type GradeStatus =
  | 'APROBADA_ANTICIPADA'      // Acumulado ya superó la nota aprobatoria incluso con 0 en lo restante
  | 'TRAYECTORIA_SEGURA'      // Nota necesaria < 3.0
  | 'EXIGE_ESFUERZO'          // Nota necesaria entre 3.0 y 4.0
  | 'RIESGO_CRITICO'          // Nota necesaria entre 4.0 y 5.0
  | 'INVIABLE_MATEMATICAMENTE' // Nota necesaria > 5.0 (matemáticamente imposible con nota máxima 5.0)
  | 'COMPLETADA_REPROBADA'    // 100% evaluado y acumulado < passingGrade
  | 'SIN_PLAN'                // Sin componentes configurados
  | 'SIN_NOTAS';              // Componentes configurados pero 0% evaluado (sin notas registradas)

export interface EvaluationItem {
  id: string;
  subjectId: string;
  name: string;
  weight: number;             // Porcentaje del 0 al 100 (ej: 25 para 25%)
  grade?: number | null;      // Calificación obtenida (escala 0.0 a 5.0)
  examId?: string;            // Vinculación opcional con Exam existente
  assignmentId?: string;      // Vinculación opcional con Assignment existente
  date?: string;              // Fecha límite o de realización
  hasMissingWeight?: boolean; // Verdadero si el componente carece de porcentaje configurado
}

export type RoundingRule = 'standard' | 'truncate';

/**
 * Utilidad de redondeo para calificaciones y umbrales académicos:
 * - 'standard': Redondeo matemático clásico a N decimales (por defecto 2).
 * - 'truncate': Truncado estricto a N decimales sin redondeo al alza.
 */
export function roundGrade(
  value: number,
  decimals: number = 2,
  rule: RoundingRule = 'standard'
): number {
  if (isNaN(value) || !isFinite(value)) return value;

  if (rule === 'truncate') {
    const factor = Math.pow(10, decimals);
    return Math.floor(value * factor) / factor;
  }
  // Standard
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Redondeo siempre hacia arriba a N decimales (por defecto 2) para notas necesarias.
 * Principio protector: nunca decirle al estudiante que necesita menos de lo que matemáticamente requiere.
 * Utiliza Math.ceil con compensación para precisión de punto flotante.
 */
export function ceilRequiredGrade(value: number, decimals: number = 2): number {
  if (isNaN(value) || !isFinite(value)) return value;
  const factor = Math.pow(10, decimals);
  return Math.ceil((value - 1e-9) * factor) / factor;
}

export interface GradeCalculationResult {
  subjectId: string;
  passingGrade: number;               // Por defecto 3.0
  totalConfiguredWeight: number;      // Suma total de pesos configurados (ej: 100%)
  evaluatedWeight: number;            // Suma de pesos que ya tienen nota asignada (ej: 50%)
  remainingWeight: number;            // Suma de pesos pendientes por evaluar (ej: 50%)
  currentAccumulatedScore: number;    // Σ(nota_i * peso_fraccion), ej: 3.2 * 0.25 = 0.80
  currentWeightedGrade: number | null;// Promedio en lo evaluado: acumulado / (evaluatedWeight / 100) (ej: 3.4)
  requiredGrade: number | null;       // Nota promedio necesaria en lo restante para aprobar
  status: GradeStatus;
  statusMessage: string;
  weightsIncomplete: boolean;         // true si totalConfiguredWeight !== 100
  isComplete: boolean;                // true si remainingWeight === 0
  hasMissingWeights?: boolean;        // true si existen componentes sin porcentaje asignado
}

export interface GradeStatusInput {
  subjectId: string;
  evaluations: EvaluationItem[];
  passingGrade?: number;
  roundingRule?: RoundingRule;
}

/**
 * Motor determinístico de cálculo de notas acumuladas y umbral de aprobación.
 *
 * Fórmula estricta:
 *   acumulado = Σ(nota_i * (peso_i / 100))
 *   promedioEvaluado = acumulado / (pesoEvaluado / 100)
 *   notaNecesaria = (notaAprobatoria - acumulado) / (pesoRestante / 100)
 */
export function calculateGradeStatus({
  subjectId,
  evaluations,
  passingGrade = 3.0,
  roundingRule = 'standard',
}: GradeStatusInput): GradeCalculationResult {
  const hasMissingWeights = evaluations.some(
    (ev) => ev.hasMissingWeight || !ev.weight || ev.weight <= 0
  );

  const itemsWithWeight = evaluations.filter(
    (ev) => typeof ev.weight === 'number' && ev.weight > 0
  );

  const totalConfiguredWeight = roundGrade(
    itemsWithWeight.reduce((acc, ev) => acc + ev.weight, 0),
    2
  );
  const weightsIncomplete = Math.abs(totalConfiguredWeight - 100) > 0.001;

  if (evaluations.length === 0) {
    return {
      subjectId,
      passingGrade,
      totalConfiguredWeight: 0,
      evaluatedWeight: 0,
      remainingWeight: 100,
      currentAccumulatedScore: 0,
      currentWeightedGrade: null,
      requiredGrade: passingGrade,
      status: 'SIN_PLAN',
      statusMessage: `Sin plan de evaluación configurado. Se requiere un promedio general de ${passingGrade.toFixed(1)} para aprobar.`,
      weightsIncomplete: true,
      isComplete: false,
      hasMissingWeights: false,
    };
  }

  // Filtrar ítems evaluados (que tienen una calificación numérica válida y peso válido)
  const evaluatedItems = itemsWithWeight.filter(
    (ev) => typeof ev.grade === 'number' && !isNaN(ev.grade) && ev.grade !== null
  );

  const evaluatedWeight = roundGrade(
    evaluatedItems.reduce((acc, ev) => acc + (ev.weight || 0), 0),
    2
  );

  // Acumulado exacto con pesos como fracción: Σ(nota_i * (peso_i / 100))
  const rawAccumulated = evaluatedItems.reduce((acc, ev) => {
    const fractionWeight = (ev.weight || 0) / 100;
    return acc + (ev.grade! * fractionWeight);
  }, 0);

  // Redondear acumulado antes de clasificar para evitar artefactos de punto flotante
  const currentAccumulatedScore = roundGrade(rawAccumulated, 2, roundingRule);

  // Promedio ponderado de lo que ya se evaluó (cifra primaria para la UI)
  const rawWeightedGrade =
    evaluatedWeight > 0 ? rawAccumulated / (evaluatedWeight / 100) : null;
  const currentWeightedGrade =
    rawWeightedGrade !== null ? roundGrade(rawWeightedGrade, 2, roundingRule) : null;

  // Peso restante en el semestre (base 100)
  const remainingWeight = Math.max(0, roundGrade(100 - evaluatedWeight, 2));
  const isComplete = remainingWeight <= 0.0001;

  let warningSuffix = '';
  if (weightsIncomplete) {
    if (totalConfiguredWeight < 100) {
      warningSuffix += ` (Atención: los porcentajes configurados suman ${totalConfiguredWeight.toFixed(0)}%, faltan ${(100 - totalConfiguredWeight).toFixed(0)}% por definir).`;
    } else {
      warningSuffix += ` (Atención: los porcentajes configurados suman ${totalConfiguredWeight.toFixed(0)}%, exceden el 100% por ${(totalConfiguredWeight - 100).toFixed(0)}%).`;
    }
  }
  if (hasMissingWeights) {
    warningSuffix += ` (Hay componentes sin porcentaje asignado, excluidos del cálculo hasta que se especifiquen).`;
  }

  // CASO 1: 100% Evaluado (Sin división por cero)
  if (isComplete) {
    const passed = currentAccumulatedScore >= passingGrade;
    return {
      subjectId,
      passingGrade,
      totalConfiguredWeight,
      evaluatedWeight,
      remainingWeight: 0,
      currentAccumulatedScore,
      currentWeightedGrade,
      requiredGrade: null,
      status: passed ? 'APROBADA_ANTICIPADA' : 'COMPLETADA_REPROBADA',
      statusMessage: passed
        ? `Materia completada y aprobada con nota final de ${currentAccumulatedScore.toFixed(2)} sobre 5.0.${warningSuffix}`
        : `Materia completada no aprobada. Nota definitiva: ${currentAccumulatedScore.toFixed(2)} sobre 5.0 (nota mínima requerida: ${passingGrade.toFixed(1)}).${warningSuffix}`,
      weightsIncomplete,
      isComplete: true,
      hasMissingWeights,
    };
  }

  // CASO 2: Aprobación Anticipada (acumulado actual >= nota aprobatoria)
  if (currentAccumulatedScore >= passingGrade) {
    return {
      subjectId,
      passingGrade,
      totalConfiguredWeight,
      evaluatedWeight,
      remainingWeight,
      currentAccumulatedScore,
      currentWeightedGrade,
      requiredGrade: 0,
      status: 'APROBADA_ANTICIPADA',
      statusMessage: `Materia aprobada anticipadamente: tu acumulado actual (${currentAccumulatedScore.toFixed(2)}) supera los ${passingGrade.toFixed(1)} requeridos, incluso obteniendo 0.0 en el ${remainingWeight.toFixed(0)}% restante.${warningSuffix}`,
      weightsIncomplete,
      isComplete: false,
      hasMissingWeights,
    };
  }

  // CASO 3: Componentes configurados pero sin calificaciones aún (0% evaluado)
  if (evaluatedWeight === 0) {
    const missingCourseWeight = Math.max(0, 100 - totalConfiguredWeight);
    const missingWeightsNotice = hasMissingWeights
      ? ' (Hay componentes sin porcentaje asignado, excluidos del cálculo hasta que se especifiquen).'
      : '';
    const msg = weightsIncomplete && totalConfiguredWeight < 100
      ? `Sin notas registradas todavía. Te falta definir el ${missingCourseWeight.toFixed(0)}% del curso.${missingWeightsNotice}`
      : `Sin notas registradas todavía. Necesitas un promedio de ${passingGrade.toFixed(1)} en el curso para aprobar.${warningSuffix}`;
    return {
      subjectId,
      passingGrade,
      totalConfiguredWeight,
      evaluatedWeight: 0,
      remainingWeight,
      currentAccumulatedScore: 0,
      currentWeightedGrade: null,
      requiredGrade: passingGrade,
      status: 'SIN_NOTAS',
      statusMessage: msg,
      weightsIncomplete,
      isComplete: false,
      hasMissingWeights,
    };
  }

  // CASO 4: Cálculo de Nota Necesaria en lo restante (siempre redondeada al alza a 2 decimales)
  const remainingFraction = remainingWeight / 100;
  const rawRequiredGrade = (passingGrade - rawAccumulated) / remainingFraction;
  const roundedRequiredGrade = ceilRequiredGrade(rawRequiredGrade, 2);

  let status: GradeStatus = 'TRAYECTORIA_SEGURA';
  let statusMessage = '';

  if (roundedRequiredGrade > 5.0) {
    status = 'INVIABLE_MATEMATICAMENTE';
    statusMessage = weightsIncomplete && totalConfiguredWeight < 100
      ? `Matemáticamente inviable: requerirías más de 5.0 en lo restante (asumiendo que el ${(100 - totalConfiguredWeight).toFixed(0)}% restante aún no se ha evaluado).`
      : `Matemáticamente inviable: requerirías una nota de ${roundedRequiredGrade.toFixed(1)} en el ${remainingWeight.toFixed(0)}% restante (la nota máxima posible es 5.0). Te recomendamos consultar con el profesor o evaluar opciones de cancelación oportuna.${warningSuffix}`;
  } else if (roundedRequiredGrade > 4.0) {
    status = 'RIESGO_CRITICO';
    statusMessage = weightsIncomplete && totalConfiguredWeight < 100
      ? `Riesgo académico alto: necesitas ${roundedRequiredGrade.toFixed(2)} en el ${remainingWeight.toFixed(0)}% que falta (asumiendo que el ${(100 - totalConfiguredWeight).toFixed(0)}% restante aún no se ha evaluado).`
      : `Riesgo académico alto: necesitas promediar ${roundedRequiredGrade.toFixed(2)} en el ${remainingWeight.toFixed(0)}% restante para pasar la materia. Se recomienda intensificar sesiones de estudio prioritarias.${warningSuffix}`;
  } else if (roundedRequiredGrade > 3.0) {
    status = 'EXIGE_ESFUERZO';
    statusMessage = weightsIncomplete && totalConfiguredWeight < 100
      ? `Requiere esfuerzo sostenido: necesitas ${roundedRequiredGrade.toFixed(2)} en el ${remainingWeight.toFixed(0)}% que falta (asumiendo que el ${(100 - totalConfiguredWeight).toFixed(0)}% restante aún no se ha evaluado).`
      : `Requiere esfuerzo sostenido: necesitas promediar ${roundedRequiredGrade.toFixed(2)} en el ${remainingWeight.toFixed(0)}% restante para asegurar la aprobación.${warningSuffix}`;
  } else {
    status = 'TRAYECTORIA_SEGURA';
    statusMessage = weightsIncomplete && totalConfiguredWeight < 100
      ? `Vas por buen camino: necesitas ${roundedRequiredGrade.toFixed(2)} en el ${remainingWeight.toFixed(0)}% que falta (asumiendo que el ${(100 - totalConfiguredWeight).toFixed(0)}% restante aún no se ha evaluado).`
      : `Vas por buen camino: necesitas promediar ${roundedRequiredGrade.toFixed(2)} en el ${remainingWeight.toFixed(0)}% restante para aprobar con ${passingGrade.toFixed(1)}.${warningSuffix}`;
  }

  return {
    subjectId,
    passingGrade,
    totalConfiguredWeight,
    evaluatedWeight,
    remainingWeight,
    currentAccumulatedScore,
    currentWeightedGrade,
    requiredGrade: roundedRequiredGrade,
    status,
    statusMessage,
    weightsIncomplete,
    isComplete: false,
    hasMissingWeights,
  };
}

/**
 * Reutiliza los registros de exámenes existentes para construir el plan de evaluación
 * unificado sin obligar al estudiante a ingresar los porcentajes dos veces.
 * Garantiza inmunidad ante doble conteo entre Exam.weight y Grade.weight.
 */
export function buildEvaluationPlanFromExams(
  subject: Subject,
  exams: Exam[],
  grades: Grade[] = []
): EvaluationItem[] {
  const subjectExams = exams.filter((e) => e.subjectId === subject.id);
  const subjectGrades = grades.filter((g) => g.subjectId === subject.id);

  const items: EvaluationItem[] = [];
  const mappedGradeIds = new Set<string>();

  // 1. Mapear cada examen con su peso
  // Prioridad de enlace:
  // a) Por examId explícito en la nota (inmune a cambios de nombre del examen)
  // b) Por id directo
  // c) Por nombre (únicamente como respaldo para datos históricos sin examId)
  for (const exam of subjectExams) {
    const matchedGrade = subjectGrades.find((g) => {
      if (g.examId) {
        return g.examId === exam.id;
      }
      return g.id === exam.id || g.name.trim().toLowerCase() === exam.title.trim().toLowerCase();
    });

    if (matchedGrade) {
      mappedGradeIds.add(matchedGrade.id);
    }

    const effectiveWeight =
      typeof exam.weight === 'number' && exam.weight > 0
        ? exam.weight
        : typeof matchedGrade?.weight === 'number' && matchedGrade.weight > 0
          ? matchedGrade.weight
          : 0;

    items.push({
      id: exam.id,
      subjectId: subject.id,
      name: exam.title,
      weight: effectiveWeight,
      grade: matchedGrade && typeof matchedGrade.value === 'number' ? matchedGrade.value : null,
      examId: exam.id,
      date: exam.date,
      hasMissingWeight: effectiveWeight <= 0,
    });
  }

  // 2. Incorporar calificaciones que no vengan de exámenes (ej. "Talleres 20%", "Quices 15%")
  // No descartar notas por tener nombres repetidos (ej. dos "Quiz" son dos notas distintas).
  for (const grade of subjectGrades) {
    if (mappedGradeIds.has(grade.id)) continue;
    if (grade.examId && subjectExams.some((e) => e.id === grade.examId)) continue;

    const effectiveWeight =
      typeof grade.weight === 'number' && grade.weight > 0 ? grade.weight : 0;

    items.push({
      id: grade.id,
      subjectId: subject.id,
      name: grade.name,
      weight: effectiveWeight,
      grade: typeof grade.value === 'number' ? grade.value : null,
      examId: grade.examId,
      hasMissingWeight: effectiveWeight <= 0,
    });
    mappedGradeIds.add(grade.id);
  }

  return items;
}

/**
 * Simulador de calificaciones ("¿Y si saco X en el siguiente examen?").
 */
export function simulateGrade({
  evaluations,
  targetItemId,
  simulatedGrade,
  passingGrade = 3.0,
  roundingRule = 'standard',
}: {
  evaluations: EvaluationItem[];
  targetItemId: string;
  simulatedGrade: number;
  passingGrade?: number;
  roundingRule?: RoundingRule;
}): GradeCalculationResult {
  const cloned = evaluations.map((item) => {
    if (item.id === targetItemId || item.examId === targetItemId) {
      return { ...item, grade: simulatedGrade };
    }
    return { ...item };
  });

  return calculateGradeStatus({
    subjectId: evaluations[0]?.subjectId || 'simulation',
    evaluations: cloned,
    passingGrade,
    roundingRule,
  });
}
