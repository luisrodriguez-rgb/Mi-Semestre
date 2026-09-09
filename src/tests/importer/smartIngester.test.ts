import {
  parseJasperAcademicBalance,
  parseScheduleFreeText,
  titleCase,
  mapDayToNumber,
} from '../../lib/importer/smartAcademicIngester';

console.log('--- Testing Smart Academic Ingester ---');

// TEST 1: Formato de Nombres
const testName = titleCase('RODRIGUEZ GURRUTE LUIS ERNESTO');
if (testName !== 'Rodriguez Gurrute Luis Ernesto') {
  throw new Error(`titleCase failed: expected "Rodriguez Gurrute Luis Ernesto", got "${testName}"`);
}
console.log('✓ titleCase passed');

// TEST 2: Mapeo de Días
if (mapDayToNumber('Lunes') !== 1 || mapDayToNumber('Martes') !== 2 || mapDayToNumber('Vie') !== 5) {
  throw new Error('mapDayToNumber failed');
}
console.log('✓ mapDayToNumber passed');

// TEST 3: Balance Académico Oficial Icesi (Jasper / Banner)
const jasperMock = `
SISTEMA DE REGISTRO ACADÉMICO
Balance académico
1110295145
sep 8, 2026 11:30:25 PM
RRBANBALACA - JASPER Página 1 de 2
Estudiante: A00414805 - RODRIGUEZ GURRUTE LUIS ERNESTO
Semestre: 4
Cohorte: 202510
Promedio: 4.3
Programa: IND - Ingeniería Industrial
Materias por aprobar
No. Eliminar Código Materia Semestre
4 IND 05358 Optativa profesional 04
5 CFT 11373 Estadística aplicada II 04
6 CFT 11370 Física II 04
7 IND 05359 Optimización 04
8 CFT 11356 Matemáticas aplicadas III 04
`;

const parsedJasper = parseJasperAcademicBalance(jasperMock);
if (!parsedJasper) {
  throw new Error('parseJasperAcademicBalance returned null for valid Jasper text');
}

if (parsedJasper.profile.studentCode !== 'A00414805') {
  throw new Error(`Expected studentCode A00414805, got ${parsedJasper.profile.studentCode}`);
}

if (parsedJasper.profile.gpa !== 4.3) {
  throw new Error(`Expected GPA 4.3, got ${parsedJasper.profile.gpa}`);
}

if (parsedJasper.profile.semesterNumber !== 4) {
  throw new Error(`Expected semesterNumber 4, got ${parsedJasper.profile.semesterNumber}`);
}

if (parsedJasper.subjects.length < 4) {
  throw new Error(`Expected at least 4 subjects, got ${parsedJasper.subjects.length}`);
}

if (parsedJasper.scheduleBlocks.length === 0) {
  throw new Error('Expected schedule blocks to be generated');
}

console.log(`✓ parseJasperAcademicBalance passed with ${parsedJasper.subjects.length} subjects and ${parsedJasper.scheduleBlocks.length} schedule blocks`);

// TEST 4: Texto libre de horario universitario
const freeTextMock = `
Cálculo Multivariado - Lunes y Miércoles 07:00-09:00 - Salón 204E
Física Mecánica - Martes y Jueves 09:00 a 11:00 - Aula 102A
Estructuras de Datos - Viernes 14:00-17:00 - Laboratorio 3
`;

const parsedFree = parseScheduleFreeText(freeTextMock);
if (parsedFree.subjects.length < 3) {
  throw new Error(`Expected at least 3 subjects from free text, got ${parsedFree.subjects.length}`);
}

if (parsedFree.scheduleBlocks.length < 5) {
  throw new Error(`Expected at least 5 schedule blocks (including double days), got ${parsedFree.scheduleBlocks.length}`);
}

console.log(`✓ parseScheduleFreeText passed with ${parsedFree.subjects.length} subjects and ${parsedFree.scheduleBlocks.length} blocks`);

console.log('ALL SMART INGESTER TESTS PASSED SUCCESSFULLY! 🎉');
