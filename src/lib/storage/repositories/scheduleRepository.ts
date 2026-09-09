import { db } from '../database';
import { ScheduleBlock, DayOfWeek } from '@/types';

export const scheduleRepository = {
  async getAll(): Promise<ScheduleBlock[]> {
    return await db.scheduleBlocks.toArray();
  },

  async getBySubject(subjectId: string): Promise<ScheduleBlock[]> {
    return await db.scheduleBlocks.where('subjectId').equals(subjectId).toArray();
  },

  async getByDay(dayOfWeek: DayOfWeek): Promise<ScheduleBlock[]> {
    return await db.scheduleBlocks.where('dayOfWeek').equals(dayOfWeek).toArray();
  },

  async save(block: ScheduleBlock): Promise<string> {
    await db.scheduleBlocks.put(block);
    return block.id;
  },

  async bulkSave(blocks: ScheduleBlock[]): Promise<void> {
    await db.scheduleBlocks.bulkPut(blocks);
  },

  async delete(id: string): Promise<void> {
    await db.scheduleBlocks.delete(id);
  },

  async clearAll(): Promise<void> {
    await db.scheduleBlocks.clear();
  },
};
