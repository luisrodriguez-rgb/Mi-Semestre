import { getSupabaseClient, isSupabaseConfigured } from './client';
import {
  profileRepository,
  semesterRepository,
  subjectRepository,
  scheduleRepository,
  assignmentRepository,
  examRepository,
  attendanceRepository,
  routineRepository,
} from '@/lib/storage';
import { Profile, Semester, Subject, ScheduleBlock, Assignment, Exam, AttendanceRecord, FixedRoutine } from '@/types';

export interface CloudSyncResult {
  success: boolean;
  message: string;
  count?: number;
}

export const syncService = {
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  async getCurrentUser() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async signUp(email: string, password: string, name: string) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado en las variables de entorno.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase no está configurado en las variables de entorno.');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  /**
   * Respalda todos los datos locales de Dexie hacia la base de datos Supabase PostgreSQL.
   */
  async pushLocalToCloud(): Promise<CloudSyncResult> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, message: 'Supabase no está configurado.' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: 'Debes iniciar sesión con tu cuenta de Supabase para respaldar tus datos en la nube.',
      };
    }

    try {
      const activeProfile = await profileRepository.getActiveProfile();
      const activeSem = await semesterRepository.getActive();
      const subjects = await subjectRepository.getAll();
      const schedule = await scheduleRepository.getAll();
      const assignments = await assignmentRepository.getAll();
      const exams = await examRepository.getAll();
      const attendance = await attendanceRepository.getAll();

      // 1. Guardar o actualizar perfil
      if (activeProfile) {
        await supabase.from('profiles').upsert({
          id: user.id,
          name: activeProfile.name || user.email?.split('@')[0] || 'Estudiante',
          university: activeProfile.university || 'Universidad Icesi',
          program: activeProfile.program || 'Ingeniería',
          semester_number: activeProfile.semesterNumber || 1,
          updated_at: new Date().toISOString(),
        });
      }

      // 2. Semestre activo
      const semId = activeSem?.id || `sem-${Date.now()}`;
      await supabase.from('semesters').upsert({
        id: semId,
        user_id: user.id,
        name: activeSem?.name || 'Semestre 2026-2',
        start_date: activeSem?.startDate || new Date().toISOString().split('T')[0],
        end_date: activeSem?.endDate || new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString().split('T')[0],
        is_active: true,
        total_weeks: activeSem?.totalWeeks || 16,
      });

      // 3. Materias
      if (subjects.length > 0) {
        const subjectsPayload = subjects.map((s) => ({
          id: s.id,
          semester_id: semId,
          name: s.name,
          code: s.code,
          professor: s.professor || '',
          credits: s.credits || 3,
          color: s.color || '#3b3abf',
          max_absences: s.maxAbsences || 4,
          passing_grade: s.passingGrade || 3.0,
          current_grade: s.currentGrade || null,
        }));
        await supabase.from('subjects').upsert(subjectsPayload);
      }

      // 4. Bloques de horario
      if (schedule.length > 0) {
        const schedulePayload = schedule.map((b) => ({
          id: b.id,
          subject_id: b.subjectId,
          day_of_week: b.dayOfWeek,
          start_time: b.startTime,
          end_time: b.endTime,
          location: b.location || '',
        }));
        await supabase.from('schedule_blocks').upsert(schedulePayload);
      }

      // 5. Tareas
      if (assignments.length > 0) {
        const assignmentsPayload = assignments.map((a) => ({
          id: a.id,
          subject_id: a.subjectId,
          title: a.title,
          description: a.description || '',
          due_date: new Date(a.dueDate).toISOString(),
          priority: a.priority || 'medium',
          estimated_minutes: a.estimatedMinutes || 60,
          status: a.status || 'pending',
        }));
        await supabase.from('assignments').upsert(assignmentsPayload);
      }

      // 6. Exámenes
      if (exams.length > 0) {
        const examsPayload = exams.map((e) => ({
          id: e.id,
          subject_id: e.subjectId,
          title: e.title,
          date: new Date(e.date).toISOString(),
          weight: e.weight || 25,
          topics: e.topics || [],
        }));
        await supabase.from('exams').upsert(examsPayload);
      }

      // 7. Asistencias
      if (attendance.length > 0) {
        const attendancePayload = attendance.map((at) => ({
          id: at.id,
          subject_id: at.subjectId,
          date: at.date,
          status: at.status,
        }));
        await supabase.from('attendance').upsert(attendancePayload);
      }

      // 8. Rutinas fijas del usuario
      const routines = await routineRepository.getAll();
      if (routines.length > 0) {
        const routinesPayload = routines.map((r) => ({
          id: r.id,
          user_id: user.id,
          day_of_week: r.dayOfWeek,
          start_time: r.startTime,
          end_time: r.endTime,
          title: r.title,
          type: r.type,
        }));
        await supabase.from('routines').upsert(routinesPayload);
      }

      return {
        success: true,
        message: '¡Datos respaldados con éxito en Supabase PostgreSQL!',
        count: subjects.length,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al conectar con la base de datos de Supabase.';
      console.error('Error al sincronizar con Supabase:', err);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },

  /**
   * Descarga la información desde Supabase y la restaura en Dexie (IndexedDB local).
   */
  async pullCloudToLocal(): Promise<CloudSyncResult> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, message: 'Supabase no está configurado.' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: 'Debes iniciar sesión para restaurar tus datos desde la nube.',
      };
    }

    try {
      // 1. Obtener semestre del usuario
      const { data: semData, error: semErr } = await supabase
        .from('semesters')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      if (semErr) throw semErr;
      if (!semData || semData.length === 0) {
        return { success: false, message: 'No se encontraron semestres en la nube para tu cuenta.' };
      }

      const cloudSem = semData[0];
      const semester: Semester = {
        id: cloudSem.id,
        userId: user.id,
        name: cloudSem.name,
        startDate: cloudSem.start_date,
        endDate: cloudSem.end_date,
        isActive: cloudSem.is_active,
        totalWeeks: cloudSem.total_weeks || 16,
      };
      await semesterRepository.save(semester);

      // 2. Obtener materias pertenecientes al semestre activo
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('semester_id', cloudSem.id);

      const subjectIds: string[] = [];
      if (subjectsData && subjectsData.length > 0) {
        for (const s of subjectsData) {
          subjectIds.push(s.id);
          const sub: Subject = {
            id: s.id,
            semesterId: s.semester_id,
            name: s.name,
            code: s.code,
            professor: s.professor,
            credits: s.credits,
            color: s.color,
            maxAbsences: s.max_absences,
            passingGrade: s.passing_grade,
            currentGrade: s.current_grade,
          };
          await subjectRepository.save(sub);
        }
      }

      // Si existen materias, restaurar entidades dependientes acotadas por subject_id
      if (subjectIds.length > 0) {
        // 3. Bloques de horario
        const { data: scheduleData } = await supabase
          .from('schedule_blocks')
          .select('*')
          .in('subject_id', subjectIds);
        if (scheduleData && scheduleData.length > 0) {
          for (const b of scheduleData) {
            const block: ScheduleBlock = {
              id: b.id,
              subjectId: b.subject_id,
              dayOfWeek: b.day_of_week,
              startTime: b.start_time,
              endTime: b.end_time,
              location: b.location,
            };
            await scheduleRepository.save(block);
          }
        }

        // 4. Tareas
        const { data: assignmentsData } = await supabase
          .from('assignments')
          .select('*')
          .in('subject_id', subjectIds);
        if (assignmentsData && assignmentsData.length > 0) {
          for (const a of assignmentsData) {
            const task: Assignment = {
              id: a.id,
              subjectId: a.subject_id,
              title: a.title,
              description: a.description,
              dueDate: a.due_date,
              priority: a.priority,
              estimatedMinutes: a.estimated_minutes,
              status: a.status,
            };
            await assignmentRepository.save(task);
          }
        }

        // 5. Exámenes
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .in('subject_id', subjectIds);
        if (examsData && examsData.length > 0) {
          for (const e of examsData) {
            const exam: Exam = {
              id: e.id,
              subjectId: e.subject_id,
              title: e.title,
              date: e.date,
              weight: e.weight,
              topics: e.topics,
            };
            await examRepository.save(exam);
          }
        }

        // 6. Asistencias
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('*')
          .in('subject_id', subjectIds);
        if (attendanceData && attendanceData.length > 0) {
          for (const at of attendanceData) {
            const record: AttendanceRecord = {
              id: at.id,
              subjectId: at.subject_id,
              date: at.date,
              status: at.status,
            };
            await attendanceRepository.save(record);
          }
        }
      }

      // 7. Rutinas fijas del usuario
      const { data: routinesData } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id);
      if (routinesData && routinesData.length > 0) {
        for (const r of routinesData) {
          const routine: FixedRoutine = {
            id: r.id,
            dayOfWeek: r.day_of_week,
            startTime: r.start_time,
            endTime: r.end_time,
            title: r.title,
            type: r.type,
          };
          await routineRepository.save(routine);
        }
      }

      window.dispatchEvent(new CustomEvent('semester-data-updated'));

      return {
        success: true,
        message: '¡Datos descargados y restaurados localmente con éxito!',
        count: subjectsData?.length || 0,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al descargar datos de la nube.';
      console.error('Error al restaurar desde Supabase:', err);
      return {
        success: false,
        message: errorMessage,
      };
    }
  },
};
