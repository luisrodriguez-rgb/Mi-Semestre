/**
 * gradeExtractor.ts
 *
 * Motor de extracción de componentes de evaluación, porcentajes y notas
 * desde texto copiado de sílabos, Moodle o Banner de la Universidad Icesi.
 * Funciona de manera 100% determinística y offline, sirviendo también
 * como fallback seguro si la IA no está disponible.
 */

export interface ExtractedEvaluationItem {
  id: string;
  name: string;
  weight: number;
  grade: number | null;
}

/**
 * Normaliza y extrae componentes a partir de texto plano o tabulado.
 */
export function extractEvaluationItemsFromText(text: string): ExtractedEvaluationItem[] {
  if (!text || typeof text !== 'string') return [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ExtractedEvaluationItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Descartar encabezados comunes de tablas
    if (/^(actividad|evaluaci[oó]n|componente|descripci[oó]n|nombre|peso|porcentaje|ponderaci[oó]n|calificaci[oó]n|nota)\b/i.test(line)) {
      continue;
    }

    // 1. Extraer porcentaje (%)
    // Busca patrones como "25%", "25 %", "peso: 20%", o números con %
    let weight: number | null = null;
    const percentMatch = line.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (percentMatch) {
      weight = parseFloat(percentMatch[1].replace(',', '.'));
    }

    // 2. Extraer nota (escala 0.0 a 5.0)
    // Busca números flotantes típicamente precedidos por 'nota', 'calificación', ':' o en columnas finales
    let grade: number | null = null;
    // Si la línea contiene dos números o patrones explícitos de nota
    const gradeMatch = line.match(/(?:nota|calif|sac[oó]|obtuvo|score)?[:\s]*\b([0-5](?:[.,]\d{1,2}))\b(?!\s*%)/i);
    if (gradeMatch) {
      const parsedGrade = parseFloat(gradeMatch[1].replace(',', '.'));
      if (parsedGrade >= 0 && parsedGrade <= 5.0) {
        // Asegurarse de no confundir el porcentaje si era pequeño
        if (weight === null || Math.abs(parsedGrade - weight) > 0.01) {
          grade = parsedGrade;
        }
      }
    }

    // Si no encontramos porcentaje explícito con %, buscar números de 2 dígitos (10, 15, 20, 25, 30...)
    if (weight === null) {
      const weightFallback = line.match(/\b([1-9][0-9])\b/);
      if (weightFallback) {
        const potentialWeight = parseInt(weightFallback[1], 10);
        if (potentialWeight >= 5 && potentialWeight <= 100) {
          weight = potentialWeight;
        }
      }
    }

    // 3. Extraer nombre del componente
    // Remover las partes numéricas de peso y nota de la línea para dejar el título limpio
    let cleanName = line
      .replace(/(\d+(?:[.,]\d+)?)\s*%/g, '')
      .replace(/(?:nota|calif|sac[oó]|obtuvo|peso|ponderaci[oó]n)[:\s]*/gi, ' ')
      .replace(/\b[0-5](?:[.,]\d{1,2})\b/g, '')
      .replace(/[|\t;]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[-–—:.,\s]+|[-–—:.,\s]+$/g, '')
      .trim();

    // Si el nombre quedó vacío o muy corto, asignar un nombre descriptivo
    if (!cleanName || cleanName.length < 2) {
      cleanName = `Componente ${results.length + 1}`;
    }

    // Capitalizar la primera letra
    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    // Solo agregar si encontramos al menos un nombre y (un porcentaje o una nota)
    if (weight !== null || grade !== null || cleanName.length > 3) {
      results.push({
        id: `ev-ext-${Date.now()}-${results.length + 1}`,
        name: cleanName,
        weight: weight !== null && !isNaN(weight) ? weight : 0,
        grade: grade !== null && !isNaN(grade) ? grade : null,
      });
    }
  }

  return results;
}
