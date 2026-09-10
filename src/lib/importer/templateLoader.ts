import { db } from '../storage/database';
import {
  profileRepository,
  semesterRepository,
  subjectRepository,
  scheduleRepository,
  routineRepository,
  examRepository,
  assignmentRepository,
  attendanceRepository,
} from '../storage';
import { ACADEMIC_TEMPLATES } from '../templates/academicTemplates';
import { ParsedAcademicData } from './smartAcademicIngester';
import { Semester, Profile, Subject, ScheduleBlock, DayOfWeek } from '@/types';

export const IS_USER_CONFIGURED_KEY = 'mi_semestre_user_configured_v1';

export async function clearAllSemesterData() {
  await db.transaction(
    'rw',
    [
      db.profiles,
      db.semesters,
      db.subjects,
      db.scheduleBlocks,
      db.routines,
      db.exams,
      db.assignments,
      db.attendance,
      db.grades,
      db.studySessions,
    ],
    async () => {
      await db.subjects.clear();
      await db.scheduleBlocks.clear();
      await db.routines.clear();
      await db.exams.clear();
      await db.assignments.clear();
      await db.attendance.clear();
      await db.grades.clear();
      await db.studySessions.clear();
      await db.semesters.clear();
    }
  );
}

/**
 * Aplica una plantilla oficial completa
 */
export async function applyAcademicTemplate(templateId: string): Promise<boolean> {
  const template = ACADEMIC_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return false;

  await clearAllSemesterData();

  await profileRepository.save(template.profile);
  await profileRepository.setActiveProfile(template.profile.id);
  await semesterRepository.save(template.semester);
  await subjectRepository.bulkSave(template.subjects);
  await scheduleRepository.bulkSave(template.scheduleBlocks);
  await routineRepository.bulkSave(template.routines);
  await examRepository.bulkSave(template.exams);
  await assignmentRepository.bulkSave(template.assignments);
  await attendanceRepository.bulkSave(template.attendance);

  if (typeof window !== 'undefined') {
    localStorage.setItem(IS_USER_CONFIGURED_KEY, 'true');
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
  }

  return true;
}

/**
 * Inicia un semestre completamente limpio desde cero para un estudiante nuevo
 */
