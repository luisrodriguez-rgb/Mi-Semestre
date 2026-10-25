import { extractEvaluationItemsFromText } from '../../lib/academic-engine/grades/gradeExtractor';

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
  throw new Error(`TEST 3 Failed: Esperaba 0 ítems para texto vacío`);
}
console.log('✓ TEST 3: Manejo seguro de texto vacío');
