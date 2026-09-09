import Dexie, { Table } from 'dexie';
import {
  Profile,
  Semester,
  Subject,
  ScheduleBlock,
  Assignment,
  Exam,
  AttendanceRecord,
  Grade,
  StudySession,
  FixedRoutine,
} from '@/types';

export class SemesterDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  semesters!: Table<Semester, string>;
  subjects!: Table<Subject, string>;
  scheduleBlocks!: Table<ScheduleBlock, string>;
  assignments!: Table<Assignment, string>;
  exams!: Table<Exam, string>;
  attendance!: Table<AttendanceRecord, string>;
  grades!: Table<Grade, string>;
  studySessions!: Table<StudySession, string>;
  routines!: Table<FixedRoutine, string>;

  constructor() {
    super('MiSemestreDB');

    this.version(2).stores({
      profiles: 'id, studentCode, university',
      semesters: 'id, userId, isActive',
      subjects: 'id, semesterId, code',
      scheduleBlocks: 'id, subjectId, dayOfWeek, startTime',
      assignments: 'id, subjectId, dueDate, status, priority',
      exams: 'id, subjectId, date',
      attendance: 'id, subjectId, date, status',
      grades: 'id, subjectId',
      studySessions: 'id, subjectId, startAt, status',
      routines: 'id, dayOfWeek, type',
    });
  }
}

export const db = new SemesterDatabase();
