import {
  calculateGradeStatus,
  buildEvaluationPlanFromExams,
  simulateGrade,
  EvaluationItem,
} from '../../lib/academic-engine/grades/gradeCalculator';
import { Subject, Exam, Grade } from '../../types';
import { calculateSubjectRisk } from '../../lib/academic-engine/risk/calculateRisk';

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

console.log('ALL GRADE CALCULATOR & RISK INTEGRATION TESTS PASSED SUCCESSFULLY!');
