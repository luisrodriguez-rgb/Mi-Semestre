import { db } from '../database';
import { Subject } from '@/types';

export const subjectRepository = {
  async getAll(): Promise<Subject[]> {
    return await db.subjects.toArray();
  },

  async getBySemester(semesterId: string): Promise<Subject[]> {
    return await db.subjects.where('semesterId').equals(semesterId).toArray();
  },

  async getById(id: string): Promise<Subject | undefined> {
    return await db.subjects.get(id);
  },

  async save(subject: Subject): Promise<string> {
    await db.subjects.put(subject);
    return subject.id;
  },

  async bulkSave(subjects: Subject[]): Promise<void> {
    await db.subjects.bulkPut(subjects);
  },

  async update(id: string, updates: Partial<Subject>): Promise<void> {
    await db.subjects.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.subjects, db.scheduleBlocks, db.assignments, db.exams], async () => {
      await db.subjects.delete(id);
      await db.scheduleBlocks.where('subjectId').equals(id).delete();
      await db.assignments.where('subjectId').equals(id).delete();
      await db.exams.where('subjectId').equals(id).delete();
    });
  },
};
