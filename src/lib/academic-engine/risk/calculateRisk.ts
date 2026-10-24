import {
  Subject,
  Exam,
  Assignment,
  AttendanceRecord,
  RiskEvaluation,
  RiskLevel,
  Grade,
  EvaluationItem,
} from '@/types';
import {
  calculateGradeStatus,
  buildEvaluationPlanFromExams,
  GradeCalculationResult,
} from '../grades/gradeCalculator';

export interface SubjectRiskInputs {
  subject: Subject;
  exams: Exam[];
  assignments: Assignment[];
  attendanceRecords: AttendanceRecord[];
  currentDate?: Date; // Por defecto hoy
  availableStudyMinutesThisWeek?: number;
  evaluations?: EvaluationItem[];
  grades?: Grade[];
}

export function calculateSubjectRisk({
  subject,
  exams,
  assignments,
  attendanceRecords,
  currentDate = new Date(),
  availableStudyMinutesThisWeek = 300, // 5 horas por defecto si no se especifica
  evaluations,
  grades = [],
}: SubjectRiskInputs): RiskEvaluation {
  const reasons: string[] = [];

  // 1. DEADLINE PRESSURE (Presión de Exámenes Próximos)
  const nowMs = currentDate.getTime();
  const upcomingExams = exams
    .filter((e) => e.subjectId === subject.id)
    .map((e) => {
      const examTime = new Date(e.date).getTime();
      const diffDays = Math.ceil((examTime - nowMs) / (1000 * 60 * 60 * 24));
      return { exam: e, diffDays };
    })
    .filter((e) => e.diffDays >= 0)
    .sort((a, b) => a.diffDays - b.diffDays);

  const nearestExam = upcomingExams[0];
  let deadlinePressure = 0;

  if (nearestExam) {
    if (nearestExam.diffDays <= 3) {
      deadlinePressure = 45;
      reasons.push(`Examen "${nearestExam.exam.title}" en ${nearestExam.diffDays === 0 ? 'hoy' : `${nearestExam.diffDays} días`}.`);
    } else if (nearestExam.diffDays <= 7) {
      deadlinePressure = 25;
      reasons.push(`Examen "${nearestExam.exam.title}" en ${nearestExam.diffDays} días.`);
    } else if (nearestExam.diffDays <= 14) {
      deadlinePressure = 10;
      reasons.push(`Examen próximo en ${nearestExam.diffDays} días.`);
    }
  }

  // 2. WORKLOAD PRESSURE (Tareas pendientes vs Tiempo de estudio)
  const pendingTasks = assignments.filter(
    (a) => a.subjectId === subject.id && a.status !== 'completed'
  );
  const tasksEstimatedMinutes = pendingTasks.reduce(
    (acc, t) => acc + (t.estimatedMinutes || 45),
    0
  );

  let examStudyBufferMinutes = 0;
  if (nearestExam && nearestExam.diffDays <= 7 && tasksEstimatedMinutes === 0) {
    examStudyBufferMinutes = 240;
    reasons.push(`Estudio sugerido de ${Math.round(examStudyBufferMinutes / 60)}h para preparar ${nearestExam.exam.title}.`);
  }

  const totalEstimatedMinutes = tasksEstimatedMinutes + examStudyBufferMinutes;

  let workloadPressure = 0;
  if (pendingTasks.length >= 3) {
    workloadPressure += 25;
    reasons.push(`${pendingTasks.length} tareas pendientes acumuladas.`);
  } else if (pendingTasks.length > 0) {
    workloadPressure += pendingTasks.length * 8;
  } else if (examStudyBufferMinutes > 0) {
    workloadPressure += 15;
  }

  if (totalEstimatedMinutes > availableStudyMinutesThisWeek && pendingTasks.length > 0) {
    workloadPressure += 15;
    reasons.push(`El trabajo estimado (${Math.round(totalEstimatedMinutes / 60)}h) supera el tiempo libre proyectado.`);
  }

  // 3. ATTENDANCE PRESSURE (Inasistencias acumuladas y margen de pérdida)
  const subjectAttendance = attendanceRecords.filter((a) => a.subjectId === subject.id);
  const totalClassesTracked = subjectAttendance.length;
  const absences = subjectAttendance.filter((a) => a.status === 'absent').length;
  const maxAllowed = subject.maxAbsences || 4;
  const remainingAbsences = Math.max(0, maxAllowed - absences);
  const attendanceRate = totalClassesTracked > 0 
    ? Math.round(((totalClassesTracked - absences) / totalClassesTracked) * 100) 
    : 100;

  let attendancePressure = 0;
  if (remainingAbsences === 0 && maxAllowed > 0) {
    attendancePressure = 35;
    reasons.push(`Límite de inasistencias alcanzado (${absences}/${maxAllowed} faltas). Próxima ausencia implica pérdida.`);
  } else if (remainingAbsences <= 1 && maxAllowed > 0) {
    attendancePressure = 25;
    reasons.push(`Solo te queda 1 falta disponible antes de perder la materia.`);
  } else if (remainingAbsences <= 2 && maxAllowed > 0) {
    attendancePressure = 10;
    reasons.push(`Te quedan ${remainingAbsences} inasistencias permitidas.`);
  }

  // 4. GRADE PRESSURE (Evaluación de notas acumuladas y nota necesaria)
  const activePlan = evaluations || buildEvaluationPlanFromExams(subject, exams, grades);
  const gradeResult: GradeCalculationResult = calculateGradeStatus({
    subjectId: subject.id,
    evaluations: activePlan,
    passingGrade: subject.passingGrade || 3.0,
  });

  let gradePressure = 0;
  const evalFraction = gradeResult.evaluatedWeight / 100;

  if (gradeResult.status === 'APROBADA_ANTICIPADA') {
    gradePressure = 0;
    reasons.push(gradeResult.statusMessage);
  } else if (gradeResult.status === 'INVIABLE_MATEMATICAMENTE') {
    gradePressure = 50;
    reasons.push(gradeResult.statusMessage);
  } else if (gradeResult.status === 'COMPLETADA_REPROBADA') {
    gradePressure = 50;
    reasons.push(gradeResult.statusMessage);
  } else if (gradeResult.status === 'RIESGO_CRITICO') {
    // Escala según el porcentaje evaluado (mientras más avanzado el semestre, mayor urgencia)
    gradePressure = Math.round(30 + 20 * evalFraction);
    reasons.push(gradeResult.statusMessage);
  } else if (gradeResult.status === 'EXIGE_ESFUERZO') {
    gradePressure = Math.round(20 * evalFraction);
    reasons.push(gradeResult.statusMessage);
  } else if (gradeResult.status === 'TRAYECTORIA_SEGURA' && gradeResult.evaluatedWeight > 0) {
    gradePressure = 0;
    if (gradeResult.requiredGrade !== null && gradeResult.requiredGrade > 2.5) {
      reasons.push(`Trayectoria estable: necesitas ${gradeResult.requiredGrade.toFixed(2)} en lo restante.`);
    }
  }

  // Score compuesto (0 a 100)
  const riskScore = Math.min(100, deadlinePressure + workloadPressure + attendancePressure + gradePressure);

  // Clasificación estricta: CRÍTICO | ATENCIÓN | ESTABLE (Cero emojis)
  const isGradeCritical =
    gradeResult.status === 'RIESGO_CRITICO' ||
    gradeResult.status === 'INVIABLE_MATEMATICAMENTE' ||
    gradeResult.status === 'COMPLETADA_REPROBADA' ||
    (gradeResult.requiredGrade !== null && gradeResult.requiredGrade > 4.0);

  const isGradeAttention = gradeResult.status === 'EXIGE_ESFUERZO';

  let level: RiskLevel = 'ESTABLE';
  if (
    riskScore >= 50 ||
    remainingAbsences <= 1 ||
    (nearestExam && nearestExam.diffDays <= 3) ||
    isGradeCritical
  ) {
    level = 'CRÍTICO';
  } else if (
    riskScore >= 25 ||
    (nearestExam && nearestExam.diffDays <= 7) ||
    pendingTasks.length >= 2 ||
    isGradeAttention
  ) {
    level = 'ATENCIÓN';
  }

  if (reasons.length === 0) {
    reasons.push('Materia al día sin entregas críticas inminentes.');
  }

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    subjectColor: subject.color,
    level,
    riskScore,
    deadlinePressure,
    workloadPressure,
    attendancePressure,
    gradePressure,
    signals: {
      daysUntilExam: nearestExam ? nearestExam.diffDays : null,
      pendingTasksCount: pendingTasks.length,
      estimatedStudyMinutes: totalEstimatedMinutes,
      availableMinutesThisWeek: availableStudyMinutesThisWeek,
      attendanceRate,
      absencesCount: absences,
      remainingAllowedAbsences: remainingAbsences,
      currentGrade: gradeResult.currentWeightedGrade ?? subject.currentGrade,
      gradeStatus: gradeResult.status,
      requiredGrade: gradeResult.requiredGrade,
      currentAccumulatedScore: gradeResult.currentAccumulatedScore,
      evaluatedWeight: gradeResult.evaluatedWeight,
    },
    reasons,
  };
}
