'use client';

import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { routineRepository } from '@/lib/storage';
import { FixedRoutine, RoutineType, DayOfWeek } from '@/types';
import { X, Clock, Coffee, Car, Dumbbell, Briefcase, Moon } from 'lucide-react';

export function AddRoutineModal() {
  const { isRoutineModalOpen, closeRoutineModal } = useUIStore();
  const { routines, refreshData } = useSemesterData();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<RoutineType>('meal');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(1);
  const [applyAllDays, setApplyAllDays] = useState(true);
  const [startTime, setStartTime] = useState('12:30');
  const [endTime, setEndTime] = useState('13:30');

  if (!isRoutineModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const days: DayOfWeek[] = applyAllDays ? [1, 2, 3, 4, 5] : [dayOfWeek];

    const newRoutines: FixedRoutine[] = days.map((d) => ({
      id: `routine-${Date.now()}-${d}`,
      title: title || (type === 'meal' ? 'Almuerzo' : type === 'commute' ? 'Transporte' : 'Compromiso Fijo'),
      type,
      dayOfWeek: d,
      startTime,
      endTime,
    }));

    await routineRepository.bulkSave(newRoutines);
    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
    closeRoutineModal();
    setTitle('');
  };

  const routineTypes = [
    { value: 'meal', label: 'Almuerzo / Comida', icon: Coffee },
    { value: 'commute', label: 'Transporte / Traslado', icon: Car },
    { value: 'gym', label: 'Gimnasio / Deporte', icon: Dumbbell },
    { value: 'work', label: 'Trabajo / Monitoría', icon: Briefcase },
    { value: 'rest', label: 'Descanso / Siesta', icon: Moon },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative transition-colors max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">Añadir Tiempo o Rutina Fija</h3>
              <p className="text-xs text-[var(--muted)]">Bloquea horas fijas para un cálculo real de tiempo útil</p>
            </div>
          </div>
          <button
            onClick={closeRoutineModal}
            className="p-1 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">Tipo de compromiso</label>
            <div className="grid grid-cols-1 gap-1.5">
              {routineTypes.map((rt) => {
                const Icon = rt.icon;
                return (
                  <button
                    type="button"
                    key={rt.value}
                    onClick={() => {
                      setType(rt.value as RoutineType);
                      if (!title) setTitle(rt.label.split('/')[0].trim());
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                      type === rt.value
                        ? 'bg-[#3b3abf] text-white border-[#3b3abf]'
                        : 'bg-[var(--paper)] text-[var(--ink-secondary)] border-[var(--border)] hover:bg-[var(--surface-raised)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{rt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">Nombre personalizado</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Almuerzo en Cafetería Central"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Hora Inicio</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Hora Fin</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs text-[var(--ink)] cursor-pointer">
              <input
                type="checkbox"
                checked={applyAllDays}
                onChange={(e) => setApplyAllDays(e.target.checked)}
                className="w-4 h-4 rounded text-[#3b3abf] focus:ring-0"
              />
              <span className="font-semibold">Repetir de Lunes a Viernes</span>
            </label>

            {!applyAllDays && (
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {[
                  { v: 1, l: 'Lun' },
                  { v: 2, l: 'Mar' },
                  { v: 3, l: 'Mié' },
                  { v: 4, l: 'Jue' },
                  { v: 5, l: 'Vie' },
                ].map((d) => (
                  <button
                    type="button"
                    key={d.v}
                    onClick={() => setDayOfWeek(d.v as DayOfWeek)}
                    className={`py-1.5 rounded-lg text-xs font-bold border ${
                      dayOfWeek === d.v
                        ? 'bg-[#3b3abf] text-white border-[#3b3abf]'
                        : 'bg-[var(--paper)] text-[var(--muted)] border-[var(--border)]'
                    }`}
                  >
                    {d.l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 transition-all cursor-pointer"
            >
              Guardar Tiempo Fijo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
