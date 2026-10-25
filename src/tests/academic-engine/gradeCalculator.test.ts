import {
  calculateGradeStatus,
  buildEvaluationPlanFromExams,
  simulateGrade,
  roundGrade,
  ceilRequiredGrade,
  EvaluationItem,
} from '../../lib/academic-engine/grades/gradeCalculator';
import { Subject, Exam, Grade, TimeSlot, RiskEvaluation } from '../../types';
import { calculateSubjectRisk } from '../../lib/academic-engine/risk/calculateRisk';
import { planStudyGaps } from '../../lib/academic-engine/planning/studyGapPlanner';

console.log('--- Testing Grade Calculator & Passing Threshold Engine ---');

// TEST 1: Cálculo con suma ponderada estricta (no promedio simple)
const testPlan1: EvaluationItem[] = [
  { id: 'ev-1', subjectId: 'sub-1', name: 'Quiz 1', weight: 10, grade: 5.0 },
  { id: 'ev-2', subjectId: 'sub-1', name: 'Parcial 1', weight: 40, grade: 2.0 },
  { id: 'ev-3', subjectId: 'sub-1', name: 'Parcial 2', weight: 50 }, // Sin nota aún
];

const res1 = calculateGradeStatus({
  subjectId: 'sub-1',
  evaluations: testPlan1,
  passingGrade: 3.0,
});

// Acumulado = (5.0 * 0.10) + (2.0 * 0.40) = 0.50 + 0.80 = 1.30
if (Math.abs(res1.currentAccumulatedScore - 1.30) > 0.001) {
  throw new Error(`TEST 1 Failed: Acumulado esperado 1.30, obtenido ${res1.currentAccumulatedScore}`);
}

// Nota necesaria en el 50% restante = (3.0 - 1.30) / 0.50 = 3.40
if (!res1.requiredGrade || Math.abs(res1.requiredGrade - 3.40) > 0.001) {
  throw new Error(`TEST 1 Failed: Nota necesaria esperada 3.40, obtenida ${res1.requiredGrade}`);
}

// Si se hubiera usado promedio simple: (5.0 + 2.0) / 2 = 3.50, lo cual sería incorrecto
if (res1.status !== 'EXIGE_ESFUERZO') {
  throw new Error(`TEST 1 Failed: Status esperado EXIGE_ESFUERZO, obtenido ${res1.status}`);
}
console.log('✓ TEST 1: Suma ponderada Σ(nota_i * peso_i) y nota necesaria calculadas con exactitud');

// TEST 2: Trayectoria segura (nota necesaria < 3.0)
const testPlan2: EvaluationItem[] = [
  { id: 'ev-1', subjectId: 'sub-2', name: 'Parcial 1', weight: 25, grade: 3.5 },
  { id: 'ev-2', subjectId: 'sub-2', name: 'Talleres', weight: 25, grade: 4.0 },
  { id: 'ev-3', subjectId: 'sub-2', name: 'Parcial 2', weight: 25 },
  { id: 'ev-4', subjectId: 'sub-2', name: 'Proyecto Final', weight: 25 },
];

const res2 = calculateGradeStatus({
  subjectId: 'sub-2',
  evaluations: testPlan2,
  passingGrade: 3.0,
});
// Acumulado = 3.5 * 0.25 + 4.0 * 0.25 = 0.875 + 1.0 = 1.875
// Restante = 50% (0.50)
// Nota necesaria = (3.0 - 1.875) / 0.50 = 1.125 / 0.50 = 2.25
if (Math.abs((res2.requiredGrade || 0) - 2.25) > 0.001 || res2.status !== 'TRAYECTORIA_SEGURA') {
  throw new Error(`TEST 2 Failed: Esperado 2.25 TRAYECTORIA_SEGURA, obtenido ${res2.requiredGrade} ${res2.status}`);
}
console.log('✓ TEST 2: Trayectoria segura identificada correctamente (< 3.0 en lo restante)');

// TEST 3: Riesgo crítico forzado cuando nota necesaria > 4.0
const testPlan3: EvaluationItem[] = [
  { id: 'ev-1', subjectId: 'sub-3', name: 'Parcial 1', weight: 30, grade: 2.0 },
  { id: 'ev-2', subjectId: 'sub-3', name: 'Parcial 2', weight: 30, grade: 1.8 },
  { id: 'ev-3', subjectId: 'sub-3', name: 'Examen Final', weight: 40 },
];

const res3 = calculateGradeStatus({
  subjectId: 'sub-3',
  evaluations: testPlan3,
  passingGrade: 3.0,
});
// Acumulado = 2.0 * 0.30 + 1.8 * 0.30 = 0.60 + 0.54 = 1.14
// Restante = 40% (0.40)
// Nota necesaria = (3.0 - 1.14) / 0.40 = 1.86 / 0.40 = 4.65
if (Math.abs((res3.requiredGrade || 0) - 4.65) > 0.001 || res3.status !== 'RIESGO_CRITICO') {
  throw new Error(`TEST 3 Failed: Esperado 4.65 RIESGO_CRITICO, obtenido ${res3.requiredGrade} ${res3.status}`);
}
console.log('✓ TEST 3: Riesgo crítico forzado con precisión (nota necesaria > 4.0)');

