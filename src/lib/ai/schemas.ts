import { z } from 'zod';

export const InboxAmbiguitySchema = z.object({
  field: z.string(),
  reason: z.string(),
  options: z.array(z.string()),
});

export type InboxAmbiguity = z.infer<typeof InboxAmbiguitySchema>;

export const InboxItemSchema = z.object({
  id: z.string(),
  type: z.enum(['exam', 'assignment', 'class', 'routine']),
  title: z.string(),
  subjectName: z.string().nullable(),
  matchedSubjectId: z.string().nullable().optional(),
  date: z.string().nullable(), // YYYY-MM-DD
  startTime: z.string().nullable(), // HH:mm
  endTime: z.string().nullable(), // HH:mm
  weight: z.number().min(0).max(100).nullable(),
  description: z.string().nullable().optional(),
  sourceText: z.string(), // Texto exacto que sustentó la extracción (Auditoría)
  ambiguities: z.array(InboxAmbiguitySchema),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  confidenceScore: z.number().optional(),
});

export type InboxItem = z.infer<typeof InboxItemSchema>;

export const InboxExtractionSchema = z.object({
  items: z.array(InboxItemSchema),
  rawTextSummary: z.string().optional(),
});

export type InboxExtraction = z.infer<typeof InboxExtractionSchema>;
