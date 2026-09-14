import { resolveAcademicEntities } from '../../lib/importer/universal/entityResolver';
import { ParsedAcademicData } from '../../lib/importer/universal/types';
import { normalizeParsedAcademicData } from '../../lib/importer/universal/normalizer';

function runDeduplicationAcrossSourcesTests() {
  console.log('--- Testing Deduplication Across Multiple Evidence Sources ---');

  // Fuente 1: Archivo ICS con bloque de horario básico
  const icsSource: ParsedAcademicData = {
    subjects: [
      { id: 'sub-ics', name: 'Optimización', code: '05359' },
    ],
    scheduleBlocks: [
      {
        subjectId: 'sub-ics',
        dayOfWeek: 2, // Martes
        startTime: '10:00',
        endTime: '12:00',
        location: undefined,
      },
    ],
  };

  // Fuente 2: Texto o Screenshot de Horario con ubicación adicional para el MISMO bloque
  const screenshotSource: ParsedAcademicData = {
    subjects: [
      { id: 'sub-img', name: 'Optimizacion', code: '05359' },
    ],
    scheduleBlocks: [
      {
        subjectId: 'sub-img',
        dayOfWeek: 2, // Martes (mismo día y hora)
        startTime: '10:00',
        endTime: '12:00',
        location: 'Edificio C - Aula 102B', // Ubicación enriquecida
      },
    ],
  };

  // Fuente 3: Texto de confirmación de WhatsApp
  const textSource: ParsedAcademicData = {
    subjects: [
      { id: 'sub-txt', name: 'Optimización Lineal', code: '05359', credits: 4 },
    ],
    scheduleBlocks: [
      {
        subjectId: 'sub-txt',
        dayOfWeek: 2,
        startTime: '10:00',
        endTime: '12:00',
      },
      {
        subjectId: 'sub-txt',
        dayOfWeek: 4, // Jueves (segunda clase semanal)
        startTime: '10:00',
        endTime: '12:00',
        location: 'Aula 102B',
      },
    ],
  };

  // Ejecutar resolución y deduplicación entre las 3 fuentes
  const { resolvedData } = resolveAcademicEntities([icsSource, screenshotSource, textSource]);
  const normalized = normalizeParsedAcademicData(resolvedData);

  // 1. Debe haber exactamente 1 sola materia normalizada (no 3)
  if (normalized.subjects.length !== 1) {
    throw new Error(`Se esperaba 1 materia unificada, pero se obtuvieron ${normalized.subjects.length}`);
  }
  const subject = normalized.subjects[0];
  if (subject.code !== '05359') {
    throw new Error(`Código esperado 05359, obtenido ${subject.code}`);
  }
  if (subject.credits !== 4) {
    throw new Error(`Créditos esperados 4 (heredados de Fuente 3), obtenidos ${subject.credits}`);
  }
  console.log(`✓ Deduplicación de Asignatura: 3 fuentes unificadas en 1 materia ("${subject.name}")`);

  // 2. Bloques de horario: El bloque de martes 10:00-12:00 estaba en las 3 fuentes.
  // Debe deduplicarse a 1 solo bloque para el martes y heredar la ubicación más específica.
  // El bloque de jueves 10:00-12:00 estaba en 1 fuente. Total bloques esperados: 2 (no 4)
  if (normalized.scheduleBlocks.length !== 2) {
    throw new Error(`Se esperaban 2 bloques únicos de clase (Martes y Jueves), pero se obtuvieron ${normalized.scheduleBlocks.length}`);
  }

  const tuesdayBlock = normalized.scheduleBlocks.find((b) => b.dayOfWeek === 2);
  if (!tuesdayBlock) {
    throw new Error('No se encontró el bloque del Martes');
  }
  if (!tuesdayBlock.location || !tuesdayBlock.location.includes('102B')) {
    throw new Error(`El bloque del martes no heredó la ubicación enriquecida: ${tuesdayBlock.location}`);
  }

  const thursdayBlock = normalized.scheduleBlocks.find((b) => b.dayOfWeek === 4);
  if (!thursdayBlock) {
    throw new Error('No se encontró el bloque del Jueves');
  }

  console.log('✓ Deduplicación de Horarios: 4 bloques redundantes colapsados a 2 bloques únicos con ubicación enriquecida');
  console.log('ALL DEDUPLICATION ACROSS SOURCES TESTS PASSED! 🎉');
}

runDeduplicationAcrossSourcesTests();
