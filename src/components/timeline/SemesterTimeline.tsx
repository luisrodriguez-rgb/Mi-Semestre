'use client';

import { useMemo, useState } from 'react';
import { Semester, Exam, Assignment, Subject } from '@/types';
import { calculateSemesterMetrics } from '@/lib/academic-engine';
import { Calendar, CheckCircle2, ChevronRight, Layers, Sparkles } from 'lucide-react';

interface SemesterTimelineProps {
  semester: Semester | null;
  subjectsMap: Record<string, Subject>;
  exams: Exam[];
  assignments: Assignment[];
}

export function SemesterTimeline({
  semester,
  subjectsMap,
  exams,
  assignments,
}: SemesterTimelineProps) {
  const [selectedWeek, setSelectedWeek] = useState<number>(6);

  const metrics = useMemo(() => {
    if (!semester) return null;
    return calculateSemesterMetrics({
      startDate: semester.startDate,
      endDate: semester.endDate,
    });
  }, [semester]);

  // Generar array de 16 semanas
  const weeks = Array.from({ length: 16 }, (_, i) => i + 1);

  // Mapear eventos a semanas
  const milestonesByWeek = useMemo(() => {
    const map: Record<number, { exams: Exam[]; tasks: Assignment[] }> = {};
    weeks.forEach((w) => (map[w] = { exams: [], tasks: [] }));

    if (!semester) return map;
    const startMs = new Date(semester.startDate).getTime();

    exams.forEach((e) => {
      const eMs = new Date(e.date).getTime();
      const diffDays = Math.max(0, Math.floor((eMs - startMs) / (1000 * 60 * 60 * 24)));
      const w = Math.min(16, Math.max(1, Math.floor(diffDays / 7) + 1));
      if (map[w]) map[w].exams.push(e);
    });

    assignments.forEach((a) => {
      const aMs = new Date(a.dueDate).getTime();
      const diffDays = Math.max(0, Math.floor((aMs - startMs) / (1000 * 60 * 60 * 24)));
      const w = Math.min(16, Math.max(1, Math.floor(diffDays / 7) + 1));
      if (map[w]) map[w].tasks.push(a);
    });

    return map;
  }, [semester, exams, assignments, weeks]);

  const currentWeekMilestones = milestonesByWeek[selectedWeek] || { exams: [], tasks: [] };

  return (
    <div className="space-y-6">
      {/* Banner de Progreso Global */}
      <div className="banner-academic p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#c5c5ff] font-bold">
              <Layers className="w-4 h-4" />
              <span>Hoja de Ruta del Semestre</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Línea de 16 Semanas
            </h2>
            <p className="text-xs text-[#e8e8ff] mt-1 max-w-xl">
              Visualiza en qué punto del semestre te encuentras y anticípate a las semanas de mayor densidad de entregas y parciales.
            </p>
          </div>

          {metrics && (
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-right">
              <div className="text-xs font-mono uppercase text-[#c5c5ff]">Semana Actual</div>
              <div className="text-2xl font-black text-white mt-0.5">
                Semana {metrics.currentWeek} <span className="text-sm font-normal text-[#c5c5ff]">/ 16</span>
              </div>
              <div className="text-[11px] text-[#a0a0ff] font-mono mt-0.5">
                {metrics.daysRemaining} días restantes para finalizar
              </div>
            </div>
          )}
        </div>

        {/* Barra de Progreso Global */}
        {metrics && (
          <div className="mt-6">
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Scrubber Horizontal de Semanas (1 a 16) */}
      <div className="card-academic p-6 bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[var(--ink)]">
            Explorar Semanas del Semestre
          </h3>
          <span className="text-xs text-[var(--muted)] font-mono">
            Haz clic en una semana para ver sus hitos
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-2">
          {weeks.map((w) => {
            const isCurrent = metrics?.currentWeek === w;
            const isSelected = selectedWeek === w;
            const hasExams = (milestonesByWeek[w]?.exams.length || 0) > 0;
            const hasTasks = (milestonesByWeek[w]?.tasks.length || 0) > 0;

            return (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`py-3 px-2 rounded-xl text-center transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                  isSelected
                    ? 'bg-[#3b3abf] text-white shadow-md shadow-[#3b3abf]/30 scale-105 z-10'
                    : isCurrent
                    ? 'bg-[#3b3abf]/15 border-2 border-[#3b3abf] text-[var(--ink)]'
                    : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--surface-raised)]'
                }`}
              >
                <span className="text-[10px] font-mono font-bold leading-none">
                  S{w}
                </span>

                {/* Dots indicadores de hitos */}
                <div className="flex items-center gap-1 mt-1.5 h-1.5">
                  {hasExams && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-amber-300' : 'bg-rose-500'
                      }`}
                    />
                  )}
                  {hasTasks && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-emerald-300' : 'bg-[#7b7bff]'
                      }`}
                    />
                  )}
                </div>

                {isCurrent && (
                  <span className="absolute -top-1 -right-1 px-1 rounded bg-[#3b3abf] text-white text-[8px] font-mono font-black">
                    Hoy
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle de la Semana Seleccionada */}
      <div className="card-academic p-6 bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div>
            <h4 className="text-base font-bold text-[var(--ink)]">
              Hitos y Compromisos de la Semana {selectedWeek}
            </h4>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {currentWeekMilestones.exams.length} exámenes programados · {currentWeekMilestones.tasks.length} entregas pendientes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Exámenes de la semana */}
          <div>
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#c084fc]" />
              Parciales y Exámenes
            </h5>

            {currentWeekMilestones.exams.length > 0 ? (
              <div className="space-y-2.5">
                {currentWeekMilestones.exams.map((ex) => {
                  const sub = subjectsMap[ex.subjectId];
                  return (
                    <div
                      key={ex.id}
                      className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold font-mono text-purple-600 dark:text-purple-300 uppercase">
                          {sub?.name || 'Materia'}
                        </span>
                        <div className="text-xs font-bold text-[var(--ink)] mt-0.5">
                          {ex.title}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-[var(--surface)] text-purple-600 dark:text-purple-300 border border-purple-500/20">
                        {ex.weight}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)] text-xs text-[var(--muted)]">
                Sin exámenes agendados esta semana.
              </div>
            )}
          </div>

          {/* Tareas de la semana */}
          <div>
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
              Entregas y Talleres
            </h5>

            {currentWeekMilestones.tasks.length > 0 ? (
              <div className="space-y-2.5">
                {currentWeekMilestones.tasks.map((t) => {
                  const sub = subjectsMap[t.subjectId];
                  return (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--border)] flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold font-mono text-[#3b3abf] dark:text-[#a0a0ff] uppercase">
                          {sub?.name || 'Materia'}
                        </span>
                        <div className="text-xs font-bold text-[var(--ink)] mt-0.5">
                          {t.title}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-[var(--muted)]">
                        {t.estimatedMinutes}m
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)] text-xs text-[var(--muted)]">
                Sin entregas pendientes registradas para esta semana.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
