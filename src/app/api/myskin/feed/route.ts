import { NextRequest, NextResponse } from 'next/server';
import { getCachedFeed, saveCachedFeed } from '@/lib/myskin/store';
import { Subject, ScheduleBlock, Assignment, Exam } from '@/types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const now = new Date();
    // 1 = Lunes, 7 = Domingo
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const subjectsMap: Record<string, Subject> = {};
    for (const sub of cached.subjects || []) {
      subjectsMap[sub.id] = sub;
    }

    const todayBlocks = (cached.scheduleBlocks || [])
      .filter((block: ScheduleBlock) => block.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    let currentClass: any = null;
    let nextClass: any = null;

    const formattedClasses = todayBlocks.map((block) => {
      const subject = subjectsMap[block.subjectId];
      const [startH, startM] = block.startTime.split(':').map(Number);
      const [endH, endM] = block.endTime.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      const isCurrent = currentMinutes >= startMin && currentMinutes < endMin;
      const isPast = currentMinutes >= endMin;
      const isUpcoming = currentMinutes < startMin;
      const startsInMinutes = isUpcoming ? startMin - currentMinutes : 0;

      const item = {
        id: block.id,
        subjectId: block.subjectId,
        subjectName: subject?.name || 'Clase Universitaria',
        subjectCode: subject?.code || '',
        color: subject?.color || '#3b82f6',
        startTime: block.startTime,
        endTime: block.endTime,
        location: block.location || 'Campus Universitario',
        professor: subject?.professor || '',
        isCurrent,
        isPast,
        isUpcoming,
        startsInMinutes,
      };

      if (isCurrent && !currentClass) {
        currentClass = item;
      }
      if (isUpcoming && !nextClass) {
        nextClass = item;
      }

      return item;
    });

    const pendingAssignments = (cached.assignments || [])
      .filter((a: Assignment) => a.status !== 'completed')
      .map((a: Assignment) => {
        const subject = subjectsMap[a.subjectId];
        const dueAt = new Date(a.dueDate).getTime();
        const diffHours = (dueAt - now.getTime()) / (1000 * 3600);
        return {
          id: a.id,
          subjectId: a.subjectId,
          course: subject?.name || 'Materia universitaria',
          title: a.title,
          dueAt: isNaN(dueAt) ? Date.now() + 86400000 : dueAt,
          dueDate: a.dueDate,
          urgent: diffHours > 0 && diffHours <= 48,
          completed: false,
          priority: a.priority,
        };
      })
      .sort((a, b) => a.dueAt - b.dueAt);

    const upcomingExams = (cached.exams || [])
      .map((e: Exam) => {
        const subject = subjectsMap[e.subjectId];
        const timestamp = new Date(e.date).getTime();
        return {
          id: e.id,
          subjectId: e.subjectId,
          course: subject?.name || 'Materia universitaria',
          title: e.title,
          date: e.date,
          timestamp: isNaN(timestamp) ? Date.now() : timestamp,
          weight: e.weight || 0,
        };
      })
      .filter((e) => e.timestamp >= now.getTime() - 24 * 3600 * 1000)
      .sort((a, b) => a.timestamp - b.timestamp);

    return NextResponse.json(
      {
        connected: true,
        provider: 'MiSemestre',
        timestamp: now.getTime(),
        semester: cached.semester?.name || 'Semestre Activo',
        student: cached.profile?.name || 'Estudiante',
        today: {
          dayOfWeek,
          classes: formattedClasses,
          currentClass,
          nextClass,
        },
        assignments: pendingAssignments,
        exams: upcomingExams,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error en GET /api/myskin/feed:', message);
    return NextResponse.json(
      { connected: false, error: message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subjects, scheduleBlocks, assignments, exams, semester, profile } = body;

    saveCachedFeed({
      subjects: Array.isArray(subjects) ? subjects : [],
      scheduleBlocks: Array.isArray(scheduleBlocks) ? scheduleBlocks : [],
      assignments: Array.isArray(assignments) ? assignments : [],
      exams: Array.isArray(exams) ? exams : [],
      semester: semester || null,
      profile: profile || null,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Estado sincronizado con MySkin exitosamente.',
        updatedAt: Date.now(),
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error en POST /api/myskin/feed:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
