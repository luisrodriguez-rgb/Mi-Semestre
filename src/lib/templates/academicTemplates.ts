import { Profile, Semester, Subject, ScheduleBlock, Assignment, Exam, FixedRoutine, AttendanceRecord } from '@/types';

export interface AcademicTemplate {
  id: string;
  name: string;
  faculty: string;
  semesterNumber: number;
  description: string;
  badge: string;
  profile: Profile;
  semester: Semester;
  subjects: Subject[];
  scheduleBlocks: ScheduleBlock[];
  routines: FixedRoutine[];
  exams: Exam[];
  assignments: Assignment[];
  attendance: AttendanceRecord[];
}

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

export const ACADEMIC_TEMPLATES: AcademicTemplate[] = [
  // 1. INGENIERÍA INDUSTRIAL - SEMESTRE 4 (ICESI OFICIAL - LUIS ERNESTO)
  {
    id: 'template-industrial-4',
    name: 'Ingeniería Industrial · Semestre 4',
    faculty: 'Facultad de Ingeniería, Diseño y Ciencias Aplicadas',
    semesterNumber: 4,
    badge: 'Perfil Oficial Icesi',
    description: '5 materias matriculadas: Estadística II, Física II, Optimización, Matemáticas Aplicadas III y Optativa.',
    profile: {
      id: 'profile-luis-ernesto',
      name: 'Luis Ernesto Rodríguez Gurrute',
      studentCode: 'A00414805',
      documentId: '1110295145',
      university: 'Universidad Icesi',
      program: 'Ingeniería Industrial',
      semesterNumber: 4,
      cohort: '202510',
      gpa: 4.3,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Luis%20Ernesto%20Rodriguez',
    },
    semester: {
      id: 'sem-2026-2-industrial',
      userId: 'profile-luis-ernesto',
      name: 'Semestre 2026-2 (Ingeniería Industrial)',
      startDate: '2026-08-03',
      endDate: '2026-12-05',
      totalWeeks: 16,
      isActive: true,
    },
    subjects: [
      {
        id: 'sub-ind-opt',
        semesterId: 'sem-2026-2-industrial',
        code: 'IND 05359',
        name: 'Optimización',
        credits: 3,
        professor: 'Ing. Carlos A. Gómez',
        color: '#3b3abf',
        maxAbsences: 4,
        passingGrade: 3.0,
      },
      {
        id: 'sub-cft-est2',
        semesterId: 'sem-2026-2-industrial',
        code: 'CFT 11373',
        name: 'Estadística Aplicada II',
        credits: 3,
        professor: 'Dra. María Elena Restrepo',
        color: '#0284c7',
        maxAbsences: 4,
        passingGrade: 3.0,
      },
      {
        id: 'sub-cft-fis2',
        semesterId: 'sem-2026-2-industrial',
        code: 'CFT 11370',
        name: 'Física II',
        credits: 4,
        professor: 'Dr. Fernando Salazar',
        color: '#ea580c',
        maxAbsences: 5,
        passingGrade: 3.0,
      },
      {
        id: 'sub-cft-mat3',
        semesterId: 'sem-2026-2-industrial',
        code: 'CFT 11356',
        name: 'Matemáticas Aplicadas III',
        credits: 4,
        professor: 'Dra. Patricia Arango',
        color: '#7c3aed',
        maxAbsences: 5,
        passingGrade: 3.0,
      },
      {
        id: 'sub-ind-optp',
        semesterId: 'sem-2026-2-industrial',
        code: 'IND 05358',
        name: 'Optativa Profesional',
        credits: 3,
        professor: 'Ing. Alejandro Echeverry',
        color: '#16a34a',
        maxAbsences: 4,
        passingGrade: 3.0,
      },
    ],
    scheduleBlocks: [
      { id: 'sb-opt-1', subjectId: 'sub-ind-opt', dayOfWeek: 1, startTime: '07:00', endTime: '09:00', location: 'Salón 204E' },
      { id: 'sb-opt-2', subjectId: 'sub-ind-opt', dayOfWeek: 3, startTime: '07:00', endTime: '09:00', location: 'Salón 204E' },
      { id: 'sb-est-1', subjectId: 'sub-cft-est2', dayOfWeek: 2, startTime: '09:00', endTime: '11:00', location: 'Aula 102A' },
      { id: 'sb-est-2', subjectId: 'sub-cft-est2', dayOfWeek: 4, startTime: '09:00', endTime: '11:00', location: 'Aula 102A' },
      { id: 'sb-fis-1', subjectId: 'sub-cft-fis2', dayOfWeek: 1, startTime: '11:00', endTime: '13:00', location: 'Salón 301D' },
      { id: 'sb-fis-2', subjectId: 'sub-cft-fis2', dayOfWeek: 3, startTime: '11:00', endTime: '13:00', location: 'Salón 301D' },
      { id: 'sb-mat-1', subjectId: 'sub-cft-mat3', dayOfWeek: 2, startTime: '14:00', endTime: '16:00', location: 'Auditorio Varela' },
      { id: 'sb-mat-2', subjectId: 'sub-cft-mat3', dayOfWeek: 4, startTime: '14:00', endTime: '16:00', location: 'Auditorio Varela' },
      { id: 'sb-optp-1', subjectId: 'sub-ind-optp', dayOfWeek: 5, startTime: '08:00', endTime: '11:00', location: 'Edificio C Lab 4' },
    ],
    routines: [
      { id: 'rout-ind-1', title: 'Almuerzo y Pausa Activa', startTime: '13:00', endTime: '14:00', dayOfWeek: 1, type: 'meal' },
      { id: 'rout-ind-2', title: 'Almuerzo y Pausa Activa', startTime: '13:00', endTime: '14:00', dayOfWeek: 2, type: 'meal' },
      { id: 'rout-ind-3', title: 'Almuerzo y Pausa Activa', startTime: '13:00', endTime: '14:00', dayOfWeek: 3, type: 'meal' },
      { id: 'rout-ind-4', title: 'Almuerzo y Pausa Activa', startTime: '13:00', endTime: '14:00', dayOfWeek: 4, type: 'meal' },
      { id: 'rout-ind-5', title: 'Gimnasio / Deporte Icesi', startTime: '17:00', endTime: '18:30', dayOfWeek: 1, type: 'gym' },
    ],
    exams: [
      { id: 'ex-opt-1', subjectId: 'sub-ind-opt', title: 'Parcial 1: Programación Lineal y Simplex', date: addDays(6), weight: 25 },
      { id: 'ex-est-1', subjectId: 'sub-cft-est2', title: 'Examen: Regresión Múltiple y ANOVA', date: addDays(12), weight: 20 },
      { id: 'ex-mat-1', subjectId: 'sub-cft-mat3', title: 'Parcial 2: Ecuaciones Diferenciales y Laplace', date: addDays(18), weight: 30 },
    ],
    assignments: [
      { id: 'as-opt-1', subjectId: 'sub-ind-opt', title: 'Taller 3: Formulación en GAMS y Sensibilidad', dueDate: addDays(2), estimatedMinutes: 90, priority: 'high', status: 'pending' },
      { id: 'as-est-1', subjectId: 'sub-cft-est2', title: 'Informe de Laboratorio RStudio', dueDate: addDays(4), estimatedMinutes: 60, priority: 'medium', status: 'pending' },
      { id: 'as-fis-1', subjectId: 'sub-cft-fis2', title: 'Guía de Ondas Electromagnéticas', dueDate: addDays(7), estimatedMinutes: 45, priority: 'low', status: 'pending' },
    ],
    attendance: [
      { id: 'att-ind-1', subjectId: 'sub-ind-opt', date: addDays(-7), status: 'present' },
      { id: 'att-ind-2', subjectId: 'sub-cft-est2', date: addDays(-5), status: 'present' },
      { id: 'att-ind-3', subjectId: 'sub-cft-fis2', date: addDays(-3), status: 'absent' },
    ],
  },

  // 2. INGENIERÍA DE SISTEMAS - SEMESTRE 5
  {
    id: 'template-sistemas-5',
    name: 'Ingeniería de Sistemas · Semestre 5',
    faculty: 'Facultad de Ingeniería, Diseño y Ciencias Aplicadas',
    semesterNumber: 5,
    badge: 'Popular',
    description: 'Cálculo Multivariado, Física Mecánica, Estructuras de Datos, Álgebra Lineal e Inglés Técnico.',
    profile: {
      id: 'profile-sistemas',
      name: 'Luis Felipe Rodríguez',
      studentCode: 'A00389124',
      documentId: '1144098231',
      university: 'Universidad Icesi',
      program: 'Ingeniería de Sistemas',
      semesterNumber: 5,
      cohort: '202420',
      gpa: 4.4,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Luis%20Felipe%20Sistemas',
    },
    semester: {
      id: 'sem-2026-2-sistemas',
      userId: 'profile-sistemas',
      name: 'Semestre 2026-2 (Ingeniería de Sistemas)',
      startDate: '2026-08-03',
      endDate: '2026-12-05',
      totalWeeks: 16,
      isActive: true,
    },
    subjects: [
      { id: 'sub-calc', semesterId: 'sem-2026-2-sistemas', code: 'MAT-301', name: 'Cálculo Multivariado', credits: 4, professor: 'Dr. Álvaro Perea', color: '#3b3abf', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-fis', semesterId: 'sem-2026-2-sistemas', code: 'FIS-201', name: 'Física Mecánica', credits: 4, professor: 'Dra. Sandra Miller', color: '#0284c7', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-ed', semesterId: 'sem-2026-2-sistemas', code: 'SIS-302', name: 'Estructuras de Datos', credits: 3, professor: 'MSc. Rodrigo Henao', color: '#16a34a', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-alg', semesterId: 'sem-2026-2-sistemas', code: 'MAT-202', name: 'Álgebra Lineal', credits: 3, professor: 'Dr. Hernando Ortiz', color: '#7c3aed', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-ing', semesterId: 'sem-2026-2-sistemas', code: 'IDI-103', name: 'Inglés Técnico III', credits: 2, professor: 'Prof. Mark Jenkins', color: '#d97706', maxAbsences: 3, passingGrade: 3.0 },
    ],
    scheduleBlocks: [
      { id: 'sb-calc-1', subjectId: 'sub-calc', dayOfWeek: 1, startTime: '07:00', endTime: '09:00', location: 'Salón 204E' },
      { id: 'sb-calc-2', subjectId: 'sub-calc', dayOfWeek: 3, startTime: '07:00', endTime: '09:00', location: 'Salón 204E' },
      { id: 'sb-fis-1', subjectId: 'sub-fis', dayOfWeek: 2, startTime: '09:00', endTime: '11:00', location: 'Aula 102A' },
      { id: 'sb-fis-2', subjectId: 'sub-fis', dayOfWeek: 4, startTime: '09:00', endTime: '11:00', location: 'Aula 102A' },
      { id: 'sb-ed-1', subjectId: 'sub-ed', dayOfWeek: 1, startTime: '11:00', endTime: '13:00', location: 'Lab 3 Software' },
      { id: 'sb-ed-2', subjectId: 'sub-ed', dayOfWeek: 3, startTime: '11:00', endTime: '13:00', location: 'Lab 3 Software' },
      { id: 'sb-alg-1', subjectId: 'sub-alg', dayOfWeek: 2, startTime: '14:00', endTime: '16:00', location: 'Salón 305B' },
      { id: 'sb-alg-2', subjectId: 'sub-alg', dayOfWeek: 4, startTime: '14:00', endTime: '16:00', location: 'Salón 305B' },
      { id: 'sb-ing-1', subjectId: 'sub-ing', dayOfWeek: 5, startTime: '08:00', endTime: '10:00', location: 'Centro de Idiomas' },
    ],
    routines: [
      { id: 'rout-sis-1', title: 'Almuerzo en Campus', startTime: '13:00', endTime: '14:00', dayOfWeek: 1, type: 'meal' },
      { id: 'rout-sis-2', title: 'Almuerzo en Campus', startTime: '13:00', endTime: '14:00', dayOfWeek: 2, type: 'meal' },
    ],
    exams: [
      { id: 'ex-calc-1', subjectId: 'sub-calc', title: 'Parcial 2: Integrales Múltiples y Teorema de Green', date: addDays(5), weight: 25 },
      { id: 'ex-fis-1', subjectId: 'sub-fis', title: 'Parcial 1: Cinemática y Dinámica', date: addDays(13), weight: 20 },
    ],
    assignments: [
      { id: 'as-calc-1', subjectId: 'sub-calc', title: 'Taller 4: Integrales de Superficie', dueDate: addDays(1), estimatedMinutes: 60, priority: 'high', status: 'pending' },
      { id: 'as-fis-1', subjectId: 'sub-fis', title: 'Informe de Laboratorio: Momento de Inercia', dueDate: addDays(3), estimatedMinutes: 75, priority: 'medium', status: 'pending' },
    ],
    attendance: [],
  },

  // 3. ADMINISTRACIÓN DE EMPRESAS - SEMESTRE 3
  {
    id: 'template-administracion-3',
    name: 'Administración de Empresas · Semestre 3',
    faculty: 'Escuela de Negocios y Economía',
    semesterNumber: 3,
    badge: 'Negocios',
    description: 'Contabilidad Financiera, Microeconomía I, Fundamentos de Mercadeo y Pensamiento Estratégico.',
    profile: {
      id: 'profile-admon',
      name: 'Estudiante de Negocios',
      studentCode: 'A00450123',
      documentId: '1109876543',
      university: 'Universidad Icesi',
      program: 'Administración de Empresas',
      semesterNumber: 3,
      cohort: '202520',
      gpa: 4.2,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Admon%20Icesi',
    },
    semester: {
      id: 'sem-2026-2-admon',
      userId: 'profile-admon',
      name: 'Semestre 2026-2 (Administración)',
      startDate: '2026-08-03',
      endDate: '2026-12-05',
      totalWeeks: 16,
      isActive: true,
    },
    subjects: [
      { id: 'sub-conta', semesterId: 'sem-2026-2-admon', code: 'ADM-201', name: 'Contabilidad Financiera', credits: 3, professor: 'Dr. Germán Nieto', color: '#0d9488', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-micro', semesterId: 'sem-2026-2-admon', code: 'ECO-102', name: 'Microeconomía I', credits: 3, professor: 'Dra. Liliana Valdés', color: '#3b3abf', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-mkt', semesterId: 'sem-2026-2-admon', code: 'MER-201', name: 'Fundamentos de Mercadeo', credits: 3, professor: 'MSc. Camilo Paz', color: '#db2777', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-estrat', semesterId: 'sem-2026-2-admon', code: 'ADM-305', name: 'Pensamiento Estratégico', credits: 3, professor: 'Dr. Víctor Botero', color: '#d97706', maxAbsences: 4, passingGrade: 3.0 },
    ],
    scheduleBlocks: [
      { id: 'sb-conta-1', subjectId: 'sub-conta', dayOfWeek: 1, startTime: '08:00', endTime: '10:00', location: 'Edificio B Salón 105' },
      { id: 'sb-conta-2', subjectId: 'sub-conta', dayOfWeek: 3, startTime: '08:00', endTime: '10:00', location: 'Edificio B Salón 105' },
      { id: 'sb-micro-1', subjectId: 'sub-micro', dayOfWeek: 2, startTime: '10:00', endTime: '12:00', location: 'Edificio C Aula 201' },
      { id: 'sb-micro-2', subjectId: 'sub-micro', dayOfWeek: 4, startTime: '10:00', endTime: '12:00', location: 'Edificio C Aula 201' },
      { id: 'sb-mkt-1', subjectId: 'sub-mkt', dayOfWeek: 1, startTime: '14:00', endTime: '16:00', location: 'Salón Multipropósito' },
      { id: 'sb-estrat-1', subjectId: 'sub-estrat', dayOfWeek: 5, startTime: '09:00', endTime: '12:00', location: 'Auditorio Banco de Bogotá' },
    ],
    routines: [],
    exams: [
      { id: 'ex-conta-1', subjectId: 'sub-conta', title: 'Parcial: Estados Financieros y Balance General', date: addDays(8), weight: 30 },
    ],
    assignments: [
      { id: 'as-micro-1', subjectId: 'sub-micro', title: 'Caso Harvard: Elasticidad y Monopolio', dueDate: addDays(3), estimatedMinutes: 80, priority: 'high', status: 'pending' },
    ],
    attendance: [],
  },

  // 4. MEDICINA / CIENCIAS DE LA SALUD - SEMESTRE 2
  {
    id: 'template-medicina-2',
    name: 'Medicina · Semestre 2',
    faculty: 'Facultad de Ciencias de la Salud',
    semesterNumber: 2,
    badge: 'Salud',
    description: 'Anatomía Humana, Bioquímica Médica, Histología y Salud Comunitaria.',
    profile: {
      id: 'profile-med',
      name: 'Estudiante de Salud',
      studentCode: 'A00512890',
      documentId: '1107654321',
      university: 'Universidad Icesi',
      program: 'Medicina',
      semesterNumber: 2,
      cohort: '202610',
      gpa: 4.6,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Medicina%20Icesi',
    },
    semester: {
      id: 'sem-2026-2-med',
      userId: 'profile-med',
      name: 'Semestre 2026-2 (Medicina)',
      startDate: '2026-08-03',
      endDate: '2026-12-05',
      totalWeeks: 16,
      isActive: true,
    },
    subjects: [
      { id: 'sub-anat', semesterId: 'sem-2026-2-med', code: 'MED-101', name: 'Anatomía Humana I', credits: 5, professor: 'Dr. Jorge Barco', color: '#ea580c', maxAbsences: 3, passingGrade: 3.0 },
      { id: 'sub-bioq', semesterId: 'sem-2026-2-med', code: 'BIO-202', name: 'Bioquímica Médica', credits: 4, professor: 'Dra. Martha Lucía R.', color: '#0284c7', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-histo', semesterId: 'sem-2026-2-med', code: 'MED-104', name: 'Histología General', credits: 3, professor: 'Dr. Diego Villamizar', color: '#7c3aed', maxAbsences: 3, passingGrade: 3.0 },
    ],
    scheduleBlocks: [
      { id: 'sb-anat-1', subjectId: 'sub-anat', dayOfWeek: 1, startTime: '07:00', endTime: '10:00', location: 'Anfiteatro / Morfología' },
      { id: 'sb-anat-2', subjectId: 'sub-anat', dayOfWeek: 3, startTime: '07:00', endTime: '10:00', location: 'Anfiteatro / Morfología' },
      { id: 'sb-bioq-1', subjectId: 'sub-bioq', dayOfWeek: 2, startTime: '08:00', endTime: '10:30', location: 'Edificio E Aula 101' },
      { id: 'sb-bioq-2', subjectId: 'sub-bioq', dayOfWeek: 4, startTime: '08:00', endTime: '10:30', location: 'Laboratorio de Bioquímica' },
      { id: 'sb-histo-1', subjectId: 'sub-histo', dayOfWeek: 5, startTime: '07:00', endTime: '10:00', location: 'Lab de Microscopía' },
    ],
    routines: [],
    exams: [
      { id: 'ex-anat-1', subjectId: 'sub-anat', title: 'Práctico en Anfiteatro: Miembro Superior y Tórax', date: addDays(7), weight: 35 },
    ],
    assignments: [
      { id: 'as-bioq-1', subjectId: 'sub-bioq', title: 'Taller de Vías Metabólicas y Ciclo de Krebs', dueDate: addDays(4), estimatedMinutes: 120, priority: 'high', status: 'pending' },
    ],
    attendance: [],
  },
];
