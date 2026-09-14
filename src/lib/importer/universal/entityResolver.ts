import {
  ParsedAcademicData,
  ParsedSubject,
  ParsedScheduleBlock,
  UnresolvedField,
  EvidenceItem,
} from './types';
import { matchSubjects } from './subjectMatcher';
import { areScheduleBlocksEquivalent, mergeScheduleBlockData } from './scheduleMatcher';

export interface EntityResolutionOutput {
  resolvedData: ParsedAcademicData;
  ambiguities: UnresolvedField[];
  evidenceGraph: EvidenceItem[];
}

/**
 * Resuelve y fusiona entidades académicas procedentes de una o múltiples fuentes de evidencia.
 */
export function resolveAcademicEntities(
  dataSources: ParsedAcademicData[]
): EntityResolutionOutput {
  const canonicalSubjects: ParsedSubject[] = [];
  const canonicalBlocks: ParsedScheduleBlock[] = [];
  const subjectIdRedirectMap = new Map<string, string>(); // oldId -> canonicalId
  const ambiguities: UnresolvedField[] = [];
  const evidenceGraph: EvidenceItem[] = [];

  let canonicalStudent = dataSources[0]?.student;
  let canonicalSemester = dataSources[0]?.semester;

  for (const src of dataSources) {
    // 1. Fusionar perfil de estudiante si no estaba presente
    if (src.student) {
      canonicalStudent = {
        name: canonicalStudent?.name || src.student.name,
        studentCode: canonicalStudent?.studentCode || src.student.studentCode,
        documentId: canonicalStudent?.documentId || src.student.documentId,
        university: canonicalStudent?.university || src.student.university,
        program: canonicalStudent?.program || src.student.program,
        semesterNumber: canonicalStudent?.semesterNumber || src.student.semesterNumber,
        cohort: canonicalStudent?.cohort || src.student.cohort,
        gpa: canonicalStudent?.gpa || src.student.gpa,
      };
    }

    if (src.semester) {
      canonicalSemester = {
        ...canonicalSemester,
        ...src.semester,
      };
    }

    // 2. Resolución de Asignaturas (Subjects)
    for (const incomingSub of src.subjects) {
      let matchedCanonical: ParsedSubject | null = null;

      for (const existing of canonicalSubjects) {
        const matchResult = matchSubjects(
          { name: existing.name, code: existing.code, nrc: existing.nrc },
          { name: incomingSub.name, code: incomingSub.code, nrc: incomingSub.nrc }
        );

        if (
          matchResult.decision === 'exact_code' ||
          matchResult.decision === 'exact_nrc' ||
          matchResult.decision === 'exact_name' ||
          matchResult.decision === 'fuzzy_match'
        ) {
          matchedCanonical = existing;
          break;
        }

        if (matchResult.decision === 'ambiguous') {
          ambiguities.push({
            field: `subject_${incomingSub.id}`,
            label: 'Materia ambigua detectada',
            message: `¿Deseas vincular "${incomingSub.name}" con "${existing.name}"?`,
            severity: 'warning',
            suggestedAction: 'Confirmar si corresponden a la misma asignatura.',
          });
        }
      }

      if (matchedCanonical) {
        // Redireccionar todas las referencias del ID entrante al ID canónico
        subjectIdRedirectMap.set(incomingSub.id, matchedCanonical.id);

        // Enriquecer datos de la materia con la evidencia entrante
        matchedCanonical.code = matchedCanonical.code || incomingSub.code;
        matchedCanonical.nrc = matchedCanonical.nrc || incomingSub.nrc;
        matchedCanonical.credits = matchedCanonical.credits || incomingSub.credits;
        matchedCanonical.professor = matchedCanonical.professor || incomingSub.professor;
        matchedCanonical.maxAbsences = matchedCanonical.maxAbsences || incomingSub.maxAbsences;

        if (incomingSub.evidence) {
          matchedCanonical.evidence = [...(matchedCanonical.evidence || []), ...incomingSub.evidence];
          evidenceGraph.push(...incomingSub.evidence);
        }
      } else {
        // Nueva asignatura canónica
        canonicalSubjects.push({ ...incomingSub });
        subjectIdRedirectMap.set(incomingSub.id, incomingSub.id);
        if (incomingSub.evidence) {
          evidenceGraph.push(...incomingSub.evidence);
        }
      }
    }

    // 3. Resolución y deduplicación de Bloques de Horario (Schedule Blocks)
    for (const rawBlock of src.scheduleBlocks) {
      const canonicalSubId = subjectIdRedirectMap.get(rawBlock.subjectId) || rawBlock.subjectId;
      const normalizedBlock: ParsedScheduleBlock = {
        ...rawBlock,
        subjectId: canonicalSubId,
      };

      const existingBlockIdx = canonicalBlocks.findIndex((b) =>
        areScheduleBlocksEquivalent(b, normalizedBlock)
      );

      if (existingBlockIdx >= 0) {
        // Deduplicar fusionando salones o evidencias
        canonicalBlocks[existingBlockIdx] = mergeScheduleBlockData(
          canonicalBlocks[existingBlockIdx],
          normalizedBlock
        );
      } else {
        canonicalBlocks.push(normalizedBlock);
      }

      if (rawBlock.evidence) {
        evidenceGraph.push(...rawBlock.evidence);
      }
    }
  }

  // 4. Mapear exámenes y tareas con IDs canónicos
  const allExams = dataSources.flatMap((d) => d.exams || []);
  const resolvedExams = allExams.map((e) => ({
    ...e,
    subjectId: subjectIdRedirectMap.get(e.subjectId) || e.subjectId,
  }));

  const allAssignments = dataSources.flatMap((d) => d.assignments || []);
  const resolvedAssignments = allAssignments.map((a) => ({
    ...a,
    subjectId: subjectIdRedirectMap.get(a.subjectId) || a.subjectId,
  }));

  // Distinguir explícitamente si vinieron evaluaciones o tareas en alguna fuente
  const anyExamsEvidenced = dataSources.some((d) => d.exams !== undefined);
  const anyAssignmentsEvidenced = dataSources.some((d) => d.assignments !== undefined);

  return {
    resolvedData: {
      student: canonicalStudent,
      semester: canonicalSemester,
      subjects: canonicalSubjects,
      scheduleBlocks: canonicalBlocks,
      exams: anyExamsEvidenced ? resolvedExams : undefined,
      assignments: anyAssignmentsEvidenced ? resolvedAssignments : undefined,
    },
    ambiguities,
    evidenceGraph,
  };
}
