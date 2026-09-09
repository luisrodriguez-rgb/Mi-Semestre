import { db } from '../database';
import { Semester } from '@/types';

export const semesterRepository = {
  async getAll(): Promise<Semester[]> {
    return await db.semesters.toArray();
  },

  async getActive(): Promise<Semester | undefined> {
    const all = await db.semesters.toArray();
    return all.find((s) => s.isActive) || all[0];
  },

  async getById(id: string): Promise<Semester | undefined> {
    return await db.semesters.get(id);
  },

  async save(semester: Semester): Promise<string> {
    await db.semesters.put(semester);
    return semester.id;
  },

  async setActive(id: string): Promise<void> {
    await db.transaction('rw', db.semesters, async () => {
      const all = await db.semesters.toArray();
      for (const s of all) {
        await db.semesters.update(s.id, { isActive: s.id === id });
      }
    });
  },

  async delete(id: string): Promise<void> {
    await db.semesters.delete(id);
  },
};
