import { db } from '../database';
import { StudySession } from '@/types';

export const studySessionRepository = {
  async getAll(): Promise<StudySession[]> {
    return await db.studySessions.toArray();
  },

  async getBySubject(subjectId: string): Promise<StudySession[]> {
    return await db.studySessions.where('subjectId').equals(subjectId).toArray();
  },

  async create(session: Omit<StudySession, 'id'>): Promise<string> {
    const id = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newSession: StudySession = {
      ...session,
      id,
    };
    await db.studySessions.put(newSession);
    return id;
  },

  async delete(id: string): Promise<void> {
    await db.studySessions.delete(id);
  },
};