// TEST 4: Estado inviable matemáticamente (nota necesaria > 5.0)
const testPlan4: EvaluationItem[] = [
  { id: 'ev-1', subjectId: 'sub-4', name: 'Corte 1', weight: 40, grade: 1.0 },
  { id: 'ev-2', subjectId: 'sub-4', name: 'Corte 2', weight: 40, grade: 1.0 },
  { id: 'ev-3', subjectId: 'sub-4', name: 'Corte 3', weight: 20 },
];

const res4 = calculateGradeStatus({
  subjectId: 'sub-4',
  evaluations: testPlan4,
  passingGrade: 3.0,
});
// Acumulado = 1.0 * 0.40 + 1.0 * 0.40 = 0.80
// Restante = 20% (0.20)
// Nota necesaria = (3.0 - 0.80) / 0.20 = 2.20 / 0.20 = 11.0 > 5.0
if (res4.status !== 'INVIABLE_MATEMATICAMENTE' || (res4.requiredGrade || 0) <= 5.0) {
  throw new Error(`TEST 4 Failed: Esperado INVIABLE_MATEMATICAMENTE con > 5.0, obtenido ${res4.requiredGrade} ${res4.status}`);
}
if (!res4.statusMessage.toLowerCase().includes('inviable')) {
  throw new Error('TEST 4 Failed: Mensaje debe advertir inviabilidad matemáticamente con prudencia');
}
console.log('✓ TEST 4: Estado inviable matemáticamente detectado con mensaje prudente');

// TEST 5: Aprobación anticipada (acumulado >= notaAprobatoria)
const testPlan5: EvaluationItem[] = [
  { id: 'ev-1', subjectId: 'sub-5', name: 'Parcial 1', weight: 35, grade: 4.8 },
  { id: 'ev-2', subjectId: 'sub-5', name: 'Parcial 2', weight: 35, grade: 4.5 },
  { id: 'ev-3', subjectId: 'sub-5', name: 'Examen Final', weight: 30 }, // Aún pendiente
];

const res5 = calculateGradeStatus({
  subjectId: 'sub-5',
  evaluations: testPlan5,
  passingGrade: 3.0,
});
// Acumulado = 4.8 * 0.35 + 4.5 * 0.35 = 1.68 + 1.575 = 3.255 >= 3.0
if (res5.status !== 'APROBADA_ANTICIPADA') {
  throw new Error(`TEST 5 Failed: Esperado APROBADA_ANTICIPADA, obtenido ${res5.status}`);
}
if (res5.requiredGrade !== 0) {
  throw new Error(`TEST 5 Failed: Nota necesaria esperada 0, obtenida ${res5.requiredGrade}`);
}
console.log('✓ TEST 5: Aprobada anticipada reconocida (incluso con 0 en lo restante pasa)');

// TEST 6: Caso borde - División por cero (pesoRestante = 0, 100% evaluado)
const testPlan6: EvaluationItem[] = [
  { id: 'ev-1', subjectId: 'sub-6', name: 'Parcial 1', weight: 50, grade: 2.5 },
  { id: 'ev-2', subjectId: 'sub-6', name: 'Parcial 2', weight: 50, grade: 2.7 },
];

const res6 = calculateGradeStatus({
  subjectId: 'sub-6',
  evaluations: testPlan6,
  passingGrade: 3.0,
});
// Acumulado = 2.5 * 0.50 + 2.7 * 0.50 = 2.60 < 3.0
if (res6.status !== 'COMPLETADA_REPROBADA' || res6.remainingWeight !== 0 || res6.isComplete !== true) {
  throw new Error(`TEST 6 Failed: Esperado COMPLETADA_REPROBADA con isComplete=true, obtenido ${res6.status}`);
}
console.log('✓ TEST 6: Caso borde 100% evaluado (sin división por cero) manejado correctamente');

// TEST 7: Caso borde - Pesos que no suman 100% (avisar, no fallar)
const testPlan7: EvaluationItem[] = [
  { id: 'ev-1', subjectId: 'sub-7', name: 'Parcial 1', weight: 30, grade: 3.5 },
  { id: 'ev-2', subjectId: 'sub-7', name: 'Parcial 2', weight: 30 },
];

const res7 = calculateGradeStatus({
  subjectId: 'sub-7',
  evaluations: testPlan7,
  passingGrade: 3.0,
});
if (res7.weightsIncomplete !== true || res7.totalConfiguredWeight !== 60) {
  throw new Error(`TEST 7 Failed: Esperado weightsIncomplete=true con total 60, obtenido ${res7.totalConfiguredWeight}`);
}
// Debe calcular asumiendo el 70% restante del semestre total (100 - 30)
// Acumulado = 3.5 * 0.30 = 1.05. Nota necesaria en el 70% restante = (3.0 - 1.05) / 0.70 = 2.79
if (!res7.requiredGrade || Math.abs(res7.requiredGrade - 2.79) > 0.02) {
  throw new Error(`TEST 7 Failed: Esperada nota necesaria aprox 2.79, obtenida ${res7.requiredGrade}`);
}
console.log('✓ TEST 7: Pesos incompletos advertidos limpiamente sin fallar');

// TEST 8: Reutilización de Exam.weight para no duplicar datos
const mockSubject: Subject = {
  id: 'sub-icesi-opt',
  semesterId: 'sem-1',
  name: 'Optimización',
  code: '05359',
  credits: 3,
  color: '#3b3abf',
  maxAbsences: 4,
  passingGrade: 3.0,
};

