import { db } from '../database';
import { Exam } from '@/types';

export const examRepository = {
  async getAll(): Promise<Exam[]> {
    return (await db.exams.toArray()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  async getBySubject(subjectId: string): Promise<Exam[]> {
    return await db.exams.where('subjectId').equals(subjectId).toArray();
  },

  async save(exam: Exam): Promise<string> {
    await db.exams.put(exam);
    return exam.id;
  },

  async bulkSave(exams: Exam[]): Promise<void> {
    await db.exams.bulkPut(exams);
  },

  async delete(id: string): Promise<void> {
    await db.exams.delete(id);
  },
};
