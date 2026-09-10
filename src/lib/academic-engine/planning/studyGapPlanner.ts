import {
  Exam,
  Assignment,
  Subject,
  TimeSlot,
  StudyRecommendation,
  RecommendationReasonCode,
  RiskEvaluation,
} from '@/types';
import { timeToMinutes, minutesToTime } from '../utils/timeHelpers';

export interface StudyPlannerInput {
  subjectsMap: Record<string, Subject>;
  exams: Exam[];
  assignments: Assignment[];
  availableSlots: Array<TimeSlot & { date: string }>;
  riskEvaluations?: RiskEvaluation[];
  baseDate?: Date;
  maxSessionsPerDay?: number;
}

/**
 * Normaliza la urgencia temporal (0-100) según los días restantes
 */
export function calculateUrgencyScore(daysRemaining: number): number {
  if (daysRemaining <= 1) return 100;
  if (daysRemaining <= 2) return 85;
  if (daysRemaining <= 4) return 70;
  if (daysRemaining <= 7) return 50;
  if (daysRemaining <= 14) return 20;
  return 10;
}

/**
 * Normaliza el peso porcentual o prioridad (0-100)
 */
export function calculateWeightScore(weight?: number, priority?: 'high' | 'medium' | 'low'): number {
  if (weight !== undefined && weight > 0) {
    // 30% o más es crítico -> 100, con piso mínimo de 25
    return Math.min(100, Math.max(25, Math.round((weight / 30) * 100)));
  }
  if (priority === 'high') return 85;
  if (priority === 'medium') return 60;
  return 35;
}

/**
 * Normaliza el déficit de horas (0-100)
 */
export function calculateDeficitScore(neededMinutes: number, availableMinutes: number): number {
  if (availableMinutes <= 0) return 100;
  const ratio = neededMinutes / availableMinutes;
  if (ratio >= 1.5) return 100;
  if (ratio >= 1.0) return 80;
  if (ratio >= 0.7) return 60;
  return 30;
}

/**
 * Planificador Determinístico de Huecos de Estudio
 * Genera recomendaciones no saturantes respetando tiempos de descanso
 */