const mockExams: Exam[] = [
  { id: 'ex-1', subjectId: 'sub-icesi-opt', title: 'Parcial 1: Simplex', date: '2026-09-20', weight: 25 },
  { id: 'ex-2', subjectId: 'sub-icesi-opt', title: 'Parcial 2: Dualidad', date: '2026-10-25', weight: 30 },
  { id: 'ex-3', subjectId: 'sub-icesi-opt', title: 'Examen Final', date: '2026-11-28', weight: 35 },
];

const mockGrades: Grade[] = [
  { id: 'gr-1', subjectId: 'sub-icesi-opt', name: 'Parcial 1: Simplex', value: 3.8, weight: 25 },
];

const planFromExams = buildEvaluationPlanFromExams(mockSubject, mockExams, mockGrades);
if (planFromExams.length !== 3) {
  throw new Error(`TEST 8 Failed: Esperados 3 componentes derivados de exámenes, obtenidos ${planFromExams.length}`);
}
if (planFromExams[0].grade !== 3.8 || planFromExams[0].weight !== 25) {
  throw new Error('TEST 8 Failed: Primer examen debe contener su nota vinculada 3.8 y peso 25%');
}
if (planFromExams[1].grade !== null && planFromExams[1].grade !== undefined) {
  throw new Error('TEST 8 Failed: Segundo examen no debe tener nota');
}
console.log('✓ TEST 8: Reutilización transparente de Exam.weight sin duplicidad de ingreso');

// TEST 9: Simulador de Notas ("¿Y si saco X en el siguiente examen?")
const simulation = simulateGrade({
  evaluations: planFromExams,
  targetItemId: 'ex-2',
  simulatedGrade: 4.2,
  passingGrade: 3.0,
});
// Antes: Parcial 1 (25% a 3.8) = 0.95. Simulado: Parcial 2 (30% a 4.2) = 1.26. Suma = 2.21 en 55%.
// Restante: 45%. Nota necesaria en el final: (3.0 - 2.21) / 0.45 = 0.79 / 0.45 = 1.76
if (!simulation.requiredGrade || Math.abs(simulation.requiredGrade - 1.76) > 0.02) {
  throw new Error(`TEST 9 Failed: Nota simulada esperada aprox 1.76, obtenida ${simulation.requiredGrade}`);
}
console.log('✓ TEST 9: Simulador interactivo de notas verificado con precisión');

// TEST 10: Integración con calculateSubjectRisk - Nota necesaria > 4.0 fuerza nivel CRÍTICO
const criticalRisk = calculateSubjectRisk({
  subject: {
    id: 'sub-crit',
    semesterId: 'sem-1',
    name: 'Física Teórica',
    code: 'FIS301',
    credits: 4,
    color: '#ef4444',
    maxAbsences: 4,
    passingGrade: 3.0,
  },
  exams: [
    // Examen a 30 días (sin presión por fecha cercana)
    { id: 'ex-far', subjectId: 'sub-crit', title: 'Examen Final', date: '2026-11-20', weight: 40 },
  ],
  assignments: [], // Sin tareas pendientes
  attendanceRecords: [], // Sin inasistencias
  evaluations: [
    { id: 'ev-1', subjectId: 'sub-crit', name: 'Parcial 1', weight: 30, grade: 2.0 },
    { id: 'ev-2', subjectId: 'sub-crit', name: 'Parcial 2', weight: 30, grade: 1.8 },
    { id: 'ev-3', subjectId: 'sub-crit', name: 'Examen Final', weight: 40 }, // requiere 4.65
  ],
});

if (criticalRisk.level !== 'CRÍTICO') {
  throw new Error(`TEST 10 Failed: calculateSubjectRisk debió forzar nivel CRÍTICO por nota necesaria > 4.0, obtenido ${criticalRisk.level}`);
}
if ((criticalRisk.gradePressure || 0) <= 0) {
  throw new Error('TEST 10 Failed: gradePressure debe ser > 0 para materias en riesgo por notas');
}
console.log('✓ TEST 10: calculateSubjectRisk fuerza nivel CRÍTICO cuando nota necesaria > 4.0');

// TEST 11: Integración con calculateSubjectRisk - Materia aprobada anticipadamente
const passedRisk = calculateSubjectRisk({
  subject: {
    id: 'sub-pass',
    semesterId: 'sem-1',
    name: 'Ética y Sociedad',
    code: 'HUM101',
    credits: 2,
    color: '#10b981',
    maxAbsences: 4,
    passingGrade: 3.0,
  },
  exams: [],
  assignments: [],
  attendanceRecords: [],
  evaluations: [
    { id: 'ev-1', subjectId: 'sub-pass', name: 'Ensayo 1', weight: 50, grade: 4.8 },
    { id: 'ev-2', subjectId: 'sub-pass', name: 'Ensayo 2', weight: 30, grade: 4.5 }, // Acumulado 3.75 >= 3.0
    { id: 'ev-3', subjectId: 'sub-pass', name: 'Debate Final', weight: 20 },
  ],
});

