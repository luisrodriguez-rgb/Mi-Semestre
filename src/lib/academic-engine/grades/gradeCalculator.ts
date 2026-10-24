import { Subject, Exam, Grade } from '@/types';

export type GradeStatus =
  | 'APROBADA_ANTICIPADA'      // Acumulado ya superó la nota aprobatoria incluso con 0 en lo restante
  | 'TRAYECTORIA_SEGURA'      // Nota necesaria < 3.0
  | 'EXIGE_ESFUERZO'          // Nota necesaria entre 3.0 y 4.0
  | 'RIESGO_CRITICO'          // Nota necesaria entre 4.0 y 5.0
  | 'INVIABLE_MATEMATICAMENTE' // Nota necesaria > 5.0 (matemáticamente imposible con nota máxima 5.0)
  | 'COMPLETADA_REPROBADA'    // 100% evaluado y acumulado < passingGrade
  | 'SIN_PLAN';               // Sin componentes configurados

export interface EvaluationItem {
  id: string;
  subjectId: string;
  name: string;
  weight: number;             // Porcentaje del 0 al 100 (ej: 25 para 25%)
  grade?: number | null;      // Calificación obtenida (escala 0.0 a 5.0)
  examId?: string;            // Vinculación opcional con Exam existente
  assignmentId?: string;      // Vinculación opcional con Assignment existente
  date?: string;              // Fecha límite o de realización
}

export interface GradeCalculationResult {
  subjectId: string;
  passingGrade: number;               // Por defecto 3.0
  totalConfiguredWeight: number;      // Suma total de pesos configurados (ej: 100%)
  evaluatedWeight: number;            // Suma de pesos que ya tienen nota asignada (ej: 50%)
  remainingWeight: number;            // Suma de pesos pendientes por evaluar (ej: 50%)
  currentAccumulatedScore: number;    // Σ(nota_i * peso_fraccion), ej: 3.2 * 0.25 = 0.80
  currentWeightedGrade: number | null;// Promedio de notas evaluadas hasta ahora: acumulado / (evaluatedWeight / 100)
  requiredGrade: number | null;       // Nota promedio necesaria en lo restante para aprobar
  status: GradeStatus;
  statusMessage: string;
  weightsIncomplete: boolean;         // true si totalConfiguredWeight !== 100
  isComplete: boolean;                // true si remainingWeight === 0
}

export interface GradeStatusInput {
  subjectId: string;
  evaluations: EvaluationItem[];
  passingGrade?: number;
}

/**
 * Motor determinístico de cálculo de notas acumuladas y umbral de aprobación.
 *
 * Fórmula estricta:
 *   acumulado = Σ(nota_i * (peso_i / 100))
 *   notaNecesaria = (notaAprobatoria - acumulado) / (pesoRestante / 100)
 */
