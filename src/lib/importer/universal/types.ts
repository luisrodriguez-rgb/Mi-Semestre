import { Semester, DayOfWeek } from '@/types';

export type InputContainer = 'ics' | 'pdf' | 'image' | 'text';

export type AcademicDocumentType =
  | 'schedule'
  | 'academic_balance'
  | 'syllabus'
  | 'grades'
  | 'unknown';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface DetectionSignal {
  id: string;
  description: string;
  weight: number;
}

export interface DetectionResult {
  container: InputContainer;
  documentType: AcademicDocumentType;
  confidence: ConfidenceLevel;
  signals: DetectionSignal[];
  rawSnippet?: string;
}

export interface EvidenceItem {
  id: string;
  sourceContainer: InputContainer;
  field: string;
  extractedValue: unknown;
  confidence: ConfidenceLevel;
  sourceText?: string;
}

export interface UnresolvedField {
  field: string;
  label: string;
  message: string;
  severity: 'warning' | 'info';
  suggestedAction?: string;
}

export interface IngestWarning {
  code: string;
  message: string;
  severity: 'warning' | 'info';
  affectedEntity?: string;
}

export interface RawEvidence {
  file?: File;
  text?: string;
  fileName?: string;
  fileType?: string;
  sourceLabel?: string;
}

export interface ParsedStudent {
  name?: string;
  studentCode?: string;
  documentId?: string;
  university?: string;
  program?: string;
  semesterNumber?: number;
  cohort?: string;
  gpa?: number;
  avatarUrl?: string;
}

export interface ParsedSubject {
  id: string;
  name: string;
  code?: string;
  nrc?: string;
  credits?: number;
  color?: string;
  professor?: string;
  maxAbsences?: number;
  evidence?: EvidenceItem[];
}

export interface ParsedScheduleBlock {
  id?: string;
  subjectId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "08:00"
  endTime: string;   // "10:00"
  location?: string;
  evidence?: EvidenceItem[];
}

export interface ParsedExam {
  id?: string;
  subjectId: string;
  title: string;
  date?: string;
  weight?: number;
  location?: string;
  notes?: string;
  topics?: string[];
  evidence?: EvidenceItem[];
}

export interface ParsedAssignment {
  id?: string;
  subjectId: string;
  title: string;
  dueDate?: string;
  estimatedMinutes?: number;
  priority?: 'high' | 'medium' | 'low';
  location?: string;
  notes?: string;
  evidence?: EvidenceItem[];
}

/**
 * ParsedAcademicData distingue explícitamente entre datos encontrados,
 * datos ausentes (undefined = no evidenciado en el documento) y listas vacías.
 */
export interface ParsedAcademicData {
  student?: ParsedStudent;
  semester?: Partial<Semester>;
  subjects: ParsedSubject[];
  scheduleBlocks: ParsedScheduleBlock[];
  exams?: ParsedExam[];           // undefined = No evidenciado en el documento cargado
  assignments?: ParsedAssignment[]; // undefined = No evidenciado en el documento cargado
  rawEvidenceSnippet?: string;
}

export interface IngestResult {
  detections: DetectionResult[];
  data: ParsedAcademicData;
  unresolved: UnresolvedField[];
  warnings: IngestWarning[];
  confidence: ConfidenceLevel;
  evidenceGraph: EvidenceItem[];
  summary: {
    subjectsCount: number;
    scheduleBlocksCount: number;
    examsCount: number | null;         // null = No evidenciado
    assignmentsCount: number | null;   // null = No evidenciado
    missingRoomsCount: number;
    hasStudentProfile: boolean;
  };
  matchedTemplate?: {
    id: string;
    name: string;
    matchScore: number;
    confidence: 'exact' | 'high' | 'partial';
  };
}

export interface CommitResult {
  semesterId: string;
  profileId: string;
  created: {
    subjects: number;
    scheduleBlocks: number;
    exams: number;
    assignments: number;
  };
  updated: {
    subjects: number;
    scheduleBlocks: number;
  };
  skipped: number;
}