if (passedRisk.level !== 'ESTABLE' || (passedRisk.gradePressure || 0) !== 0) {
  throw new Error(`TEST 11 Failed: Materia aprobada anticipadamente debe tener nivel ESTABLE y gradePressure 0, obtenido ${passedRisk.level} ${passedRisk.gradePressure}`);
}
console.log('✓ TEST 11: Materia aprobada anticipadamente clasifica ESTABLE con gradePressure 0');

// TEST 12: Inmunidad ante doble conteo (Grade vinculada a Exam con peso en ambos no duplica porcentaje)
const subDobleConteo: Subject = {
  id: 'sub-double',
  semesterId: 'sem-1',
  name: 'Calculo Multivariable',
  code: 'MAT201',
  credits: 4,
  color: '#2563eb',
  maxAbsences: 4,
  passingGrade: 3.0,
};

const examsDobleConteo: Exam[] = [
  { id: 'ex-parcial1', subjectId: 'sub-double', title: 'Parcial 1 (Vectores)', date: '2026-09-15', weight: 30 },
  { id: 'ex-final', subjectId: 'sub-double', title: 'Examen Final', date: '2026-11-20', weight: 70 },
];

const gradesDobleConteo: Grade[] = [
  // Esta nota está vinculada al examen 'ex-parcial1' y ambos especifican peso 30
  { id: 'gr-parcial1', subjectId: 'sub-double', name: 'Parcial 1 (Vectores)', value: 4.0, weight: 30 },
];

const planDobleConteo = buildEvaluationPlanFromExams(subDobleConteo, examsDobleConteo, gradesDobleConteo);
if (planDobleConteo.length !== 2) {
  throw new Error(`TEST 12 Failed: Se esperaban 2 items en el plan (sin duplicar), obtenidos ${planDobleConteo.length}`);
}

const statusDobleConteo = calculateGradeStatus({
  subjectId: 'sub-double',
  evaluations: planDobleConteo,
  passingGrade: 3.0,
});

if (statusDobleConteo.totalConfiguredWeight !== 100) {
  throw new Error(`TEST 12 Failed: totalConfiguredWeight debio ser 100, obtenido ${statusDobleConteo.totalConfiguredWeight}`);
}
if (statusDobleConteo.evaluatedWeight !== 30) {
  throw new Error(`TEST 12 Failed: evaluatedWeight debio ser 30 (no 60 por doble conteo), obtenido ${statusDobleConteo.evaluatedWeight}`);
}
if (statusDobleConteo.currentWeightedGrade !== 4.0) {
  throw new Error(`TEST 12 Failed: currentWeightedGrade esperado 4.0, obtenido ${statusDobleConteo.currentWeightedGrade}`);
}
console.log('✓ TEST 12: Inmunidad ante doble conteo verificada (Exam.weight y Grade.weight no se suman dos veces)');

// TEST 13: Grade con peso propio sin Exam asociado (ej. "Talleres 20%") entra al plan de evaluacion
const subTalleres: Subject = {
  id: 'sub-talleres',
  semesterId: 'sem-1',
  name: 'Estructuras de Datos',
  code: 'SIS202',
  credits: 3,
  color: '#8b5cf6',
  maxAbsences: 4,
  passingGrade: 3.0,
};

const examsTalleres: Exam[] = [
  { id: 'ex-midterm', subjectId: 'sub-talleres', title: 'Parcial Mitad de Semestre', date: '2026-10-10', weight: 40 },
  { id: 'ex-final-proj', subjectId: 'sub-talleres', title: 'Proyecto Final', date: '2026-11-25', weight: 40 },
];

const gradesTalleres: Grade[] = [
  // Nota sin ningun examen asociado
  { id: 'gr-standalone-talleres', subjectId: 'sub-talleres', name: 'Talleres Continuos', value: 4.5, weight: 20 },
];

const planTalleres = buildEvaluationPlanFromExams(subTalleres, examsTalleres, gradesTalleres);
if (planTalleres.length !== 3) {
  throw new Error(`TEST 13 Failed: Se esperaban 3 items en el plan incluyendo el taller sin examen, obtenidos ${planTalleres.length}`);
}

const tallerItem = planTalleres.find((it) => it.name === 'Talleres Continuos');
if (!tallerItem || tallerItem.weight !== 20 || tallerItem.grade !== 4.5) {
  throw new Error('TEST 13 Failed: Taller independiente no quedo registrado con su nota 4.5 y peso 20%');
}

const statusTalleres = calculateGradeStatus({
  subjectId: 'sub-talleres',
  evaluations: planTalleres,
  passingGrade: 3.0,
});
if (statusTalleres.evaluatedWeight !== 20 || statusTalleres.currentAccumulatedScore !== 0.90) {
  throw new Error(`TEST 13 Failed: evaluatedWeight debio ser 20 y acumulado 0.90, obtenido peso ${statusTalleres.evaluatedWeight} acum ${statusTalleres.currentAccumulatedScore}`);
}
if (statusTalleres.currentWeightedGrade !== 4.5) {
  throw new Error(`TEST 13 Failed: currentWeightedGrade esperado 4.5, obtenido ${statusTalleres.currentWeightedGrade}`);
}
console.log('✓ TEST 13: Grade con peso propio sin Exam asociado entra correctamente al plan de evaluacion');

