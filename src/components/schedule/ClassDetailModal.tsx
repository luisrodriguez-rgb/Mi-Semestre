'use client';

import { useMemo, useEffect } from 'react';
import { ScheduleBlock, Subject, Assignment, Exam, AttendanceRecord } from '@/types';
import { useUIStore } from '@/stores/uiStore';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pencil,
  Plus,
  Minus,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { formatMinutesHuman } from '@/lib/academic-engine/utils/timeHelpers';

interface ClassDetailModalProps {
  block: ScheduleBlock | null;
  subject?: Subject;
  assignments: Assignment[];
  exams: Exam[];
  attendance: AttendanceRecord[];
  onClose: () => void;
  onEdit: (block: ScheduleBlock) => void;
  onAddAbsence: (subjectId: string) => Promise<void>;
  onAddPresent: (subjectId: string) => Promise<void>;
  onRemoveAbsence: (subjectId: string) => Promise<void>;
}

const DAY_NAMES: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

export function ClassDetailModal({
  block,
  subject,
  assignments,
  exams,
  attendance,
  onClose,
  onEdit,
  onAddAbsence,
  onAddPresent,
  onRemoveAbsence,
}: ClassDetailModalProps) {
  const { startFocusSession } = useUIStore();

  // Cerrar al presionar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const subjectTasks = useMemo(() => {
    if (!subject) return [];
    return assignments.filter((a) => a.subjectId === subject.id && a.status !== 'completed');
  }, [assignments, subject]);

  const subjectExams = useMemo(() => {
    if (!subject) return [];
    return exams
      .filter((e) => e.subjectId === subject.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [exams, subject]);

  const subjectAbsences = useMemo(() => {
    if (!subject) return [];
    return attendance.filter((a) => a.subjectId === subject.id && a.status === 'absent');
  }, [attendance, subject]);

  if (!block || !subject) return null;

  const maxAbsences = subject.maxAbsences ?? 4;
  const currentAbsences = subjectAbsences.length;
  const absenceRatio = maxAbsences > 0 ? currentAbsences / maxAbsences : 0;
  const isAtRisk = absenceRatio >= 0.75;
  const isDanger = absenceRatio >= 1.0;

  const handleStartTaskFocus = (task: Assignment) => {
    startFocusSession(task.title, subject.name, task.estimatedMinutes || 45, task.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden relative transition-colors max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera temática con el color de la materia */}
        <div
          className="p-6 text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${subject.color || '#3b3abf'} 0%, #0c102a 100%)`,
          }}
        >
          {/* Botón cerrar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 z-20 flex items-center justify-center w-9 h-9 rounded-xl bg-black/30 hover:bg-black/60 active:scale-95 text-white transition-all cursor-pointer select-none"
            title="Cerrar ficha"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>

          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider opacity-90">
            <BookOpen className="w-4 h-4" />
            <span>{subject.code || 'MATERIA'}</span>
            {subject.nrc && <span>· NRC {subject.nrc}</span>}
            <span>· {subject.credits} Créditos</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight mt-1 text-white">
            {subject.name}
          </h2>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-white/90">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 opacity-80" />
              <span>{DAY_NAMES[block.dayOfWeek]}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 opacity-80" />
              <span>
                {block.startTime} — {block.endTime}
              </span>
            </div>
            {block.location && (
              <div className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 opacity-80" />
                <span>{block.location}</span>
              </div>
            )}
            {subject.professor && (
              <div className="flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 opacity-80" />
                <span>{subject.professor}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Sección de Asistencias & Radar de Faltas */}
          <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isDanger ? (
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                ) : isAtRisk ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                  Control de Inasistencias
                </span>
              </div>

              <span
                className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${
                  isDanger
                    ? 'bg-rose-500 text-white'
                    : isAtRisk
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {currentAbsences} / {maxAbsences} faltas
              </span>
            </div>

            {/* Barra de progreso de faltas */}
            <div className="w-full h-2 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isDanger ? 'bg-rose-500' : isAtRisk ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.round(absenceRatio * 100))}%` }}
              />
            </div>

            {isAtRisk && !isDanger && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-2">
                Atención: Te queda solo {Math.max(0, maxAbsences - currentAbsences)} falta antes de perder la materia por inasistencia.
              </p>
            )}
            {isDanger && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-2">
                Límite de faltas alcanzado ({maxAbsences}). Comunícate de inmediato con el docente.
              </p>
            )}

            {/* Botones de acción rápida para asistencias */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]/60">
              <button
                onClick={() => onAddPresent(subject.id)}
                className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Asistí hoy</span>
              </button>

              <button
                onClick={() => onAddAbsence(subject.id)}
                className="flex-1 py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar falta</span>
              </button>

              {currentAbsences > 0 && (
                <button
                  onClick={() => onRemoveAbsence(subject.id)}
                  className="py-1.5 px-2.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                  title="Deshacer última falta"
                >
                  <Minus className="w-3 h-3" />
                  <span>Deshacer</span>
                </button>
              )}
            </div>
          </div>

          {/* Próximas Evaluaciones / Parciales */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#3b3abf] dark:text-[#a0a0ff]" />
                Próximas Evaluaciones ({subjectExams.length})
              </span>
            </div>

            {subjectExams.length === 0 ? (
              <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] text-xs text-[var(--muted)] text-center">
                No hay evaluaciones registradas para esta materia.
              </div>
            ) : (
              <div className="space-y-2">
                {subjectExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-[var(--ink)]">{exam.title}</div>
                      <div className="text-[11px] text-[var(--muted)] font-mono mt-0.5 flex items-center gap-2">
                        <span>{new Date(exam.date).toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span>·</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">Peso: {exam.weight}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tareas Pendientes */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Entregas y Tareas Pendientes ({subjectTasks.length})
              </span>
            </div>

            {subjectTasks.length === 0 ? (
              <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] text-xs text-[var(--muted)] text-center">
                No tienes tareas pendientes en esta materia. ¡Excelente!
              </div>
            ) : (
              <div className="space-y-2">
                {subjectTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--ink)] truncate">{task.title}</div>
                      <div className="text-[11px] text-[var(--muted)] font-mono mt-0.5 flex items-center gap-2">
                        <span>Entrega: {new Date(task.dueDate).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}</span>
                        <span>·</span>
                        <span>~{formatMinutesHuman(task.estimatedMinutes)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartTaskFocus(task)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all cursor-pointer"
                      title="Iniciar Pomodoro para esta tarea"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Enfocar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer con Acciones */}
        <div className="p-4 bg-[var(--paper)] border-t border-[var(--border)] flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onEdit(block);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-bold text-[var(--ink)] transition-all cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>Editar bloque u horario</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0c102a] dark:bg-[#1e2554] hover:bg-[#181f4a] text-white text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
