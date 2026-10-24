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
      id: 'profile-industrial-demo',
      name: 'Estudiante Industrial',
      studentCode: 'EST-202610',
      documentId: '1110295145',
      university: 'Universidad Icesi',
      program: 'Ingeniería Industrial',
      semesterNumber: 4,
      cohort: '202510',
      gpa: 4.3,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Estudiante%20Industrial',
    },
    semester: {
      id: 'sem-2026-2-industrial',
      userId: 'profile-industrial-demo',
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
      name: 'Estudiante Sistemas',
      studentCode: 'EST-202620',
      documentId: '1144098231',
      university: 'Universidad Icesi',
      program: 'Ingeniería de Sistemas',
      semesterNumber: 5,
      cohort: '202420',
      gpa: 4.4,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Estudiante%20Sistemas',
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

  // 5. ECONOMÍA Y NEGOCIOS INTERNACIONALES - SEMESTRE 4 (ICESI OFICIAL - ISABELLA PALOMINO)
  {
    id: 'template-economia-4',
    name: 'Economía y Negocios Internacionales · Semestre 4',
    faculty: 'Facultad de Ciencias Administrativas y Económicas',
    semesterNumber: 4,
    badge: 'Perfil Oficial Icesi',
    description: '7 materias matriculadas: Economía matemática, Contabilidad gerencial, Estadística para la toma de decisiones, Pensamiento económico II, Comportamiento de firmas, Recordar y olvidar, Hip Hop.',
    profile: {
      id: 'profile-isabella-palomino',
      name: 'Palomino Ortega Isabella',
      studentCode: 'A00414870',
      documentId: '1097497195',
      university: 'Universidad Icesi',
      program: 'Economía y Negocios Internacionales',
      semesterNumber: 4,
      cohort: '202510',
      gpa: 4.5,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Isabella%20Palomino',
    },
    semester: {
      id: 'sem-2026-2-economia-4',
      userId: 'profile-isabella-palomino',
      name: '4° Semestre · 2026-2 (Economía y Negocios Internacionales)',
      startDate: '2026-08-03',
      endDate: '2026-12-05',
      totalWeeks: 16,
      isActive: true,
    },
    subjects: [
      {
        id: 'sub-eco-mat',
        semesterId: 'sem-2026-2-economia-4',
        code: '08322',
        name: 'Economía Matemática',
        credits: 4,
        professor: 'Docente Titular',
        color: '#3b3abf',
        maxAbsences: 4,
        passingGrade: 3.0,
      },
      {
        id: 'sub-eco-conta',
        semesterId: 'sem-2026-2-economia-4',
        code: '04258',
        name: 'Contabilidad Gerencial',
        credits: 3,
        professor: 'Docente Titular',
        color: '#0284c7',
        maxAbsences: 4,
        passingGrade: 3.0,
      },
      {
        id: 'sub-eco-est',
        semesterId: 'sem-2026-2-economia-4',
        code: '06326',
        name: 'Estadística para la Toma de Decisiones',
        credits: 3,
        professor: 'Docente Titular',
        color: '#059669',
        maxAbsences: 4,
        passingGrade: 3.0,
      },
      {
        id: 'sub-eco-pens',
        semesterId: 'sem-2026-2-economia-4',
        code: '06311',
        name: 'Pensamiento y Contexto Económico II',
        credits: 4,
        professor: 'Docente Titular',
        color: '#d97706',
        maxAbsences: 4,
        passingGrade: 3.0,
      },
      {
        id: 'sub-eco-firmas',
        semesterId: 'sem-2026-2-economia-4',
        code: '06302',
        name: 'Comportamiento de las Firmas y el Consumidor',
        credits: 3,
        professor: 'Docente Titular',
        color: '#7c3aed',
        maxAbsences: 4,
        passingGrade: 3.0,
      },
      {
        id: 'sub-eco-cult',
        semesterId: 'sem-2026-2-economia-4',
        code: '02810',
        name: 'Recordar y Olvidar: Identidad, Cultura y Comunicación',
        credits: 3,
        professor: 'Docente Titular',
        color: '#dc2626',
        maxAbsences: 4,
        passingGrade: 3.0,
      },
      {
        id: 'sub-eco-hiphop',
        semesterId: 'sem-2026-2-economia-4',
        code: '40074',
        name: 'Hip Hop: Cultura, Industria y Territorio',
        credits: 2,
        professor: 'Docente Titular',
        color: '#ea580c',
        maxAbsences: 4,
        passingGrade: 3.0,
      },
    ],
    scheduleBlocks: [
      { id: 'sb-ecomat-1', subjectId: 'sub-eco-mat', dayOfWeek: 1, startTime: '07:00', endTime: '09:00', location: 'Salón 204C' },
      { id: 'sb-ecomat-2', subjectId: 'sub-eco-mat', dayOfWeek: 3, startTime: '07:00', endTime: '09:00', location: 'Salón 204C' },
      { id: 'sb-ecoconta-1', subjectId: 'sub-eco-conta', dayOfWeek: 1, startTime: '09:00', endTime: '11:00', location: 'Edificio D Aula 102' },
      { id: 'sb-ecoconta-2', subjectId: 'sub-eco-conta', dayOfWeek: 3, startTime: '09:00', endTime: '11:00', location: 'Edificio D Aula 102' },
      { id: 'sb-ecoest-1', subjectId: 'sub-eco-est', dayOfWeek: 2, startTime: '07:00', endTime: '09:00', location: 'Laboratorio de Cómputo 2' },
      { id: 'sb-ecoest-2', subjectId: 'sub-eco-est', dayOfWeek: 4, startTime: '07:00', endTime: '09:00', location: 'Laboratorio de Cómputo 2' },
      { id: 'sb-ecopens-1', subjectId: 'sub-eco-pens', dayOfWeek: 2, startTime: '09:00', endTime: '11:00', location: 'Salón 301D' },
      { id: 'sb-ecopens-2', subjectId: 'sub-eco-pens', dayOfWeek: 4, startTime: '09:00', endTime: '11:00', location: 'Salón 301D' },
      { id: 'sb-ecofirm-1', subjectId: 'sub-eco-firmas', dayOfWeek: 1, startTime: '11:00', endTime: '13:00', location: 'Auditorio Varela' },
      { id: 'sb-ecofirm-2', subjectId: 'sub-eco-firmas', dayOfWeek: 3, startTime: '11:00', endTime: '13:00', location: 'Auditorio Varela' },
      { id: 'sb-ecocult-1', subjectId: 'sub-eco-cult', dayOfWeek: 2, startTime: '14:00', endTime: '16:00', location: 'Edificio C Aula 201' },
      { id: 'sb-ecocult-2', subjectId: 'sub-eco-cult', dayOfWeek: 4, startTime: '14:00', endTime: '16:00', location: 'Edificio C Aula 201' },
      { id: 'sb-ecohiphop-1', subjectId: 'sub-eco-hiphop', dayOfWeek: 5, startTime: '09:00', endTime: '12:00', location: 'Salón Multipropósito' },
    ],
    routines: [
      { id: 'rt-eco-gym', title: 'Entrenamiento Gimnasio Campus', dayOfWeek: 1, startTime: '17:00', endTime: '18:30', type: 'gym' },
      { id: 'rt-eco-rest', title: 'Pausa y Descanso Activo', dayOfWeek: 3, startTime: '14:00', endTime: '15:00', type: 'rest' },
    ],
    exams: [
      { id: 'ex-ecomat-1', subjectId: 'sub-eco-mat', title: 'Parcial 1: Optimización Estática y Multiplicadores de Lagrange', date: addDays(6), weight: 25 },
      { id: 'ex-ecoconta-1', subjectId: 'sub-eco-conta', title: 'Parcial 1: Costeo Variable vs Absorción', date: addDays(12), weight: 20 },
      { id: 'ex-ecopens-1', subjectId: 'sub-eco-pens', title: 'Entrega Ensayo: Modelos de Crecimiento Económico', date: addDays(18), weight: 20 },
    ],
    assignments: [
      { id: 'as-ecoest-1', subjectId: 'sub-eco-est', title: 'Taller R: Regresión Lineal Múltiple', dueDate: addDays(3), estimatedMinutes: 90, priority: 'high', status: 'pending' },
      { id: 'as-ecofirm-1', subjectId: 'sub-eco-firmas', title: 'Caso Harvard: Estrategias de Fijación de Precios', dueDate: addDays(5), estimatedMinutes: 60, priority: 'medium', status: 'pending' },
    ],
    attendance: [],
  },

  // 6. INGENIERÍA TELEMÁTICA - SEMESTRE 4
  {
    id: 'template-telematica-4',
    name: 'Ingeniería Telemática · Semestre 4',
    faculty: 'Facultad de Ingeniería, Diseño y Ciencias Aplicadas',
    semesterNumber: 4,
    badge: 'Telemática',
    description: 'Redes de Comunicación I, Sistemas Distribuidos, Arquitectura de Computadores y Probabilidad.',
    profile: {
      id: 'profile-tel',
      name: 'Estudiante de Telemática',
      studentCode: 'A00481234',
      documentId: '1105432198',
      university: 'Universidad Icesi',
      program: 'Ingeniería Telemática',
      semesterNumber: 4,
      cohort: '202510',
      gpa: 4.4,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Telematica%20Icesi',
    },
    semester: {
      id: 'sem-2026-2-telematica',
      userId: 'profile-tel',
      name: 'Semestre 2026-2 (Ingeniería Telemática)',
      startDate: '2026-08-03',
      endDate: '2026-12-05',
      totalWeeks: 16,
      isActive: true,
    },
    subjects: [
      { id: 'sub-tel-redes', semesterId: 'sem-2026-2-telematica', code: 'TEL 08201', name: 'Redes de Comunicación I', credits: 4, professor: 'Ing. Álvaro Rendón', color: '#0284c7', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-tel-dist', semesterId: 'sem-2026-2-telematica', code: 'SIS 08310', name: 'Sistemas Distribuidos', credits: 4, professor: 'Dr. Andrés Delgado', color: '#3b3abf', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-tel-arqui', semesterId: 'sem-2026-2-telematica', code: 'TEL 08205', name: 'Arquitectura de Computadores', credits: 3, professor: 'MSc. Julián Moreno', color: '#7c3aed', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-tel-prob', semesterId: 'sem-2026-2-telematica', code: 'CFT 11375', name: 'Probabilidad y Estadística', credits: 3, professor: 'Dra. María Elena Restrepo', color: '#ea580c', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-tel-mat', semesterId: 'sem-2026-2-telematica', code: 'MAT 08320', name: 'Matemáticas Especiales', credits: 4, professor: 'Dr. Diego Fernando Cruz', color: '#0d9488', maxAbsences: 5, passingGrade: 3.0 },
    ],
    scheduleBlocks: [
      { id: 'sb-tel-red-1', subjectId: 'sub-tel-redes', dayOfWeek: 1, startTime: '07:00', endTime: '09:00', location: 'Laboratorio de Redes y Telecomunicaciones' },
      { id: 'sb-tel-red-2', subjectId: 'sub-tel-redes', dayOfWeek: 3, startTime: '07:00', endTime: '09:00', location: 'Laboratorio de Redes y Telecomunicaciones' },
      { id: 'sb-tel-dist-1', subjectId: 'sub-tel-dist', dayOfWeek: 2, startTime: '09:00', endTime: '11:00', location: 'Edificio C Sala 204' },
      { id: 'sb-tel-dist-2', subjectId: 'sub-tel-dist', dayOfWeek: 4, startTime: '09:00', endTime: '11:00', location: 'Edificio C Sala 204' },
      { id: 'sb-tel-arq-1', subjectId: 'sub-tel-arqui', dayOfWeek: 1, startTime: '11:00', endTime: '13:00', location: 'Salón 102B' },
      { id: 'sb-tel-arq-2', subjectId: 'sub-tel-arqui', dayOfWeek: 3, startTime: '11:00', endTime: '13:00', location: 'Salón 102B' },
      { id: 'sb-tel-prob-1', subjectId: 'sub-tel-prob', dayOfWeek: 2, startTime: '14:00', endTime: '16:00', location: 'Edificio D Aula 302' },
      { id: 'sb-tel-mat-1', subjectId: 'sub-tel-mat', dayOfWeek: 5, startTime: '08:00', endTime: '11:00', location: 'Auditorio Varela' },
    ],
    routines: [],
    exams: [
      { id: 'ex-tel-red-1', subjectId: 'sub-tel-redes', title: 'Parcial 1: Modelo OSI, TCP/IP y Subnetting', date: addDays(4), weight: 25 },
      { id: 'ex-tel-dist-1', subjectId: 'sub-tel-dist', title: 'Parcial 1: Comunicación RPC y Algoritmos de Consenso', date: addDays(11), weight: 25 },
    ],
    assignments: [
      { id: 'as-tel-red-1', subjectId: 'sub-tel-redes', title: 'Topología Packet Tracer: VLANs y Enrutamiento OSPF', dueDate: addDays(2), estimatedMinutes: 90, priority: 'high', status: 'pending' },
    ],
    attendance: [],
  },

  // 7. DISEÑO DE MEDIOS INTERACTIVOS - SEMESTRE 4
  {
    id: 'template-diseno-medios-4',
    name: 'Diseño de Medios Interactivos · Semestre 4',
    faculty: 'Facultad de Ingeniería, Diseño y Ciencias Aplicadas',
    semesterNumber: 4,
    badge: 'DMI',
    description: 'Programación Interactiva II, Experiencia de Usuario UX/UI, Modelado 3D y Narrativa Transmedia.',
    profile: {
      id: 'profile-dmi',
      name: 'Estudiante de DMI',
      studentCode: 'A00490128',
      documentId: '1106543289',
      university: 'Universidad Icesi',
      program: 'Diseño de Medios Interactivos',
      semesterNumber: 4,
      cohort: '202510',
      gpa: 4.5,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=DMI%20Icesi',
    },
    semester: {
      id: 'sem-2026-2-dmi',
      userId: 'profile-dmi',
      name: 'Semestre 2026-2 (Diseño de Medios Interactivos)',
      startDate: '2026-08-03',
      endDate: '2026-12-05',
      totalWeeks: 16,
      isActive: true,
    },
    subjects: [
      { id: 'sub-dmi-prog', semesterId: 'sem-2026-2-dmi', code: 'DMI 04210', name: 'Programación Interactiva II', credits: 4, professor: 'Ing. Juan Manuel Reyes', color: '#8b5cf6', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-dmi-ux', semesterId: 'sem-2026-2-dmi', code: 'DMI 04225', name: 'Diseño de Experiencia UX/UI', credits: 3, professor: 'Dis. Natalia Gómez', color: '#ec4899', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-dmi-3d', semesterId: 'sem-2026-2-dmi', code: 'DMI 04230', name: 'Modelado y Animación 3D', credits: 4, professor: 'MSc. Andrés Caicedo', color: '#f59e0b', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-dmi-narr', semesterId: 'sem-2026-2-dmi', code: 'DMI 04218', name: 'Narrativa Transmedia', credits: 3, professor: 'Mg. Santiago Rivas', color: '#06b6d4', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-dmi-taller', semesterId: 'sem-2026-2-dmi', code: 'DMI 04250', name: 'Taller de Medios II', credits: 4, professor: 'Dra. Carolina Hoyos', color: '#10b981', maxAbsences: 4, passingGrade: 3.0 },
    ],
    scheduleBlocks: [
      { id: 'sb-dmi-prog-1', subjectId: 'sub-dmi-prog', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', location: 'Laboratorio de Creatividad Digital (Edificio I)' },
      { id: 'sb-dmi-ux-1', subjectId: 'sub-dmi-ux', dayOfWeek: 2, startTime: '08:00', endTime: '11:00', location: 'Edificio C Sala Mac 1' },
      { id: 'sb-dmi-3d-1', subjectId: 'sub-dmi-3d', dayOfWeek: 3, startTime: '14:00', endTime: '17:00', location: 'Laboratorio de Animación y Render' },
      { id: 'sb-dmi-narr-1', subjectId: 'sub-dmi-narr', dayOfWeek: 4, startTime: '10:00', endTime: '12:00', location: 'Edificio B Salón 201' },
      { id: 'sb-dmi-taller-1', subjectId: 'sub-dmi-taller', dayOfWeek: 5, startTime: '08:00', endTime: '12:00', location: 'Taller Central de Prototipado' },
    ],
    routines: [],
    exams: [
      { id: 'ex-dmi-ux-1', subjectId: 'sub-dmi-ux', title: 'Entrega Prototipo Funcional Figma & Test de Usabilidad', date: addDays(5), weight: 30 },
      { id: 'ex-dmi-3d-1', subjectId: 'sub-dmi-3d', title: 'Entrega Modelo 3D Personaje Rigging y Texturizado', date: addDays(14), weight: 25 },
    ],
    assignments: [
      { id: 'as-dmi-prog-1', subjectId: 'sub-dmi-prog', title: 'Videojuego Web Three.js / P5.js: Mecánicas e Interacción', dueDate: addDays(3), estimatedMinutes: 120, priority: 'high', status: 'pending' },
    ],
    attendance: [],
  },

  // 8. DERECHO - SEMESTRE 3
  {
    id: 'template-derecho-3',
    name: 'Derecho · Semestre 3',
    faculty: 'Facultad de Derecho y Ciencias Sociales',
    semesterNumber: 3,
    badge: 'Derecho',
    description: 'Derecho Constitucional Colombiano, Teoría General del Proceso, Obligaciones I y Penal General.',
    profile: {
      id: 'profile-der',
      name: 'Estudiante de Derecho',
      studentCode: 'A00472190',
      documentId: '1104321987',
      university: 'Universidad Icesi',
      program: 'Derecho',
      semesterNumber: 3,
      cohort: '202520',
      gpa: 4.3,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Derecho%20Icesi',
    },
    semester: {
      id: 'sem-2026-2-derecho',
      userId: 'profile-der',
      name: 'Semestre 2026-2 (Derecho)',
      startDate: '2026-08-03',
      endDate: '2026-12-05',
      totalWeeks: 16,
      isActive: true,
    },
    subjects: [
      { id: 'sub-der-const', semesterId: 'sem-2026-2-derecho', code: 'DER 03102', name: 'Derecho Constitucional Colombiano', credits: 4, professor: 'Dr. Rodrigo Uprimny', color: '#b91c1c', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-der-proc', semesterId: 'sem-2026-2-derecho', code: 'DER 03201', name: 'Teoría General del Proceso', credits: 4, professor: 'Dra. Claudia Morales', color: '#d97706', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-der-obliga', semesterId: 'sem-2026-2-derecho', code: 'DER 03215', name: 'Régimen General de Obligaciones I', credits: 4, professor: 'Dr. Hernando Valencia', color: '#1d4ed8', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-der-penal', semesterId: 'sem-2026-2-derecho', code: 'DER 03305', name: 'Derecho Penal General', credits: 3, professor: 'Dr. Alejandro Gómez', color: '#7e22ce', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-der-filo', semesterId: 'sem-2026-2-derecho', code: 'CSO 01210', name: 'Filosofía y Argumentación Jurídica', credits: 3, professor: 'Dra. Helena Alviar', color: '#047857', maxAbsences: 4, passingGrade: 3.0 },
    ],
    scheduleBlocks: [
      { id: 'sb-der-const-1', subjectId: 'sub-der-const', dayOfWeek: 1, startTime: '07:00', endTime: '09:00', location: 'Edificio C Aula 101' },
      { id: 'sb-der-const-2', subjectId: 'sub-der-const', dayOfWeek: 3, startTime: '07:00', endTime: '09:00', location: 'Edificio C Aula 101' },
      { id: 'sb-der-proc-1', subjectId: 'sub-der-proc', dayOfWeek: 2, startTime: '09:00', endTime: '11:00', location: 'Sala de Audiencias / Sala de Juicios' },
      { id: 'sb-der-proc-2', subjectId: 'sub-der-proc', dayOfWeek: 4, startTime: '09:00', endTime: '11:00', location: 'Sala de Audiencias / Sala de Juicios' },
      { id: 'sb-der-ob-1', subjectId: 'sub-der-obliga', dayOfWeek: 1, startTime: '11:00', endTime: '13:00', location: 'Auditorio Banco de Bogotá' },
      { id: 'sb-der-ob-2', subjectId: 'sub-der-obliga', dayOfWeek: 3, startTime: '11:00', endTime: '13:00', location: 'Auditorio Banco de Bogotá' },
      { id: 'sb-der-pen-1', subjectId: 'sub-der-penal', dayOfWeek: 2, startTime: '14:00', endTime: '16:00', location: 'Edificio B Salón 104' },
      { id: 'sb-der-fil-1', subjectId: 'sub-der-filo', dayOfWeek: 5, startTime: '08:00', endTime: '11:00', location: 'Edificio D Salón 202' },
    ],
    routines: [],
    exams: [
      { id: 'ex-der-const-1', subjectId: 'sub-der-const', title: 'Parcial Oral: Acción de Tutela y Bloque de Constitucionalidad', date: addDays(4), weight: 30 },
      { id: 'ex-der-ob-1', subjectId: 'sub-der-obliga', title: 'Parcial Escrito: Fuentes de las Obligaciones y Negocio Jurídico', date: addDays(10), weight: 25 },
    ],
    assignments: [
      { id: 'as-der-proc-1', subjectId: 'sub-der-proc', title: 'Memorial de Demanda: Excepciones Previas y Jurisdicción', dueDate: addDays(2), estimatedMinutes: 90, priority: 'high', status: 'pending' },
    ],
    attendance: [],
  },

  // 9. BIOLOGÍA CON CONCENTRACIÓN EN CONSERVACIÓN - SEMESTRE 3
  {
    id: 'template-biologia-3',
    name: 'Biología · Semestre 3',
    faculty: 'Facultad de Ciencias Naturales',
    semesterNumber: 3,
    badge: 'Biología',
    description: 'Ecología de Poblaciones, Genética General, Botánica Sistemática y Bioestadística.',
    profile: {
      id: 'profile-bio',
      name: 'Estudiante de Biología',
      studentCode: 'A00465432',
      documentId: '1103219876',
      university: 'Universidad Icesi',
      program: 'Biología con concentración en Conservación',
      semesterNumber: 3,
      cohort: '202520',
      gpa: 4.4,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Biologia%20Icesi',
    },
    semester: {
      id: 'sem-2026-2-biologia',
      userId: 'profile-bio',
      name: 'Semestre 2026-2 (Biología)',
      startDate: '2026-08-03',
      endDate: '2026-12-05',
      totalWeeks: 16,
      isActive: true,
    },
    subjects: [
      { id: 'sub-bio-eco', semesterId: 'sem-2026-2-biologia', code: 'BIO 05102', name: 'Ecología de Poblaciones', credits: 4, professor: 'Dr. Gustavo Kattan', color: '#15803d', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-bio-gen', semesterId: 'sem-2026-2-biologia', code: 'BIO 05204', name: 'Genética General y Molecular', credits: 4, professor: 'Dra. Beatriz Salgado', color: '#0369a1', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-bio-bot', semesterId: 'sem-2026-2-biologia', code: 'BIO 05115', name: 'Botánica Sistemática', credits: 4, professor: 'Dr. Philip Silverstone', color: '#a16207', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-bio-campo', semesterId: 'sem-2026-2-biologia', code: 'BIO 05301', name: 'Métodos de Muestreo en Campo', credits: 3, professor: 'MSc. Camilo Peraza', color: '#0f766e', maxAbsences: 3, passingGrade: 3.0 },
      { id: 'sub-bio-est', semesterId: 'sem-2026-2-biologia', code: 'CFT 11378', name: 'Bioestadística Aplicada', credits: 3, professor: 'Dr. Fernando Ayerbe', color: '#6d28d9', maxAbsences: 4, passingGrade: 3.0 },
    ],
    scheduleBlocks: [
      { id: 'sb-bio-eco-1', subjectId: 'sub-bio-eco', dayOfWeek: 1, startTime: '08:00', endTime: '10:00', location: 'Edificio E Salón 204' },
      { id: 'sb-bio-eco-2', subjectId: 'sub-bio-eco', dayOfWeek: 3, startTime: '08:00', endTime: '10:00', location: 'Edificio E Salón 204' },
      { id: 'sb-bio-gen-1', subjectId: 'sub-bio-gen', dayOfWeek: 2, startTime: '10:00', endTime: '12:00', location: 'Laboratorio de Genética y Biología Molecular' },
      { id: 'sb-bio-gen-2', subjectId: 'sub-bio-gen', dayOfWeek: 4, startTime: '10:00', endTime: '12:00', location: 'Laboratorio de Genética y Biología Molecular' },
      { id: 'sb-bio-bot-1', subjectId: 'sub-bio-bot', dayOfWeek: 2, startTime: '14:00', endTime: '17:00', location: 'Herbario y Laboratorio de Botánica' },
      { id: 'sb-bio-est-1', subjectId: 'sub-bio-est', dayOfWeek: 1, startTime: '11:00', endTime: '13:00', location: 'Sala de Cómputo 3' },
      { id: 'sb-bio-campo-1', subjectId: 'sub-bio-campo', dayOfWeek: 5, startTime: '07:00', endTime: '12:00', location: 'Salida de Campo: Reserva Yotoco / Farallones' },
    ],
    routines: [],
    exams: [
      { id: 'ex-bio-eco-1', subjectId: 'sub-bio-eco', title: 'Parcial 1: Modelos de Crecimiento Logístico y Tablas de Vida', date: addDays(6), weight: 25 },
      { id: 'ex-bio-gen-1', subjectId: 'sub-bio-gen', title: 'Parcial 1: Genética Mendeliana, Ligamiento y Recombinación', date: addDays(12), weight: 25 },
    ],
    assignments: [
      { id: 'as-bio-campo-1', subjectId: 'sub-bio-campo', title: 'Informe de Campo: Estimación de Densidad y Transectos', dueDate: addDays(4), estimatedMinutes: 100, priority: 'high', status: 'pending' },
    ],
    attendance: [],
  },

  // 10. PSICOLOGÍA - SEMESTRE 3
  {
    id: 'template-psicologia-3',
    name: 'Psicología · Semestre 3',
    faculty: 'Facultad de Derecho y Ciencias Sociales',
    semesterNumber: 3,
    badge: 'Psicología',
    description: 'Psicología Cognitiva, Procesos Biológicos II, Psicología Social y Psicometría.',
    profile: {
      id: 'profile-psi',
      name: 'Estudiante de Psicología',
      studentCode: 'A00456789',
      documentId: '1102198765',
      university: 'Universidad Icesi',
      program: 'Psicología',
      semesterNumber: 3,
      cohort: '202520',
      gpa: 4.5,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Psicologia%20Icesi',
    },
    semester: {
      id: 'sem-2026-2-psicologia',
      userId: 'profile-psi',
      name: 'Semestre 2026-2 (Psicología)',
      startDate: '2026-08-03',
      endDate: '2026-12-05',
      totalWeeks: 16,
      isActive: true,
    },
    subjects: [
      { id: 'sub-psi-cog', semesterId: 'sem-2026-2-psicologia', code: 'PSI 02105', name: 'Psicología Cognitiva', credits: 4, professor: 'Dra. Martha Peláez', color: '#4338ca', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-psi-bio', semesterId: 'sem-2026-2-psicologia', code: 'PSI 02201', name: 'Procesos Biológicos del Comportamiento II', credits: 4, professor: 'Dr. Jorge Eslava', color: '#be185d', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-psi-social', semesterId: 'sem-2026-2-psicologia', code: 'PSI 02310', name: 'Psicología Social', credits: 3, professor: 'Dra. Ángela María Estrada', color: '#0e7490', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-psi-met', semesterId: 'sem-2026-2-psicologia', code: 'PSI 02220', name: 'Psicometría y Evaluación', credits: 4, professor: 'Dr. César Carrión', color: '#c2410c', maxAbsences: 4, passingGrade: 3.0 },
      { id: 'sub-psi-inv', semesterId: 'sem-2026-2-psicologia', code: 'CSO 01305', name: 'Investigación Cualitativa', credits: 3, professor: 'Dra. Constanza Tobón', color: '#047857', maxAbsences: 4, passingGrade: 3.0 },
    ],
    scheduleBlocks: [
      { id: 'sb-psi-cog-1', subjectId: 'sub-psi-cog', dayOfWeek: 1, startTime: '09:00', endTime: '11:00', location: 'Edificio B Salón 205' },
      { id: 'sb-psi-cog-2', subjectId: 'sub-psi-cog', dayOfWeek: 3, startTime: '09:00', endTime: '11:00', location: 'Edificio B Salón 205' },
      { id: 'sb-psi-bio-1', subjectId: 'sub-psi-bio', dayOfWeek: 2, startTime: '07:00', endTime: '09:00', location: 'Laboratorio de Neurociencias y Conducta' },
      { id: 'sb-psi-bio-2', subjectId: 'sub-psi-bio', dayOfWeek: 4, startTime: '07:00', endTime: '09:00', location: 'Laboratorio de Neurociencias y Conducta' },
      { id: 'sb-psi-soc-1', subjectId: 'sub-psi-social', dayOfWeek: 1, startTime: '14:00', endTime: '16:00', location: 'Edificio C Salón 301' },
      { id: 'sb-psi-met-1', subjectId: 'sub-psi-met', dayOfWeek: 2, startTime: '11:00', endTime: '13:00', location: 'Sala Gesell / Cámara de Observación' },
      { id: 'sb-psi-met-2', subjectId: 'sub-psi-met', dayOfWeek: 4, startTime: '11:00', endTime: '13:00', location: 'Sala Gesell / Cámara de Observación' },
      { id: 'sb-psi-inv-1', subjectId: 'sub-psi-inv', dayOfWeek: 5, startTime: '09:00', endTime: '12:00', location: 'Edificio D Salón 104' },
    ],
    routines: [],
    exams: [
      { id: 'ex-psi-cog-1', subjectId: 'sub-psi-cog', title: 'Parcial 1: Memoria de Trabajo, Atención y Funciones Ejecutivas', date: addDays(5), weight: 30 },
      { id: 'ex-psi-bio-1', subjectId: 'sub-psi-bio', title: 'Parcial 1: Neuroanatomía Funcional y Sinapsis', date: addDays(13), weight: 25 },
    ],
    assignments: [
      { id: 'as-psi-met-1', subjectId: 'sub-psi-met', title: 'Estandarización de Instrumento: Validez de Contenido y Alfa de Cronbach', dueDate: addDays(3), estimatedMinutes: 80, priority: 'high', status: 'pending' },
    ],
    attendance: [],
  },
];

export function getTemplateForProgram(programName: string): AcademicTemplate {
  const norm = (programName || '').toLowerCase().trim();
  if (norm.includes('telemática') || norm.includes('telematica')) {
    return ACADEMIC_TEMPLATES.find((t) => t.id === 'template-telematica-4') || ACADEMIC_TEMPLATES[0];
  }
  if (norm.includes('interactivo') || norm.includes('diseño') || norm.includes('diseno') || norm.includes('dmi')) {
    return ACADEMIC_TEMPLATES.find((t) => t.id === 'template-diseno-medios-4') || ACADEMIC_TEMPLATES[0];
  }
  if (norm.includes('sistema')) {
    return ACADEMIC_TEMPLATES.find((t) => t.id === 'template-sistemas-5') || ACADEMIC_TEMPLATES[0];
  }
  if (norm.includes('industrial')) {
    return ACADEMIC_TEMPLATES.find((t) => t.id === 'template-industrial-4') || ACADEMIC_TEMPLATES[0];
  }
  if (norm.includes('economía') || norm.includes('economia')) {
    return ACADEMIC_TEMPLATES.find((t) => t.id === 'template-economia-4') || ACADEMIC_TEMPLATES[0];
  }
  if (norm.includes('administra')) {
    return ACADEMIC_TEMPLATES.find((t) => t.id === 'template-administracion-3') || ACADEMIC_TEMPLATES[0];
  }
  if (norm.includes('medicina') || norm.includes('salud')) {
    return ACADEMIC_TEMPLATES.find((t) => t.id === 'template-medicina-2') || ACADEMIC_TEMPLATES[0];
  }
  if (norm.includes('derecho') || norm.includes('jurídic') || norm.includes('juridic')) {
    return ACADEMIC_TEMPLATES.find((t) => t.id === 'template-derecho-3') || ACADEMIC_TEMPLATES[0];
  }
  if (norm.includes('biolog') || norm.includes('conservac')) {
    return ACADEMIC_TEMPLATES.find((t) => t.id === 'template-biologia-3') || ACADEMIC_TEMPLATES[0];
  }
  if (norm.includes('psicolog')) {
    return ACADEMIC_TEMPLATES.find((t) => t.id === 'template-psicologia-3') || ACADEMIC_TEMPLATES[0];
  }
  return ACADEMIC_TEMPLATES[0];
}
