import { Subject, Exam, Assignment, AttendanceRecord, RiskEvaluation, RiskLevel } from '@/types';

export interface SubjectRiskInputs {
  subject: Subject;
  exams: Exam[];
  assignments: Assignment[];
  attendanceRecords: AttendanceRecord[];
  currentDate?: Date; // Por defecto hoy
  availableStudyMinutesThisWeek?: number;
}

export function calculateSubjectRisk({
  subject,
  exams,
  assignments,
  attendanceRecords,
  currentDate = new Date(),
  availableStudyMinutesThisWeek = 300, // 5 horas por defecto si no se especifica
}: SubjectRiskInputs): RiskEvaluation {
  const reasons: string[] = [];

  // 1. DEADLINE PRESSURE (Presión de Exámenes Próximos)
  // Filtrar exámenes futuros para esta materia
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
  const totalEstimatedMinutes = pendingTasks.reduce(
    (acc, t) => acc + (t.estimatedMinutes || 45),
    0
  );

  let workloadPressure = 0;
  if (pendingTasks.length >= 3) {
    workloadPressure += 25;
    reasons.push(`${pendingTasks.length} tareas pendientes acumuladas.`);
  } else if (pendingTasks.length > 0) {
    workloadPressure += pendingTasks.length * 8;
  }

  // Si el trabajo pendiente supera el tiempo de estudio disponible
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

  // Score compuesto (0 a 100)
  const riskScore = Math.min(100, deadlinePressure + workloadPressure + attendancePressure);

  // Clasificación estricta: CRÍTICO | ATENCIÓN | ESTABLE (Cero emojis)
  let level: RiskLevel = 'ESTABLE';
  if (riskScore >= 50 || remainingAbsences <= 1 || (nearestExam && nearestExam.diffDays <= 3)) {
    level = 'CRÍTICO';
  } else if (riskScore >= 25 || (nearestExam && nearestExam.diffDays <= 7) || pendingTasks.length >= 2) {
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
    signals: {
      daysUntilExam: nearestExam ? nearestExam.diffDays : null,
      pendingTasksCount: pendingTasks.length,
      estimatedStudyMinutes: totalEstimatedMinutes,
      availableMinutesThisWeek: availableStudyMinutesThisWeek,
      attendanceRate,
      absencesCount: absences,
      remainingAllowedAbsences: remainingAbsences,
      currentGrade: subject.currentGrade,
    },
    reasons,
  };
}
