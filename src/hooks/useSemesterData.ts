'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Subject,
  ScheduleBlock,
  Assignment,
  Exam,
  AttendanceRecord,
  FixedRoutine,
  Semester,
} from '@/types';
import {
  semesterRepository,
  subjectRepository,
  scheduleRepository,
  assignmentRepository,
  examRepository,
  attendanceRepository,
  routineRepository,
} from '@/lib/storage';
import { seedDatabaseIfEmpty } from '@/lib/mockData';

export function useSemesterData() {
  const [semester, setSemester] = useState<Semester | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [routines, setRoutines] = useState<FixedRoutine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Auto seed if empty
      await seedDatabaseIfEmpty();

      const [
        activeSem,
        allSubjects,
        allSchedule,
        allAssignments,
        allExams,
        allAttendance,
        allRoutines,
      ] = await Promise.all([
        semesterRepository.getActive(),
        subjectRepository.getAll(),
        scheduleRepository.getAll(),
        assignmentRepository.getAll(),
        examRepository.getAll(),
        attendanceRepository.getAll(),
        routineRepository.getAll(),
      ]);

      setSemester(activeSem || null);
      setSubjects(allSubjects);
      setScheduleBlocks(allSchedule);
      setAssignments(allAssignments);
      setExams(allExams);
      setAttendance(allAttendance);
      setRoutines(allRoutines);
    } catch (err) {
      console.error('Error loading semester data from Dexie:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subjects map by ID for O(1) lookups
  const subjectsMap = subjects.reduce<Record<string, Subject>>((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

  return {
    semester,
    subjects,
    subjectsMap,
    scheduleBlocks,
    assignments,
    exams,
    attendance,
    routines,
    isLoading,
    refreshData: loadData,
  };
}
