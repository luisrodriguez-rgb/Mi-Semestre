'use client';

import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { assignmentRepository, studySessionRepository } from '@/lib/storage';
import { CheckCircle2, Clock, Award, X, ArrowRight } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import confetti from 'canvas-confetti';

export function FocusCompletionModal() {
  const { isFocusCompletionOpen, focusCompletionData, closeFocusCompletion } = useUIStore();
  const [selectedOutcome, setSelectedOutcome] = useState<'completed' | 'partial' | 'free'>('completed');
  const [remainingMinutes, setRemainingMinutes] = useState<number>(30);
  const [saving, setSaving] = useState(false);

  if (!isFocusCompletionOpen || !focusCompletionData) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const now = new Date();
      const start = new Date(now.getTime() - focusCompletionData.minutesElapsed * 60 * 1000);

      // 1. Registrar sesión de estudio en IndexedDB
      await studySessionRepository.create({
        subjectId: 'general',
        assignmentId: focusCompletionData.taskId,
        title: focusCompletionData.taskTitle,
        startAt: start.toISOString(),
        endAt: now.toISOString(),
        durationMinutes: focusCompletionData.minutesElapsed,
        status: 'completed',
      });

      // 2. Si se completó al 100% y había una tarea vinculada
      if (selectedOutcome === 'completed' && focusCompletionData.taskId) {
        await assignmentRepository.toggleStatus(focusCompletionData.taskId);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
        });
      }

      // 3. Si fue parcial y había tarea vinculada, ajustar tiempo estimado restante
      if (selectedOutcome === 'partial' && focusCompletionData.taskId) {
        const all = await assignmentRepository.getAll();
        const task = all.find((t) => t.id === focusCompletionData.taskId);
        if (task) {
          task.estimatedMinutes = remainingMinutes;
          await assignmentRepository.save(task);
        }
      }

      closeFocusCompletion();
      // Pequeño timeout para recargar estado reactivo
      window.dispatchEvent(new CustomEvent('semester-data-updated'));
    } catch (err) {
      console.error('Error al registrar resultado de enfoque:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-[#3b3abf] dark:text-[#a0a0ff]">
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Cierre de Bloque · Registrar Resultado</span>
          </div>
          <button
            onClick={closeFocusCompletion}
            className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen del bloque completado */}
        <div className="mt-5 p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)]">
          <div className="text-xs font-mono text-[var(--muted)] uppercase font-semibold">
            {focusCompletionData.subjectName || 'Enfoque General'}
          </div>
          <div className="text-lg font-extrabold text-[var(--ink)] mt-0.5 tracking-tight">
            {focusCompletionData.taskTitle}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs font-mono text-[var(--ink-secondary)]">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <Clock className="w-3.5 h-3.5" />
              {focusCompletionData.minutesElapsed} min completados
            </span>
            <span>·</span>
            <span className="text-[var(--muted)]">
              Planificado: {focusCompletionData.minutesPlanned} min
            </span>
          </div>
        </div>

        {/* Pregunta clave del flujo de producto */}
        <div className="mt-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)] mb-3">
            ¿Cuál fue el resultado de esta sesión?
          </label>

          <div className="space-y-2.5">
            {/* Opción 1: Tarea completada */}
            <div
              onClick={() => setSelectedOutcome('completed')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedOutcome === 'completed'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--paper)] text-[var(--ink)]'
              }`}
            >
              <CheckCircle2
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  selectedOutcome === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--muted)]'
                }`}
              />
              <div className="flex-1 text-xs">
                <strong className="block text-sm font-bold text-[var(--ink)]">
                  Completada al 100%
                </strong>
                <span className="text-[var(--muted)]">
                  La tarea queda marcada como terminada y se actualiza el radar de riesgo.
                </span>
              </div>
            </div>

            {/* Opción 2: Avanzada parcialmente */}
            <div
              onClick={() => setSelectedOutcome('partial')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedOutcome === 'partial'
                  ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/20'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--paper)] text-[var(--ink)]'
              }`}
            >
              <Clock
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  selectedOutcome === 'partial' ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--muted)]'
                }`}
              />
              <div className="flex-1 text-xs">
                <strong className="block text-sm font-bold text-[var(--ink)]">
                  Avanzada (Requiere más tiempo)
                </strong>
                <span className="text-[var(--muted)]">
                  Avanzaste un tramo importante pero necesitas otra sesión posterior.
                </span>

                {selectedOutcome === 'partial' && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="font-semibold text-[var(--ink)]">
                      Tiempo estimado restante:
                    </span>
                    <CustomSelect
                      value={String(remainingMinutes)}
                      onChange={(val) => setRemainingMinutes(Number(val))}
                      options={[
                        { value: '15', label: '15 minutos' },
                        { value: '30', label: '30 minutos' },
                        { value: '45', label: '45 minutos' },
                        { value: '60', label: '1 hora' },
                        { value: '90', label: '1h 30m' },
                        { value: '120', label: '2 horas' },
                      ]}
                      align="right"
                      buttonClassName="py-0.5 px-2 font-mono text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Opción 3: Solo estudio libre */}
            <div
              onClick={() => setSelectedOutcome('free')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedOutcome === 'free'
                  ? 'bg-[#f0f0ff] dark:bg-[#181a38] border-[#3b3abf] text-[var(--ink)] ring-2 ring-[#3b3abf]/20'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--paper)] text-[var(--ink)]'
              }`}
            >
              <Award
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  selectedOutcome === 'free' ? 'text-[#3b3abf] dark:text-[#a0a0ff]' : 'text-[var(--muted)]'
                }`}
              />
              <div className="flex-1 text-xs">
                <strong className="block text-sm font-bold text-[var(--ink)]">
                  Solo registrar sesión de estudio
                </strong>
                <span className="text-[var(--muted)]">
                  Guarda las horas dedicadas en tu historial semestral sin alterar tareas.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-end gap-2.5">
          <button
            onClick={closeFocusCompletion}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-all cursor-pointer"
          >
            Omitir por ahora
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-extrabold shadow-md shadow-[#3b3abf]/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{saving ? 'Guardando...' : 'Confirmar y Actualizar'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
