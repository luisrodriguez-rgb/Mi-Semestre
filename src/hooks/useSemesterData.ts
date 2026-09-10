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
  Profile,
} from '@/types';
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
import { seedDatabaseIfEmpty } from '@/lib/mockData';

export function useSemesterData() {
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
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
        activeProfile,
        activeSem,
        semestersList,
        allSubjects,
        allSchedule,
        allAssignments,
        allExams,
        allAttendance,
        allRoutines,
      ] = await Promise.all([
        profileRepository.getActiveProfile(),
        semesterRepository.getActive(),
        semesterRepository.getAll(),
        subjectRepository.getAll(),
        scheduleRepository.getAll(),
        assignmentRepository.getAll(),
        examRepository.getAll(),
        attendanceRepository.getAll(),
        routineRepository.getAll(),
      ]);

      setProfile(activeProfile || null);
      setSemester(activeSem || null);
      setAllSemesters(semestersList);
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

  const switchSemester = useCallback(async (semesterId: string) => {
    await semesterRepository.setActive(semesterId);
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
  }, []);

  const createSemester = useCallback(async (name: string, startDate?: string, endDate?: string) => {
    const newSem: Semester = {
      id: `sem-${Date.now()}`,
      userId: profile?.id || 'usr-default',
      name,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 120 * 24 * 3600 * 1000).toISOString().split('T')[0],
      totalWeeks: 16,
      isActive: true,
    };
    await semesterRepository.save(newSem);
    await semesterRepository.setActive(newSem.id);
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
    return newSem.id;
  }, [profile?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();

    const handleDataUpdated = () => {
      loadData();
    };

    window.addEventListener('semester-data-updated', handleDataUpdated);
    return () => {
      window.removeEventListener('semester-data-updated', handleDataUpdated);
    };
  }, [loadData]);

  // Subjects map by ID for O(1) lookups
  const subjectsMap = subjects.reduce<Record<string, Subject>>((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

  return {
    profile,
    semester,
    allSemesters,
    subjects,
    subjectsMap,
    scheduleBlocks,
    assignments,
    exams,
    attendance,
    routines,
    isLoading,
    refreshData: loadData,
    switchSemester,
    createSemester,
  };
}
