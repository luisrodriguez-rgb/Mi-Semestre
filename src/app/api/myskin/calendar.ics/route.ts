import { NextResponse } from 'next/server';
import { getCachedFeed } from '@/lib/myskin/store';
import { generateIcsCalendar } from '@/lib/importer/calendarExporter';
import { Subject } from '@/types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  try {
    const cached = getCachedFeed();
    const subjectsMap: Record<string, Subject> = {};
    for (const sub of cached.subjects || []) {
      subjectsMap[sub.id] = sub;
    }

    const icsContent = generateIcsCalendar({
      semesterName: cached.semester?.name || 'Semestre Activo',
      subjectsMap,
      blocks: cached.scheduleBlocks || [],
      exams: cached.exams || [],
    });

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="misemestre-myskin.ics"',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error generando calendar.ics para MySkin:', message);
    return new NextResponse('Error al generar calendario', {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