// TEST 14: Regla de redondeo a 2 decimales y precision configurable (Standard y Truncate)
// Evitar artefactos como 2.9999999999999996
const precisionVal = 1.0 - 0.7; // En JS da 0.30000000000000004
const roundedStd = roundGrade(precisionVal, 2, 'standard');
if (roundedStd !== 0.30) {
  throw new Error(`TEST 14 Failed: Redondeo standard esperado 0.30, obtenido ${roundedStd}`);
}

// Truncate
const truncatedVal = roundGrade(2.999, 2, 'truncate');
if (truncatedVal !== 2.99) {
  throw new Error(`TEST 14 Failed: Truncate esperado 2.99, obtenido ${truncatedVal}`);
}

// Evaluacion con flotante 2.9999 no debe fallar la clasificacion contra 3.0
const testPlanFloat: EvaluationItem[] = [
  { id: 'ev-f1', subjectId: 'sub-float', name: 'Componente 1', weight: 33.33, grade: 3.0 },
  { id: 'ev-f2', subjectId: 'sub-float', name: 'Componente 2', weight: 33.33, grade: 3.0 },
  { id: 'ev-f3', subjectId: 'sub-float', name: 'Componente 3', weight: 33.34, grade: 3.0 },
];
const statusFloat = calculateGradeStatus({
  subjectId: 'sub-float',
  evaluations: testPlanFloat,
  passingGrade: 3.0,
});
if (statusFloat.status !== 'APROBADA_ANTICIPADA' || statusFloat.currentAccumulatedScore !== 3.0) {
  throw new Error(`TEST 14 Failed: Precision con decimales repetidos debio dar 3.00 APROBADA_ANTICIPADA, obtenido ${statusFloat.currentAccumulatedScore} ${statusFloat.status}`);
}
console.log('✓ TEST 14: Redondeo de precision y reglas configurables (Standard y Truncate) operando limpiamente');

// TEST 15: Exclusion de materias INVIABLE_MATEMATICAMENTE de studyGapPlanner
const subjectsMapTest: Record<string, Subject> = {
  'sub-inviable': {
    id: 'sub-inviable',
    semesterId: 'sem-1',
    name: 'Materia Inviable',
    code: 'INV100',
    credits: 3,
    color: '#ef4444',
    maxAbsences: 4,
    passingGrade: 3.0,
  },
  'sub-salvable': {
    id: 'sub-salvable',
    semesterId: 'sem-1',
    name: 'Materia Salvable',
    code: 'SAL200',
    credits: 3,
    color: '#3b82f6',
    maxAbsences: 4,
    passingGrade: 3.0,
  },
};

const baseDateTest = new Date('2026-10-25T08:00:00');
const testExamsGap: Exam[] = [
  { id: 'ex-inv', subjectId: 'sub-inviable', title: 'Parcial Final Inviable', date: '2026-10-27T10:00:00', weight: 30 },
  { id: 'ex-sal', subjectId: 'sub-salvable', title: 'Parcial Final Salvable', date: '2026-10-28T10:00:00', weight: 30 },
];

const testSlotsGap: Array<TimeSlot & { date: string }> = [
  {
    dayOfWeek: 1,
    startTime: '14:00',
    endTime: '15:30',
    durationMinutes: 90,
    transitionBufferMinutes: 15,
    effectiveStudyMinutes: 75,
    category: 'USABLE',
    date: '2026-10-25',
  },
];

const riskEvaluationsTest: RiskEvaluation[] = [
  {
    subjectId: 'sub-inviable',
    subjectName: 'Materia Inviable',
    subjectColor: '#ef4444',
    riskScore: 90,
    level: 'CRÍTICO',
    deadlinePressure: 40,
    workloadPressure: 0,
    attendancePressure: 0,
    gradePressure: 50,
    signals: {
      daysUntilExam: 2,
      pendingTasksCount: 0,
      estimatedStudyMinutes: 120,
      availableMinutesThisWeek: 300,
      attendanceRate: 100,
      absencesCount: 0,
      remainingAllowedAbsences: 4,
      gradeStatus: 'INVIABLE_MATEMATICAMENTE',
      requiredGrade: 6.5,
    },
    reasons: ['Inviable matemáticamente'],
  },
  {
    subjectId: 'sub-salvable',
    subjectName: 'Materia Salvable',
    subjectColor: '#3b82f6',
    riskScore: 65,
    level: 'ATENCIÓN',
    deadlinePressure: 30,
    workloadPressure: 0,
    attendancePressure: 0,
    gradePressure: 35,
    signals: {
      daysUntilExam: 3,
      pendingTasksCount: 0,
      estimatedStudyMinutes: 120,
      availableMinutesThisWeek: 300,
      attendanceRate: 100,
      absencesCount: 0,
      remainingAllowedAbsences: 4,
      gradeStatus: 'RIESGO_CRITICO',
      requiredGrade: 4.2,
    },
    reasons: ['Requiere esfuerzo prioritario'],
  },
];

const gapRecommendations = planStudyGaps({
  subjectsMap: subjectsMapTest,
  exams: testExamsGap,
  assignments: [],
  availableSlots: testSlotsGap,
  riskEvaluations: riskEvaluationsTest,
  baseDate: baseDateTest,
  maxSessionsPerDay: 2,
});

