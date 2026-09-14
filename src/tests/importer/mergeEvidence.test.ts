import { resolveAcademicEntities } from '../../lib/importer/universal/entityResolver';
import { ParsedAcademicData } from '../../lib/importer/universal/types';

function runMergeEvidenceTests() {
  console.log('--- Testing Multi-Evidence Graph Merge ---');

  // Fuente 1: Balance Jasper (Aporta estudiante, materias, códigos y créditos)
  const balanceSource: ParsedAcademicData = {
    student: {
      name: 'Luis Ernesto Rodríguez',
      studentCode: 'A00414805',
      program: 'Ingeniería Industrial',
      gpa: 4.35,
    },
    subjects: [
      { id: 'sub-opt', name: 'Optimización', code: '05359', credits: 3 },
      { id: 'sub-est', name: 'Estadística Aplicada II', code: '11373', credits: 3 },
    ],
    scheduleBlocks: [],
  };

  // Fuente 2: ICS Calendar (Aporta días y horas)
  const icsSource: ParsedAcademicData = {
    subjects: [
      { id: 'sub-opt-ics', name: 'Optimización' },
    ],
    scheduleBlocks: [
      { subjectId: 'sub-opt-ics', dayOfWeek: 1, startTime: '07:00', endTime: '09:00' },
      { subjectId: 'sub-opt-ics', dayOfWeek: 3, startTime: '07:00', endTime: '09:00' },
    ],
  };

  // Fuente 3: Captura / Texto de salones (Aporta salones)
  const roomSource: ParsedAcademicData = {
    subjects: [
      { id: 'sub-opt-room', name: 'Optimización' },
    ],
    scheduleBlocks: [
      { subjectId: 'sub-opt-room', dayOfWeek: 1, startTime: '07:00', endTime: '09:00', location: 'Edificio D · Aula 305' },
    ],
  };

  const mergeOutput = resolveAcademicEntities([balanceSource, icsSource, roomSource]);
  const merged = mergeOutput.resolvedData;

  // Verificaciones
  if (merged.subjects.length !== 2) {
    throw new Error(`Expected 2 distinct subjects, got ${merged.subjects.length}`);
  }

  const optSubject = merged.subjects.find((s) => s.name === 'Optimización');
  if (!optSubject || optSubject.credits !== 3 || optSubject.code !== '05359') {
    throw new Error('Optimización failed to retain credits and code from balance');
  }

  // Deberían haber 2 bloques (Lunes y Miércoles), y el del Lunes debe haber adoptado el salón de la Fuente 3
  if (merged.scheduleBlocks.length !== 2) {
    throw new Error(`Expected 2 schedule blocks for Optimización, got ${merged.scheduleBlocks.length}`);
  }

  const mondayBlock = merged.scheduleBlocks.find((b) => b.dayOfWeek === 1);
  if (!mondayBlock || mondayBlock.location !== 'Edificio D · Aula 305') {
    throw new Error(`Monday block failed to inherit room from roomSource, got: ${mondayBlock?.location}`);
  }

  console.log('✓ Multi-evidence merge: Balance (Student/Credits) + ICS (Times) + Room (Location) successfully unified');
  console.log('ALL MERGE EVIDENCE TESTS PASSED SUCCESSFULLY! 🎉');
}

runMergeEvidenceTests();
