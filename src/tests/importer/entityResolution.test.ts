import { matchSubjects } from '../../lib/importer/universal/subjectMatcher';
import { resolveAcademicEntities } from '../../lib/importer/universal/entityResolver';

function runEntityResolutionTests() {
  console.log('--- Testing Entity Resolution & Subject Matcher Hierarchy ---');

  // 1. Coincidencia por Código Exacto
  const codeMatch = matchSubjects(
    { name: 'Estadística 2', code: 'CFT-11373' },
    { name: 'Estadística Aplicada II', code: 'CFT-11373' }
  );
  if (codeMatch.decision !== 'exact_code') {
    throw new Error(`Expected exact_code, got ${codeMatch.decision}`);
  }
  console.log('✓ Exact code matching passed');

  // 2. Coincidencia por NRC Exacto
  const nrcMatch = matchSubjects(
    { name: 'Contabilidad', nrc: '11602' },
    { name: 'Contabilidad Gerencial', nrc: '11602' }
  );
  if (nrcMatch.decision !== 'exact_nrc') {
    throw new Error(`Expected exact_nrc, got ${nrcMatch.decision}`);
  }
  console.log('✓ Exact NRC matching passed');

  // 3. Coincidencia por Nombre Normalizado (Tildes y mayúsculas ignoradas)
  const nameMatch = matchSubjects(
    { name: 'FÍSICA II' },
    { name: 'Fisica ii' }
  );
  if (nameMatch.decision !== 'exact_name') {
    throw new Error(`Expected exact_name, got ${nameMatch.decision}`);
  }
  console.log('✓ Exact normalized name matching passed');

  // 4. Similitud Difusa Alta (>= 0.85)
  const fuzzyMatch = matchSubjects(
    { name: 'Optimización Lineal' },
    { name: 'Optimizacion Lineal' }
  );
  if (fuzzyMatch.decision !== 'exact_name' && fuzzyMatch.decision !== 'fuzzy_match') {
    throw new Error(`Expected high fuzzy or exact match, got ${fuzzyMatch.decision}`);
  }
  console.log('✓ High fuzzy matching passed');

  // 5. Regla de Oro: Ambigüedad (0.65 a 0.84) NUNCA vincula silenciosamente
  const ambiguousMatch = matchSubjects(
    { name: 'Matemáticas para Negocios I' },
    { name: 'Matemáticas para Negocios II' }
  );
  if (ambiguousMatch.decision !== 'ambiguous') {
    throw new Error(`Expected 'ambiguous' (no silent merge for I vs II), got ${ambiguousMatch.decision}`);
  }
  console.log('✓ Negative guardrail: Ambiguous names prevented from silent binding passed');

  // 6. Test de Fusión a través de resolveAcademicEntities
  const sourceA = {
    subjects: [{ id: 'sub-a', name: 'Estadística Aplicada II', code: '11373', credits: 3 }],
    scheduleBlocks: [],
  };

  const sourceB = {
    subjects: [{ id: 'sub-b', name: 'Estadística 2', code: '11373' }],
    scheduleBlocks: [
      { subjectId: 'sub-b', dayOfWeek: 1 as const, startTime: '14:00', endTime: '16:00', location: 'Lab 3' },
    ],
  };

  const resolution = resolveAcademicEntities([sourceA, sourceB]);
  if (resolution.resolvedData.subjects.length !== 1) {
    throw new Error(`Expected 1 merged subject, got ${resolution.resolvedData.subjects.length}`);
  }
  if (resolution.resolvedData.scheduleBlocks[0].subjectId !== 'sub-a') {
    throw new Error(`Expected schedule block to be bound to canonical ID sub-a, got ${resolution.resolvedData.scheduleBlocks[0].subjectId}`);
  }

  console.log('✓ Cross-source entity resolution into canonical subject passed');
  console.log('ALL ENTITY RESOLUTION TESTS PASSED SUCCESSFULLY! 🎉');
}

runEntityResolutionTests();
