import { decisionTracker } from '../../lib/academic-engine/metrics/decisionTracker';

function testDecisionTracker() {
  console.log('--- Testing Decision Telemetry & Quality Tracking ---');

  decisionTracker.clearDecisionHistory();

  // Simulación: El sistema muestra 10 recomendaciones
  for (let i = 1; i <= 10; i++) {
    decisionTracker.recordRecommendationShown(`rec_${i}`, `task_${i}`, 'sub_calc');
  }

  // El usuario acepta 7 recomendaciones
  for (let i = 1; i <= 7; i++) {
    decisionTracker.recordRecommendationAccepted(`rec_${i}`, `task_${i}`);
  }

  // El usuario completa 5 sesiones Pomodoro
  for (let i = 1; i <= 5; i++) {
    decisionTracker.recordFocusCompleted(`task_${i}`, 45);
  }

  // En 3 ocasiones, el usuario sobreescribió la recomendación eligiendo otra tarea
  decisionTracker.recordRecommendationOverridden('rec_8', 'task_alt_1', 'NEED_TO_SUBMIT_OTHER_FIRST');
  decisionTracker.recordRecommendationOverridden('rec_9', 'task_alt_2', 'NEED_TO_SUBMIT_OTHER_FIRST');
  decisionTracker.recordRecommendationOverridden('rec_10', 'task_alt_3', 'ALREADY_STUDIED');

  const metrics = decisionTracker.getDecisionMetricsSummary();

  console.log('Métricas calculadas:', metrics);

  if (metrics.totalShown !== 10) {
    throw new Error(`FALLO: totalShown esperado 10, obtenido ${metrics.totalShown}`);
  }
  if (metrics.totalAccepted !== 7) {
    throw new Error(`FALLO: totalAccepted esperado 7, obtenido ${metrics.totalAccepted}`);
  }
  if (metrics.decisionAcceptanceRate !== 70) {
    throw new Error(`FALLO: decisionAcceptanceRate esperado 70%, obtenido ${metrics.decisionAcceptanceRate}%`);
  }
  if (metrics.decisionCompletionRate !== 71) { // 5 / 7 = 71.4% -> 71%
    throw new Error(`FALLO: decisionCompletionRate esperado 71%, obtenido ${metrics.decisionCompletionRate}%`);
  }
  if (metrics.recommendationOverrideRate !== 30) {
    throw new Error(`FALLO: recommendationOverrideRate esperado 30%, obtenido ${metrics.recommendationOverrideRate}%`);
  }
  if (metrics.overrideReasonCounts.NEED_TO_SUBMIT_OTHER_FIRST !== 2) {
    throw new Error(`FALLO: Desglose de NEED_TO_SUBMIT_OTHER_FIRST esperado 2, obtenido ${metrics.overrideReasonCounts.NEED_TO_SUBMIT_OTHER_FIRST}`);
  }

  console.log('✓ Decision Acceptance Rate (70%) calculado con exactitud.');
  console.log('✓ Decision Completion Rate (71%) calculado con exactitud.');
  console.log('✓ Override Rate (30%) y desglose de motivos auditados correctamente.');
  console.log('\nALL DECISION TRACKER TESTS PASSED SUCCESSFULLY! 📊\n');
}

testDecisionTracker();
