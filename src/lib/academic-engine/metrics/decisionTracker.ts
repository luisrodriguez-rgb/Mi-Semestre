/**
 * Telemetría de Decisión y Calidad del Producto (Offline-First & Privado)
 * Mide la tasa de adopción de recomendaciones, completitud de sesiones y motivos de descarte.
 */

export type OverrideReason =
  | 'NEED_TO_SUBMIT_OTHER_FIRST'   // Necesito entregar esto primero
  | 'RECOMMENDATION_MAKES_NO_SENSE' // La recomendación no tiene sentido
  | 'PREFER_ANOTHER_SUBJECT'        // Prefiero otra materia
  | 'ALREADY_STUDIED'               // Ya estudié esto
  | 'MISSING_INFORMATION';          // Me falta información

export interface DecisionEvent {
  id: string;
  timestamp: string;
  type: 'shown' | 'accepted' | 'overridden' | 'completed';
  recommendationId?: string;
  recommendedTaskId?: string;
  recommendedSubjectId?: string;
  chosenTaskId?: string;
  overrideReason?: OverrideReason;
  durationMinutes?: number;
}

export interface DecisionMetricsSummary {
  totalShown: number;
  totalAccepted: number;
  totalOverridden: number;
  totalCompleted: number;
  decisionAcceptanceRate: number; // % (totalAccepted / totalShown)
  decisionCompletionRate: number; // % (totalCompleted / totalAccepted)
  recommendationOverrideRate: number; // % (totalOverridden / totalShown)
  overrideReasonCounts: Record<OverrideReason, number>;
}

const STORAGE_KEY = 'mi_semestre_decision_events_v1';

// Almacén en memoria para entornos Node / SSR o como capa intermedia
let memoryEvents: DecisionEvent[] = [];

function loadEvents(): DecisionEvent[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignorar error de parsing en localStorage
    }
  }
  return memoryEvents;
}

function persistEvents(events: DecisionEvent[]): void {
  memoryEvents = events;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // Ignorar fallos de cuota local
    }
  }
}

export const decisionTracker = {
  recordRecommendationShown(recommendationId: string, taskId?: string, subjectId?: string): void {
    const events = loadEvents();
    events.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type: 'shown',
      recommendationId,
      recommendedTaskId: taskId,
      recommendedSubjectId: subjectId,
    });
    persistEvents(events);
  },

  recordRecommendationAccepted(recommendationId: string, taskId?: string): void {
    const events = loadEvents();
    events.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type: 'accepted',
      recommendationId,
      recommendedTaskId: taskId,
    });
    persistEvents(events);
  },

  recordRecommendationOverridden(
    recommendationId: string,
    chosenTaskId: string,
    reason: OverrideReason
  ): void {
    const events = loadEvents();
    events.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type: 'overridden',
      recommendationId,
      chosenTaskId,
      overrideReason: reason,
    });
    persistEvents(events);
  },

  recordFocusCompleted(taskId: string, durationMinutes: number): void {
    const events = loadEvents();
    events.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type: 'completed',
      recommendedTaskId: taskId,
      durationMinutes,
    });
    persistEvents(events);
  },

  getDecisionMetricsSummary(): DecisionMetricsSummary {
    const events = loadEvents();
    let totalShown = 0;
    let totalAccepted = 0;
    let totalOverridden = 0;
    let totalCompleted = 0;

    const overrideReasonCounts: Record<OverrideReason, number> = {
      NEED_TO_SUBMIT_OTHER_FIRST: 0,
      RECOMMENDATION_MAKES_NO_SENSE: 0,
      PREFER_ANOTHER_SUBJECT: 0,
      ALREADY_STUDIED: 0,
      MISSING_INFORMATION: 0,
    };

    for (const ev of events) {
      if (ev.type === 'shown') totalShown++;
      if (ev.type === 'accepted') totalAccepted++;
      if (ev.type === 'overridden') {
        totalOverridden++;
        if (ev.overrideReason) {
          overrideReasonCounts[ev.overrideReason] =
            (overrideReasonCounts[ev.overrideReason] || 0) + 1;
        }
      }
      if (ev.type === 'completed') totalCompleted++;
    }

    const decisionAcceptanceRate = totalShown > 0 ? Math.round((totalAccepted / totalShown) * 100) : 0;
    const decisionCompletionRate = totalAccepted > 0 ? Math.round((totalCompleted / totalAccepted) * 100) : 0;
    const recommendationOverrideRate = totalShown > 0 ? Math.round((totalOverridden / totalShown) * 100) : 0;

    return {
      totalShown,
      totalAccepted,
      totalOverridden,
      totalCompleted,
      decisionAcceptanceRate,
      decisionCompletionRate,
      recommendationOverrideRate,
      overrideReasonCounts,
    };
  },

  clearDecisionHistory(): void {
    persistEvents([]);
  },
};
