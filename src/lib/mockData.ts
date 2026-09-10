import {
  Profile,
  Semester,
  Subject,
  ScheduleBlock,
  Assignment,
  Exam,
  AttendanceRecord,
  FixedRoutine,
  CourseHistory,
  PendingCourse,
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
} from './storage';

// ═════════════════════════════════════════════════════════════
// PLANTILLA DEMOSTRATIVA (Icesi - Luis Ernesto Rodríguez)
// ═════════════════════════════════════════════════════════════
export const demoIcesiProfile: Profile = {
  id: 'user-luis-ernesto-rodriguez',
  name: 'Luis Ernesto Rodríguez Gurrute',
  studentCode: 'A00414805',
  documentId: '1110295145',
  university: 'Universidad Icesi',
  program: 'IND - Ingeniería Industrial',
  semesterNumber: 4,
  cohort: '202510',
  gpa: 4.3,
  email: 'luis.rodriguez14@u.icesi.edu.co',
};

// ═════════════════════════════════════════════════════════════
// PERFIL INICIAL NEUTRAL (Para nuevos estudiantes)
// ═════════════════════════════════════════════════════════════
export const defaultProfile: Profile = {
  id: 'user-estudiante-activo',
  name: 'Estudiante',
  studentCode: 'A00123456',
  documentId: '',
  university: 'Universidad Icesi',
  program: 'Pregrado Universitario',
  semesterNumber: 1,
  cohort: '202610',
  gpa: 4.5,
  email: '',
};

// ═════════════════════════════════════════════════════════════
// SEMESTRE ACTIVO: 202620 (Segundo Semestre de 2026 - PRE)
// ═════════════════════════════════════════════════════════════
export const mockSemester: Semester = {
  id: 'sem-2026-2-pre',
  userId: 'user-luis-ernesto-rodriguez',
  name: 'Segundo Semestre De 2026 - PRE',
  startDate: '2026-08-03',
  endDate: '2026-11-27',
  isActive: true,
  totalWeeks: 16,
};

// ═════════════════════════════════════════════════════════════
// MATERIAS MATRICULADAS (Con Código y NRC Oficial Icesi)
// ═════════════════════════════════════════════════════════════
export const mockSubjects: Subject[] = [
  {
    id: 'sub-mat-3',
    semesterId: 'sem-2026-2-pre',
    name: 'Matemáticas aplicadas III',
    code: '11356',
    nrc: '11676',
    professor: 'Dr. Héctor Fabio Sánchez',
    credits: 4,
    color: '#6366f1', // Indigo / Purple
    maxAbsences: 4,
    passingGrade: 3.0,
    currentGrade: 4.0,
  },
  {
    id: 'sub-optimizacion',
    semesterId: 'sem-2026-2-pre',
    name: 'Optimización',
    code: '05359',
    nrc: '11830',
    professor: 'Dr. Andrés Gómez',
    credits: 4,
    color: '#0d9488', // Teal / Cian
    maxAbsences: 4,
    passingGrade: 3.0,
    currentGrade: 3.8,
  },
  {
    id: 'sub-estadistica-2',
    semesterId: 'sem-2026-2-pre',
    name: 'Estadística aplicada II',
    code: '11373',
    nrc: '11883',
    professor: 'Dr. Diego Fernando Cruz',
    credits: 4,
    color: '#a16207', // Marrón / Dorado
    maxAbsences: 4,
    passingGrade: 3.0,
    currentGrade: 4.3,
  },
  {
    id: 'sub-contabilidad',
    semesterId: 'sem-2026-2-pre',
    name: 'Contabilidad gerencial',
    code: '04258',
    nrc: '11602',
    professor: 'Mg. Carlos Alberto Osorio',
    credits: 3,
    color: '#0284c7', // Azul clásico
    maxAbsences: 4,
    passingGrade: 3.0,
    currentGrade: 4.1,
  },
  {
    id: 'sub-electricidad',
    semesterId: 'sem-2026-2-pre',
    name: 'Electricidad-magnetismo y Laboratorio',
    code: '11239',
    nrc: '10313 / 10312',
    professor: 'Ing. Sandra Patricia Morales',
    credits: 4,
    color: '#ea580c', // Naranja / Ámbar
    maxAbsences: 4,
    passingGrade: 3.0,
    currentGrade: 3.9,
  },
  {
    id: 'sub-academic-comm-2',
    semesterId: 'sem-2026-2-pre',
    name: 'Academic communication for an interconnected world II',
    code: '07307',
    nrc: '11113',
    professor: 'Prof. Katherine Miller',
    credits: 2,
    color: '#16a34a', // Verde
    maxAbsences: 4,
    passingGrade: 3.0,
    currentGrade: 4.5,
  },
];

