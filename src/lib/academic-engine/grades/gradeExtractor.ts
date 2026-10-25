/**
 * gradeExtractor.ts
 *
 * Motor de extracción de componentes de evaluación, porcentajes y notas
 * desde texto copiado de sílabos, Moodle o Banner de la Universidad Icesi.
 * Funciona de manera determinística como primer paso y admite resolución
 * híbrida con IA (Gemini vía /api/ai/extract) cuando el texto es ambiguo
 * o contiene líneas sin porcentaje explícito.
 */

export interface ExtractedEvaluationItem {
  id: string;
  name: string;
  weight: number;
  grade: number | null;
}

const SECTION_HEADER_REGEX =
  /^(?:plan|sistema|criterios?|tabla|esquema|reglas?|m[eé]todo|propuesta)\s+de\s+(?:evaluaci[oó]n|calificaci[oó]n|notas?|puntuaci[oó]n)|^(?:actividad|evaluaci[oó]n|componente|descripci[oó]n|nombre|peso|porcentaje|ponderaci[oó]n|calificaci[oó]n|nota|corte\s*\d+|semanas?)\s*$/i;

/**
 * Normaliza y extrae componentes a partir de texto plano o tabulado de forma determinística.
 */
export function extractEvaluationItemsFromText(text: string): ExtractedEvaluationItem[] {
  if (!text || typeof text !== 'string') return [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ExtractedEvaluationItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // 1. Descartar encabezados de tablas o títulos de sección (ej. "Plan de evaluación")
    if (SECTION_HEADER_REGEX.test(rawLine)) {
      continue;
    }

    // 2. Extraer porcentaje (%)
    let weight: number | null = null;
    const percentMatch = rawLine.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (percentMatch) {
      weight = parseFloat(percentMatch[1].replace(',', '.'));
    }

    // Si no hay porcentaje con %, buscar números de 2 dígitos precedidos por peso/ponderación
    if (weight === null) {
      const explicitWeightMatch = rawLine.match(/(?:peso|ponderaci[oó]n|valor|equivale)[:\s]*\b([1-9][0-9]?)\b/i);
      if (explicitWeightMatch) {
        weight = parseFloat(explicitWeightMatch[1]);
      }
    }

    // 3. Extraer nota (escala 0.0 a 5.0)
    let grade: number | null = null;
    // Buscar patrón explícito con palabra clave (ej. "nota 4", "nota 4.5", "calif: 3.8", "obtuvo 5")
    const explicitGradeMatch = rawLine.match(
      /(?:nota|calif(?:icaci[oó]n)?|sac[oó]|obtuvo|score)\s*[:\s]*\b([0-5](?:[.,]\d{1,2})?)\b/i
    );
    if (explicitGradeMatch) {
      const parsed = parseFloat(explicitGradeMatch[1].replace(',', '.'));
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 5.0) {
        grade = parsed;
      }
    } else {
      // Buscar decimal suelto en rango 0.0 - 5.0 que no sea el porcentaje
      const decimalMatches = Array.from(rawLine.matchAll(/\b([0-5][.,]\d{1,2})\b(?!\s*%)/g));
      for (const m of decimalMatches) {
        const parsed = parseFloat(m[1].replace(',', '.'));
        if (weight === null || Math.abs(parsed - weight) > 0.01) {
          grade = parsed;
          break;
        }
      }
    }

    // Si no tiene porcentaje y tampoco tiene nota, descartar (es texto explicativo o título)
    if (weight === null && grade === null) {
      continue;
    }

    // 4. Limpieza del nombre del componente
    let cleanName = rawLine;

    // Remover prefijos de semana/sesión (ej. "Semana 8: Parcial 2 (20%)" -> "Parcial 2 (20%)")
    cleanName = cleanName.replace(/^(?:semana|sem|corte|clase|sesi[oó]n)\s*\d+\s*[:\-–—]\s*/i, ' ');

    // Remover el bloque de porcentaje (ej. "20%", "10,00 %")
    cleanName = cleanName.replace(/(\d+(?:[.,]\d+)?)\s*%/g, ' ');

    // Remover bloque de nota explícita (ej. "nota 4", "calif: 3.8")
    cleanName = cleanName.replace(
      /(?:nota|calif(?:icaci[oó]n)?|sac[oó]|obtuvo|score)\s*[:\s]*[0-5](?:[.,]\d{1,2})?/gi,
      ' '
    );

    // Remover el token exacto detectado como nota (ej. "4,20" o "3.1")
    if (grade !== null) {
      // Remover patrones numéricos con punto o coma para la nota encontrada
      const gradeStr = grade.toString();
      const [intPart, decPart = '0'] = gradeStr.split('.');
      const pattern =
        decPart === '0'
          ? `\\b${intPart}(?:[.,]0+)?\\b`
          : `\\b${intPart}[.,]${decPart}0*\\b`;
      cleanName = cleanName.replace(new RegExp(pattern, 'g'), ' ');
    }

    // Remover palabras residuales de atributos
    cleanName = cleanName.replace(/(?:peso|ponderaci[oó]n|valor|calificaci[oó]n)[:\s]*/gi, ' ');

    // Remover paréntesis o corchetes vacíos resultantes de quitar el porcentaje: "()" o "[]"
    cleanName = cleanName.replace(/\(\s*\)|\[\s*\]/g, ' ');

    // Remover delimitadores de tabla y limpiar espacios
    cleanName = cleanName
      .replace(/[|\t;]+/g, ' ')
      .replace(/^[-–—:.,\s]+|[-–—:.,\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanName || cleanName.length < 2) {
      cleanName = `Componente ${results.length + 1}`;
    }

    // Capitalizar primera letra
    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    results.push({
      id: `ev-ext-${Date.now()}-${results.length + 1}`,
      name: cleanName,
      weight: weight !== null && !isNaN(weight) ? weight : 0,
      grade: grade !== null && !isNaN(grade) ? grade : null,
    });
  }

  return results;
}

