import { InboxItem } from './schemas';
import { SubjectContext } from './preprocessor';

export interface AIProvider {
  extractInboxItems(params: {
    rawText: string;
    enrolledSubjects: SubjectContext[];
    baseDate?: Date;
  }): Promise<{ items: InboxItem[]; sourceEngine: 'gemini' | 'preprocessor' }>;
}