// ═════════════════════════════════════════════════════════════
// HORARIO EXACTO (Extraído de la cuadrícula del usuario)
// ═════════════════════════════════════════════════════════════
export const mockScheduleBlocks: ScheduleBlock[] = [
  // LUNES
  {
    id: 'b-lun-contabilidad',
    subjectId: 'sub-contabilidad',
    dayOfWeek: 1,
    startTime: '10:00',
    endTime: '13:00',
    location: 'Edificio C · Salón 201',
  },
  {
    id: 'b-lun-estadistica',
    subjectId: 'sub-estadistica-2',
    dayOfWeek: 1,
    startTime: '14:00',
    endTime: '18:00',
    location: 'Laboratorio de Cómputo 3',
  },

  // MARTES
  {
    id: 'b-mar-electricidad',
    subjectId: 'sub-electricidad',
    dayOfWeek: 2,
    startTime: '11:00',
    endTime: '13:00',
    location: 'Edificio B · Aula 104',
  },
  {
    id: 'b-mar-academic-comm',
    subjectId: 'sub-academic-comm-2',
    dayOfWeek: 2,
    startTime: '14:00',
    endTime: '16:00',
    location: 'Centro de Idiomas · Aula 302',
  },

  // MIÉRCOLES
  {
    id: 'b-mie-mat-3',
    subjectId: 'sub-mat-3',
    dayOfWeek: 3,
    startTime: '07:00',
    endTime: '09:00',
    location: 'Edificio A · Salón 105',
  },
  {
    id: 'b-mie-contabilidad',
    subjectId: 'sub-contabilidad',
    dayOfWeek: 3,
    startTime: '11:00',
    endTime: '13:00',
    location: 'Edificio C · Salón 201',
  },

  // JUEVES
  {
    id: 'b-jue-optimizacion',
    subjectId: 'sub-optimizacion',
    dayOfWeek: 4,
    startTime: '07:00',
    endTime: '10:00',
    location: 'Edificio D · Auditorio 101',
  },
  {
    id: 'b-jue-electricidad',
    subjectId: 'sub-electricidad',
    dayOfWeek: 4,
    startTime: '11:00',
    endTime: '13:00',
    location: 'Edificio B · Aula 104',
  },
  {
    id: 'b-jue-academic-comm',
    subjectId: 'sub-academic-comm-2',
    dayOfWeek: 4,
    startTime: '14:00',
    endTime: '16:00',
    location: 'Centro de Idiomas · Aula 302',
  },

  // VIERNES
  {
    id: 'b-vie-mat-3',
    subjectId: 'sub-mat-3',
    dayOfWeek: 5,
    startTime: '07:00',
    endTime: '09:00',
    location: 'Edificio A · Salón 105',
  },
  {
    id: 'b-vie-electricidad-lab',
    subjectId: 'sub-electricidad',
    dayOfWeek: 5,
    startTime: '14:00',
    endTime: '16:00',
    location: 'Laboratorio de Física Experimental',
  },
];

export const mockRoutines: FixedRoutine[] = [
  { id: 'r-almuerzo-1', title: 'Almuerzo Icesi', type: 'meal', dayOfWeek: 1, startTime: '13:00', endTime: '14:00' },
  { id: 'r-almuerzo-2', title: 'Almuerzo Icesi', type: 'meal', dayOfWeek: 2, startTime: '13:00', endTime: '14:00' },
  { id: 'r-almuerzo-3', title: 'Almuerzo Icesi', type: 'meal', dayOfWeek: 3, startTime: '13:00', endTime: '14:00' },
  { id: 'r-almuerzo-4', title: 'Almuerzo Icesi', type: 'meal', dayOfWeek: 4, startTime: '13:00', endTime: '14:00' },
  { id: 'r-almuerzo-5', title: 'Almuerzo Icesi', type: 'meal', dayOfWeek: 5, startTime: '13:00', endTime: '14:00' },
];

const now = new Date();
const addDays = (d: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + d);
  return date.toISOString().split('T')[0];
};

