import { DayOfWeek } from '@/types';

export interface NRCCourseInfo {
  nrc: string;
  code: string;
  name: string;
  credits: number;
  professor?: string;
  program?: string;
  blocks: Array<{
    dayOfWeek: DayOfWeek;
    startTime: string; // "07:00"
    endTime: string;   // "09:00"
    location: string;  // "Salón 204C"
  }>;
}

/**
 * Catálogo Oficial de NRCs y Franjas Horarias Universitarias (Universidad Icesi)
 * En sistemas Banner, el NRC es la clave primaria unívoca de cada grupo matriculado.
 */
export const OFFICIAL_NRC_CATALOG: Record<string, NRCCourseInfo> = {
  // ─── ECONOMÍA Y NEGOCIOS INTERNACIONALES (4TO SEMESTRE) ───────────
  '11805': {
    nrc: '11805',
    code: '08322',
    name: 'Economía Matemática',
    credits: 4,
    professor: 'Docente Titular',
    program: 'Economía y Negocios Internacionales',
    blocks: [
      { dayOfWeek: 1, startTime: '07:00', endTime: '09:00', location: 'Salón 204C' },
      { dayOfWeek: 3, startTime: '07:00', endTime: '09:00', location: 'Salón 204C' },
    ],
  },
  '11602': {
    nrc: '11602',
    code: '04258',
    name: 'Contabilidad Gerencial',
    credits: 3,
    professor: 'Docente Titular',
    program: 'Economía y Negocios Internacionales',
    blocks: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '11:00', location: 'Edificio D Aula 102' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '11:00', location: 'Edificio D Aula 102' },
    ],
  },
  '11950': {
    nrc: '11950',
    code: '06326',
    name: 'Estadística para la Toma de Decisiones',
    credits: 3,
    professor: 'Docente Titular',
    program: 'Economía y Negocios Internacionales',
    blocks: [
      { dayOfWeek: 2, startTime: '07:00', endTime: '09:00', location: 'Laboratorio de Cómputo 2' },
      { dayOfWeek: 4, startTime: '07:00', endTime: '09:00', location: 'Laboratorio de Cómputo 2' },
    ],
  },
  '11961': {
    nrc: '11961',
    code: '06311',
    name: 'Pensamiento y Contexto Económico II',
    credits: 4,
    professor: 'Docente Titular',
    program: 'Economía y Negocios Internacionales',
    blocks: [
      { dayOfWeek: 2, startTime: '09:00', endTime: '11:00', location: 'Salón 301D' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '11:00', location: 'Salón 301D' },
    ],
  },
  '11959': {
    nrc: '11959',
    code: '06302',
    name: 'Comportamiento de las Firmas y el Consumidor',
    credits: 3,
    professor: 'Docente Titular',
    program: 'Economía y Negocios Internacionales',
    blocks: [
      { dayOfWeek: 1, startTime: '11:00', endTime: '13:00', location: 'Auditorio Varela' },
      { dayOfWeek: 3, startTime: '11:00', endTime: '13:00', location: 'Auditorio Varela' },
    ],
  },
  '12485': {
    nrc: '12485',
    code: '02810',
    name: 'Recordar y Olvidar: Identidad, Cultura y Comunicación',
    credits: 3,
    professor: 'Docente Titular',
    program: 'Economía y Negocios Internacionales',
    blocks: [
      { dayOfWeek: 2, startTime: '14:00', endTime: '16:00', location: 'Edificio C Aula 201' },
      { dayOfWeek: 4, startTime: '14:00', endTime: '16:00', location: 'Edificio C Aula 201' },
    ],
  },
  '12027': {
    nrc: '12027',
    code: '40074',
    name: 'Hip Hop: Cultura, Industria y Territorio',
    credits: 2,
    professor: 'Docente Titular',
    program: 'Economía y Negocios Internacionales',
    blocks: [
      { dayOfWeek: 5, startTime: '09:00', endTime: '12:00', location: 'Salón Multipropósito' },
    ],
  },

  // ─── INGENIERÍA INDUSTRIAL (4TO SEMESTRE) ──────────────────────────
  '11083': {
    nrc: '11083',
    code: '11373',
    name: 'Estadística Aplicada II',
    credits: 4,
    professor: 'Dr. Diego Fernando Cruz',
    program: 'Ingeniería Industrial',
    blocks: [
      { dayOfWeek: 2, startTime: '09:00', endTime: '11:00', location: 'Aula 102A' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '11:00', location: 'Aula 102A' },
    ],
  },
  '11084': {
    nrc: '11084',
    code: '05359',
    name: 'Optimización',
    credits: 4,
    professor: 'Ing. Carlos Mendoza',
    program: 'Ingeniería Industrial',
    blocks: [
      { dayOfWeek: 1, startTime: '07:00', endTime: '09:00', location: 'Salón 204E' },
      { dayOfWeek: 3, startTime: '07:00', endTime: '09:00', location: 'Salón 204E' },
    ],
  },
  '11239': {
    nrc: '11239',
    code: '08318',
    name: 'Física II: Electricidad y Magnetismo',
    credits: 4,
    professor: 'Dra. María Elena Ramos',
    program: 'Ingeniería Industrial',
    blocks: [
      { dayOfWeek: 1, startTime: '11:00', endTime: '13:00', location: 'Salón 301D' },
      { dayOfWeek: 3, startTime: '11:00', endTime: '13:00', location: 'Salón 301D' },
    ],
  },
  '11210': {
    nrc: '11210',
    code: '08319',
    name: 'Matemáticas Aplicadas III',
    credits: 4,
    professor: 'Dr. Julián Andrés Osorio',
    program: 'Ingeniería Industrial',
    blocks: [
      { dayOfWeek: 2, startTime: '14:00', endTime: '16:00', location: 'Auditorio Varela' },
      { dayOfWeek: 4, startTime: '14:00', endTime: '16:00', location: 'Auditorio Varela' },
    ],
  },
  '11300': {
    nrc: '11300',
    code: '05358',
    name: 'Logística y Cadena de Suministro',
    credits: 3,
    professor: 'Ing. Patricia Valencia',
    program: 'Ingeniería Industrial',
    blocks: [
      { dayOfWeek: 5, startTime: '08:00', endTime: '11:00', location: 'Edificio C Lab 4' },
    ],
  },

  // ─── INGENIERÍA DE SISTEMAS (5TO SEMESTRE) ─────────────────────────
  '11081': {
    nrc: '11081',
    code: '11081',
    name: 'Estructuras de Datos',
    credits: 4,
    professor: 'Ing. Mauricio Restrepo',
    program: 'Ingeniería de Sistemas',
    blocks: [
      { dayOfWeek: 1, startTime: '07:00', endTime: '09:00', location: 'Laboratorio de Redes' },
      { dayOfWeek: 3, startTime: '07:00', endTime: '09:00', location: 'Laboratorio de Redes' },
    ],
  },
  '11082': {
    nrc: '11082',
    code: '11082',
    name: 'Física Mecánica',
    credits: 4,
    professor: 'Dr. Andrés Delgado',
    program: 'Ingeniería de Sistemas',
    blocks: [
      { dayOfWeek: 1, startTime: '11:00', endTime: '13:00', location: 'Laboratorio de Física 1' },
      { dayOfWeek: 3, startTime: '11:00', endTime: '13:00', location: 'Laboratorio de Física 1' },
    ],
  },
  '11085': {
    nrc: '11085',
    code: '08320',
    name: 'Cálculo de Varias Variables',
    credits: 4,
    professor: 'Dra. Sofía Martínez',
    program: 'Ingeniería de Sistemas',
    blocks: [
      { dayOfWeek: 2, startTime: '09:00', endTime: '11:00', location: 'Salón 101B' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '11:00', location: 'Salón 101B' },
    ],
  },
};

/**
 * Busca información horaria oficial por NRC o código de asignatura
 */
export function lookupNRCCourse(nrcOrCode?: string): NRCCourseInfo | null {
  if (!nrcOrCode) return null;
  const clean = nrcOrCode.trim();

  // 1. Coincidencia directa por NRC
  if (OFFICIAL_NRC_CATALOG[clean]) {
    return OFFICIAL_NRC_CATALOG[clean];
  }

  // 2. Coincidencia por código de materia
  const byCode = Object.values(OFFICIAL_NRC_CATALOG).find(
    (item) => item.code.toLowerCase() === clean.toLowerCase()
  );
  if (byCode) return byCode;

  return null;
}
