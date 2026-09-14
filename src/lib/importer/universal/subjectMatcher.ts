export interface SubjectMatchCandidate {
  id?: string;
  name: string;
  code?: string;
  nrc?: string;
}

export type SubjectMatchDecision =
  | 'exact_code'
  | 'exact_nrc'
  | 'exact_name'
  | 'fuzzy_match'
  | 'ambiguous'
  | 'no_match';

export interface SubjectMatchResult {
  decision: SubjectMatchDecision;
  confidenceScore: number; // 0 a 1.0
  reason: string;
}

/**
 * Normaliza un texto para comparación fonética/textual (minúsculas, sin tildes, sin puntuación)
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Coeficiente de similitud de Dice basado en bigramas (0 a 1)
 */
export function calculateDiceSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };

  const bg1 = getBigrams(s1);
  const bg2 = getBigrams(s2);

  let intersection = 0;
  for (const b of bg1) {
    if (bg2.has(b)) intersection++;
  }

  return (2 * intersection) / (bg1.size + bg2.size);
}

/**
 * Evalúa la coincidencia entre dos representaciones de materias
 * siguiendo la jerarquía estricta:
 * 1. Código exacto
 * 2. NRC exacto
 * 3. Nombre normalizado exacto
 * 4. Similitud difusa >= 0.85 (Fuzzy Match)
 * 5. Ambigüedad (0.65 a 0.84) -> Requiere confirmación, no vincula silenciosamente
 * 6. Sin coincidencia (< 0.65)
 */
/**
 * Extrae el nivel académico / número de secuencia si existe (ej. "II", "2", "I", "1")
 */
export function extractCourseLevel(str: string): string | null {
  const norm = normalizeString(str);
  const match = norm.match(/\b(i{1,3}|iv|v|vi{0,3}|ix|x|\d+)\b$/i);
  if (!match) return null;
  const val = match[1].toLowerCase();
  const romanMap: Record<string, string> = {
    i: '1',
    ii: '2',
    iii: '3',
    iv: '4',
    v: '5',
    vi: '6',
    vii: '7',
    viii: '8',
    ix: '9',
    x: '10',
  };
  return romanMap[val] || val;
}

/**
 * Evalúa la coincidencia entre dos representaciones de materias
 * siguiendo la jerarquía estricta:
 * 1. Código exacto
 * 2. NRC exacto
 * 3. Nombre normalizado exacto (incluyendo equivalencia de niveles como "2" y "II")
 * 4. Similitud difusa >= 0.85 (Fuzzy Match, requiere mismos niveles si aplican)
 * 5. Ambigüedad (0.65 a 0.84 o conflicto de niveles) -> Requiere confirmación, no vincula silenciosamente
 * 6. Sin coincidencia (< 0.65)
 */
export function matchSubjects(
  candidateA: SubjectMatchCandidate,
  candidateB: SubjectMatchCandidate
): SubjectMatchResult {
  // 1. Código exacto
  if (candidateA.code && candidateB.code) {
    const codeA = normalizeString(candidateA.code).replace(/\s+/g, '');
    const codeB = normalizeString(candidateB.code).replace(/\s+/g, '');
    if (codeA === codeB || codeA.includes(codeB) || codeB.includes(codeA)) {
      return {
        decision: 'exact_code',
        confidenceScore: 1.0,
        reason: `Coincidencia exacta de código: ${candidateA.code}`,
      };
    }
  }

  // 2. NRC exacto
  if (candidateA.nrc && candidateB.nrc) {
    const nrcA = candidateA.nrc.trim();
    const nrcB = candidateB.nrc.trim();
    if (nrcA === nrcB) {
      return {
        decision: 'exact_nrc',
        confidenceScore: 0.98,
        reason: `Coincidencia exacta de NRC: ${candidateA.nrc}`,
      };
    }
  }

  // 3. Nombre normalizado exacto
  const normA = normalizeString(candidateA.name);
  const normB = normalizeString(candidateB.name);
  if (normA === normB) {
    return {
      decision: 'exact_name',
      confidenceScore: 0.95,
      reason: `Nombres normalizados idénticos: "${candidateA.name}"`,
    };
  }

  const levelA = extractCourseLevel(candidateA.name);
  const levelB = extractCourseLevel(candidateB.name);

  // Si los niveles son equivalentes ("Estadística 2" vs "Estadística II")
  if (levelA && levelB && levelA === levelB) {
    const baseA = normA.replace(/\b(i{1,3}|iv|v|vi{0,3}|ix|x|\d+)\b$/i, '').trim();
    const baseB = normB.replace(/\b(i{1,3}|iv|v|vi{0,3}|ix|x|\d+)\b$/i, '').trim();
    if (baseA === baseB) {
      return {
        decision: 'exact_name',
        confidenceScore: 0.94,
        reason: `Nombres equivalentes con diferente notación de nivel (${levelA}): "${candidateA.name}" y "${candidateB.name}"`,
      };
    }
  }

  // Si los niveles son abiertamente conflictivos (ej. Nivel 1 vs Nivel 2), NUNCA debe vincularse silenciosamente
  const hasConflictingLevels = levelA && levelB && levelA !== levelB;

  // 4. Similitud difusa
  const similarity = calculateDiceSimilarity(candidateA.name, candidateB.name);

  if (hasConflictingLevels) {
    return {
      decision: 'ambiguous',
      confidenceScore: similarity,
      reason: `Nivel de materia conflictivo (${levelA} vs ${levelB}) a pesar de alta similitud (${Math.round(similarity * 100)}%). No se vincula silenciosamente.`,
    };
  }

  if (similarity >= 0.85) {
    return {
      decision: 'fuzzy_match',
      confidenceScore: similarity,
      reason: `Alta similitud fonética/textual (${Math.round(similarity * 100)}%) entre "${candidateA.name}" y "${candidateB.name}"`,
    };
  }

  if (similarity >= 0.65) {
    return {
      decision: 'ambiguous',
      confidenceScore: similarity,
      reason: `Posible relación ambigua (${Math.round(similarity * 100)}%) entre "${candidateA.name}" y "${candidateB.name}". No se vincula silenciosamente.`,
    };
  }

  return {
    decision: 'no_match',
    confidenceScore: similarity,
    reason: `Nombres distintos (${Math.round(similarity * 100)}% de similitud)`,
  };
}
