import {
  Semester,
  Subject,
  ScheduleBlock,
  Assignment,
  Exam,
  AttendanceRecord,
  FixedRoutine,
} from '@/types';
import {
  semesterRepository,
  subjectRepository,
  scheduleRepository,
  assignmentRepository,
  examRepository,
  attendanceRepository,
  routineRepository,
} from './storage';

export const mockSemester: Semester = {
  id: 'sem-2026-2',
  userId: 'user-demo',
  name: 'Semestre 2026-2 (Ingeniería)',
  startDate: '2026-08-03',
  endDate: '2026-11-27',
  isActive: true,
  totalWeeks: 16,
};

export const mockSubjects: Subject[] = [
  {
    id: 'sub-calculo',
    semesterId: 'sem-2026-2',
    name: 'Cálculo Multivariado',
    code: 'MAT301',
    professor: 'Dr. Alejandro Ramírez',
    credits: 4,
    color: '#6366f1', // Indigo
    maxAbsences: 4,
    passingGrade: 3.0,
    currentGrade: 3.8,
  },
  {
    id: 'sub-fisica',
    semesterId: 'sem-2026-2',
    name: 'Física Mecánica',
    code: 'FIS201',
    professor: 'Ing. Sandra Torres',
    credits: 4,
    color: '#0ea5e9', // Sky / Cyan
    maxAbsences: 4,
    passingGrade: 3.0,
    currentGrade: 4.2,
  },
  {
    id: 'sub-algebra',
    semesterId: 'sem-2026-2',
    name: 'Álgebra Lineal',
    code: 'MAT202',
    professor: 'Dra. Claudia Morales',
    credits: 3,
    color: '#8b5cf6', // Violet
    maxAbsences: 4,
    passingGrade: 3.0,
    currentGrade: 4.5,
  },
  {
    id: 'sub-estructuras',
    semesterId: 'sem-2026-2',
    name: 'Estructuras de Datos',
    code: 'SIS302',
    professor: 'Ing. Carlos Mendoza',
    credits: 4,
    color: '#10b981', // Emerald
    maxAbsences: 4,
    passingGrade: 3.0,
    currentGrade: 4.1,
  },
  {
    id: 'sub-ingles',
    semesterId: 'sem-2026-2',
    name: 'Inglés Técnico III',
    code: 'IDM301',
    professor: 'Prof. David Smith',
    credits: 2,
    color: '#f59e0b', // Amber
    maxAbsences: 4,
    passingGrade: 3.0,
    currentGrade: 4.8,
  },
];

export const mockScheduleBlocks: ScheduleBlock[] = [
  // Lunes
  { id: 'b-lun-1', subjectId: 'sub-calculo', dayOfWeek: 1, startTime: '07:00', endTime: '09:00', location: 'Edificio A · Salón 204' },
  { id: 'b-lun-2', subjectId: 'sub-estructuras', dayOfWeek: 1, startTime: '16:00', endTime: '18:00', location: 'Laboratorio de Cómputo 4' },

  // Martes
  { id: 'b-mar-1', subjectId: 'sub-fisica', dayOfWeek: 2, startTime: '10:00', endTime: '12:00', location: 'Edificio B · Aula 102' },
  { id: 'b-mar-2', subjectId: 'sub-algebra', dayOfWeek: 2, startTime: '14:00', endTime: '16:00', location: 'Edificio A · Salón 305' },

  // Miércoles
  { id: 'b-mie-1', subjectId: 'sub-calculo', dayOfWeek: 3, startTime: '07:00', endTime: '09:00', location: 'Edificio A · Salón 204' },
  { id: 'b-mie-2', subjectId: 'sub-estructuras', dayOfWeek: 3, startTime: '16:00', endTime: '18:00', location: 'Laboratorio de Cómputo 4' },

  // Jueves
  { id: 'b-jue-1', subjectId: 'sub-fisica', dayOfWeek: 4, startTime: '10:00', endTime: '12:00', location: 'Edificio B · Aula 102' },
  { id: 'b-jue-2', subjectId: 'sub-algebra', dayOfWeek: 4, startTime: '14:00', endTime: '16:00', location: 'Edificio A · Salón 305' },

  // Viernes
  { id: 'b-vie-1', subjectId: 'sub-calculo', dayOfWeek: 5, startTime: '07:00', endTime: '08:00', location: 'Edificio A · Salón 204' },
  { id: 'b-vie-2', subjectId: 'sub-ingles', dayOfWeek: 5, startTime: '16:00', endTime: '18:00', location: 'Centro de Idiomas · Virtual' },
];

export const mockRoutines: FixedRoutine[] = [
  { id: 'r-almuerzo-1', title: 'Almuerzo', type: 'meal', dayOfWeek: 1, startTime: '12:00', endTime: '13:00' },
  { id: 'r-almuerzo-2', title: 'Almuerzo', type: 'meal', dayOfWeek: 2, startTime: '12:00', endTime: '13:00' },
  { id: 'r-almuerzo-3', title: 'Almuerzo', type: 'meal', dayOfWeek: 3, startTime: '12:00', endTime: '13:00' },
  { id: 'r-almuerzo-4', title: 'Almuerzo', type: 'meal', dayOfWeek: 4, startTime: '12:00', endTime: '13:00' },
  { id: 'r-almuerzo-5', title: 'Almuerzo', type: 'meal', dayOfWeek: 5, startTime: '12:00', endTime: '13:00' },
  { id: 'r-gym-1', title: 'Gimnasio', type: 'gym', dayOfWeek: 1, startTime: '18:30', endTime: '19:30' },
  { id: 'r-gym-3', title: 'Gimnasio', type: 'gym', dayOfWeek: 3, startTime: '18:30', endTime: '19:30' },
];

