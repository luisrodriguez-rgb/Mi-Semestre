import { InboxItem } from './schemas';
import { detectDateAmbiguities } from './ambiguityEngine';
import { computeItemConfidence } from './confidenceEngine';

export interface SubjectContext {
  id: string;
  name: string;
  code: string;
}

/**
 * Encuentra la materia más similar por nombre o código
 */
export function matchSubject(
  text: string,
  subjects: SubjectContext[]
): { matchedSubject?: SubjectContext; subjectName: string | null } {
  const normText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const sub of subjects) {
    const normSubName = sub.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normSubCode = sub.code.toLowerCase();

    // Coincidencia exacta o contenida
    if (normText.includes(normSubName) || (normSubCode && normText.includes(normSubCode))) {
      return { matchedSubject: sub, subjectName: sub.name };
    }

    // Coincidencia parcial por palabras clave (ej. "estadistica" para "Estadística Aplicada II")
    const words = normSubName.split(/\s+/).filter((w) => w.length > 4);
    for (const word of words) {
      if (normText.includes(word)) {
        return { matchedSubject: sub, subjectName: sub.name };
      }
    }
  }

  // Si no coincide con ninguna matriculada, intentar inferir el nombre del texto
  const genericMatch = text.match(/(?:clase|materia|profesor de|profe de|parcial de|taller de)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s]{3,25})/i);
  if (genericMatch) {
    return { subjectName: genericMatch[1].trim() };
  }

  return { subjectName: null };
}

/**
 * Extrae la hora de una oración (formato 24h o 12h: "2:00 pm", "a las 2", "14:00")
 */
export function extractTimeHHmm(text: string): string | null {
  const norm = text.toLowerCase();

  // "14:30" o "07:00"
  const colon24Match = norm.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (colon24Match) {
    const h = colon24Match[1].padStart(2, '0');
    return `${h}:${colon24Match[2]}`;
  }

  // "2:00 pm" o "8:30 am"
  const ampmMatch = norm.match(/\b([1-9]|1[0-2])(?::([0-5]\d))?\s*(am|pm)\b/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2] || '00';
    const isPm = ampmMatch[3] === 'pm';
    if (isPm && h < 12) h += 12;
    if (!isPm && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m}`;
  }

  // "a las 2" / "a las 14"
  const aLasMatch = norm.match(/a\s+las\s+([1-9]|1\d|2[0-3])\b/);
  if (aLasMatch) {
    let h = parseInt(aLasMatch[1], 10);
    // Si dice "a las 2", "a las 3" típicamente es en la tarde si es universitario
    if (h >= 1 && h <= 6) h += 12;
    return `${h.toString().padStart(2, '0')}:00`;
  }

  return null;
}

/**
 * Extrae porcentaje o peso: "vale 20%", "peso: 25%", "25 %"
 */
export function extractWeight(text: string): number | null {
  const match = text.match(/(?:vale|peso|ponderacion|porcentaje|equivale a)?\s*(\d{1,2})\s*%/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Preprocesador Determinístico Local
 * Segmenta oraciones y extrae entidades con alta fidelidad
 */
export function preprocessInboxText(
  rawText: string,
  enrolledSubjects: SubjectContext[],
  baseDate: Date = new Date()
): InboxItem[] {
  if (!rawText || !rawText.trim()) return [];

  // Dividir texto por oraciones o conectores clave
  const sentences = rawText
    .split(/(?:\.\s+|\n+|;\s+|(?<=\w)\s+y\s+(?:el|la|para|para el|entregar|el ejercicio)\b)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  const items: InboxItem[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const norm = sentence.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Determinar tipo
    let type: InboxItem['type'] | null = null;
    let title = '';

    if (norm.includes('parcial') || norm.includes('examen') || norm.includes('quiz') || norm.includes('evaluacion')) {
      type = 'exam';
      if (norm.includes('parcial 1') || norm.includes('primer parcial')) title = 'Parcial 1';
      else if (norm.includes('parcial 2') || norm.includes('segundo parcial')) title = 'Parcial 2';
      else if (norm.includes('parcial 3') || norm.includes('tercer parcial')) title = 'Parcial 3';
      else if (norm.includes('quiz')) title = 'Quiz';
      else title = 'Parcial';
    } else if (norm.includes('taller') || norm.includes('entrega') || norm.includes('tarea') || norm.includes('ejercicio') || norm.includes('proyecto')) {
      type = 'assignment';
      const taskMatch = sentence.match(/(?:el\s+)?(taller\s*\d*|ejercicio\s*\d*|proyecto\s*\w*|entrega\s*\d*)/i);
      title = taskMatch ? taskMatch[1].trim() : 'Entrega académica';
    } else if (norm.includes('clase') || norm.includes('lab') || norm.includes('laboratorio')) {
      type = 'class';
      title = 'Sesión de clase';
    } else if (norm.includes('almuerzo') || norm.includes('gym') || norm.includes('gimnasio')) {
      type = 'routine';
      title = norm.includes('gym') ? 'Gimnasio' : 'Almuerzo';
    }

    if (!type) continue; // Si no luce como ningún elemento académico o rutina, ignorar

    // Extraer materia
    const { matchedSubject, subjectName } = matchSubject(sentence, enrolledSubjects);

    // Extraer fecha y ambigüedades
    const { resolvedDate, ambiguities } = detectDateAmbiguities(sentence, baseDate);

    // Extraer hora
    const startTime = extractTimeHHmm(sentence);

    // Extraer ponderación
    const weight = extractWeight(sentence);

    // Calcular confianza determinística
    const { confidence, confidenceScore } = computeItemConfidence(
      {
        id: `inbox_${Date.now()}_${i}`,
        type,
        title: matchedSubject ? `${title} - ${matchedSubject.name}` : title,
        subjectName: subjectName || (matchedSubject ? matchedSubject.name : null),
        matchedSubjectId: matchedSubject?.id || null,
        date: resolvedDate || null,
        startTime: startTime || null,
        endTime: null,
        weight: weight || null,
        sourceText: sentence,
        ambiguities,
      },
      Boolean(matchedSubject)
    );

    items.push({
      id: `inbox_${Date.now()}_${i}`,
      type,
      title: matchedSubject ? `${title} - ${matchedSubject.name}` : title,
      subjectName: subjectName || (matchedSubject ? matchedSubject.name : null),
      matchedSubjectId: matchedSubject?.id || null,
      date: resolvedDate || null,
      startTime: startTime || null,
      endTime: null,
      weight: weight || null,
      sourceText: sentence,
      ambiguities,
      confidence,
      confidenceScore,
    });
  }

  return items;
}
