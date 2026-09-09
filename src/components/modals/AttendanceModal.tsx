'use client';

import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { attendanceRepository, subjectRepository } from '@/lib/storage';
import { AttendanceRecord } from '@/types';
import { X, UserCheck, AlertTriangle, Plus, Minus, CheckCircle, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

export function AttendanceModal() {
  const { isAttendanceModalOpen, closeAttendanceModal } = useUIStore();
  const { subjects, attendance, refreshData } = useSemesterData();

  if (!isAttendanceModalOpen) return null;

  const handleAddAbsence = async (subjectId: string) => {
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
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative transition-colors max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">
                Control de Asistencias y Faltas
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Registro oficial por materia y cálculo de riesgo por inasistencia
              </p>
            </div>
          </div>
          <button
            onClick={closeAttendanceModal}
            className="p-1 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5">
          {subjects.map((sub) => {
            const subRecords = attendance.filter((a) => a.subjectId === sub.id);
            const absences = subRecords.filter((a) => a.status === 'absent').length;
            const presents = subRecords.filter((a) => a.status === 'present').length;
            const total = absences + presents;
            const rate = total > 0 ? Math.round(((total - absences) / total) * 100) : 100;
            const remaining = Math.max(0, sub.maxAbsences - absences);
            const isDanger = remaining <= 1;

            return (
              <div
                key={sub.id}
                className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: sub.color }}
                    />
                    <strong className="text-xs font-bold text-[var(--ink)]">
                      {sub.name}
                    </strong>
                    <span className="text-[10px] font-mono text-[var(--muted)]">
                      ({sub.code})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono mt-2 text-[var(--ink-secondary)]">
                    <span>
                      Asistencia:{' '}
                      <strong className={rate >= 80 ? 'text-emerald-500' : 'text-rose-500'}>
                        {rate}%
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      Faltas:{' '}
                      <strong className={isDanger ? 'text-rose-500' : 'text-[var(--ink)]'}>
                        {absences} / {sub.maxAbsences}
                      </strong>
                    </span>
                    <span>·</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        isDanger
                          ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                          : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {remaining} permitidas
                    </span>
                  </div>
                </div>

                {/* Acciones de asistencia */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAddPresent(sub.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all cursor-pointer"
                    title="Registrar clase asistida hoy"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Asistí</span>
                  </button>

                  <button
                    onClick={() => handleAddAbsence(sub.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer"
                    title="Registrar inasistencia / falta"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Falta</span>
                  </button>

                  {absences > 0 && (
                    <button
                      onClick={() => handleRemoveLastAbsence(sub.id)}
                      className="p-1.5 rounded-lg text-[var(--muted)] hover:text-rose-500 hover:bg-[var(--surface)] border border-[var(--border)] transition-colors cursor-pointer"
                      title="Deshacer última falta"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-[var(--border)] text-right">
          <button
            onClick={closeAttendanceModal}
            className="px-5 py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