export function calculateGradeStatus({
  subjectId,
  evaluations,
  passingGrade = 3.0,
}: GradeStatusInput): GradeCalculationResult {
  const totalConfiguredWeight = evaluations.reduce((acc, ev) => acc + (ev.weight || 0), 0);
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
    };
  }

  // Filtrar ítems evaluados (que tienen una calificación numérica válida)
  const evaluatedItems = evaluations.filter(
    (ev) => typeof ev.grade === 'number' && !isNaN(ev.grade) && ev.grade !== null
  );

  const evaluatedWeight = evaluatedItems.reduce((acc, ev) => acc + (ev.weight || 0), 0);

  // Acumulado exacto con pesos como fracción: Σ(nota_i * (peso_i / 100))
  const currentAccumulatedScore = evaluatedItems.reduce((acc, ev) => {
    const fractionWeight = (ev.weight || 0) / 100;
    return acc + (ev.grade! * fractionWeight);
  }, 0);

  // Promedio ponderado de lo que ya se evaluó
  const currentWeightedGrade =
    evaluatedWeight > 0 ? currentAccumulatedScore / (evaluatedWeight / 100) : null;

  // Peso restante en el semestre (base 100)
  const remainingWeight = Math.max(0, 100 - evaluatedWeight);
  const isComplete = remainingWeight <= 0.0001;

  let warningSuffix = '';
  if (weightsIncomplete && totalConfiguredWeight < 100) {
    warningSuffix = ` (Atención: los porcentajes configurados suman ${totalConfiguredWeight.toFixed(0)}%, faltan ${(100 - totalConfiguredWeight).toFixed(0)}% por definir).`;
  }

  // CASO 1: 100% Evaluado (Sin división por cero)
  if (isComplete) {
    const passed = currentAccumulatedScore >= passingGrade - 0.001;
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
        ? `Materia completada y aprobada con nota final de ${currentAccumulatedScore.toFixed(2)} sobre 5.0.`
        : `Materia completada no aprobada. Nota definitiva: ${currentAccumulatedScore.toFixed(2)} sobre 5.0 (nota mínima requerida: ${passingGrade.toFixed(1)}).`,
      weightsIncomplete,
      isComplete: true,
    };
  }

  // CASO 2: Aprobación Anticipada (acumulado actual >= nota aprobatoria)
  if (currentAccumulatedScore >= passingGrade - 0.001) {
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
    };
  }

  // CASO 3: Cálculo de Nota Necesaria
  const remainingFraction = remainingWeight / 100;
  const rawRequiredGrade = (passingGrade - currentAccumulatedScore) / remainingFraction;

  let status: GradeStatus = 'TRAYECTORIA_SEGURA';
  let statusMessage = '';

  if (rawRequiredGrade > 5.0) {
    status = 'INVIABLE_MATEMATICAMENTE';
    statusMessage = `Matemáticamente inviable: requerirías una nota de ${rawRequiredGrade.toFixed(1)} en el ${remainingWeight.toFixed(0)}% restante (la nota máxima posible es 5.0). Te recomendamos consultar con el profesor o evaluar opciones de cancelación oportuna.${warningSuffix}`;
  } else if (rawRequiredGrade > 4.0) {
    status = 'RIESGO_CRITICO';
    statusMessage = `Riesgo académico alto: necesitas promediar ${rawRequiredGrade.toFixed(2)} en el ${remainingWeight.toFixed(0)}% restante para pasar la materia. Se recomienda intensificar sesiones de estudio prioritarias.${warningSuffix}`;
  } else if (rawRequiredGrade > 3.0) {
    status = 'EXIGE_ESFUERZO';
    statusMessage = `Requiere esfuerzo sostenido: necesitas promediar ${rawRequiredGrade.toFixed(2)} en el ${remainingWeight.toFixed(0)}% restante para asegurar la aprobación.${warningSuffix}`;
  } else {
    status = 'TRAYECTORIA_SEGURA';
    statusMessage = `Vas por buen camino: necesitas promediar ${rawRequiredGrade.toFixed(2)} en el ${remainingWeight.toFixed(0)}% restante para aprobar con ${passingGrade.toFixed(1)}.${warningSuffix}`;
  }

  return {
    subjectId,
    passingGrade,
    totalConfiguredWeight,
    evaluatedWeight,
    remainingWeight,
    currentAccumulatedScore,
    currentWeightedGrade,
    requiredGrade: rawRequiredGrade,
    status,
    statusMessage,
    weightsIncomplete,
    isComplete: false,
  };
}

/**
 * Reutiliza los registros de exámenes existentes para construir el plan de evaluación
 * unificado sin obligar al estudiante a ingresar los porcentajes dos veces.
 */
export function buildEvaluationPlanFromExams(
  subject: Subject,
  exams: Exam[],
  grades: Grade[] = []
): EvaluationItem[] {
  const subjectExams = exams.filter((e) => e.subjectId === subject.id);
  const subjectGrades = grades.filter((g) => g.subjectId === subject.id);

  const items: EvaluationItem[] = [];

  // Mapear cada examen con su peso
  for (const exam of subjectExams) {
    // Buscar si existe una calificación asociada por nombre o id
    const matchedGrade = subjectGrades.find(
      (g) =>
        g.name.trim().toLowerCase() === exam.title.trim().toLowerCase() ||
        (g as any).examId === exam.id
    );

    items.push({
      id: exam.id,
      subjectId: subject.id,
      name: exam.title,
      weight: exam.weight || 20,
      grade: matchedGrade ? matchedGrade.value : null,
      examId: exam.id,
      date: exam.date,
    });
  }

  // Incorporar calificaciones que no vengan de exámenes (ej. Talleres, Quices generales)
  for (const grade of subjectGrades) {
    const alreadyMapped = items.some((it) => it.examId && (grade as any).examId === it.examId);
    if (!alreadyMapped && !items.some((it) => it.name === grade.name)) {
      items.push({
        id: grade.id,
        subjectId: subject.id,
        name: grade.name,
        weight: grade.weight || 15,
        grade: grade.value,
      });
    }
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
}: {
  evaluations: EvaluationItem[];
  targetItemId: string;
  simulatedGrade: number;
  passingGrade?: number;
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
  });
}
