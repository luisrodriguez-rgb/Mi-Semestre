'use client';

import { useMemo } from 'react';
import { Subject, Assignment, Exam, DayOfWeek } from '@/types';
import { formatMinutesHuman } from '@/lib/academic-engine/utils/timeHelpers';
import { useUIStore } from '@/stores/uiStore';
import {
  X,
  Sparkles,
  Play,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Zap,
} from 'lucide-react';

export interface FreeSlotDecisionData {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  dayOfWeek: DayOfWeek;
  dayName: string;
}

interface SlotDecisionModalProps {
  slot: FreeSlotDecisionData | null;
  onClose: () => void;
  subjectsMap: Record<string, Subject>;
  assignments: Assignment[];
  exams: Exam[];
}

export function SlotDecisionModal({
  slot,
  onClose,
  subjectsMap,
  assignments,
  exams,
}: SlotDecisionModalProps) {
  const { startFocusSession, openRoutineModal } = useUIStore();

  // Filtrar y ordenar tareas recomendadas que caben o son prioritarias
  const recommendations = useMemo(() => {
    if (!slot) return [];

    const pending = assignments.filter((a) => a.status !== 'completed');
    if (pending.length === 0) return [];

    return [...pending]
      .map((task) => {
        const subject = subjectsMap[task.subjectId];
        const relatedExam = exams.find((e) => e.subjectId === task.subjectId);

        let priorityScore = 0;
        if (task.priority === 'high') priorityScore += 40;
        if (task.priority === 'medium') priorityScore += 20;

        // Bonificación si hay un parcial cercano
        let examNotice = '';
        if (relatedExam) {
          const daysToExam = Math.ceil(
            (new Date(relatedExam.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysToExam >= 0 && daysToExam <= 7) {
            priorityScore += 50 - daysToExam * 5;
            examNotice = `Parcial próximo (${daysToExam === 0 ? 'Hoy' : `en ${daysToExam} días`})`;
          }
        }

        // Bonificación si el tiempo de la tarea encaja en el hueco
        const fitsInSlot = task.estimatedMinutes <= slot.durationMinutes;
        if (fitsInSlot) priorityScore += 30;

        return {
          task,
          subject,
          relatedExam,
          examNotice,
          fitsInSlot,
          priorityScore,
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [slot, assignments, exams, subjectsMap]);

  if (!slot) return null;

  const handleStartTaskFocus = (task: Assignment, subjectName: string) => {
    const plannedMinutes = Math.min(task.estimatedMinutes || 45, slot.durationMinutes);
    startFocusSession(task.title, subjectName, plannedMinutes, task.id);
    onClose();
  };

  const handleStartFreeStudy = (minutes: number) => {
    startFocusSession('Estudio y avance libre', 'Autónomo', minutes);
    onClose();
  };

  const handleCreatePersonalBlock = () => {
    onClose();
    openRoutineModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative transition-colors max-h-[90vh] overflow-y-auto">
        {/* Header con Capacidad Disponible */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Capacidad Disponible Detectada</span>
            </div>
            <h2 className="text-xl font-black text-[var(--ink)] tracking-tight mt-1">
              Tienes {formatMinutesHuman(slot.durationMinutes)} libres
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {slot.dayName} · {slot.startTime} — {slot.endTime}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo: ¿Qué quieres hacer con este tiempo? */}
        <div className="mt-5 space-y-4">
          <div className="text-xs font-bold text-[var(--ink)] uppercase tracking-wide flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Mi Semestre recomienda para este espacio:</span>
          </div>

          {recommendations.length === 0 ? (
            <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)] text-center text-xs text-[var(--muted)]">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              ¡Estás al día! No tienes entregas pendientes obligatorias.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recommendations.slice(0, 3).map(({ task, subject, examNotice, fitsInSlot }, idx) => {
                const subjectName = subject?.name || 'Materia';
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between gap-2.5 ${
                      idx === 0
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-[var(--paper)] border-[var(--border)] hover:border-[#3b3abf]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {idx === 0 && (
                          <span className="inline-block text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white mb-1.5 shadow-2xs">
                            Mejor siguiente acción
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-[var(--ink)] leading-snug">
                          {task.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--muted)] mt-1 font-medium">
                          <span
                            className="font-bold text-[var(--ink)]"
                            style={{ color: subject?.color }}
                          >
                            {subjectName}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Requiere ~{formatMinutesHuman(task.estimatedMinutes)}
                          </span>
                          {examNotice && (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              · {examNotice}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartTaskFocus(task, subjectName)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0c102a] dark:bg-[#1e2554] hover:bg-[#181f4a] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        title="Iniciar Pomodoro en este hueco"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Enfocar</span>
                      </button>
                    </div>

                    {!fitsInSlot && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md">
                        Esta entrega requiere más de {formatMinutesHuman(slot.durationMinutes)}. Puedes avanzar un bloque parcial.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Opciones Alternativas */}
          <div className="pt-2 border-t border-[var(--border)] space-y-2">
            <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wide">
              Otras acciones para este hueco
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleStartFreeStudy(Math.min(60, slot.durationMinutes))}
                className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] hover:bg-[var(--surface-raised)] text-[var(--ink)] font-semibold transition-all flex items-center justify-between cursor-pointer group text-left"
              >
                <div>
                  <div className="font-bold">Estudio libre</div>
                  <div className="text-[10px] text-[var(--muted)]">Lectura o repaso general</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--ink)] transition-colors" />
              </button>

              <button
                onClick={handleCreatePersonalBlock}
                className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] hover:bg-[var(--surface-raised)] text-[var(--ink)] font-semibold transition-all flex items-center justify-between cursor-pointer group text-left"
              >
                <div>
                  <div className="font-bold">+ Bloque personal</div>
                  <div className="text-[10px] text-[var(--muted)]">Almuerzo, gym, viaje</div>
                </div>
                <Plus className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--ink)] transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
