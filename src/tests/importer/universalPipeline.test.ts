import { detectEvidence, detectInputContainer } from '../../lib/importer/universal/detector';
import { ingestAcademicEvidence } from '../../lib/importer/universal/pipeline';

function runUniversalPipelineTests() {
  console.log('--- Testing Universal Academic Ingest Pipeline ---');

  // 1. Test Detección de Contenedores y Firmas de Contenido
  const icsDetection = detectEvidence({
    text: 'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Clase de Cálculo\nEND:VEVENT\nEND:VCALENDAR',
  });

  if (icsDetection.container !== 'ics') {
    throw new Error(`Expected container 'ics', got ${icsDetection.container}`);
  }
  if (icsDetection.documentType !== 'schedule') {
    throw new Error(`Expected documentType 'schedule', got ${icsDetection.documentType}`);
  }
  console.log('✓ Detección de calendario ICS por firma interna aprobada');

  // 2. Test Detección Multi-señal de Balance Jasper
  const sampleJasper = `
UNIVERSIDAD ICESI
SISTEMA DE REGISTRO ACADÉMICO - RRBANBALACA
Balance académico del estudiante
Estudiante: A00414805 - RODRIGUEZ GURRUTE LUIS ERNESTO
Programa: ING - Ingeniería Industrial
Semestre: 4
Cohorte: 202510
Promedio: 4.35
Materias matriculadas:
11373 Estadística Aplicada II 04
05359 Optimización 04
11239 Electricidad y Laboratorio 04
  `;

  const jasperDetection = detectEvidence({ text: sampleJasper });
  if (jasperDetection.documentType !== 'academic_balance') {
    throw new Error(`Expected 'academic_balance', got ${jasperDetection.documentType}`);
  }
  if (jasperDetection.confidence !== 'high') {
    throw new Error(`Expected 'high' confidence for multi-signal Jasper, got ${jasperDetection.confidence}`);
  }
  console.log('✓ Detección multi-señal de Balance Jasper aprobada');

  // 3. Test Pipeline con Balance Jasper: NO inventar exámenes ni horarios
  return ingestAcademicEvidence({ text: sampleJasper }).then((result) => {
    if (result.data.subjects.length === 0) {
      throw new Error('Debería haber extraído al menos 3 materias del balance Jasper.');
    }
    if (result.summary.examsCount !== null) {
      throw new Error(`Principio violado: El balance no tiene exámenes, se esperaba null (no evidenciado) pero se obtuvieron ${result.summary.examsCount}`);
    }

    const hasNoExamsWarning = result.warnings.some((w) => w.code === 'EXAMS_NOT_EVIDENCED');
    if (!hasNoExamsWarning) {
      throw new Error('Se esperaba warning transparente EXAMS_NOT_EVIDENCED cuando no hay evaluaciones.');
    }

    console.log('✓ Pipeline con Balance: Extracción limpia sin inventar exámenes falsos aprobada');

    // 4. Test Fusión Multi-Evidencia (Balance + Horario Libre)
    const scheduleText = `
Lunes y Miércoles 08:00 - 10:00 Salón 204C Estadística Aplicada II
Martes y Jueves 10:00 - 12:00 Aula 102B Optimización
    `;

    return ingestAcademicEvidence([
      { text: sampleJasper },
      { text: scheduleText },
    ]).then((mergedResult) => {
      if (mergedResult.data.subjects.length === 0) {
        throw new Error('Fusión multi-evidencia falló al preservar materias.');
      }
      if (mergedResult.summary.scheduleBlocksCount === 0) {
        throw new Error('Fusión multi-evidencia falló al incorporar bloques de horario.');
      }

      console.log(`✓ Fusión Multi-Evidencia aprobada: ${mergedResult.data.subjects.length} materias, ${mergedResult.summary.scheduleBlocksCount} bloques.`);
      console.log('ALL UNIVERSAL PIPELINE TESTS PASSED SUCCESSFULLY! 🎉');
    });
  });
}

runUniversalPipelineTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