// Fechas dinámicas calculadas cerca de hoy
const now = new Date();
const addDays = (d: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + d);
  return date.toISOString().split('T')[0];
};

export const mockExams: Exam[] = [
  {
    id: 'exam-calc-2',
    subjectId: 'sub-calculo',
    title: 'Parcial 2: Integrales Múltiples y Teorema de Green',
    date: `${addDays(4)}T08:00:00`,
    weight: 25,
    topics: ['Integrales dobles y triples', 'Cambio de coordenadas polares', 'Teorema de Green'],
  },
  {
    id: 'exam-estructuras-1',
    subjectId: 'sub-estructuras',
    title: 'Entrega Proyecto Fase 1: Árboles AVL y Grafos',
    date: `${addDays(8)}T23:59:00`,
    weight: 20,
    topics: ['Árboles autobalanceados', 'Dijkstra', 'Recorridos DFS/BFS'],
  },
  {
    id: 'exam-fisica-2',
    subjectId: 'sub-fisica',
    title: 'Parcial 2: Dinámica Rotacional y Torque',
    date: `${addDays(12)}T10:00:00`,
    weight: 25,
  },
  {
    id: 'exam-algebra-1',
    subjectId: 'sub-algebra',
    title: 'Quiz 2: Espacios Vectoriales e Independencia',
    date: `${addDays(16)}T14:00:00`,
    weight: 15,
  },
];

export const mockAssignments: Assignment[] = [
  {
    id: 'ass-calc-1',
    subjectId: 'sub-calculo',
    title: 'Taller 4: Ejercicios 1 a 12 de Integrales de Superficie',
    description: 'Guía de preparación previa al parcial de cálculo.',
    dueDate: `${addDays(2)}T23:59:00`,
    priority: 'high',
    estimatedMinutes: 60,
    status: 'pending',
  },
  {
    id: 'ass-calc-2',
    subjectId: 'sub-calculo',
    title: 'Simulacro de examen en grupo',
    description: 'Resolver modelo de parcial 2025-2.',
    dueDate: `${addDays(3)}T18:00:00`,
    priority: 'high',
    estimatedMinutes: 90,
    status: 'pending',
  },
  {
    id: 'ass-fisica-1',
    subjectId: 'sub-fisica',
    title: 'Informe de Laboratorio: Momento de Inercia',
    description: 'Redactar análisis de error y gráficas en Python/Excel.',
    dueDate: `${addDays(6)}T14:00:00`,
    priority: 'medium',
    estimatedMinutes: 75,
    status: 'pending',
  },
  {
    id: 'ass-estructuras-1',
    subjectId: 'sub-estructuras',
    title: 'Implementar Algoritmo de Floyd-Warshall en C++',
    dueDate: `${addDays(7)}T20:00:00`,
    priority: 'high',
    estimatedMinutes: 90,
    status: 'in_progress',
  },
  {
    id: 'ass-ingles-1',
    subjectId: 'sub-ingles',
    title: 'Lectura: Clean Architecture & Microservices Paper',
    dueDate: `${addDays(10)}T16:00:00`,
    priority: 'low',
    estimatedMinutes: 40,
    status: 'pending',
  },
];

export const mockAttendance: AttendanceRecord[] = [
  { id: 'att-calc-1', subjectId: 'sub-calculo', date: addDays(-20), status: 'present' },
  { id: 'att-calc-2', subjectId: 'sub-calculo', date: addDays(-18), status: 'present' },
  { id: 'att-calc-3', subjectId: 'sub-calculo', date: addDays(-15), status: 'absent' }, // Falta 1
  { id: 'att-calc-4', subjectId: 'sub-calculo', date: addDays(-13), status: 'present' },
  { id: 'att-calc-5', subjectId: 'sub-calculo', date: addDays(-11), status: 'present' },
  { id: 'att-calc-6', subjectId: 'sub-calculo', date: addDays(-8), status: 'absent' },  // Falta 2 (Quedan 2 faltas de 4 permitidas)
  { id: 'att-calc-7', subjectId: 'sub-calculo', date: addDays(-6), status: 'present' },
  { id: 'att-calc-8', subjectId: 'sub-calculo', date: addDays(-4), status: 'present' },
  { id: 'att-calc-9', subjectId: 'sub-calculo', date: addDays(-1), status: 'present' },

  { id: 'att-fis-1', subjectId: 'sub-fisica', date: addDays(-14), status: 'present' },
  { id: 'att-fis-2', subjectId: 'sub-fisica', date: addDays(-7), status: 'present' },
  { id: 'att-fis-3', subjectId: 'sub-fisica', date: addDays(-2), status: 'absent' }, // Falta 1
];

export async function seedDatabaseIfEmpty(): Promise<boolean> {
  const existing = await semesterRepository.getAll();
  if (existing.length === 0) {
    await semesterRepository.save(mockSemester);
    await subjectRepository.bulkSave(mockSubjects);
    await scheduleRepository.bulkSave(mockScheduleBlocks);
    await routineRepository.bulkSave(mockRoutines);
    await examRepository.bulkSave(mockExams);
    await assignmentRepository.bulkSave(mockAssignments);
    await attendanceRepository.bulkSave(mockAttendance);
    return true;
  }
  return false;
}

export async function resetDatabaseToDemo(): Promise<void> {
  const { db } = await import('./storage/database');
  await db.delete();
  await db.open();
  await semesterRepository.save(mockSemester);
  await subjectRepository.bulkSave(mockSubjects);
  await scheduleRepository.bulkSave(mockScheduleBlocks);
  await routineRepository.bulkSave(mockRoutines);
  await examRepository.bulkSave(mockExams);
  await assignmentRepository.bulkSave(mockAssignments);
  await attendanceRepository.bulkSave(mockAttendance);
}