export function planStudyGaps(input: StudyPlannerInput): StudyRecommendation[] {
  const {
    subjectsMap,
    exams,
    assignments,
    availableSlots,
    riskEvaluations = [],
    baseDate = new Date(),
    maxSessionsPerDay = 2,
  } = input;

  const recommendations: StudyRecommendation[] = [];
  const riskMap = new Map<string, number>();
  for (const r of riskEvaluations) {
    riskMap.set(r.subjectId, r.riskScore);
  }

  // 1. Construir lista de metas académicas próximas (Exámenes y Tareas pendientes)
  interface AcademicTarget {
    type: 'exam' | 'assignment';
    id: string;
    subjectId: string;
    title: string;
    targetDate: Date;
    daysRemaining: number;
    weight?: number;
    priority?: 'high' | 'medium' | 'low';
    topics?: string[];
    neededMinutes: number;
  }

  const targets: AcademicTarget[] = [];
  const baseTime = baseDate.getTime();

  for (const exam of exams) {
    const examTime = new Date(exam.date).getTime();
    const diffDays = Math.max(0, (examTime - baseTime) / (1000 * 60 * 60 * 24));

    // Solo planificar para exámenes dentro de los próximos 21 días
    if (diffDays <= 21 && examTime > baseTime) {
      targets.push({
        type: 'exam',
        id: exam.id,
        subjectId: exam.subjectId,
        title: exam.title,
        targetDate: new Date(exam.date),
        daysRemaining: diffDays,
        weight: exam.weight,
        topics: exam.topics,
        // Regla: 1 hora de estudio por cada 5% de peso de examen (mínimo 60m, máximo 240m)
        neededMinutes: Math.min(240, Math.max(60, Math.round((exam.weight / 5) * 60))),
      });
    }
  }

  for (const task of assignments) {
    if (task.status === 'completed') continue;
    const taskTime = new Date(task.dueDate).getTime();
    const diffDays = Math.max(0, (taskTime - baseTime) / (1000 * 60 * 60 * 24));

    if (diffDays <= 14 && taskTime > baseTime) {
      targets.push({
        type: 'assignment',
        id: task.id,
        subjectId: task.subjectId,
        title: task.title,
        targetDate: new Date(task.dueDate),
        daysRemaining: diffDays,
        priority: task.priority,
        neededMinutes: task.estimatedMinutes || 60,
      });
    }
  }

  if (targets.length === 0 || availableSlots.length === 0) {
    return [];
  }

  // 2. Ordenar huecos cronológicamente y filtrar huecos no utilizables (< 45m o en hora de almuerzo)
  const validSlots = availableSlots
    .filter((slot) => {
      if (slot.durationMinutes < 45) return false;
      const startMin = timeToMinutes(slot.startTime);
      // Evitar programar exactamente en la hora central de almuerzo (12:30 a 13:30)
      if (startMin >= 750 && startMin <= 810) return false;
      return true;
    })
    .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

  // Contador de sesiones por día para evitar sobrecarga del estudiante
  const sessionsPerDayCount = new Map<string, number>();

  // 3. Asignar estudio en huecos disponibles evaluando el Priority Score
  for (const slot of validSlots) {
    const dayCount = sessionsPerDayCount.get(slot.date) || 0;
    if (dayCount >= maxSessionsPerDay) continue;

    const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
    const slotTimeMs = slotDateTime.getTime();

    // Evaluar candidatos que ocurren DESPUÉS de este hueco
    const eligibleTargets = targets.filter((t) => t.targetDate.getTime() > slotTimeMs && t.neededMinutes > 0);
    if (eligibleTargets.length === 0) continue;

    // Calcular Priority Score para cada candidato en este hueco
    let bestTarget: AcademicTarget | null = null;
    let highestScore = -1;

    for (const target of eligibleTargets) {
      const urgencyScore = calculateUrgencyScore(target.daysRemaining);
      const weightScore = calculateWeightScore(target.weight, target.priority);
      const deficitScore = calculateDeficitScore(target.neededMinutes, slot.durationMinutes);
      const riskScore = riskMap.get(target.subjectId) || 30;
      const availabilityScore = slot.durationMinutes >= 60 && slot.durationMinutes <= 90 ? 100 : 70;

      // Ponderación determinística orientada a urgencia e inminencia
      const priorityScore = Math.round(
        urgencyScore * 0.40 +
        weightScore * 0.20 +
        deficitScore * 0.15 +
        riskScore * 0.15 +
        availabilityScore * 0.10
      );

      if (priorityScore > highestScore) {
        highestScore = priorityScore;
        bestTarget = target;
      }
    }

    if (!bestTarget) continue;

    // Principio: No saturar el hueco. Dejar buffer de 15m y limitar sesión a máx 60-75 min
    const sessionDuration = Math.min(
      75,
      Math.max(45, Math.min(slot.durationMinutes - 15, bestTarget.neededMinutes))
    );

    const slotStartMin = timeToMinutes(slot.startTime) + 10; // 10 min de transición
    const sessionEndMin = slotStartMin + sessionDuration;

    const startTimeStr = minutesToTime(slotStartMin);
    const endTimeStr = minutesToTime(sessionEndMin);

    const startDate = new Date(`${slot.date}T${startTimeStr}:00`);
    const endDate = new Date(`${slot.date}T${endTimeStr}:00`);

    const subject = subjectsMap[bestTarget.subjectId];
    const subjectName = subject?.name || 'Materia';

    const reason = bestTarget.type === 'exam'
      ? `Parcial en ${Math.ceil(bestTarget.daysRemaining)} días (${bestTarget.weight}% de peso). Hueco ideal de ${sessionDuration}m.`
      : `Entrega pendiente de ${bestTarget.title} en ${Math.ceil(bestTarget.daysRemaining)} días.`;

    const reasonCodes: RecommendationReasonCode[] = [];
    if (bestTarget.type === 'exam' && bestTarget.daysRemaining <= 4) reasonCodes.push('EXAM_SOON');
    if (bestTarget.type === 'assignment' && bestTarget.daysRemaining <= 2) reasonCodes.push('APPROACHING_DEADLINE');
    if ((bestTarget.weight || 0) >= 20 || bestTarget.priority === 'high') reasonCodes.push('HIGH_WEIGHT');
    if (bestTarget.neededMinutes > slot.durationMinutes) reasonCodes.push('STUDY_DEFICIT');
    if ((riskMap.get(bestTarget.subjectId) || 0) >= 70) reasonCodes.push('HIGH_RISK');

    recommendations.push({
      id: `rec_${bestTarget.id}_${slot.date}_${slotStartMin}`,
      subjectId: bestTarget.subjectId,
      subjectName,
      subjectColor: subject?.color || '#3b3abf',
      examId: bestTarget.type === 'exam' ? bestTarget.id : undefined,
      assignmentId: bestTarget.type === 'assignment' ? bestTarget.id : undefined,
      title: `Preparar: ${bestTarget.title}`,
      start: startDate,
      end: endDate,
      startTimeStr,
      endTimeStr,
      durationMinutes: sessionDuration,
      priorityScore: highestScore,
      reason,
      reasonCodes,
      status: 'suggested',
      topics: bestTarget.topics,
    });

    bestTarget.neededMinutes -= sessionDuration;
    sessionsPerDayCount.set(slot.date, dayCount + 1);
  }

  return recommendations;
}
