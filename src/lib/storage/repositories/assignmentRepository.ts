import { db } from '../database';
import { Assignment } from '@/types';

export const assignmentRepository = {
  async getAll(): Promise<Assignment[]> {
    return await db.assignments.toArray();
  },

  async getBySubject(subjectId: string): Promise<Assignment[]> {
    return await db.assignments.where('subjectId').equals(subjectId).toArray();
  },

  async getPending(): Promise<Assignment[]> {
    return (await db.assignments.toArray()).filter((a) => a.status !== 'completed');
  },

  async save(assignment: Assignment): Promise<string> {
    await db.assignments.put(assignment);
    return assignment.id;
  },

  async bulkSave(assignments: Assignment[]): Promise<void> {
    await db.assignments.bulkPut(assignments);
  },

  async toggleStatus(id: string): Promise<void> {
    const item = await db.assignments.get(id);
    if (item) {
      const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
      await db.assignments.update(id, { status: nextStatus });
    }
  },

  async delete(id: string): Promise<void> {
    await db.assignments.delete(id);
  },
};
