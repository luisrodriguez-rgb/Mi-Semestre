import { RawEvidence, DetectionResult } from './types';
import { detectInputContainer } from './containerDetector';
import { classifyAcademicDocument } from './documentClassifier';

export { detectInputContainer } from './containerDetector';
export { classifyAcademicDocument } from './documentClassifier';

/**
 * Orquestador de Detección:
 * Analiza la evidencia cruda y produce un DetectionResult completo con contenedor,
 * tipo de documento, señales auditables y nivel de confianza.
 */
export function detectEvidence(evidence: RawEvidence): DetectionResult {
  const container = detectInputContainer(evidence);
  const textToAnalyze = evidence.text || '';
  const classification = classifyAcademicDocument(textToAnalyze, container);

  return {
    container,
    documentType: classification.documentType,
    confidence: classification.confidence,
    signals: classification.signals,
    rawSnippet: textToAnalyze.slice(0, 250),
  };
}
