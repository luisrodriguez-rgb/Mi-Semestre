'use client';

import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { attendanceRepository } from '@/lib/storage';
import { AttendanceRecord } from '@/types';
import { X, UserCheck, AlertTriangle, Plus, Minus, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export function AttendanceModal() {
  const { isAttendanceModalOpen, closeAttendanceModal } = useUIStore();
  const { subjects, attendance, refreshData } = useSemesterData();
  const [animatingSubjectId, setAnimatingSubjectId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ id: string; type: 'present' | 'absent' } | null>(null);

  if (!isAttendanceModalOpen) return null;

  const handleAddAbsence = async (subjectId: string, currentAbsences: number, maxAbsences: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subjectId,
      date: todayStr,
      status: 'absent',
    };
    await attendanceRepository.save(newRecord);
    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));

    setAnimatingSubjectId(subjectId);
    setLastAction({ id: subjectId, type: 'absent' });
    setTimeout(() => {
      setAnimatingSubjectId(null);
    }, 800);
  };

  const handleAddPresent = async (subjectId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subjectId,
      date: todayStr,
      status: 'present',
    };
    await attendanceRepository.save(newRecord);
    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));

    setAnimatingSubjectId(subjectId);
    setLastAction({ id: subjectId, type: 'present' });
    confetti({
      particleCount: 35,
      spread: 45,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#6ee7b7'],
    });
    setTimeout(() => {
      setAnimatingSubjectId(null);
    }, 800);
  };

  const handleRemoveLastAbsence = async (subjectId: string) => {
    const subjectAbsences = attendance.filter(
      (a) => a.subjectId === subjectId && a.status === 'absent'
    );
    if (subjectAbsences.length === 0) return;
    const last = subjectAbsences[subjectAbsences.length - 1];
    await attendanceRepository.delete(last.id);
    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative transition-colors max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">
                Control de Asistencias y Faltas
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Registro por clase: suma asistencias o registra faltas con radar preventivo
              </p>
            </div>
          </div>
          <button
            onClick={closeAttendanceModal}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Materias */}
        <div className="mt-4 space-y-3.5">
          {subjects.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--muted)]">
              No tienes materias registradas aún. Agrega una clase para llevar el control.
            </div>
          ) : (
            subjects.map((sub) => {
              const subRecords = attendance.filter((a) => a.subjectId === sub.id);
              const absences = subRecords.filter((a) => a.status === 'absent').length;
              const presents = subRecords.filter((a) => a.status === 'present').length;
              const maxAbsences = sub.maxAbsences || 4;
              const remaining = Math.max(0, maxAbsences - absences);
              const isOverLimit = absences >= maxAbsences;
              const isDanger = remaining === 1;
              const isAnimating = animatingSubjectId === sub.id;
              const lastType = lastAction?.id === sub.id ? lastAction.type : null;

              // Porcentaje de faltas consumidas
              const percentFaltas = Math.min(100, Math.round((absences / maxAbsences) * 100));

              return (
                <div
                  key={sub.id}
                  className={`p-4 rounded-xl bg-[var(--paper)] border transition-all duration-300 ${
                    isOverLimit
                      ? 'border-rose-500/60 bg-rose-500/5'
                      : isDanger
                      ? 'border-amber-500/60 bg-amber-500/5'
                      : 'border-[var(--border)]'
                  } ${isAnimating ? (lastType === 'absent' ? 'animate-pulse scale-[1.01]' : 'scale-[1.01]') : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <strong className="text-xs font-bold text-[var(--ink)]">
                          {sub.name}
                        </strong>
                        <span className="text-[10px] font-mono text-[var(--muted)]">
                          ({sub.code})
                        </span>
                      </div>

                      {/* Métricas de Asistencia vs Faltas */}
                      <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono mt-2 text-[var(--ink-secondary)]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          ✓ {presents} asistidas
                        </span>
                        <span>·</span>
                        <span>
                          Faltas:{' '}
                          <strong
                            className={
                              isOverLimit
                                ? 'text-rose-600 dark:text-rose-400 font-black'
                                : isDanger
                                ? 'text-amber-600 dark:text-amber-400 font-bold'
                                : 'text-[var(--ink)]'
                            }
                          >
                            {absences} / {maxAbsences}
                          </strong>
                        </span>
                        <span>·</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            isOverLimit
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : isDanger
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          {isOverLimit
                            ? 'Límite excedido'
                            : `${remaining} permitidas`}
                        </span>
                      </div>

                      {/* Barra de progreso de faltas hacia el límite */}
                      <div className="w-full sm:w-64 h-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] mt-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOverLimit
                              ? 'bg-rose-600'
                              : isDanger
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentFaltas}%` }}
                        />
                      </div>
                    </div>

                    {/* Botones de acción directa */}
                    <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                      <button
                        onClick={() => handleAddPresent(sub.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        title="Registrar clase asistida hoy"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Asistí</span>
                      </button>

                      <button
                        onClick={() => handleAddAbsence(sub.id, absences, maxAbsences)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        title="Registrar inasistencia / falta"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Falta</span>
                      </button>

                      {absences > 0 && (
                        <button
                          onClick={() => handleRemoveLastAbsence(sub.id)}
                          className="p-1.5 rounded-xl text-[var(--muted)] hover:text-rose-600 hover:bg-[var(--surface)] border border-[var(--border)] transition-colors cursor-pointer"
                          title="Restar última falta"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