if (gapRecommendations.length === 0) {
  throw new Error('TEST 15 Failed: Se esperaba al menos 1 recomendacion para la materia salvable');
}
const hasInviableRecommendation = gapRecommendations.some((rec) => rec.subjectId === 'sub-inviable');
if (hasInviableRecommendation) {
  throw new Error('TEST 15 Failed: studyGapPlanner no debe recomendar estudiar una materia INVIABLE_MATEMATICAMENTE');
}
const hasSalvableRecommendation = gapRecommendations.some((rec) => rec.subjectId === 'sub-salvable');
if (!hasSalvableRecommendation) {
  throw new Error('TEST 15 Failed: studyGapPlanner debe priorizar la materia salvable');
}
console.log('✓ TEST 15: Materia INVIABLE excluida del planificador de huecos y materia salvable priorizada con exito');

// TEST 16: Renombrar el examen despues de guardar la nota no debe duplicar el item (vinculacion por examId)
const subRenombrar: Subject = {
  id: 'sub-renombrar',
  semesterId: 'sem-1',
  name: 'Calculo I',
  code: 'MAT101',
  credits: 3,
  color: '#2563eb',
  maxAbsences: 4,
  passingGrade: 3.0,
};

// Examen que originalmente se llamaba "Parcial 1" y fue renombrado a "Parcial 1 (corte 1)"
const examsRenombrados: Exam[] = [
  { id: 'ex-parcial-1', subjectId: 'sub-renombrar', title: 'Parcial 1 (corte 1)', date: '2026-09-20', weight: 25 },
  { id: 'ex-parcial-2', subjectId: 'sub-renombrar', title: 'Parcial 2', date: '2026-10-30', weight: 25 },
];

// Nota guardada previamente vinculada con examId: 'ex-parcial-1', pero con el nombre antiguo
const gradesConExamId: Grade[] = [
  { id: 'gr-ex-parcial-1', subjectId: 'sub-renombrar', name: 'Parcial 1', value: 4.5, weight: 25, examId: 'ex-parcial-1' },
];

const planRenombrado = buildEvaluationPlanFromExams(subRenombrar, examsRenombrados, gradesConExamId);
if (planRenombrado.length !== 2) {
  throw new Error(`TEST 16 Failed: Se esperaban 2 items, pero se obtuvieron ${planRenombrado.length} (posible duplicado por renombre)`);
}
const itemRenombrado = planRenombrado.find((it) => it.examId === 'ex-parcial-1');
if (!itemRenombrado || itemRenombrado.grade !== 4.5 || itemRenombrado.weight !== 25) {
  throw new Error('TEST 16 Failed: El examen renombrado no preservo su calificacion vinculada por examId');
}
const statusRenombrado = calculateGradeStatus({
  subjectId: 'sub-renombrar',
  evaluations: planRenombrado,
  passingGrade: 3.0,
});
if (statusRenombrado.totalConfiguredWeight !== 50) {
  throw new Error(`TEST 16 Failed: totalConfiguredWeight debio ser 50%, pero fue ${statusRenombrado.totalConfiguredWeight}% (posible doble conteo a 75%)`);
}
console.log('✓ TEST 16: Renombrar examen enlaza por examId y no duplica items ni altera porcentajes');

// TEST 17: Avisar cuando los pesos suman MAS de 100%
const testPlanOverweight: EvaluationItem[] = [
  { id: 'ev-ov1', subjectId: 'sub-over', name: 'Parcial 1', weight: 60, grade: 3.5 },
  { id: 'ev-ov2', subjectId: 'sub-over', name: 'Parcial 2', weight: 65 }, // Suma 125%
];

const statusOverweight = calculateGradeStatus({
  subjectId: 'sub-over',
  evaluations: testPlanOverweight,
  passingGrade: 3.0,
});
if (statusOverweight.weightsIncomplete !== true || statusOverweight.totalConfiguredWeight !== 125) {
  throw new Error(`TEST 17 Failed: Esperado totalConfiguredWeight 125 con weightsIncomplete true, obtenido ${statusOverweight.totalConfiguredWeight}`);
}
if (!statusOverweight.statusMessage.includes('exceden el 100% por 25%')) {
  throw new Error(`TEST 17 Failed: Mensaje debe advertir sobrepeso explicito (> 100%), obtenido: ${statusOverweight.statusMessage}`);
}
console.log('✓ TEST 17: Pesos superiores al 100% generan advertencia explicita con el porcentaje excedido');

// TEST 18: No descartar notas por tener nombres repetidos (ej. dos "Quiz" son dos notas distintas)
const subQuices: Subject = {
  id: 'sub-quices',
  semesterId: 'sem-1',
  name: 'Quimica General',
  code: 'QUI101',
  credits: 3,
  color: '#059669',
  maxAbsences: 4,
  passingGrade: 3.0,
};

const gradesRepetidas: Grade[] = [
  { id: 'gr-quiz-1', subjectId: 'sub-quices', name: 'Quiz', value: 4.5, weight: 10 },
  { id: 'gr-quiz-2', subjectId: 'sub-quices', name: 'Quiz', value: 3.5, weight: 10 },
  { id: 'gr-quiz-3', subjectId: 'sub-quices', name: 'Quiz', value: 5.0, weight: 10 },
];

