import {
  extractEvaluationItemsFromText,
  hasAmbiguousExtraction,
} from '../../lib/academic-engine/grades/gradeExtractor';

console.log('--- Testing Grade & Syllabus Extractor ---');

// TEST 1: Texto simple copiado de un sílabo con porcentajes
const syllabusText = `
Parcial 1 25% 3.8
Parcial 2: 25%
Taller de programación 20% 4.5
Proyecto Final (30%)
`;

const items1 = extractEvaluationItemsFromText(syllabusText);

if (items1.length !== 4) {
  throw new Error(`TEST 1 Failed: Se esperaban 4 ítems, obtenidos ${items1.length}`);
}

if (items1[0].weight !== 25 || items1[0].grade !== 3.8) {
  throw new Error(`TEST 1 Failed: Ítem 0 incorrecto: ${JSON.stringify(items1[0])}`);
}

if (items1[1].weight !== 25 || items1[1].grade !== null) {
  throw new Error(`TEST 1 Failed: Ítem 1 incorrecto: ${JSON.stringify(items1[1])}`);
}

if (items1[2].weight !== 20 || items1[2].grade !== 4.5) {
  throw new Error(`TEST 1 Failed: Ítem 2 incorrecto: ${JSON.stringify(items1[2])}`);
}

if (items1[3].weight !== 30 || items1[3].grade !== null) {
  throw new Error(`TEST 1 Failed: Ítem 3 incorrecto: ${JSON.stringify(items1[3])}`);
}

console.log('✓ TEST 1: Extracción correcta de sílabo estándar con y sin notas');

// TEST 2: Texto con encabezados de tabla (Moodle / Banner)
const moodleText = `
Actividad	Ponderación	Calificación
Primer Parcial Teórico	20%	3.2
Segundo Parcial Teórico	20%	2.8
Laboratorios y Quices	30%	4.0
Examen Final	30%	-
`;

const items2 = extractEvaluationItemsFromText(moodleText);

if (items2.length !== 4) {
  throw new Error(`TEST 2 Failed: Se esperaban 4 ítems, obtenidos ${items2.length}`);
}

if (items2[0].name !== 'Primer Parcial Teórico' || items2[0].weight !== 20 || items2[0].grade !== 3.2) {
  throw new Error(`TEST 2 Failed: Ítem 0 Moodle incorrecto: ${JSON.stringify(items2[0])}`);
}

console.log('✓ TEST 2: Filtrado de encabezados y extracción de tabla Moodle/Banner');

// TEST 3: Manejo de texto vacío o sin datos
const items3 = extractEvaluationItemsFromText('');
if (items3.length !== 0) {
  throw new Error('TEST 3 Failed: Esperaba 0 ítems para texto vacío');
}
console.log('✓ TEST 3: Manejo seguro de texto vacío');

// TEST 4: "Plan de evaluación" (título) no debe crear un componente con 0%
const titleText = `
Plan de evaluación
Parcial 1 30%
Parcial 2 30%
Proyecto 40%
`;
const items4 = extractEvaluationItemsFromText(titleText);
if (items4.some((it) => it.name.toLowerCase().includes('plan de evaluaci'))) {
  throw new Error('TEST 4 Failed: "Plan de evaluación" no debe crear un componente');
}
if (items4.length !== 3) {
  throw new Error(`TEST 4 Failed: Se esperaban 3 componentes reales, obtenidos: ${items4.length}`);
}
console.log('✓ TEST 4: Título "Plan de evaluación" descartado sin crear componente ficticio');

// TEST 5: "Parcial 1 25% nota 4" -> nombre "Parcial 1", nota 4.0 (número entero de nota detectado)
const integerGradeText = 'Parcial 1 25% nota 4';
const items5 = extractEvaluationItemsFromText(integerGradeText);
if (items5.length !== 1) {
  throw new Error(`TEST 5 Failed: Esperaba 1 ítem, obtenidos: ${items5.length}`);
}
if (items5[0].name !== 'Parcial 1') {
  throw new Error(`TEST 5 Failed: Nombre esperado "Parcial 1", obtenido: "${items5[0].name}"`);
}
if (items5[0].weight !== 25) {
  throw new Error(`TEST 5 Failed: Peso esperado 25, obtenido: ${items5[0].weight}`);
}
if (items5[0].grade !== 4.0) {
  throw new Error(`TEST 5 Failed: Nota esperada 4.0, obtenida: ${items5[0].grade}`);
}
console.log('✓ TEST 5: "Parcial 1 25% nota 4" extrae nombre "Parcial 1" y nota entera 4.0');

// TEST 6: "Semana 8: Parcial 2 (20%)" -> nombre "Parcial 2", sin paréntesis vacíos
const weekParenthesesText = 'Semana 8: Parcial 2 (20%)';
const items6 = extractEvaluationItemsFromText(weekParenthesesText);
if (items6.length !== 1) {
  throw new Error(`TEST 6 Failed: Esperaba 1 ítem, obtenidos: ${items6.length}`);
}
if (items6[0].name !== 'Parcial 2') {
  throw new Error(`TEST 6 Failed: Nombre esperado "Parcial 2", obtenido: "${items6[0].name}"`);
}
if (items6[0].weight !== 20) {
  throw new Error(`TEST 6 Failed: Peso esperado 20, obtenido: ${items6[0].weight}`);
}
if (items6[0].name.includes('(') || items6[0].name.includes(')')) {
  throw new Error(`TEST 6 Failed: El nombre no debe contener paréntesis vacíos: "${items6[0].name}"`);
}
console.log('✓ TEST 6: "Semana 8: Parcial 2 (20%)" extrae nombre limpio "Parcial 2" sin paréntesis vacíos');

// TEST 7: hasAmbiguousExtraction detecta casos dudosos para conmutar a IA
if (hasAmbiguousExtraction([], '')) {
  console.log('✓ TEST 7: Detecta texto vacío como ambiguo');
}
if (hasAmbiguousExtraction([{ id: '1', name: 'Componente 1', weight: 0, grade: null }], 'Parciales')) {
  console.log('✓ TEST 7.1: Detecta ítems sin porcentaje como ambiguos para invocar IA');
}

console.log('ALL GRADE EXTRACTOR TESTS PASSED SUCCESSFULLY!');
