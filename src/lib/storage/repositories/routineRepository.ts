import { db } from '../database';
import { FixedRoutine } from '@/types';

export const routineRepository = {
  async getAll(): Promise<FixedRoutine[]> {
    return await db.routines.toArray();
  },

  async save(routine: FixedRoutine): Promise<string> {
    await db.routines.put(routine);
    return routine.id;
  },

  async bulkSave(routines: FixedRoutine[]): Promise<void> {
    await db.routines.bulkPut(routines);
  },

  async delete(id: string): Promise<void> {
    await db.routines.delete(id);
  },
};
