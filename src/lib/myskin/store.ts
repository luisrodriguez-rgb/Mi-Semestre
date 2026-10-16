import fs from 'fs';
import path from 'path';
import { Subject, ScheduleBlock, Assignment, Exam, Semester, Profile } from '@/types';
import {
  mockSubjects,
  mockScheduleBlocks,
  mockAssignments,
  mockExams,
  mockSemester,
  demoIcesiProfile,
} from '@/lib/mockData';

export interface MySkinFeedPayload {
  subjects: Subject[];
  scheduleBlocks: ScheduleBlock[];
  assignments: Assignment[];
  exams: Exam[];
  semester?: Semester | null;
  profile?: Profile | null;
  updatedAt: number;
}

export interface PendingStudySession {
  id: string;
  subjectId?: string;
  title: string;
  durationMinutes: number;
  startAt?: string;
  endAt?: string;
  timestamp: number;
}

const CACHE_FILE = path.join(process.cwd(), '.next', 'myskin-cache.json');
const SESSIONS_FILE = path.join(process.cwd(), '.next', 'myskin-sessions.json');

// Global en memoria para persistencia rapida durante la ejecucion de Next.js
declare global {
  // eslint-disable-next-line no-var
  var __myskin_feed_cache: MySkinFeedPayload | undefined;
  // eslint-disable-next-line no-var
  var __myskin_pending_sessions: PendingStudySession[] | undefined;
}

function getDefaultFeed(): MySkinFeedPayload {
  return {
    subjects: mockSubjects,
    scheduleBlocks: mockScheduleBlocks,
    assignments: mockAssignments,
    exams: mockExams,
    semester: mockSemester,
    profile: demoIcesiProfile,
    updatedAt: Date.now(),
  };
}

export function getCachedFeed(): MySkinFeedPayload {
  if (global.__myskin_feed_cache) {
    return global.__myskin_feed_cache;
  }

  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      global.__myskin_feed_cache = parsed;
      return parsed;
    }
  } catch (err) {
    console.debug('[MySkinStore] No se pudo leer el archivo de cache:', err);
  }

  const fallback = getDefaultFeed();
  global.__myskin_feed_cache = fallback;
  return fallback;
}

export function saveCachedFeed(data: Omit<MySkinFeedPayload, 'updatedAt'> & { updatedAt?: number }): MySkinFeedPayload {
  const payload: MySkinFeedPayload = {
    ...data,
    updatedAt: data.updatedAt || Date.now(),
  };

  global.__myskin_feed_cache = payload;

  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.debug('[MySkinStore] No se pudo persistir en archivo:', err);
  }

  return payload;
}

export function getPendingSessions(): PendingStudySession[] {
  if (global.__myskin_pending_sessions) {
    return global.__myskin_pending_sessions;
  }

  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        global.__myskin_pending_sessions = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.debug('[MySkinStore] No se pudo leer sesiones pendientes:', err);
  }

  global.__myskin_pending_sessions = [];
  return [];
}

export function addPendingSession(session: Omit<PendingStudySession, 'id' | 'timestamp'>): PendingStudySession {
  const current = getPendingSessions();
  const newSession: PendingStudySession = {
    ...session,
    id: `pomo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };

  current.push(newSession);
  global.__myskin_pending_sessions = current;

  try {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(current, null, 2), 'utf-8');
  } catch (err) {
    console.debug('[MySkinStore] No se pudo guardar sesion pendiente:', err);
  }

  return newSession;
}

export function clearPendingSessions(sessionIds?: string[]): void {
  let remaining: PendingStudySession[] = [];
  if (sessionIds && sessionIds.length > 0) {
    const toRemove = new Set(sessionIds);
    remaining = getPendingSessions().filter((s) => !toRemove.has(s.id));
  }

  global.__myskin_pending_sessions = remaining;

  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(remaining, null, 2), 'utf-8');
  } catch (err) {
    console.debug('[MySkinStore] No se pudo actualizar sesiones pendientes:', err);
  }
}