const planQuicesRepetidos = buildEvaluationPlanFromExams(subQuices, [], gradesRepetidas);
if (planQuicesRepetidos.length !== 3) {
  throw new Error(`TEST 18 Failed: Se esperaban 3 evaluaciones para 3 quices distintos, obtenidos ${planQuicesRepetidos.length}`);
}
const statusQuicesRepetidos = calculateGradeStatus({
  subjectId: 'sub-quices',
  evaluations: planQuicesRepetidos,
  passingGrade: 3.0,
});
if (statusQuicesRepetidos.evaluatedWeight !== 30) {
  throw new Error(`TEST 18 Failed: evaluatedWeight debio ser 30%, obtenido ${statusQuicesRepetidos.evaluatedWeight}%`);
}
// Acumulado: (4.5 * 0.10) + (3.5 * 0.10) + (5.0 * 0.10) = 0.45 + 0.35 + 0.50 = 1.30
if (Math.abs(statusQuicesRepetidos.currentAccumulatedScore - 1.30) > 0.001) {
  throw new Error(`TEST 18 Failed: Acumulado esperado 1.30, obtenido ${statusQuicesRepetidos.currentAccumulatedScore}`);
}
console.log('✓ TEST 18: Multiples notas con nombres identicos ("Quiz") se preservan todas de forma independiente');

// TEST 19: Persistencia y recarga de componentes pendientes (sin nota)
const subPending: Subject = {
  id: 'sub-pending',
  semesterId: 'sem-1',
  name: 'Programacion Avanzada',
  code: 'SIS301',
  credits: 4,
  color: '#6366f1',
  maxAbsences: 4,
  passingGrade: 3.0,
};

const gradesWithPending: Grade[] = [
  { id: 'gr-taller-1', subjectId: 'sub-pending', name: 'Talleres en Clase', value: null, weight: 20 },
  { id: 'gr-proyecto', subjectId: 'sub-pending', name: 'Proyecto de Semestre', value: null, weight: 30 },
];

const planPending = buildEvaluationPlanFromExams(subPending, [], gradesWithPending);
if (planPending.length !== 2) {
  throw new Error(`TEST 19 Failed: Componentes pendientes no se deben perder, obtenidos ${planPending.length}`);
}
if (planPending[0].grade !== null || planPending[1].grade !== null) {
  throw new Error('TEST 19 Failed: Componentes pendientes deben mantener grade null');
}
if (planPending[0].weight !== 20 || planPending[1].weight !== 30) {
  throw new Error('TEST 19 Failed: Pesos de componentes pendientes deben preservarse intactos');
}
console.log('✓ TEST 19: Componentes pendientes (sin nota) se conservan y recargan correctamente en el plan');

// TEST 20: No inventar pesos por defecto (20 / 15). Marcar como "sin porcentaje" y excluir del calculo
const subNoWeights: Subject = {
  id: 'sub-noweights',
  semesterId: 'sem-1',
  name: 'Historia Contemporanea',
  code: 'SOC102',
  credits: 2,
  color: '#84cc16',
  maxAbsences: 4,
  passingGrade: 3.0,
};

const examsSinPeso: Exam[] = [
  { id: 'ex-inbox-1', subjectId: 'sub-noweights', title: 'Parcial Sorpresa', date: '2026-10-15', weight: 0 },
];

const gradesSinPeso: Grade[] = [
  { id: 'gr-inbox-2', subjectId: 'sub-noweights', name: 'Ensayo no ponderado', value: 4.0, weight: 0 },
];

const planSinPeso = buildEvaluationPlanFromExams(subNoWeights, examsSinPeso, gradesSinPeso);
if (planSinPeso.length !== 2) {
  throw new Error(`TEST 20 Failed: Se esperaban 2 items, obtenidos ${planSinPeso.length}`);
}
if (planSinPeso[0].weight !== 0 || planSinPeso[0].hasMissingWeight !== true) {
  throw new Error(`TEST 20 Failed: Primer item no debe inventar 20%, peso debe ser 0 y hasMissingWeight true, obtenido ${planSinPeso[0].weight}`);
}
if (planSinPeso[1].weight !== 0 || planSinPeso[1].hasMissingWeight !== true) {
  throw new Error(`TEST 20 Failed: Segundo item no debe inventar 15%, peso debe ser 0 y hasMissingWeight true, obtenido ${planSinPeso[1].weight}`);
}

const statusSinPeso = calculateGradeStatus({
  subjectId: 'sub-noweights',
  evaluations: planSinPeso,
  passingGrade: 3.0,
});
if (statusSinPeso.hasMissingWeights !== true) {
  throw new Error('TEST 20 Failed: hasMissingWeights debe ser true cuando hay items sin porcentaje');
}
if (statusSinPeso.totalConfiguredWeight !== 0) {
  throw new Error(`TEST 20 Failed: totalConfiguredWeight debe ser 0 (excluyendo items sin porcentaje), obtenido ${statusSinPeso.totalConfiguredWeight}`);
}
if (!statusSinPeso.statusMessage.includes('sin porcentaje asignado')) {
  throw new Error('TEST 20 Failed: Mensaje debe advertir componentes sin porcentaje');
}
console.log('✓ TEST 20: No se inventan pesos por defecto; items sin porcentaje son excluidos del calculo y advertidos');

