import { db } from '../database';
import { Profile } from '@/types';

const ACTIVE_USER_KEY = 'mi_semestre_active_user_id';

export const profileRepository = {
  async getAll(): Promise<Profile[]> {
    return await db.profiles.toArray();
  },

  async getById(id: string): Promise<Profile | undefined> {
    return await db.profiles.get(id);
  },

  async getByStudentCode(code: string): Promise<Profile | undefined> {
    const all = await db.profiles.toArray();
    return all.find((p) => p.studentCode.trim().toLowerCase() === code.trim().toLowerCase());
  },

  async getActiveProfile(): Promise<Profile | undefined> {
    if (typeof window === 'undefined') return undefined;
    const activeId = localStorage.getItem(ACTIVE_USER_KEY);
    if (activeId) {
      const found = await db.profiles.get(activeId);
      if (found) return found;
    }
    const all = await db.profiles.toArray();
    return all[0];
  },

  async setActiveProfile(id: string): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_USER_KEY, id);
    }
  },

  async save(profile: Profile): Promise<string> {
    await db.profiles.put(profile);
    return profile.id;
  },

  async delete(id: string): Promise<void> {
    await db.profiles.delete(id);
  },
};
