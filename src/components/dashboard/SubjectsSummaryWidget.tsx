'use client';

import React from 'react';
import { Subject, Exam, Grade } from '@/types';
import { buildEvaluationPlanFromExams, calculateGradeStatus } from '@/lib/academic-engine';
import { useUIStore } from '@/stores/uiStore';
import { ChevronRight, Plus, BookOpen } from 'lucide-react';

interface SubjectsSummaryWidgetProps {
  subjects: Subject[];
  exams: Exam[];
  grades: Grade[];
}

export function SubjectsSummaryWidget({ subjects, exams, grades }: SubjectsSummaryWidgetProps) {
  const { openGradeCalculator } = useUIStore();

  if (subjects.length === 0) return null;

  return (
    <div className="card-academic p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#3b3abf] dark:text-[#a0a0ff]" />
          <h3 className="text-sm font-bold text-[var(--ink)] tracking-tight">
            Tus materias
          </h3>
        </div>
        <span className="text-[11px] font-medium text-[var(--muted)]">
          {subjects.length} activas
        </span>
      </div>

      <div className="divide-y divide-[var(--border)] -mx-1">
        {subjects.map((subject) => {
          const plan = buildEvaluationPlanFromExams(subject, exams, grades);
          const status = calculateGradeStatus({
            subjectId: subject.id,
            evaluations: plan,
            passingGrade: subject.passingGrade || 3.0,
          });

          // Determinar estado amigable y colores
          let badgeText = 'Por comenzar';
          let badgeColor = 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
          let subtitle = 'Sin notas · Toca para anotar';

          if (status.status === 'APROBADA_ANTICIPADA') {
            badgeText = 'Asegurada';
            badgeColor = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
            subtitle = 'Materia ya aprobada con 3.0+';
          } else if (status.status === 'INVIABLE_MATEMATICAMENTE') {
            badgeText = 'Inviable';
            badgeColor = 'bg-rose-950/40 text-rose-300 border-rose-700/60';
            subtitle = 'Requiere más de 5.0 en lo restante';
          } else if (status.evaluatedWeight > 0) {
            const req = status.requiredGrade || 3.0;
            if (req > 4.0) {
              badgeText = 'Atención';
              badgeColor = 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
              subtitle = `Necesitas ${req.toFixed(1)} en el ${status.remainingWeight}% que falta`;
            } else if (req > 3.0) {
              badgeText = 'Exige esfuerzo';
              badgeColor = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
              subtitle = `Necesitas ${req.toFixed(1)} en el ${status.remainingWeight}% que falta`;
            } else {
              badgeText = 'En camino';
              badgeColor = 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
              subtitle = `Necesitas ${req.toFixed(1)} en el ${status.remainingWeight}% que falta`;
            }
          }

          const hasGrades = status.evaluatedWeight > 0 && status.currentWeightedGrade !== null;

          return (
            <button
              key={subject.id}
              onClick={() => openGradeCalculator(subject.id)}
              className="w-full py-2.5 px-2 flex items-center justify-between text-left hover:bg-[var(--paper)] rounded-xl transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: subject.color || '#3b3abf' }}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--ink)] truncate group-hover:text-[#3b3abf] transition-colors">
                    {subject.name}
                  </div>
                  <div className="text-[11px] text-[var(--muted)] truncate">
                    {hasGrades ? (
                      <>
                        Llevas <span className="font-bold text-[var(--ink)]">{status.currentWeightedGrade?.toFixed(1)}</span> ({status.evaluatedWeight}%) · {subtitle}
                      </>
                    ) : (
                      subtitle
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}
                >
                  {badgeText}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--ink)] group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => openGradeCalculator()}
        className="w-full py-2 px-3 rounded-xl bg-[var(--paper)] hover:bg-[var(--border)] text-[var(--ink)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-[var(--border)] cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
        <span>Abrir libreta de notas completa</span>
      </button>
    </div>
  );
}
