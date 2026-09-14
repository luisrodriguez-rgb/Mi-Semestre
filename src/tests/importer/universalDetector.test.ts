import { detectInputContainer } from '../../lib/importer/universal/containerDetector';
import { classifyAcademicDocument } from '../../lib/importer/universal/documentClassifier';
import { detectEvidence } from '../../lib/importer/universal/detector';

function runDetectorTests() {
  console.log('--- Testing Universal Academic Detector & Classifier ---');

  // 1. Detección de Contenedores por Extensión, MIME y Contenido
  const icsByExt = detectInputContainer({ fileName: 'mi_horario_2026.ics' });
  if (icsByExt !== 'ics') throw new Error(`Expected ics by extension, got ${icsByExt}`);

  const pdfByMime = detectInputContainer({ fileType: 'application/pdf', fileName: 'matricula.bin' });
  if (pdfByMime !== 'pdf') throw new Error(`Expected pdf by MIME, got ${pdfByMime}`);

  const imageByExt = detectInputContainer({ fileName: 'horario_screenshot.png' });
  if (imageByExt !== 'image') throw new Error(`Expected image, got ${imageByExt}`);

  const icsByContent = detectInputContainer({ text: 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR' });
  if (icsByContent !== 'ics') throw new Error(`Expected ics by content, got ${icsByContent}`);

  console.log('✓ Container detection (MIME, extension, content) passed');

  // 2. Clasificación Multi-señal de Balance Académico
  const jasperText = `
SISTEMA DE REGISTRO ACADÉMICO - RRBANBALACA
Balance académico del estudiante
Cohorte: 202510
Promedio: 4.41
Materias por aprobar:
11373 Estadística Aplicada II 04
  `;

  const jasperResult = classifyAcademicDocument(jasperText, 'text');
  if (jasperResult.documentType !== 'academic_balance') {
    throw new Error(`Expected academic_balance, got ${jasperResult.documentType}`);
  }
  if (jasperResult.confidence !== 'high') {
    throw new Error(`Expected high confidence, got ${jasperResult.confidence}`);
  }
  if (jasperResult.signals.length < 3) {
    throw new Error(`Expected at least 3 detection signals, got ${jasperResult.signals.length}`);
  }

  console.log('✓ Multi-signal Academic Balance classification passed with signals:', jasperResult.signals.map(s => s.id));

  // 3. Clasificación de Horario por Días + Horas
  const scheduleText = 'Lunes y Miércoles 08:00 a 10:00 Aula 204C Cálculo Multivariable';
  const scheduleResult = classifyAcademicDocument(scheduleText, 'text');
  if (scheduleResult.documentType !== 'schedule') {
    throw new Error(`Expected schedule, got ${scheduleResult.documentType}`);
  }

  console.log('✓ Schedule document classification passed');

  // 4. Clasificación de Syllabus
  const syllabusText = `
Syllabus de la asignatura: Optimización Lineal
Políticas de Evaluación:
Primer corte: 25% (Parcial 1)
Segundo corte: 25% (Parcial 2)
Tercer corte: 20% (Talleres)
Examen final: 30%
Objetivos de aprendizaje: Modelación en programación lineal
  `;

  const syllabusResult = classifyAcademicDocument(syllabusText, 'text');
  if (syllabusResult.documentType !== 'syllabus') {
    throw new Error(`Expected syllabus, got ${syllabusResult.documentType}`);
  }

  console.log('✓ Syllabus classification passed with grading policy signals');

  // 5. Fachada detectEvidence
  const fullDetection = detectEvidence({ text: jasperText });
  if (fullDetection.container !== 'text' || fullDetection.documentType !== 'academic_balance') {
    throw new Error('Facade detectEvidence failed');
  }

  console.log('ALL DETECTOR & CLASSIFIER TESTS PASSED SUCCESSFULLY! 🎉');
}

runDetectorTests();