// TEST 21: La nota necesaria se redondea SIEMPRE hacia arriba (Math.ceil a 2 decimales, nunca hacia abajo)
// Caso A: Matematicamente requiere 4.012 -> no debe redondearse hacia abajo a 4.00 ni 4.01
const ceilTestA = ceilRequiredGrade(4.012, 2);
if (ceilTestA !== 4.02) {
  throw new Error(`TEST 21 Failed: ceilRequiredGrade(4.012) debio ser 4.02, obtenido ${ceilTestA}`);
}

// Caso B: Matematicamente requiere 4.001 -> no debe redondearse hacia abajo a 4.00
const ceilTestB = ceilRequiredGrade(4.001, 2);
if (ceilTestB !== 4.01) {
  throw new Error(`TEST 21 Failed: ceilRequiredGrade(4.001) debio ser 4.01, obtenido ${ceilTestB}`);
}

// Caso C: En calculateGradeStatus, si se requiere 4.002, debe clasificar en RIESGO_CRITICO (> 4.0) y no EXIGE_ESFUERZO
// Passing grade = 3.0. Evaluado: 50% con nota 1.998. Acumulado = 0.999.
// Restante: 50%. Nota necesaria exacta: (3.0 - 0.999) / 0.50 = 2.001 / 0.50 = 4.002.
// Redondeado al alza a 2 decimales = 4.01 (> 4.0) -> RIESGO_CRITICO.
const testPlanCeil: EvaluationItem[] = [
  { id: 'ev-c1', subjectId: 'sub-ceil', name: 'Corte 1', weight: 50, grade: 1.998 },
  { id: 'ev-c2', subjectId: 'sub-ceil', name: 'Corte 2', weight: 50 },
];
const statusCeil = calculateGradeStatus({
  subjectId: 'sub-ceil',
  evaluations: testPlanCeil,
  passingGrade: 3.0,
});
if (statusCeil.requiredGrade !== 4.01) {
  throw new Error(`TEST 21 Failed: Nota necesaria debio redondearse al alza a 4.01, obtenido ${statusCeil.requiredGrade}`);
}
if (statusCeil.status !== 'RIESGO_CRITICO') {
  throw new Error(`TEST 21 Failed: Con 4.01 el estatus debe ser RIESGO_CRITICO, obtenido ${statusCeil.status}`);
}
console.log('✓ TEST 21: Nota necesaria se redondea estrictamente hacia arriba (Math.ceil a 2 decimales)');

// TEST 22: Con 0% evaluado, el estado debe ser neutro SIN_NOTAS (nunca TRAYECTORIA_SEGURA)
const testPlanZeroEval: EvaluationItem[] = [
  { id: 'ev-z1', subjectId: 'sub-zero', name: 'Parcial 1', weight: 35 },
  { id: 'ev-z2', subjectId: 'sub-zero', name: 'Parcial 2', weight: 35 },
  { id: 'ev-z3', subjectId: 'sub-zero', name: 'Final', weight: 30 },
];
const statusZeroEval = calculateGradeStatus({
  subjectId: 'sub-zero',
  evaluations: testPlanZeroEval,
  passingGrade: 3.0,
});
if (statusZeroEval.status !== 'SIN_NOTAS') {
  throw new Error(`TEST 22 Failed: Con 0% evaluado el status debe ser SIN_NOTAS, obtenido ${statusZeroEval.status}`);
}
if (!statusZeroEval.statusMessage.includes('Sin notas registradas todavía')) {
  throw new Error(`TEST 22 Failed: Mensaje debe indicar neutralidad sin notas, obtenido: ${statusZeroEval.statusMessage}`);
}
console.log('✓ TEST 22: Con 0% evaluado se asigna estado neutro SIN_NOTAS sin emitir falsa tranquilidad');

// TEST 23: Con % incompletos (<100%), calcula siempre la nota necesaria en el % restante
const testPlanIncompleteWeights: EvaluationItem[] = [
  { id: 'ev-inc1', subjectId: 'sub-inc', name: 'Parcial 1', weight: 35, grade: 2.0 },
];
const statusIncompleteWeights = calculateGradeStatus({
  subjectId: 'sub-inc',
  evaluations: testPlanIncompleteWeights,
  passingGrade: 3.0,
});
if (statusIncompleteWeights.weightsIncomplete !== true) {
  throw new Error('TEST 23 Failed: weightsIncomplete debe ser true');
}
// Acumulado = 2.0 * 0.35 = 0.70. Falta 2.30 en el 65% restante -> 2.30 / 0.65 = 3.538... -> 3.54
if (!statusIncompleteWeights.requiredGrade || Math.abs(statusIncompleteWeights.requiredGrade - 3.54) > 0.001) {
  throw new Error(`TEST 23 Failed: Nota necesaria esperada 3.54, obtenida ${statusIncompleteWeights.requiredGrade}`);
}
if (!statusIncompleteWeights.statusMessage.includes('asumiendo que el 65% restante aún no se ha evaluado')) {
  throw new Error(`TEST 23 Failed: Mensaje debe indicar la aclaración del porcentaje no evaluado, obtenido: ${statusIncompleteWeights.statusMessage}`);
}
console.log('✓ TEST 23: Porcentajes incompletos calculan exactamente la nota necesaria asumiendo lo que falta por evaluar');

console.log('ALL GRADE CALCULATOR & RISK INTEGRATION TESTS PASSED SUCCESSFULLY!');
