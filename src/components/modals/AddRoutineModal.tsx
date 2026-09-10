'use client';

import { useState, useMemo } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { routineRepository } from '@/lib/storage';
import { FixedRoutine, RoutineType, DayOfWeek } from '@/types';
import {
  X,
  Clock,
  Coffee,
  Car,
  Dumbbell,
  Briefcase,
  Moon,
  Trash2,
  FileText,
  Calendar,
} from 'lucide-react';

const DAY_LABELS: Record<DayOfWeek, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

interface RoutineFormContentProps {
  editingRoutine: FixedRoutine | null;
  routines: FixedRoutine[];
  refreshData: () => Promise<void>;
  onClose: () => void;
}

function RoutineFormContent({
  editingRoutine,
  routines,
  refreshData,
  onClose,
}: RoutineFormContentProps) {
  const isEditing = Boolean(editingRoutine);

  const [title, setTitle] = useState(editingRoutine?.title || '');
  const [type, setType] = useState<RoutineType>(editingRoutine?.type || 'meal');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(editingRoutine?.dayOfWeek || 1);
  const [startTime, setStartTime] = useState(editingRoutine?.startTime || '12:30');
  const [endTime, setEndTime] = useState(editingRoutine?.endTime || '13:30');
  const [notes, setNotes] = useState(editingRoutine?.notes || '');
  const [applyAllDays, setApplyAllDays] = useState(!editingRoutine);
  const [isDeleting, setIsDeleting] = useState(false);

  // Buscar si esta rutina se repite en otros días de la semana con el mismo título y horario
  const siblingRoutines = useMemo(() => {
    if (!editingRoutine) return [];
    return routines.filter(
      (r) =>
        r.id !== editingRoutine.id &&
        r.title.toLowerCase().trim() === editingRoutine.title.toLowerCase().trim() &&
        r.startTime === editingRoutine.startTime &&
        r.endTime === editingRoutine.endTime
    );
  }, [editingRoutine, routines]);

  const hasSiblings = siblingRoutines.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && editingRoutine) {
      // Guardar edición
      const updated: FixedRoutine = {
        ...editingRoutine,
        title: title || getDefaultTitle(type),
        type,
        dayOfWeek,
        startTime,
        endTime,
        notes: notes.trim() || undefined,
      };

      await routineRepository.save(updated);

      // Si el usuario eligió aplicar cambios a toda la serie recurrente
      if (applyAllDays && hasSiblings) {
        const updatedSiblings = siblingRoutines.map((s) => ({
          ...s,
          title: updated.title,
          type: updated.type,
          startTime: updated.startTime,
          endTime: updated.endTime,
          notes: updated.notes,
        }));
        await routineRepository.bulkSave(updatedSiblings);
      }
    } else {
      // Creación nueva
      const days: DayOfWeek[] = applyAllDays ? [1, 2, 3, 4, 5] : [dayOfWeek];

      const newRoutines: FixedRoutine[] = days.map((d) => ({
        id: `routine-${Date.now()}-${d}`,
        title: title || getDefaultTitle(type),
        type,
        dayOfWeek: d,
        startTime,
        endTime,
        notes: notes.trim() || undefined,
      }));

      await routineRepository.bulkSave(newRoutines);
    }

    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
    onClose();
  };

  const handleDeleteThis = async () => {
    if (!editingRoutine) return;
    await routineRepository.delete(editingRoutine.id);
    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
    onClose();
  };

  const handleDeleteAllSeries = async () => {
    if (!editingRoutine) return;
    const allIds = [editingRoutine.id, ...siblingRoutines.map((s) => s.id)];
    for (const id of allIds) {
      await routineRepository.delete(id);
    }
    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
    onClose();
  };

  const getDefaultTitle = (t: RoutineType) => {
    switch (t) {
      case 'meal':
        return 'Almuerzo';
      case 'commute':
        return 'Transporte';
      case 'gym':
        return 'Gimnasio';
      case 'work':
        return 'Trabajo / Monitoría';
      case 'rest':
        return 'Descanso';
      default:
        return 'Tiempo Fijo';
    }
  };

  const routineTypes = [
    { value: 'meal', label: 'Almuerzo / Comida', icon: Coffee },
    { value: 'commute', label: 'Transporte / Traslado', icon: Car },
    { value: 'gym', label: 'Gimnasio / Deporte', icon: Dumbbell },
    { value: 'work', label: 'Trabajo / Monitoría', icon: Briefcase },
    { value: 'rest', label: 'Descanso / Siesta', icon: Moon },
  ];

  return (
    <div
      className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative transition-colors max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--ink)]">
              {isEditing ? 'Gestionar Bloque Personal' : 'Añadir Tiempo o Rutina Fija'}
            </h3>
            <p className="text-xs text-[var(--muted)]">
              {isEditing
                ? `Edita o elimina este compromiso (${DAY_LABELS[dayOfWeek]})`
                : 'Bloquea horas fijas para un cálculo real de tiempo útil'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-[var(--paper)] hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] flex items-center justify-center transition-colors cursor-pointer"
          title="Cerrar modal"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 pointer-events-none" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Categoría / Tipo */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
            Tipo de compromiso
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {routineTypes.map((rt) => {
              const Icon = rt.icon;
              const isSelected = type === rt.value;
              return (
                <button
                  type="button"
                  key={rt.value}
                  onClick={() => {
                    setType(rt.value as RoutineType);
                    if (!title || routineTypes.some((o) => title.startsWith(o.label.split('/')[0].trim()))) {
                      setTitle(rt.label.split('/')[0].trim());
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#3b3abf] text-white border-[#3b3abf] shadow-xs'
                      : 'bg-[var(--paper)] text-[var(--ink-secondary)] border-[var(--border)] hover:bg-[var(--surface-raised)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{rt.label}</span>
                  </div>
                  {isSelected && <span className="text-[10px] font-mono font-bold">Seleccionado</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nombre personalizado */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink)] mb-1">
            Nombre personalizado
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Almuerzo en Cafetería Central, Gimnasio Samán"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
          />
        </div>

        {/* Horario */}
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

        {/* Notas / Recordatorios */}
        <div>
          <label className="block text-xs font-bold text-[var(--ink)] mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>Notas o Recordatorio (Opcional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Llevar ropa de cambio, locker 42, almorzar con grupo de trabajo"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] resize-none"
          />
        </div>

        {/* Días de la semana */}
        <div>
          {!isEditing ? (
            <>
              <label className="flex items-center gap-2 text-xs text-[var(--ink)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyAllDays}
                  onChange={(e) => setApplyAllDays(e.target.checked)}
                  className="w-4 h-4 rounded text-[#3b3abf] focus:ring-0 cursor-pointer"
                />
                <span className="font-semibold">Repetir de Lunes a Viernes</span>
              </label>

              {!applyAllDays && (
                <div className="mt-2 grid grid-cols-6 gap-1.5">
                  {[
                    { v: 1, l: 'Lun' },
                    { v: 2, l: 'Mar' },
                    { v: 3, l: 'Mié' },
                    { v: 4, l: 'Jue' },
                    { v: 5, l: 'Vie' },
                    { v: 6, l: 'Sáb' },
                  ].map((d) => (
                    <button
                      type="button"
                      key={d.v}
                      onClick={() => setDayOfWeek(d.v as DayOfWeek)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        dayOfWeek === d.v
                          ? 'bg-[#3b3abf] text-white border-[#3b3abf]'
                          : 'bg-[var(--paper)] text-[var(--muted)] border-[var(--border)] hover:bg-[var(--surface-raised)]'
                      }`}
                    >
                      {d.l}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span>Día de la semana</span>
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {[
                  { v: 1, l: 'Lun' },
                  { v: 2, l: 'Mar' },
                  { v: 3, l: 'Mié' },
                  { v: 4, l: 'Jue' },
                  { v: 5, l: 'Vie' },
                  { v: 6, l: 'Sáb' },
                ].map((d) => (
                  <button
                    type="button"
                    key={d.v}
                    onClick={() => setDayOfWeek(d.v as DayOfWeek)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      dayOfWeek === d.v
                        ? 'bg-[#3b3abf] text-white border-[#3b3abf]'
                        : 'bg-[var(--paper)] text-[var(--muted)] border-[var(--border)] hover:bg-[var(--surface-raised)]'
                    }`}
                  >
                    {d.l}
                  </button>
                ))}
              </div>

              {hasSiblings && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <label className="flex items-center gap-2 text-amber-900 dark:text-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyAllDays}
                      onChange={(e) => setApplyAllDays(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3b3abf] focus:ring-0 cursor-pointer"
                    />
                    <span className="font-medium">
                      Aplicar cambios a toda la serie recurrente ({siblingRoutines.length + 1} días)
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones principales */}
        <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2">
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 transition-all cursor-pointer"
          >
            {isEditing ? 'Guardar Cambios' : 'Guardar Tiempo Fijo'}
          </button>

          {isEditing && (
            <div className="pt-1">
              {!isDeleting ? (
                <button
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  className="w-full py-2 rounded-xl border border-rose-300/80 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar este bloque</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 space-y-2 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    ¿Seguro que deseas eliminar esta rutina?
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={handleDeleteThis}
                      className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      Eliminar solo este día ({DAY_LABELS[dayOfWeek]})
                    </button>

                    {hasSiblings && (
                      <button
                        type="button"
                        onClick={handleDeleteAllSeries}
                        className="w-full py-1.5 px-3 rounded-lg bg-rose-800 hover:bg-rose-900 text-white text-xs font-bold transition-colors cursor-pointer text-center"
                      >
                        Eliminar en toda la semana ({siblingRoutines.length + 1} días)
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsDeleting(false)}
                      className="w-full py-1 rounded-lg text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer text-center"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export function AddRoutineModal() {
  const { isRoutineModalOpen, closeRoutineModal, editingRoutine } = useUIStore();
  const { routines, refreshData } = useSemesterData();

  if (!isRoutineModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeRoutineModal();
      }}
    >
      <RoutineFormContent
        key={editingRoutine ? editingRoutine.id : 'new-routine'}
        editingRoutine={editingRoutine}
        routines={routines}
        refreshData={refreshData}
        onClose={closeRoutineModal}
      />
    </div>
  );
}
