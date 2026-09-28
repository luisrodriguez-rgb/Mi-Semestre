import { AcademicTemplate, ACADEMIC_TEMPLATES } from '../templates/academicTemplates';
import { ParsedAcademicData, ParsedSubject, ParsedScheduleBlock, ParsedExam, ParsedAssignment } from './universal/types';

export interface TemplateMatchResult {
  template: AcademicTemplate;
  confidence: 'exact' | 'high' | 'partial';
  matchScore: number; // 0 - 100
  matchedSubjectsCount: number;
  totalTemplateSubjects: number;
}

function normalizeStr(s?: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

/**
 * Encuentra la plantilla académica que mejor coincide con los datos extraídos de un balance
 */
export function findBestTemplateMatch(
  data: ParsedAcademicData,
  templates: AcademicTemplate[] = ACADEMIC_TEMPLATES
): TemplateMatchResult | null {
  const normProg = normalizeStr(data.student?.program);
  const semNum = data.student?.semesterNumber;
  const subjects = data.subjects || [];

  let bestTemplate: AcademicTemplate | null = null;
  let bestScore = 0;
  let bestMatchedCount = 0;

  for (const tmpl of templates) {
    let score = 0;
    const tmplProg = normalizeStr(tmpl.profile.program);

    // 1. Coincidencia por carrera y semestre (Peso fuerte: 50 pts)
    const progMatch =
      normProg.length > 3 &&
      (tmplProg.includes(normProg) || normProg.includes(tmplProg) || tmplProg.includes('economia') && normProg.includes('economia'));

    if (progMatch) {
      score += 40;
      if (semNum && tmpl.semesterNumber === semNum) {
        score += 20;
      }
    }

    // 2. Coincidencia por materias (códigos o nombres) (Peso fuerte: hasta 40 pts)
    let matchedInTemplate = 0;
    for (const sub of subjects) {
      const subCode = sub.code?.toLowerCase();
      const subNrc = sub.nrc?.toLowerCase();
      const subName = normalizeStr(sub.name);

      const hasMatch = tmpl.subjects.some((tmplSub) => {
        if (subCode && tmplSub.code && tmplSub.code.toLowerCase() === subCode) return true;
        if (subNrc && tmplSub.nrc && tmplSub.nrc.toLowerCase() === subNrc) return true;
        const tmplName = normalizeStr(tmplSub.name);
        return subName.length > 4 && (tmplName.includes(subName) || subName.includes(tmplName));
      });

      if (hasMatch) {
        matchedInTemplate++;
      }
    }

    const subjectRatio = subjects.length > 0 ? matchedInTemplate / subjects.length : 0;
    score += Math.round(subjectRatio * 40);

    if (score > bestScore && score >= 45) {
      bestScore = score;
      bestTemplate = tmpl;
      bestMatchedCount = matchedInTemplate;
    }
  }

  if (!bestTemplate) return null;

  const confidence: 'exact' | 'high' | 'partial' =
    bestScore >= 80 ? 'exact' : bestScore >= 60 ? 'high' : 'partial';

  return {
    template: bestTemplate,
    confidence,
    matchScore: bestScore,
    matchedSubjectsCount: bestMatchedCount,
    totalTemplateSubjects: bestTemplate.subjects.length,
  };
}

/**
 * Autocompleta franjas horarias, aulas, parciales y tareas desde una plantilla oficial
 * sobre los datos reales del estudiante extraídos del balance.
 */
export function autofillDataFromTemplate(
  currentData: ParsedAcademicData,
  template: AcademicTemplate
): ParsedAcademicData {
  const currentSubjects = [...currentData.subjects];
  const newScheduleBlocks: ParsedScheduleBlock[] = [...currentData.scheduleBlocks];
  const newExams: ParsedExam[] = [...(currentData.exams || [])];
  const newAssignments: ParsedAssignment[] = [...(currentData.assignments || [])];

  // Mapear cada materia del estudiante a la materia correspondiente de la plantilla
  for (const sub of currentSubjects) {
    const subCode = sub.code?.toLowerCase();
    const subNrc = sub.nrc?.toLowerCase();
    const subName = normalizeStr(sub.name);

    // Buscar en la plantilla
    const matchedTmplSub = template.subjects.find((ts) => {
      if (subCode && ts.code && ts.code.toLowerCase() === subCode) return true;
      if (subNrc && ts.nrc && ts.nrc.toLowerCase() === subNrc) return true;
      const tsName = normalizeStr(ts.name);
      return subName.length > 4 && (tsName.includes(subName) || subName.includes(tsName));
    });

    if (matchedTmplSub) {
      // 1. Inyectar horario si el estudiante no tenía bloques asignados para esta materia
      const existingBlocks = newScheduleBlocks.filter((b) => b.subjectId === sub.id);
      if (existingBlocks.length === 0) {
        const tmplBlocks = template.scheduleBlocks.filter((b) => b.subjectId === matchedTmplSub.id);
        tmplBlocks.forEach((tb, idx) => {
          newScheduleBlocks.push({
            id: `sb-auto-${sub.id}-${idx}`,
            subjectId: sub.id,
            dayOfWeek: tb.dayOfWeek,
            startTime: tb.startTime,
            endTime: tb.endTime,
            location: tb.location,
            evidence: [
              {
                id: `ev-tmpl-${sub.id}`,
                sourceContainer: 'text',
                field: 'scheduleBlocks',
                extractedValue: `${tb.startTime}-${tb.endTime} ${tb.location}`,
                confidence: 'high',
                sourceText: `Autocompletado desde plantilla oficial: ${template.name}`,
              },
            ],
          });
        });
      }

      // 2. Inyectar parciales preliminares de la plantilla
      const tmplExams = template.exams.filter((e) => e.subjectId === matchedTmplSub.id);
      tmplExams.forEach((te) => {
        if (!newExams.some((e) => e.subjectId === sub.id && e.title === te.title)) {
          newExams.push({
            id: `ex-auto-${sub.id}-${te.id}`,
            subjectId: sub.id,
            title: te.title,
            date: te.date,
            weight: te.weight,
          });
        }
      });

      // 3. Inyectar tareas o talleres
      const tmplTasks = template.assignments.filter((a) => a.subjectId === matchedTmplSub.id);
      tmplTasks.forEach((ta) => {
        if (!newAssignments.some((a) => a.subjectId === sub.id && a.title === ta.title)) {
          newAssignments.push({
            id: `as-auto-${sub.id}-${ta.id}`,
            subjectId: sub.id,
            title: ta.title,
            dueDate: ta.dueDate,
            estimatedMinutes: ta.estimatedMinutes,
            priority: ta.priority,
          });
        }
      });
    }
  }

  return {
    ...currentData,
    subjects: currentSubjects,
    scheduleBlocks: newScheduleBlocks,
    exams: newExams.length > 0 ? newExams : undefined,
    assignments: newAssignments.length > 0 ? newAssignments : undefined,
  };
}
