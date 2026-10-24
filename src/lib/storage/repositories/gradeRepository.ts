import { db } from '../database';
import { Grade } from '@/types';

export const gradeRepository = {
  async getAll(): Promise<Grade[]> {
    return await db.grades.toArray();
  },

  async getBySubject(subjectId: string): Promise<Grade[]> {
    return await db.grades.where('subjectId').equals(subjectId).toArray();
  },

  async save(grade: Grade): Promise<string> {
    await db.grades.put(grade);
    return grade.id;
  },

  async bulkSave(grades: Grade[]): Promise<void> {
    await db.grades.bulkPut(grades);
  },

  async delete(id: string): Promise<void> {
    await db.grades.delete(id);
  },

  async deleteBySubject(subjectId: string): Promise<void> {
    await db.grades.where('subjectId').equals(subjectId).delete();
  },
};
