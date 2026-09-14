import { RawEvidence, InputContainer } from './types';

/**
 * Determina el contenedor físico/digital del archivo o texto
 * basándose en tipo MIME, extensión y encabezados binarios o de texto.
 */
export function detectInputContainer(evidence: RawEvidence): InputContainer {
  const fileName = evidence.file?.name || evidence.fileName || '';
  const fileType = evidence.file?.type || evidence.fileType || '';
  const ext = fileName.split('.').pop()?.toLowerCase();

  // 1. Detección por extensión o tipo MIME oficial
  if (ext === 'ics' || fileType === 'text/calendar') {
    return 'ics';
  }
  if (ext === 'pdf' || fileType === 'application/pdf') {
    return 'pdf';
  }
  if (
    ext === 'png' ||
    ext === 'jpg' ||
    ext === 'jpeg' ||
    ext === 'webp' ||
    fileType.startsWith('image/')
  ) {
    return 'image';
  }

  // 2. Detección por firma interna en texto plano
  const text = evidence.text || '';
  if (/BEGIN:VCALENDAR/i.test(text)) {
    return 'ics';
  }

  return 'text';
}