export async function startFreshEmptySemester(input: {
  name: string;
  studentCode: string;
  university?: string;
  program: string;
  semesterNumber: number;
  initialSubjects?: Array<{
    name: string;
    code: string;
    color: string;
    professor?: string;
    location?: string;
    credits?: number;
    blocks?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      location: string;
    }>;
  }>;
}): Promise<void> {
  await clearAllSemesterData();

  const profileId = `profile-user-${Date.now()}`;
  const semesterId = `sem-user-${Date.now()}`;

  const profile: Profile = {
    id: profileId,
    name: input.name.trim() || 'Estudiante Icesista',
    studentCode: input.studentCode.trim() || 'A00' + Math.floor(100000 + Math.random() * 900000),
    university: input.university?.trim() || 'Universidad Icesi',
    program: input.program.trim() || 'Pregrado',
    semesterNumber: input.semesterNumber || 1,
    cohort: new Date().getFullYear().toString() + '10',
    gpa: 4.0,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(input.name)}`,
  };

  const semester: Semester = {
    id: semesterId,
    userId: profileId,
    name: `Semestre ${new Date().getFullYear()}-2 (${profile.program})`,
    startDate: `${new Date().getFullYear()}-08-01`,
    endDate: `${new Date().getFullYear()}-12-05`,
    totalWeeks: 16,
    isActive: true,
  };

  await profileRepository.save(profile);
  await profileRepository.setActiveProfile(profileId);
  await semesterRepository.save(semester);

  // Si añadió materias iniciales en el wizard
  if (input.initialSubjects && input.initialSubjects.length > 0) {
    const subjectsToSave: Subject[] = [];
    const blocksToSave: ScheduleBlock[] = [];

    input.initialSubjects.forEach((s, idx) => {
      const subId = `sub-fresh-${idx}-${Date.now()}`;
      subjectsToSave.push({
        id: subId,
        semesterId,
        name: s.name.trim(),
        code: s.code.trim() || `MAT-${101 + idx}`,
        color: s.color || '#3b3abf',
        credits: s.credits || 3,
        professor: s.professor?.trim() || 'Docente Asignado',
        maxAbsences: 4,
        passingGrade: 3.0,
      });

      if (s.blocks && s.blocks.length > 0) {
        s.blocks.forEach((b, bIdx) => {
          blocksToSave.push({
            id: `sb-fresh-${subId}-${bIdx}`,
            subjectId: subId,
            dayOfWeek: b.dayOfWeek as DayOfWeek,
            startTime: b.startTime,
            endTime: b.endTime,
            location: b.location?.trim() || s.location?.trim() || 'Campus',
          });
        });
      }
    });

    await subjectRepository.bulkSave(subjectsToSave);
    if (blocksToSave.length > 0) {
      await scheduleRepository.bulkSave(blocksToSave);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(IS_USER_CONFIGURED_KEY, 'true');
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
  }
}

/**
 * Aplica los datos extraídos por el parser inteligente (IA / Balance / Horario)
 */
export async function applyParsedAcademicData(parsed: ParsedAcademicData): Promise<void> {
  await clearAllSemesterData();

  const profileId = `profile-ai-${Date.now()}`;
  const semesterId = `sem-ai-${Date.now()}`;

  const profile: Profile = {
    id: profileId,
    name: parsed.profile.name || 'Estudiante',
    studentCode: parsed.profile.studentCode || 'A00414805',
    documentId: parsed.profile.documentId || '1110295145',
    university: parsed.profile.university || 'Universidad Icesi',
    program: parsed.profile.program || 'Ingeniería',
    semesterNumber: parsed.profile.semesterNumber || 1,
    cohort: parsed.profile.cohort || '202510',
    gpa: parsed.profile.gpa || 4.2,
    avatarUrl: parsed.profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(parsed.profile.name || 'Estudiante')}`,
  };

  const semester: Semester = {
    id: semesterId,
    userId: profileId,
    name: parsed.semester.name || `Semestre 2026-2 (${profile.program})`,
    startDate: parsed.semester.startDate || '2026-08-01',
    endDate: parsed.semester.endDate || '2026-12-05',
    totalWeeks: 16,
    isActive: true,
  };

  const subjectsToSave: Subject[] = parsed.subjects.map((s) => ({
    id: s.id,
    semesterId,
    name: s.name,
    code: s.code,
    credits: s.credits || 3,
    color: s.color,
    professor: s.professor || 'Docente Titular',
    maxAbsences: s.maxAbsences || 4,
    passingGrade: 3.0,
  }));

  const blocksToSave: ScheduleBlock[] = parsed.scheduleBlocks.map((b, i) => ({
    id: `sb-parsed-${i}-${Date.now()}`,
    subjectId: b.subjectId,
    dayOfWeek: b.dayOfWeek as DayOfWeek,
    startTime: b.startTime,
    endTime: b.endTime,
    location: b.location || 'Aula Campus',
  }));

  // Generar tareas y exámenes iniciales para que el motor empiece a calcular de inmediato
  const addDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  const examsToSave = subjectsToSave.slice(0, 3).map((sub, i) => ({
    id: `ex-parsed-${sub.id}`,
    subjectId: sub.id,
    title: `Parcial 1: Fundamentos y Primera Entrega de ${sub.name}`,
    date: addDays(7 + i * 5),
    weight: 25,
  }));

  const assignmentsToSave = subjectsToSave.slice(0, 3).map((sub, i) => ({
    id: `as-parsed-${sub.id}`,
    subjectId: sub.id,
    title: `Taller Práctico y Guía 1 de ${sub.name}`,
    dueDate: addDays(2 + i * 2),
    estimatedMinutes: 60 + i * 15,
    priority: (i === 0 ? 'high' : 'medium') as 'high' | 'medium',
    status: 'pending' as const,
  }));

  await profileRepository.save(profile);
  await profileRepository.setActiveProfile(profileId);
  await semesterRepository.save(semester);
  await subjectRepository.bulkSave(subjectsToSave);
  await scheduleRepository.bulkSave(blocksToSave);
  await examRepository.bulkSave(examsToSave);
  await assignmentRepository.bulkSave(assignmentsToSave);

  if (typeof window !== 'undefined') {
    localStorage.setItem(IS_USER_CONFIGURED_KEY, 'true');
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
  }
}
