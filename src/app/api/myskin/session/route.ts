import { NextRequest, NextResponse } from 'next/server';
import {
  getPendingSessions,
  addPendingSession,
  clearPendingSessions,
} from '@/lib/myskin/store';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
    const sessions = getPendingSessions();
    return NextResponse.json({ sessions }, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, durationMinutes, subjectId, startAt, endAt } = body;

    if (!durationMinutes || typeof durationMinutes !== 'number' || durationMinutes <= 0) {
      return NextResponse.json(
        { error: 'durationMinutes debe ser un numero positivo mayor a 0.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const session = addPendingSession({
      title: title || 'Sesion de concentracion MySkin',
      durationMinutes,
      subjectId: subjectId || undefined,
      startAt: startAt || new Date(Date.now() - durationMinutes * 60 * 1000).toISOString(),
      endAt: endAt || new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Sesion de estudio registrada exitosamente desde MySkin.',
        session,
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('all') === 'true') {
      clearPendingSessions();
      return NextResponse.json({ success: true, cleared: 'all' }, { headers: CORS_HEADERS });
    }

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    clearPendingSessions(ids);

    return NextResponse.json({ success: true, clearedCount: ids.length }, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