// ═════════════════════════════════════════════════════════════
// EVALUACIONES Y COMPONENTES OFICIALES (Del balance académico)
// ═════════════════════════════════════════════════════════════
export const mockExams: Exam[] = [
  // Estadística Aplicada II (20% + 20% + 20% + 20% proyecto)
  {
    id: 'exam-est2-p1',
    subjectId: 'sub-estadistica-2',
    title: 'Primer Parcial: Muestreo y Estimación por Intervalos',
    date: `${addDays(4)}T14:00:00`,
    weight: 20,
    topics: ['Distribuciones muestrales', 'Intervalos de confianza', 'Estimación de proporciones'],
  },
  {
    id: 'exam-est2-sustentacion',
    subjectId: 'sub-estadistica-2',
    title: 'Sustentación Proyecto Integrador de Análisis Estadístico',
    date: `${addDays(14)}T15:00:00`,
    weight: 20,
    topics: ['Modelo aplicado', 'Interpretación en R / Python', 'Conclusiones gerenciales'],
  },

  // Optimización (Jornadas de solución de problemas 20% + 20% + 20%)
  {
    id: 'exam-opt-jornada-1',
    subjectId: 'sub-optimizacion',
    title: 'Jornada de Solución de Problemas - Unidad 1',
    date: `${addDays(6)}T07:00:00`,
    weight: 20,
    topics: ['Modelación matemática', 'Método Simplex', 'Dualidad y Sensibilidad'],
  },

  // Electricidad-magnetismo y Lab (Parcial 1: 25%, Parcial 2: 25%)
  {
    id: 'exam-elect-p1',
    subjectId: 'sub-electricidad',
    title: 'Examen Parcial 1: Ley de Coulomb y Campo Eléctrico',
    date: `${addDays(9)}T11:00:00`,
    weight: 25,
    topics: ['Ley de Gauss', 'Potencial eléctrico', 'Capacitancia y Dieléctricos'],
  },

  // Matemáticas Aplicadas III (Parcial 1: 20%, Parcial 2: 20%)
  {
    id: 'exam-mat3-p1',
    subjectId: 'sub-mat-3',
    title: 'Parcial 1: Ecuaciones Diferenciales Lineales y Laplace',
    date: `${addDays(12)}T07:00:00`,
    weight: 20,
    topics: ['Transformada de Laplace', 'Problemas con valor inicial', 'Convolución'],
  },

  // Academic Communication II (Final Test: 30%, Project: 35%)
  {
    id: 'exam-comm-project',
    subjectId: 'sub-academic-comm-2',
    title: 'Final Term Project Presentation (Global Supply Chains)',
    date: `${addDays(18)}T14:00:00`,
    weight: 35,
    topics: ['Academic speaking', 'Persuasive writing', 'Data visualization in English'],
  },
];

// ═════════════════════════════════════════════════════════════
// TAREAS Y ENTREGAS (Syllabus exacto)
// ═════════════════════════════════════════════════════════════
export const mockAssignments: Assignment[] = [
  {
    id: 'ass-opt-colab-1',
    subjectId: 'sub-optimizacion',
    title: 'Entrega Cuaderno Google Colab 1 (Grupos 3-4 personas)',
    description: 'Resolución computacional de problemas de optimización lineal con PuLP/SciPy.',
    dueDate: `${addDays(2)}T23:59:00`,
    priority: 'high',
    estimatedMinutes: 90,
    status: 'pending',
  },
  {
    id: 'ass-est-propuesta',
    subjectId: 'sub-estadistica-2',
    title: 'Propuesta del Proyecto Integrador de Análisis Estadístico',
    description: 'Definición de dataset, pregunta de investigación y plan de análisis.',
    dueDate: `${addDays(3)}T18:00:00`,
    priority: 'high',
    estimatedMinutes: 60,
    status: 'pending',
  },
  {
    id: 'ass-elect-practica-s8',
    subjectId: 'sub-electricidad',
    title: 'Práctica de Laboratorio: Circuitos RC y Ley de Ohm',
    description: 'Informe técnico de laboratorio corte semana 8.',
    dueDate: `${addDays(5)}T14:00:00`,
    priority: 'medium',
    estimatedMinutes: 75,
    status: 'pending',
  },
  {
    id: 'ass-mat3-quices',
    subjectId: 'sub-mat-3',
    title: 'Actividad 1: Taller grupal de Transformadas de Laplace',
    dueDate: `${addDays(7)}T20:00:00`,
    priority: 'medium',
    estimatedMinutes: 60,
    status: 'in_progress',
  },
  {
    id: 'ass-conta-taller',
    subjectId: 'sub-contabilidad',
    title: 'Taller 1: Punto de Equilibrio y Costeo Absorbente vs Variable',
    dueDate: `${addDays(8)}T12:00:00`,
    priority: 'medium',
    estimatedMinutes: 45,
    status: 'pending',
  },
  {
    id: 'ass-english-mel',
    subjectId: 'sub-academic-comm-2',
    title: 'MyEnglishLab: Units 3 & 4 Progress Questionnaire',
    dueDate: `${addDays(10)}T23:59:00`,
    priority: 'low',
    estimatedMinutes: 30,
    status: 'pending',
  },
];

