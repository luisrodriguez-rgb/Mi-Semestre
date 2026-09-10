import { GoogleGenAI } from '@google/genai';
import { AIProvider } from './provider';
import { InboxItem, InboxExtractionSchema } from './schemas';
import { preprocessInboxText, SubjectContext } from './preprocessor';
import { computeItemConfidence } from './confidenceEngine';

export class GeminiProvider implements AIProvider {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
  }

  async extractInboxItems(params: {
    rawText: string;
    enrolledSubjects: SubjectContext[];
    baseDate?: Date;
  }): Promise<{ items: InboxItem[]; sourceEngine: 'gemini' | 'preprocessor' }> {
    const { rawText, enrolledSubjects, baseDate = new Date() } = params;

    // Si no hay API key configurada en el servidor, usamos el preprocesador determinístico
    if (!this.apiKey) {
      const items = preprocessInboxText(rawText, enrolledSubjects, baseDate);
      return { items, sourceEngine: 'preprocessor' };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });
      const enrolledListStr = enrolledSubjects.map((s) => `- ${s.name} (Código: ${s.code})`).join('\n');
      const todayStr = baseDate.toISOString().split('T')[0];

      const prompt = `Eres el extractor estructurado de 'Mi Semestre'. Tu objetivo es convertir texto caótico (mensajes de WhatsApp, apuntes de notas del celular, avisos de profesores) en entidades académicas estructuradas.

FECHA DE REFERENCIA DE HOY: ${todayStr}

MATERIAS MATRICULADAS POR EL ESTUDIANTE:
${enrolledListStr || 'No hay materias especificadas'}

TEXTO A PROCESAR:
"""
${rawText}
"""

INSTRUCCIONES:
1. Extrae todas las evaluaciones (exam), tareas/entregas (assignment), sesiones de clase (class) o rutinas (routine).
2. Para cada ítem, extrae 'sourceText' con la frase o fragmento exacto que sustentó la extracción para auditoría humana.
3. Asocia 'subjectName' a una de las materias matriculadas si coincide o es similar.
4. Si una fecha es relativa o ambigua (ej. "el otro martes", "este viernes"), incluye un objeto en 'ambiguities' con la explicación y opciones de fechas.
5. NO inventes datos. Si una hora o porcentaje no se menciona, usa null.`;

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
                    id: { type: 'STRING' },
                    type: { type: 'STRING', enum: ['exam', 'assignment', 'class', 'routine'] },
                    title: { type: 'STRING' },
                    subjectName: { type: 'STRING', nullable: true },
                    date: { type: 'STRING', nullable: true },
                    startTime: { type: 'STRING', nullable: true },
                    endTime: { type: 'STRING', nullable: true },
                    weight: { type: 'NUMBER', nullable: true },
                    description: { type: 'STRING', nullable: true },
                    sourceText: { type: 'STRING' },
                    ambiguities: {
                      type: 'ARRAY',
                      items: {
                        type: 'OBJECT',
                        properties: {
                          field: { type: 'STRING' },
                          reason: { type: 'STRING' },
                          options: { type: 'ARRAY', items: { type: 'STRING' } },
                        },
                        required: ['field', 'reason', 'options'],
                      },
                    },
                  },
                  required: ['id', 'type', 'title', 'sourceText', 'ambiguities'],
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

      const parsedJson = JSON.parse(responseText);
      const validation = InboxExtractionSchema.safeParse(parsedJson);

      if (!validation.success) {
        console.warn('Fallo de validación Zod en respuesta de Gemini, usando fallback:', validation.error);
        const fallbackItems = preprocessInboxText(rawText, enrolledSubjects, baseDate);
        return { items: fallbackItems, sourceEngine: 'preprocessor' };
      }

      // Procesar cada ítem con el ConfidenceEngine determinístico
      const validatedItems: InboxItem[] = validation.data.items.map((item, idx) => {
        // Enlazar con materia matriculada
        let matchedSubjectId: string | null = null;
        if (item.subjectName) {
          const normItemSubject = item.subjectName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const match = enrolledSubjects.find((s) => {
            const normSub = s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return normItemSubject.includes(normSub) || normSub.includes(normItemSubject);
          });
          if (match) matchedSubjectId = match.id;
        }

        const { confidence, confidenceScore } = computeItemConfidence(
          {
            ...item,
            id: item.id || `inbox_gemini_${Date.now()}_${idx}`,
            matchedSubjectId,
          },
          Boolean(matchedSubjectId)
        );

        return {
          ...item,
          id: item.id || `inbox_gemini_${Date.now()}_${idx}`,
          matchedSubjectId,
          confidence,
          confidenceScore,
        };
      });

      return { items: validatedItems, sourceEngine: 'gemini' };
    } catch (err) {
      console.warn('Error llamando a Gemini, conmutando a preprocesador determinístico:', err);
      const fallbackItems = preprocessInboxText(rawText, enrolledSubjects, baseDate);
      return { items: fallbackItems, sourceEngine: 'preprocessor' };
    }
  }
}
