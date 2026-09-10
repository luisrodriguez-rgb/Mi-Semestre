import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/ai/geminiProvider';
import { SubjectContext } from '@/lib/ai/preprocessor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawText, enrolledSubjects = [], baseDate } = body;

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return NextResponse.json(
        { error: 'El texto a procesar es requerido.' },
        { status: 400 }
      );
    }

    const provider = new GeminiProvider();
    const result = await provider.extractInboxItems({
      rawText: rawText.trim(),
      enrolledSubjects: enrolledSubjects as SubjectContext[],
      baseDate: baseDate ? new Date(baseDate) : new Date(),
    });

    return NextResponse.json({
      success: true,
      items: result.items,
      sourceEngine: result.sourceEngine,
    });
  } catch (err) {
    console.error('Error en /api/ai/extract:', err);
    return NextResponse.json(
      { error: 'Error interno al procesar el texto con el motor de extracción.' },
      { status: 500 }
    );
  }
}