export const mockAttendance: AttendanceRecord[] = [
  { id: 'att-est2-1', subjectId: 'sub-estadistica-2', date: addDays(-21), status: 'present' },
  { id: 'att-est2-2', subjectId: 'sub-estadistica-2', date: addDays(-14), status: 'present' },
  { id: 'att-est2-3', subjectId: 'sub-estadistica-2', date: addDays(-7), status: 'present' },

  { id: 'att-opt-1', subjectId: 'sub-optimizacion', date: addDays(-21), status: 'present' },
  { id: 'att-opt-2', subjectId: 'sub-optimizacion', date: addDays(-14), status: 'present' },
  { id: 'att-opt-3', subjectId: 'sub-optimizacion', date: addDays(-7), status: 'absent' }, // Falta 1
];

// ═════════════════════════════════════════════════════════════
// HISTORIAL ACADÉMICO REAL (28 materias cursadas - Icesi)
// ═════════════════════════════════════════════════════════════
export const mockHistoryCourses: CourseHistory[] = [
  { code: '07001', name: 'Inglés I', period: 'PRE', credits: 0, grade: 'Aprobado' },
  { code: '07002', name: 'Inglés II', period: 'PRE', credits: 0, grade: 'Aprobado' },
  { code: '01302', name: 'Organizaciones', period: '202510', credits: 2, grade: 4.6 },
  { code: '08324', name: 'Pensamiento lógico', period: '202510', credits: 2, grade: 4.4 },
  { code: '08325', name: 'Pensamiento matemático', period: '202510', credits: 3, grade: 4.0 },
  { code: '09640', name: 'Habilidades básicas en computación', period: '202510', credits: 0, grade: 'Aprobado' },
  { code: '09803', name: 'Pensamiento computacional', period: '202510', credits: 2, grade: 4.7 },
  { code: '16037', name: 'Lenguaje I', period: '202510', credits: 2, grade: 3.3 },
  { code: '20060', name: 'Proyecto PROBO', period: '202510', credits: 0, grade: 'Aprobado' },
  { code: '41001', name: 'Exploración II', period: '202510', credits: 1, grade: 'Aprobado' },
  { code: '41005', name: 'Exploración I', period: '202510', credits: 1, grade: 'Aprobado' },
  { code: '02876', name: 'Constitución y democracia', period: '202520', credits: 2, grade: 4.1 },
  { code: '02879', name: 'Principios de economía', period: '202520', credits: 2, grade: 4.1 },
  { code: '05360', name: 'Pensamiento sistémico', period: '202520', credits: 2, grade: 5.0 },
  { code: '07003', name: 'Inglés III', period: '202520', credits: 2, grade: 'Aprobado' },
  { code: '09641', name: 'Habilidades en hojas electrónicas', period: '202520', credits: 0, grade: 'Aprobado' },
  { code: '11354', name: 'Matemáticas aplicadas I', period: '202520', credits: 4, grade: 3.8 },
  { code: '16038', name: 'Lenguaje II', period: '202520', credits: 2, grade: 4.2 },
  { code: '41002', name: 'Exploración III', period: '202520', credits: 1, grade: 'Aprobado' },
  { code: '41003', name: 'Exploración IV', period: '202520', credits: 1, grade: 'Aprobado' },
  { code: '05351', name: 'Flujos de valor', period: '202610', credits: 3, grade: 4.5 },
  { code: '05356', name: 'Investigación', period: '202610', credits: 2, grade: 4.6 },
  { code: '05364', name: 'Probabilidad aplicada', period: '202610', credits: 2, grade: 4.0 },
  { code: '07004', name: 'Inglés IV', period: '202610', credits: 2, grade: 'Aprobado' },
  { code: '11238', name: 'Física y Laboratorio', period: '202610', credits: 4, grade: 4.6 },
  { code: '11355', name: 'Matemáticas aplicadas II', period: '202610', credits: 3, grade: 4.3 },
  { code: '39104', name: 'IA y transformaciones sociales', period: '202610', credits: 2, grade: 4.3 },
  { code: '40070', name: 'Arte colombiano: de lo sagrado a lo subversivo', period: '202610', credits: 2, grade: 4.2 },
];

