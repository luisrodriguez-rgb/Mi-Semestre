'use client';

import { useEffect, useRef } from 'react';
import { useSemesterData } from './useSemesterData';
import { studySessionRepository } from '@/lib/storage';

export function useMySkinSync() {
  const {
    subjects,
    scheduleBlocks,
    assignments,
    exams,
    semester,
    profile,
    isLoading,
  } = useSemesterData();

  const lastSyncHash = useRef<string>('');

  // 1. Sincronizar datos academicos hacia /api/myskin/feed cuando cambien
  useEffect(() => {
    if (isLoading) return;

    const currentHash = JSON.stringify({
      subs: subjects.map((s) => ({ id: s.id, name: s.name, code: s.code })),
      blocks: scheduleBlocks.map((b) => ({ id: b.id, sId: b.subjectId, d: b.dayOfWeek, t: b.startTime })),
      asg: assignments.map((a) => ({ id: a.id, title: a.title, due: a.dueDate, c: a.completed })),
      ex: exams.map((e) => ({ id: e.id, date: e.date, title: e.title })),
    });

    if (currentHash === lastSyncHash.current) return;
    lastSyncHash.current = currentHash;

    const syncPayload = {
      subjects,
      scheduleBlocks,
      assignments,
      exams,
      semester,
      profile,
    };

    fetch('/api/myskin/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncPayload),
    }).catch((err) => {
      console.debug('[MySkinSync] No se pudo sincronizar feed:', err);
    });
  }, [subjects, scheduleBlocks, assignments, exams, semester, profile, isLoading]);

  // 2. Comprobar sesiones de estudio completadas en MySkin e ingresarlas al historial de Dexie
  useEffect(() => {
    if (isLoading) return;

    const checkPendingSessions = async () => {
      try {
        const res = await fetch('/api/myskin/session');
        if (!res.ok) return;

        const data = await res.json();
        const sessions = data.sessions;

        if (Array.isArray(sessions) && sessions.length > 0) {
          const processedIds: string[] = [];

          for (const s of sessions) {
            const targetSubjectId = s.subjectId || subjects[0]?.id || 'general';
            await studySessionRepository.create({
              subjectId: targetSubjectId,
              title: s.title || 'Foco MySkin completado',
              startAt: s.startAt || new Date(Date.now() - s.durationMinutes * 60 * 1000).toISOString(),
              endAt: s.endAt || new Date().toISOString(),
              durationMinutes: s.durationMinutes || 25,
              status: 'completed',
            });
            processedIds.push(s.id);
          }

          if (processedIds.length > 0) {
            await fetch('/api/myskin/session', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: processedIds }),
            });
          }
        }
      } catch (err) {
        console.debug('[MySkinSync] Error procesando sesiones de MySkin:', err);
      }
    };

    checkPendingSessions();
    const interval = setInterval(checkPendingSessions, 30000);
    return () => clearInterval(interval);
  }, [isLoading, subjects]);
}
