import { ingestAcademicEvidence } from '../../lib/importer/universal/pipeline';
import { RawEvidence } from '../../lib/importer/universal/types';

async function runMultiInputPipelineTests() {
  console.log('--- Testing Multi-Input End-to-End Pipeline ---');

  // Entrada 1: Balance Oficial Jasper (PDF/Texto)
  const balanceEvidence: RawEvidence = {
    text: `
UNIVERSIDAD ICESI
SISTEMA DE REGISTRO ACADÉMICO - RRBANBALACA
Balance académico del estudiante
Estudiante: A00414805 - LUIS ERNESTO RODRIGUEZ GURRUTE
Programa: ING - Ingeniería Industrial
Semestre: 4
Cohorte: 202510
Promedio: 4.35
Materias matriculadas:
11373 Estadística Aplicada II 04
05359 Optimización 04
    `,
  };

  // Entrada 2: Calendario .ICS Externo (Google Calendar / Banner)
  const icsEvidence: RawEvidence = {
    text: `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Banner//Horario//ES
BEGIN:VEVENT
SUMMARY:Estadística Aplicada II
DTSTART;TZID=America/Bogota:20260914T140000
DTEND;TZID=America/Bogota:20260914T160000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE
LOCATION:Edificio Palmas
END:VEVENT
BEGIN:VEVENT
SUMMARY:Optimización
DTSTART;TZID=America/Bogota:20260915T100000
DTEND;TZID=America/Bogota:20260915T120000
RRULE:FREQ=WEEKLY;BYDAY=TU,TH
LOCATION:Aula Campus
END:VEVENT
END:VCALENDAR`,
  };

  // Entrada 3: Nota / Screenshot de WhatsApp con asignación de aula exacta
  const classroomNoteEvidence: RawEvidence = {
    text: `
Recordatorio salón Optimización:
Martes y Jueves 10:00 - 12:00 Salón 102B (Edificio C)
    `,
  };

  const multiEvidenceInput: RawEvidence[] = [
    balanceEvidence,
    icsEvidence,
    classroomNoteEvidence,
  ];

  const result = await ingestAcademicEvidence(multiEvidenceInput);

  // 1. Verificaciones de Detección
  if (result.detections.length !== 3) {
    throw new Error(`Se esperaban 3 detecciones, se obtuvieron ${result.detections.length}`);
  }
  console.log('✓ Detección individual de 3 evidencias completada');

  console.log('Resulting subjects:', result.data.subjects.map((s) => ({ id: s.id, name: s.name, code: s.code })));

  // 2. Verificación de Sujetos Canónicos
  if (result.data.subjects.length !== 2) {
    throw new Error(`Se esperaban exactamente 2 asignaturas únicas, se obtuvieron ${result.data.subjects.length}`);
  }
  const statSubject = result.data.subjects.find((s) => s.name.includes('Estadística'));
  if (!statSubject || statSubject.code !== '11373' || statSubject.credits !== 4) {
    throw new Error('Estadística Aplicada II no conservó sus atributos del balance');
  }
  console.log(`✓ Materias consolidadas: ${result.data.subjects.map((s) => s.name).join(', ')}`);

  // 3. Verificación de Perfil de Estudiante
  if (result.data.student?.studentCode !== 'A00414805') {
    throw new Error(`Código de estudiante esperado A00414805, obtenido ${result.data.student?.studentCode}`);
  }
  if (result.data.student?.gpa !== 4.35) {
    throw new Error(`Promedio esperado 4.35, obtenido ${result.data.student?.gpa}`);
  }
  console.log('✓ Perfil de estudiante consolidado desde evidencia oficial');

  // 4. Verificación de Horarios y Salón Enriquecido
  // Estadística: Lunes y Miércoles (2 bloques)
  // Optimización: Martes y Jueves (2 bloques)
  if (result.data.scheduleBlocks.length !== 4) {
    throw new Error(`Se esperaban 4 bloques de clase semanales, se obtuvieron ${result.data.scheduleBlocks.length}`);
  }

  const optSubject = result.data.subjects.find((s) => s.name.includes('Optimización'));
  const optBlocks = result.data.scheduleBlocks.filter((b) => b.subjectId === optSubject?.id);
  const enrichedBlock = optBlocks.find((b) => b.location && b.location.includes('102B'));
  if (!enrichedBlock) {
    throw new Error('El salón de Optimización (102B) no se enriqueció a partir de la tercera evidencia');
  }
  console.log('✓ Enriquecimiento cruzado: Salón 102B fusionado exitosamente en horario de Optimización');

  // 5. Verificación de Integridad de Evaluaciones (Cero datos falsos)
  if (result.summary.examsCount !== null) {
    throw new Error(`Se esperaba null para exámenes no evidenciados, se obtuvo ${result.summary.examsCount}`);
  }
  console.log('✓ Invariante de honestidad: No se inventaron evaluaciones');
  console.log('ALL MULTI-INPUT PIPELINE TESTS PASSED! 🎉');
}

runMultiInputPipelineTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
