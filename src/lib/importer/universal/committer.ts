import { db } from '../../storage/database';
import {
  profileRepository,
  semesterRepository,
  subjectRepository,
  scheduleRepository,
  examRepository,
  assignmentRepository,
} from '../../storage';
import { ParsedAcademicData, CommitResult } from './types';
import { Profile, Semester, Subject, ScheduleBlock, Exam, Assignment } from '@/types';
import { IS_USER_CONFIGURED_KEY } from '../templateLoader';

/**
 * Commit atómico local-first en Dexie.
 * La transacción asegura que o se guarda todo el estado académico consistente o se revierte por completo.
 * Devuelve un CommitResult detallado para auditoría y retroalimentación de la interfaz.
 */
export async function commitAcademicDataAtomically(data: ParsedAcademicData): Promise<CommitResult> {
  const profileId = `profile-user-${Date.now()}`;
  const semesterId = `sem-user-${Date.now()}`;

  const profile: Profile = {
    id: profileId,
    name: data.student?.name || 'Estudiante',
    studentCode: data.student?.studentCode || 'A00' + Math.floor(100000 + Math.random() * 900000),
    documentId: data.student?.documentId || undefined,
    university: data.student?.university || 'Universidad',
    program: data.student?.program || 'Pregrado',
    semesterNumber: data.student?.semesterNumber || 1,
    cohort: data.student?.cohort || undefined,
    gpa: data.student?.gpa || undefined,
    avatarUrl:
      data.student?.avatarUrl ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.student?.name || 'Estudiante')}`,
  };

  const semester: Semester = {
    id: semesterId,
    userId: profileId,
    name: data.semester?.name || `Semestre Activo (${profile.program})`,
    startDate: data.semester?.startDate || '2026-08-01',
    endDate: data.semester?.endDate || '2026-12-05',
    totalWeeks: data.semester?.totalWeeks || 16,
    isActive: true,
  };

  const subjectsToSave: Subject[] = data.subjects.map((s) => ({
    id: s.id,
    semesterId,
    name: s.name,
    code: s.code || 'MAT-100',
    credits: s.credits || 3,
    color: s.color || '#3b3abf',
    professor: s.professor || 'Docente Titular',
    maxAbsences: s.maxAbsences || 4,
    passingGrade: 3.0,
  }));

  const blocksToSave: ScheduleBlock[] = data.scheduleBlocks.map((b, i) => ({
    id: `sb-universal-${i}-${Date.now()}`,
    subjectId: b.subjectId,
    dayOfWeek: b.dayOfWeek,
    startTime: b.startTime,
    endTime: b.endTime,
    location: b.location || undefined,
  }));

  // Guardar únicamente evaluaciones y tareas REALES encontradas en la evidencia (Cero datos falsos)
  const examsToSave: Exam[] = (data.exams || []).map((e) => ({
    id: e.id || `ex-universal-${Date.now()}-${Math.random()}`,
    subjectId: e.subjectId,
    title: e.title,
    date: e.date || new Date().toISOString(),
    weight: e.weight || 20,
    location: e.location,
    notes: e.notes,
    topics: e.topics,
  }));

  const assignmentsToSave: Assignment[] = (data.assignments || []).map((a) => ({
    id: a.id || `as-universal-${Date.now()}-${Math.random()}`,
    subjectId: a.subjectId,
    title: a.title,
    dueDate: a.dueDate || new Date().toISOString(),
    estimatedMinutes: a.estimatedMinutes || 45,
    priority: a.priority || 'medium',
    status: 'pending',
    location: a.location,
    notes: a.notes,
  }));

  // Transacción atómica en Dexie para asegurar consistencia absoluta local-first
  await db.transaction(
    'rw',
    [
      db.profiles,
      db.semesters,
      db.subjects,
      db.scheduleBlocks,
      db.exams,
      db.assignments,
      db.routines,
      db.attendance,
      db.grades,
      db.studySessions,
    ],
    async () => {
      // Limpiar colecciones transaccionales anteriores
      await db.subjects.clear();
      await db.scheduleBlocks.clear();
      await db.exams.clear();
      await db.assignments.clear();
      await db.routines.clear();
      await db.attendance.clear();
      await db.grades.clear();
      await db.studySessions.clear();
      await db.semesters.clear();

      // Guardar nuevos registros atómicamente
      await profileRepository.save(profile);
      await profileRepository.setActiveProfile(profileId);
      await semesterRepository.save(semester);

      if (subjectsToSave.length > 0) {
        await subjectRepository.bulkSave(subjectsToSave);
      }
      if (blocksToSave.length > 0) {
        await scheduleRepository.bulkSave(blocksToSave);
      }
      if (examsToSave.length > 0) {
        await examRepository.bulkSave(examsToSave);
      }
      if (assignmentsToSave.length > 0) {
        await assignmentRepository.bulkSave(assignmentsToSave);
      }
    }
  );

  if (typeof window !== 'undefined') {
    localStorage.setItem(IS_USER_CONFIGURED_KEY, 'true');
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
  }

  return {
    semesterId,
    profileId,
    created: {
      subjects: subjectsToSave.length,
      scheduleBlocks: blocksToSave.length,
      exams: examsToSave.length,
      assignments: assignmentsToSave.length,
    },
    updated: {
      subjects: 0,
      scheduleBlocks: 0,
    },
    skipped: 0,
  };
}
