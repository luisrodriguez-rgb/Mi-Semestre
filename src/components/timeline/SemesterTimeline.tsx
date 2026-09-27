'use client';

import { useMemo, useState, useEffect } from 'react';
import { Semester, Exam, Assignment, Subject } from '@/types';
import { calculateSemesterMetrics } from '@/lib/academic-engine';
import { semesterRepository } from '@/lib/storage';
import { Layers, Calendar, CheckCircle2, Clock } from 'lucide-react';

interface SemesterTimelineProps {
  semester: Semester | null;
  subjectsMap: Record<string, Subject>;
  exams: Exam[];
  assignments: Assignment[];
}

function parseLocalDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }
  const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
  }
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getCalendarDaysDiff(start: Date, target: Date): number {
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.floor((utcTarget - utcStart) / (1000 * 60 * 60 * 24));
}

export function SemesterTimeline({
  semester,
  subjectsMap,
  exams,
  assignments,
}: SemesterTimelineProps) {
  const [customTotalWeeks, setCustomTotalWeeks] = useState<number | null>(null);
  const totalWeeks = customTotalWeeks ?? semester?.totalWeeks ?? 16;

  const metrics = useMemo(() => {
    if (!semester) return null;
    return calculateSemesterMetrics({
      startDate: semester.startDate,
      endDate: semester.endDate,
      totalWeeks,
    });
  }, [semester, totalWeeks]);

  const currentWeekNumber = metrics?.currentWeek ?? 1;

  // Estado de la semana seleccionada por el usuario (null = seguir la semana actual calculada)
  const [userSelectedWeek, setUserSelectedWeek] = useState<number | null>(null);
  const selectedWeek = userSelectedWeek ?? currentWeekNumber;

  // Resetear selección manual si cambia el semestre
  useEffect(() => {
    setUserSelectedWeek(null);
  }, [semester?.id]);

  const handleUpdateTotalWeeks = async (newTotal: number) => {
    setCustomTotalWeeks(newTotal);
    if (selectedWeek > newTotal) {
      setUserSelectedWeek(newTotal);
    }
    if (semester) {
      const updated = { ...semester, totalWeeks: newTotal };
      await semesterRepository.save(updated);
      window.dispatchEvent(new CustomEvent('semester-data-updated'));
    }
  };

  // Helper para calcular el rango de fechas de una semana dada
  const getWeekRange = (w: number) => {
    if (!semester?.startDate) return { label: '', shortLabel: '', start: null, end: null };
    const semStart = parseLocalDate(semester.startDate);
    const start = new Date(semStart);
    start.setDate(semStart.getDate() + (w - 1) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const fmtShort = (d: Date) =>
      d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    const fmtFull = (d: Date) =>
      d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });

    return {
      label: `${fmtFull(start)} – ${fmtFull(end)}`,
      shortLabel: `${fmtShort(start)} – ${fmtShort(end)}`,
      start,
      end,
    };
  };

  // Generar array dinámico de semanas
  const weeks = useMemo(() => Array.from({ length: totalWeeks }, (_, i) => i + 1), [totalWeeks]);

  // Mapear eventos a semanas usando diferencia de días calendarios sin sesgos de zona horaria
  const milestonesByWeek = useMemo(() => {
    const map: Record<number, { exams: Exam[]; tasks: Assignment[] }> = {};
    weeks.forEach((w) => (map[w] = { exams: [], tasks: [] }));

    if (!semester) return map;
    const startDay = parseLocalDate(semester.startDate);

    exams.forEach((e) => {
      const eDay = parseLocalDate(e.date);
      const diffDays = Math.max(0, getCalendarDaysDiff(startDay, eDay));
      const w = Math.min(totalWeeks, Math.max(1, Math.floor(diffDays / 7) + 1));
      if (map[w]) map[w].exams.push(e);
    });

    assignments.forEach((a) => {
      const aDay = parseLocalDate(a.dueDate);
      const diffDays = Math.max(0, getCalendarDaysDiff(startDay, aDay));
      const w = Math.min(totalWeeks, Math.max(1, Math.floor(diffDays / 7) + 1));
      if (map[w]) map[w].tasks.push(a);
    });

    return map;
  }, [semester, exams, assignments, weeks, totalWeeks]);

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
              Línea de {totalWeeks} Semanas
            </h2>
            <p className="text-xs text-[#e8e8ff] mt-1 max-w-xl">
              Visualiza en qué punto del semestre te encuentras y anticípate a las semanas de mayor densidad de entregas y parciales.
            </p>
          </div>

          {metrics && (
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-right">
              <div className="text-xs font-mono uppercase text-[#c5c5ff]">
                Semana Actual {metrics.hasStarted && `(Día ${metrics.daysElapsed + 1} de ${metrics.totalDays})`}
              </div>
              <div className="text-2xl font-black text-white mt-0.5">
                Semana {metrics.currentWeek} <span className="text-sm font-normal text-[#c5c5ff]">/ {totalWeeks}</span>
              </div>
              <div className="text-[11px] text-[#a0a0ff] font-mono mt-0.5">
                {getWeekRange(metrics.currentWeek).shortLabel} · {metrics.daysRemaining} días restantes para finalizar
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

      {/* Scrubber Horizontal de Semanas */}
      <div className="card-academic p-6 bg-[var(--surface)] border border-[var(--border)] transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--ink)]">
              Explorar Semanas del Semestre
            </h3>
            <span className="text-xs text-[var(--muted)] font-mono">
              Haz clic en una semana para ver sus hitos y compromisos
            </span>
          </div>

          {/* Control interactivo para aumentar o mermar semanas del semestre */}
          <div className="flex items-center gap-2 bg-[var(--paper)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
            <span className="text-xs text-[var(--muted)] font-mono font-medium">Duración:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleUpdateTotalWeeks(Math.max(8, totalWeeks - 1))}
                disabled={totalWeeks <= 8}
                className="w-6 h-6 rounded-lg bg-[var(--surface)] text-[var(--ink)] hover:bg-[#3b3abf] hover:text-white font-black text-xs flex items-center justify-center transition-colors cursor-pointer border border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                title="Reducir 1 semana al semestre"
              >
                -
              </button>
              <span className="font-mono font-bold text-xs text-[var(--ink)] min-w-[70px] text-center">
                {totalWeeks} semanas
              </span>
              <button
                onClick={() => handleUpdateTotalWeeks(Math.min(24, totalWeeks + 1))}
                disabled={totalWeeks >= 24}
                className="w-6 h-6 rounded-lg bg-[var(--surface)] text-[var(--ink)] hover:bg-[#3b3abf] hover:text-white font-black text-xs flex items-center justify-center transition-colors cursor-pointer border border-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                title="Aumentar 1 semana al semestre"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
          {weeks.map((w) => {
            const isCurrent = currentWeekNumber === w;
            const isSelected = selectedWeek === w;
            const hasExams = (milestonesByWeek[w]?.exams.length || 0) > 0;
            const hasTasks = (milestonesByWeek[w]?.tasks.length || 0) > 0;
            const range = getWeekRange(w);

            return (
              <button
                key={w}
                onClick={() => setUserSelectedWeek(w)}
                title={`Semana ${w}: ${range.label}`}
                className={`py-2.5 px-2 rounded-xl text-center transition-all flex flex-col items-center justify-center relative cursor-pointer ${
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
                {range.shortLabel && (
                  <span
                    className={`text-[8px] font-mono mt-0.5 leading-none opacity-80 ${
                      isSelected ? 'text-[#e0e0ff]' : 'text-[var(--muted)]'
                    }`}
                  >
                    {range.shortLabel.split('–')[0]?.trim()}
                  </span>
                )}

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
                  <span className="absolute -top-1 -right-1 px-1 rounded bg-[#3b3abf] text-white text-[8px] font-mono font-black shadow-xs">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-[var(--ink)]">
                Hitos y Compromisos de la Semana {selectedWeek}
              </h4>
              {selectedWeek === currentWeekNumber ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Semana Actual (En curso)
                </span>
              ) : (
                <button
                  onClick={() => setUserSelectedWeek(null)}
                  className="text-[11px] font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3 h-3" />
                  <span>Volver a semana actual (Semana {currentWeekNumber})</span>
                </button>
              )}
            </div>
            <p className="text-xs text-[var(--muted)] mt-1 font-mono">
              {getWeekRange(selectedWeek).label && `${getWeekRange(selectedWeek).label} · `}
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
