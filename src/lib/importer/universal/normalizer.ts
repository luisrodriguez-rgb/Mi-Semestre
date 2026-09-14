import { ParsedAcademicData } from './types';
import { DayOfWeek } from '@/types';

export const UNIVERSAL_PALETTE = [
  '#3b3abf', // Azul Mi Semestre
  '#0284c7', // Celeste
  '#0d9488', // Teal
  '#16a34a', // Verde
  '#7c3aed', // Púrpura
  '#db2777', // Magenta
  '#d97706', // Ámbar
  '#ea580c', // Naranja
];

export function titleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatTimeString(t: string): string {
  if (!t) return '08:00';
  const clean = t.trim().toLowerCase();
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (match) {
    const hh = match[1].padStart(2, '0');
    const mm = match[2] || '00';
    return `${hh}:${mm}`;
  }
  return clean.padStart(5, '0');
}

export function normalizeParsedAcademicData(raw: ParsedAcademicData): ParsedAcademicData {
  let colorIdx = 0;

  // 1. Normalizar materias y asignar colores únicos si no los traen
  const normalizedSubjects = raw.subjects.map((s) => ({
    ...s,
    name: titleCase(s.name.trim()),
    code: s.code?.trim() || `MAT-${101 + colorIdx}`,
    color: s.color || UNIVERSAL_PALETTE[colorIdx++ % UNIVERSAL_PALETTE.length],
    credits: s.credits || 3,
    professor: s.professor ? titleCase(s.professor.trim()) : undefined,
    maxAbsences: s.maxAbsences || 4,
  }));

  // 2. Normalizar bloques de horario
  const normalizedBlocks = raw.scheduleBlocks.map((b) => ({
    ...b,
    dayOfWeek: Math.max(1, Math.min(7, b.dayOfWeek)) as DayOfWeek,
    startTime: formatTimeString(b.startTime),
    endTime: formatTimeString(b.endTime),
    location: b.location?.trim() || undefined,
  }));

  // 3. Normalizar evaluaciones si vinieron en la evidencia (preservar undefined si no vinieron)
  const normalizedExams = raw.exams
    ? raw.exams.map((e, idx) => ({
        ...e,
        id: e.id || `exam-${idx}-${Date.now()}`,
        title: titleCase(e.title.trim()),
        weight: e.weight || 20,
        location: e.location?.trim() || undefined,
        notes: e.notes?.trim() || undefined,
      }))
    : undefined;

  // 4. Normalizar tareas si vinieron en la evidencia (preservar undefined si no vinieron)
  const normalizedAssignments = raw.assignments
    ? raw.assignments.map((a, idx) => ({
        ...a,
        id: a.id || `task-${idx}-${Date.now()}`,
        title: titleCase(a.title.trim()),
        priority: a.priority || 'medium',
        location: a.location?.trim() || undefined,
        notes: a.notes?.trim() || undefined,
      }))
    : undefined;

  return {
    ...raw,
    student: raw.student
      ? {
          ...raw.student,
          name: raw.student.name ? titleCase(raw.student.name) : undefined,
          university: raw.student.university ? titleCase(raw.student.university) : undefined,
          program: raw.student.program ? titleCase(raw.student.program) : undefined,
        }
      : undefined,
    subjects: normalizedSubjects,
    scheduleBlocks: normalizedBlocks,
    exams: normalizedExams,
    assignments: normalizedAssignments,
  };
}