// ═════════════════════════════════════════════════════════════
// MATERIAS POR APROBAR (Ruta hacia el Grado en Ing. Industrial)
// ═════════════════════════════════════════════════════════════
export const mockPendingCourses: PendingCourse[] = [
  { code: 'CBB 37207', name: 'Diseño de experimentos', semester: 5 },
  { code: 'CFT 11384', name: 'Electiva en ciencias básicas', semester: 5 },
  { code: 'TIC 09831', name: 'Analítica de datos', semester: 5 },
  { code: 'IND 05352', name: 'Ingeniería de las operaciones I', semester: 5 },
  { code: 'IND 05353', name: 'Ingeniería de las operaciones II', semester: 6 },
  { code: 'PDP 00101', name: 'Programa de desarrollo profesional I', semester: 6 },
  { code: 'IND 05167', name: 'Calidad en las operaciones', semester: 6 },
  { code: 'IND 05361', name: 'Simulación I', semester: 6 },
  { code: 'IND 05350', name: 'Electiva de exploración y profundización', semester: 6 },
  { code: 'IND 05363', name: 'Tecnología en las operaciones', semester: 6 },
  { code: 'CLI 19017', name: 'Examen Saber PRO', semester: 7 },
  { code: 'IND 05349', name: 'Diseño y manufactura', semester: 7 },
  { code: 'IND 05354', name: 'Ingeniería de las operaciones III', semester: 7 },
  { code: 'IND 05362', name: 'Simulación II', semester: 7 },
  { code: 'PDP 00132', name: 'Programa de desarrollo profesional II', semester: 7 },
  { code: 'IND 05355', name: 'Ingeniería de las operaciones IV', semester: 8 },
  { code: 'HUM 02875', name: 'Ciudadanía III', semester: 8 },
  { code: 'PDP 00134', name: 'Práctica profesional', semester: 9 },
];

export async function seedDatabaseIfEmpty(): Promise<boolean> {
  if (typeof window !== 'undefined' && localStorage.getItem('mi_semestre_user_configured_v1') === 'true') {
    return false;
  }

  const existingProfiles = await profileRepository.getAll();
  if (existingProfiles.length === 0) {
    await profileRepository.save(defaultProfile);
    await profileRepository.setActiveProfile(defaultProfile.id);
  }

  const existingSemesters = await semesterRepository.getAll();
  if (existingSemesters.length === 0) {
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
  await profileRepository.save(demoIcesiProfile);
  await profileRepository.setActiveProfile(demoIcesiProfile.id);
  await semesterRepository.save(mockSemester);
  await subjectRepository.bulkSave(mockSubjects);
  await scheduleRepository.bulkSave(mockScheduleBlocks);
  await routineRepository.bulkSave(mockRoutines);
  await examRepository.bulkSave(mockExams);
  await assignmentRepository.bulkSave(mockAssignments);
  await attendanceRepository.bulkSave(mockAttendance);
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mi_semestre_user_configured_v1');
  }
}

export async function resetDatabaseToCleanSlate(): Promise<void> {
  const { db } = await import('./storage/database');
  await db.delete();
  await db.open();
  const cleanProfile: Profile = {
    id: `user-${Date.now()}`,
    name: 'Estudiante',
    studentCode: 'A00123456',
    university: 'Universidad Icesi',
    program: 'Mi Carrera',
    semesterNumber: 1,
    gpa: 4.5,
    email: '',
  };
  await profileRepository.save(cleanProfile);
  await profileRepository.setActiveProfile(cleanProfile.id);
  const cleanSemester: Semester = {
    id: `sem-${Date.now()}`,
    userId: cleanProfile.id,
    name: 'Primer Semestre 2026',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 112 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
    totalWeeks: 16,
  };
  await semesterRepository.save(cleanSemester);
  if (typeof window !== 'undefined') {
    localStorage.setItem('mi_semestre_user_configured_v1', 'true');
  }
}