/**
 * Determina si la extracción determinística tiene dudas o líneas sin porcentaje.
 */
export function hasAmbiguousExtraction(items: ExtractedEvaluationItem[], rawText: string): boolean {
  if (items.length === 0) return true;
  // Si algún ítem no tiene peso definido o tiene nombre genérico
  const hasZeroWeight = items.some((it) => it.weight <= 0);
  const hasGenericName = items.some((it) => it.name.startsWith('Componente '));
  const totalWeight = items.reduce((acc, it) => acc + it.weight, 0);

  // Si los pesos suman 0 o hay ítems dudosos
  if (hasZeroWeight || hasGenericName || totalWeight <= 0) return true;

  // Si el texto tiene palabras de evaluación pero extrajo muy poco
  const evalWordMatches = rawText.match(/\b(parcial|taller|quiz|proyecto|entrega|laboratorio)\b/gi) || [];
  if (evalWordMatches.length >= 2 && items.length === 1) return true;

  return false;
}

/**
 * Extracción híbrida: intenta primero el motor determinístico offline;
 * si hay dudas o líneas sin %, consulta el endpoint de IA (/api/ai/extract-grades).
 */
export async function extractEvaluationPlanHybrid(
  rawText: string,
  subjectContext?: { id: string; name: string; code?: string }
): Promise<{ items: ExtractedEvaluationItem[]; source: 'deterministic' | 'ai' }> {
  const deterministicItems = extractEvaluationItemsFromText(rawText);

  if (!hasAmbiguousExtraction(deterministicItems, rawText)) {
    return { items: deterministicItems, source: 'deterministic' };
  }

  try {
    const res = await fetch('/api/ai/extract-grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rawText,
        subjectName: subjectContext?.name,
      }),
    });

    if (!res.ok) {
      return { items: deterministicItems, source: 'deterministic' };
    }

    const json = await res.json();
    if (json.success && Array.isArray(json.items) && json.items.length > 0) {
      const items: ExtractedEvaluationItem[] = json.items.map((it: any, idx: number) => {
        let grade = typeof it.grade === 'number' && !isNaN(it.grade) ? it.grade : null;
        // Si la IA devolvió grade null, preservar la nota encontrada por el determinístico
        if (grade === null) {
          const match =
            deterministicItems.find(
              (det) =>
                det.name.toLowerCase() === (it.name || '').toLowerCase() ||
                (it.name || '').toLowerCase().includes(det.name.toLowerCase()) ||
                det.name.toLowerCase().includes((it.name || '').toLowerCase())
            ) || (deterministicItems.length === json.items.length ? deterministicItems[idx] : null);

          if (match && match.grade !== null) {
            grade = match.grade;
          }
        }

        return {
          id: it.id || `ev-ai-${Date.now()}-${idx + 1}`,
          name: it.name || `Componente ${idx + 1}`,
          weight: typeof it.weight === 'number' && it.weight >= 0 ? it.weight : 0,
          grade,
        };
      });

      return { items, source: json.source || 'ai' };
    }
  } catch (err) {
    console.warn('Fallback a extractor determinístico por error de red:', err);
  }

  return { items: deterministicItems, source: 'deterministic' };
}
