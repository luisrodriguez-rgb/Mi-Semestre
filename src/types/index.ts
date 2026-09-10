export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Lunes, 7 = Domingo

export interface Profile {
  id: string;
  name: string;
  email?: string;
  studentCode: string;
  documentId?: string;
  university: string;
  program: string;
  semesterNumber: number;
  gpa?: number; // Promedio acumulado, ej. 4.3
  cohort?: string; // ej. 202510
  avatarUrl?: string;
}

export interface Semester {
  id: string;
  userId: string;
  name: string; // ej. "Segundo Semestre De 2026 - PRE"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  totalWeeks: number; // Típicamente 16
}

export interface Subject {
  id: string;
  semesterId: string;
  name: string;
  code: string;
  nrc?: string;
  professor?: string;
  credits: number;
  color: string;
  maxAbsences: number;
  passingGrade: number;
  currentGrade?: number;
}

export interface CourseHistory {
  code: string;
  name: string;
  period: string;
  credits: number;
  grade: number | string; // 4.3 o "Aprobado"
}

export interface PendingCourse {
  code: string;
  name: string;
  semester: number;
}

export type DataSource = 'manual' | 'ics' | 'ai_inbox' | 'system' | 'import';

export interface ImportedEventMetadata {
  source: DataSource;
  externalUid?: string;
  externalCalendarId?: string;
  academicFingerprint?: string;
}

export interface ScheduleBlock extends Partial<ImportedEventMetadata> {
  id: string;
  subjectId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "08:00" formato 24h
  endTime: string;   // "10:00" formato 24h
  location?: string; // Salón / Aula
}

export type EventType = 'class' | 'study' | 'assignment' | 'exam' | 'personal' | 'routine';

export interface CalendarEvent extends Partial<ImportedEventMetadata> {
  id: string;
  type: EventType;
  title: string;
  startTime: string; // HH:mm o ISO string
  endTime: string;
  dayOfWeek?: DayOfWeek;
  date?: string; // YYYY-MM-DD si es fecha específica
  subjectId?: string;
  location?: string;
  color?: string;
  isRecurring?: boolean;
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Assignment extends Partial<ImportedEventMetadata> {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  dueDate: string; // ISO 8601 o YYYY-MM-DD HH:mm
  priority: TaskPriority;
  estimatedMinutes: number;
  status: TaskStatus;
}

export interface Exam extends Partial<ImportedEventMetadata> {
  id: string;
  subjectId: string;
  title: string; // ej. "Parcial 1: Integrales triples"
  date: string;  // YYYY-MM-DD HH:mm
  weight: number; // Porcentaje, ej. 25
  topics?: string[];
}

export type AttendanceStatus = 'present' | 'absent' | 'excused';

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export interface Grade {
  id: string;
  subjectId: string;
  name: string;
  value: number; // Calificación obtenida
  weight: number; // Porcentaje del corte (ej. 20%)
}

export interface StudySession {
  id: string;
  subjectId: string;
  assignmentId?: string;
  title: string;
  startAt: string; // ISO string o HH:mm
  endAt: string;
  durationMinutes: number;
  status: 'planned' | 'completed' | 'skipped';
}

export type RecommendationReasonCode =
  | 'EXAM_SOON'
  | 'HIGH_WEIGHT'
  | 'STUDY_DEFICIT'
  | 'APPROACHING_DEADLINE'
  | 'HIGH_RISK';

export interface StudyRecommendation {
  id: string;
  subjectId: string;
  subjectName?: string;
  subjectColor?: string;
  assignmentId?: string;
  examId?: string;
  title: string;
  start: Date;
  end: Date;
  startTimeStr: string;
  endTimeStr: string;
  durationMinutes: number;
  priorityScore: number;
  reason: string;
  reasonCodes?: RecommendationReasonCode[];
  status: 'suggested' | 'accepted' | 'dismissed' | 'completed';
  topics?: string[];
}

export interface NormalizedCalendarEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  dayOfWeek?: DayOfWeek;
  startTimeStr: string; // "08:00"
  endTimeStr: string;   // "10:00"
  recurrence?: {
    freq?: string;
    byDay?: string[];
    until?: Date;
  };
  source: DataSource;
  sourceCalendar?: string;
  suggestedType: EventType;
  matchedSubjectId?: string;
}

export type RoutineType = 'commute' | 'meal' | 'gym' | 'work' | 'rest';

export interface FixedRoutine extends Partial<ImportedEventMetadata> {
  id: string;
  title: string;
  type: RoutineType;
  dayOfWeek: DayOfWeek;
  startTime: string; // "12:00"
  endTime: string;   // "13:00"
}

// -------------------------------------------------------------
// Tipos del Motor Académico (Academic Engine)
// -------------------------------------------------------------

export type AvailabilityCategory = 'FREE' | 'USABLE' | 'BLOCKED';

export interface TimeSlot {
  startTime: string; // "10:00"
  endTime: string;   // "12:00"
  durationMinutes: number; // Tiempo libre bruto (raw)
  transitionBufferMinutes: number; // Margen de traslado/preparación (ej. 15m)
  effectiveStudyMinutes: number; // Tiempo útil efectivo para estudio
  category: AvailabilityCategory;
  reason?: string; // ej. "Hueco entre clases", "Transporte hacia campus"
  dayOfWeek?: DayOfWeek;
  date?: string;
}

export interface ScheduleConflict {
  id: string;
  itemA: { id: string; title: string; time: string };
  itemB: { id: string; title: string; time: string };
  dayOfWeek: DayOfWeek;
  overlapMinutes: number;
  description: string;
}

export type RiskLevel = 'CRÍTICO' | 'ATENCIÓN' | 'ESTABLE';

export interface RiskEvaluation {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  level: RiskLevel;
  riskScore: number; // 0 - 100
  deadlinePressure: number;
  workloadPressure: number;
  attendancePressure: number;
  signals: {
    daysUntilExam?: number | null;
    pendingTasksCount: number;
    estimatedStudyMinutes: number;
    availableMinutesThisWeek: number;
    attendanceRate: number;
    absencesCount: number;
    remainingAllowedAbsences: number;
    currentGrade?: number;
  };
  reasons: string[];
}

export interface NowActionState {
  status: 'in_class' | 'in_free_slot' | 'off_hours';
  headline: string;
  currentTimeString: string;
  currentBlock?: {
    id: string;
    title: string;
    type: 'class' | 'routine' | 'study';
    location?: string;
    remainingMinutes: number;
    endTime: string;
    color: string;
  };
  nextBlock?: {
    id: string;
    title: string;
    startTime: string;
    location?: string;
  };
  availableSlot?: TimeSlot;
  recommendation?: {
    taskId?: string;
    subjectId: string;
    subjectName: string;
    title: string;
    estimatedMinutes: number;
    reason: string;
  };
}
