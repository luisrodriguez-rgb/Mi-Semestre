import { db } from '../database';
import { AttendanceRecord } from '@/types';

export const attendanceRepository = {
  async getAll(): Promise<AttendanceRecord[]> {
    return await db.attendance.toArray();
  },

  async getBySubject(subjectId: string): Promise<AttendanceRecord[]> {
    return await db.attendance.where('subjectId').equals(subjectId).toArray();
  },

  async save(record: AttendanceRecord): Promise<string> {
    await db.attendance.put(record);
    return record.id;
  },

  async bulkSave(records: AttendanceRecord[]): Promise<void> {
    await db.attendance.bulkPut(records);
  },

  async delete(id: string): Promise<void> {
    await db.attendance.delete(id);
  },
};
