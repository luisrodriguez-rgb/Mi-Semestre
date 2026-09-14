import {
  RawEvidence,
  IngestResult,
  ParsedAcademicData,
  DetectionResult,
} from './types';
import { detectEvidence } from './detector';
import { resolveAcademicEntities } from './entityResolver';
import { normalizeParsedAcademicData } from './normalizer';
import { validateAndBuildIngestResult } from './validator';
import { parseJasperAcademicBalance, parseScheduleFreeText } from '../smartAcademicIngester';
import { parseIcsCalendar } from '../icsParser';
import { titleCase } from './normalizer';

/**
 * Lee el contenido textual de un archivo en el navegador
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(new Error(`No se pudo leer el archivo: ${file.name}`));
    reader.readAsText(file);
  });
}

/**
 * Convierte eventos de calendario .ICS en ParsedAcademicData
 */
export function convertIcsToAcademicData(icsContent: string): ParsedAcademicData {
  const events = parseIcsCalendar(icsContent);
  const subjectsMap = new Map<string, { id: string; name: string; code: string; credits: number; maxAbsences: number }>();
  const scheduleBlocks: ParsedAcademicData['scheduleBlocks'] = [];
  const exams: NonNullable<ParsedAcademicData['exams']> = [];
  const assignments: NonNullable<ParsedAcademicData['assignments']> = [];

  for (const ev of events) {
    const cleanTitle = titleCase(ev.title);
    const subId = `sub-${cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    if (!subjectsMap.has(subId)) {
      subjectsMap.set(subId, {
        id: subId,
        name: cleanTitle,
        code: `MAT-${(101 + subjectsMap.size).toString()}`,
        credits: 3,
        maxAbsences: 4,
      });
    }

    if (ev.suggestedType === 'class') {
      if (ev.dayOfWeek) {
        scheduleBlocks.push({
          subjectId: subId,
          dayOfWeek: ev.dayOfWeek,
          startTime: ev.startTimeStr,
          endTime: ev.endTimeStr,
          location: ev.location,
        });
      }
    } else if (ev.suggestedType === 'exam') {
      exams.push({
        subjectId: subId,
        title: cleanTitle,
        date: ev.start.toISOString(),
        weight: 25,
        location: ev.location,
        notes: ev.description,
      });
    } else if (ev.suggestedType === 'assignment') {
      assignments.push({
        subjectId: subId,
        title: cleanTitle,
        dueDate: ev.start.toISOString(),
        location: ev.location,
        notes: ev.description,
      });
    }
  }

  return {
    subjects: Array.from(subjectsMap.values()),
    scheduleBlocks,
    exams: exams.length > 0 ? exams : undefined,
    assignments: assignments.length > 0 ? assignments : undefined,
    rawEvidenceSnippet: icsContent.slice(0, 250),
  };
}

/**
 * Extrae datos académicos desde un texto de balance Jasper SIN inventar horarios ni exámenes ficticios
 */
export function extractRealJasperData(text: string): ParsedAcademicData | null {
  const parsed = parseJasperAcademicBalance(text);
  if (!parsed || parsed.subjects.length === 0) return null;

  return {
    student: {
      name: parsed.profile.name,
      studentCode: parsed.profile.studentCode,
      documentId: parsed.profile.documentId,
      university: parsed.profile.university,
      program: parsed.profile.program,
      semesterNumber: parsed.profile.semesterNumber,
      cohort: parsed.profile.cohort,
      gpa: parsed.profile.gpa,
      avatarUrl: parsed.profile.avatarUrl,
    },
    semester: parsed.semester,
    subjects: parsed.subjects.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      credits: s.credits,
      color: s.color,
      professor: s.professor,
      maxAbsences: s.maxAbsences,
    })),
    scheduleBlocks: [], // No evidenciado en el reporte de balance de materias
    exams: undefined,   // Explícitamente no evidenciado
    assignments: undefined,
    rawEvidenceSnippet: text.slice(0, 250),
  };
}

/**
 * Pipeline Universal de Ingesta Académica
 * Procesa una o múltiples evidencias y devuelve un IngestResult unificado
 */
export async function ingestAcademicEvidence(
  evidenceInput: RawEvidence | RawEvidence[]
): Promise<IngestResult> {
  const evidences = Array.isArray(evidenceInput) ? evidenceInput : [evidenceInput];

  if (evidences.length === 0) {
    throw new Error('No se suministró ninguna evidencia académica para procesar.');
  }

  const detections: DetectionResult[] = [];
  const extractedDataList: ParsedAcademicData[] = [];

  for (const evidence of evidences) {
    let rawText = evidence.text || '';

    // Si viene un archivo y no hay texto extraído aún, leer el archivo
    if (evidence.file && !rawText) {
      const fileName = evidence.file.name.toLowerCase();
      if (fileName.endsWith('.ics') || fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
        rawText = await readFileAsText(evidence.file);
      }
    }

    const detection = detectEvidence({
      ...evidence,
      text: rawText,
    });
    detections.push(detection);

    let extracted: ParsedAcademicData | null = null;

    if (detection.container === 'ics' || (detection.documentType === 'schedule' && /BEGIN:VCALENDAR/i.test(rawText))) {
      extracted = convertIcsToAcademicData(rawText);
    } else if (detection.documentType === 'academic_balance') {
      extracted = extractRealJasperData(rawText);
    } else if (detection.documentType === 'schedule') {
      const scheduleResult = parseScheduleFreeText(rawText);
      extracted = {
        student: scheduleResult.profile,
        semester: scheduleResult.semester,
        subjects: scheduleResult.subjects,
        scheduleBlocks: scheduleResult.scheduleBlocks as ParsedAcademicData['scheduleBlocks'],
        exams: undefined,
        assignments: undefined,
        rawEvidenceSnippet: rawText.slice(0, 250),
      };
    } else {
      // Fallback inteligente
      const maybeJasper = extractRealJasperData(rawText);
      if (maybeJasper && maybeJasper.subjects.length > 0) {
        extracted = maybeJasper;
      } else if (rawText.trim().length > 0) {
        const freeSchedule = parseScheduleFreeText(rawText);
        extracted = {
          student: freeSchedule.profile,
          semester: freeSchedule.semester,
          subjects: freeSchedule.subjects,
          scheduleBlocks: freeSchedule.scheduleBlocks as ParsedAcademicData['scheduleBlocks'],
          exams: undefined,
          assignments: undefined,
          rawEvidenceSnippet: rawText.slice(0, 250),
        };
      }
    }

    if (extracted) {
      extractedDataList.push(extracted);
    }
  }

  if (extractedDataList.length === 0) {
    extractedDataList.push({
      subjects: [],
      scheduleBlocks: [],
    });
  }

  // 1. Resolución de entidades y fusión entre múltiples evidencias
  const { resolvedData, ambiguities, evidenceGraph } = resolveAcademicEntities(extractedDataList);

  // 2. Normalización de formato
  const normalizedData = normalizeParsedAcademicData(resolvedData);

  // 3. Validación y diagnóstico transparente
  return validateAndBuildIngestResult(normalizedData, detections, ambiguities, evidenceGraph);
}
