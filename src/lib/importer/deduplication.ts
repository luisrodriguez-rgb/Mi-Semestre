import { DataSource, ScheduleBlock } from '@/types';

/**
 * Normaliza cadenas para comparación determinística (minúsculas, sin tildes, sin espacios redundantes)
 */
export function normalizeText(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Hashing rápido no criptográfico (FNV-1a 32-bit) para generar identificadores estables
 */
export function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * 1. Fingerprint Externo: Identifica el evento proveniente del calendario origen (Google, Outlook, etc.)
 */
export function computeExternalFingerprint(
  source: DataSource,
  externalUid: string,
  occurrenceId: string = '0'
): string {
  const payload = `${source}|${externalUid.trim()}|${occurrenceId.trim()}`;
  return `ext_${fnv1aHash(payload)}`;
}

/**
 * 2. Fingerprint Académico: Detecta si dos eventos representan la misma clase universitaria,
 * sin importar de qué archivo o fuente provengan
 */
export function computeAcademicFingerprint(
  subjectNameOrCode: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  location?: string
): string {
  const normSubject = normalizeText(subjectNameOrCode);
  const normLoc = normalizeText(location);
  const payload = `${normSubject}|d${dayOfWeek}|${startTime.trim()}-${endTime.trim()}|${normLoc}`;
  return `acad_${fnv1aHash(payload)}`;
}

/**
 * Fingerprint de clase sin ubicación (permite detectar cambio de salón)
 */
export function computeTimeSlotSubjectFingerprint(
  subjectNameOrCode: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string
): string {
  const normSubject = normalizeText(subjectNameOrCode);
  const payload = `${normSubject}|d${dayOfWeek}|${startTime.trim()}-${endTime.trim()}`;
  return `slot_${fnv1aHash(payload)}`;
}

export interface BlockComparisonResult {
  action: 'create' | 'update' | 'skip';
  existingId?: string;
  reason: string;
  diff?: {
    location?: { old?: string; new?: string };
  };
}

/**
 * Compara un bloque propuesto contra la lista de bloques existentes para determinar si se crea, actualiza o ignora
 */
export function resolveBlockDeduplication(
  candidate: {
    subjectId: string;
    subjectNameOrCode: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location?: string;
    externalUid?: string;
    source: DataSource;
  },
  existingBlocks: ScheduleBlock[],
  subjectsMap: Record<string, { id: string; name: string; code: string }>
): BlockComparisonResult {
  const candidateAcadFp = computeAcademicFingerprint(
    candidate.subjectNameOrCode,
    candidate.dayOfWeek,
    candidate.startTime,
    candidate.endTime,
    candidate.location
  );

  const candidateSlotFp = computeTimeSlotSubjectFingerprint(
    candidate.subjectNameOrCode,
    candidate.dayOfWeek,
    candidate.startTime,
    candidate.endTime
  );

  for (const existing of existingBlocks) {
    // 1. Coincidencia directa por externalUid
    if (candidate.externalUid && existing.externalUid === candidate.externalUid) {
      if (normalizeText(existing.location) !== normalizeText(candidate.location)) {
        return {
          action: 'update',
          existingId: existing.id,
          reason: 'Mismo evento externo con cambio de salón',
          diff: {
            location: { old: existing.location, new: candidate.location },
          },
        };
      }
      return {
        action: 'skip',
        existingId: existing.id,
        reason: 'Evento externo ya registrado e idéntico',
      };
    }

    const existingSubject = subjectsMap[existing.subjectId];
    const existingNameOrCode = existingSubject ? `${existingSubject.name} ${existingSubject.code}` : existing.subjectId;

    const existingAcadFp = existing.academicFingerprint || computeAcademicFingerprint(
      existingNameOrCode,
      existing.dayOfWeek,
      existing.startTime,
      existing.endTime,
      existing.location
    );

    // 2. Coincidencia exacta de clase, horario y salón
    if (candidateAcadFp === existingAcadFp) {
      return {
        action: 'skip',
        existingId: existing.id,
        reason: 'Clase exactamente idéntica ya presente en el horario',
      };
    }

    // 3. Misma materia y mismo horario, pero diferente salón -> Actualizar salón
    const existingSlotFp = computeTimeSlotSubjectFingerprint(
      existingNameOrCode,
      existing.dayOfWeek,
      existing.startTime,
      existing.endTime
    );

    if (candidateSlotFp === existingSlotFp) {
      return {
        action: 'update',
        existingId: existing.id,
        reason: 'Misma clase y horario pero con cambio de salón detectado',
        diff: {
          location: { old: existing.location, new: candidate.location },
        },
      };
    }
  }

  // 4. No hay coincidencia -> Es un bloque nuevo
  return {
    action: 'create',
    reason: 'Nuevo bloque no registrado previamente',
  };
}
