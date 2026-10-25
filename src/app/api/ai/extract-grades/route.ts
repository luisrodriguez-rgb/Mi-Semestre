import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { extractEvaluationItemsFromText } from '@/lib/academic-engine/grades/gradeExtractor';
import { ExtractedGradesResponseSchema } from '@/lib/ai/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawText, subjectName } = body;

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return NextResponse.json(
        { error: 'El texto a procesar es requerido.' },
        { status: 400 }
      );
    }

    const trimmedText = rawText.trim();
    // Siempre extraemos determinísticamente como base de alta fidelidad
    const deterministicItems = extractEvaluationItemsFromText(trimmedText);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        items: deterministicItems,
        source: 'deterministic',
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Eres el extractor estructurado de planes de evaluación y calificaciones de 'Mi Semestre' (Universidad Icesi).
Tu objetivo es analizar el texto suministrado (que puede ser un sílabo, una tabla de Moodle copiada con tabuladores, una tabla de Banner, o un mensaje de WhatsApp) y extraer todos los componentes evaluativos, sus porcentajes de ponderación y las notas obtenidas.

${subjectName ? `MATERIA: ${subjectName}\n` : ''}
TEXTO A PROCESAR:
"""
${trimmedText}
"""

REGLAS DE EXTRACCIÓN:
1. 'name': Nombre conciso y limpio de la actividad evaluativa (ej. 'Parcial 1', 'Taller 2', 'Proyecto Final'). Remueve notas o porcentajes pegados al nombre, palabras como 'nota' o encabezados de tabla.
2. 'weight': Porcentaje de la evaluación entre 0 y 100 (ej. 20 para 20%, 15.5 para 15.5%). Si no se menciona o no está claro, usa 0.
3. 'grade': Calificación obtenida en la escala de 0.0 a 5.0 (ej. 4.2, 3.5, 5.0). Si aún no tiene calificación o está pendiente, usa null. NUNCA inventes notas.
4. Descartar encabezados de tablas (como 'Actividad', 'Ponderación', 'Calificación') y títulos generales como 'Plan de evaluación'.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              items: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: { type: 'STRING' },
                    weight: { type: 'NUMBER' },
                    grade: { type: 'NUMBER', nullable: true },
                  },
                  required: ['name', 'weight', 'grade'],
                },
              },
            },
            required: ['items'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini devolvió respuesta vacía');
      }

      const parsed = JSON.parse(responseText);
      const validated = ExtractedGradesResponseSchema.safeParse(parsed);

      if (validated.success && validated.data.items.length > 0) {
        // Regla: si la IA no extrajo notas (grade: null) pero el extractor determinístico
        // encontró notas en esa línea o componente, conservar las notas del determinístico.
        const mergedItems = validated.data.items.map((aiItem, idx) => {
          let grade = aiItem.grade;
          if (grade === null) {
            const match =
              deterministicItems.find(
                (det) =>
                  det.name.toLowerCase() === aiItem.name.toLowerCase() ||
                  aiItem.name.toLowerCase().includes(det.name.toLowerCase()) ||
                  det.name.toLowerCase().includes(aiItem.name.toLowerCase())
              ) || (deterministicItems.length === validated.data.items.length ? deterministicItems[idx] : null);

            if (match && match.grade !== null) {
              grade = match.grade;
            }
          }
          return {
            id: `ev-ai-${Date.now()}-${idx + 1}`,
            name: aiItem.name,
            weight: aiItem.weight,
            grade,
          };
        });

        return NextResponse.json({
          success: true,
          items: mergedItems,
          source: 'ai',
        });
      }
    } catch (aiErr) {
      console.warn('Error en Gemini para /api/ai/extract-grades, fallback a determinístico:', aiErr);
    }

    return NextResponse.json({
      success: true,
      items: deterministicItems,
      source: 'deterministic',
    });
  } catch (err) {
    console.error('Error en /api/ai/extract-grades:', err);
    return NextResponse.json(
      { error: 'Error interno al procesar las calificaciones.' },
      { status: 500 }
    );
  }
}
