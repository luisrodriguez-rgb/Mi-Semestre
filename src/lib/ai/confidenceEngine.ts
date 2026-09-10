import { InboxItem } from './schemas';

/**
 * Motor de Confianza Determinístico
 * La IA NO inventa la confianza; el sistema la calcula mediante reglas semánticas auditables
 */
export function computeItemConfidence(
  item: Omit<InboxItem, 'confidence' | 'confidenceScore'>,
  isSubjectKnown: boolean
): { confidence: 'high' | 'medium' | 'low'; confidenceScore: number } {
  let score = 50; // Base neutral

  // 1. Fecha
  if (item.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
    score += 25;
  } else if (!item.date) {
    score -= 20;
  }

  // 2. Materia
  if (isSubjectKnown && item.matchedSubjectId) {
    score += 25;
  } else if (item.subjectName) {
    score += 10;
  } else {
    score -= 20;
  }

  // 3. Ponderación
  if (item.type === 'exam') {
    if (item.weight !== null && item.weight > 0) {
      score += 15;
    } else {
      score -= 10;
    }
  }

  // 4. Hora
  if (item.startTime && /^\d{2}:\d{2}$/.test(item.startTime)) {
    score += 10;
  }

  // 5. Ambigüedades detectadas
  if (item.ambiguities && item.ambiguities.length > 0) {
    score -= item.ambiguities.length * 20;
  }

  // Clamp entre 0 y 100
  const normalizedScore = Math.max(0, Math.min(100, score));

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (normalizedScore >= 85) {
    confidence = 'high';
  } else if (normalizedScore >= 60) {
    confidence = 'medium';
  }

  return {
    confidence,
    confidenceScore: normalizedScore,
  };
}
