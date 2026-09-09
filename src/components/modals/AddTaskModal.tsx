'use client';

import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { assignmentRepository } from '@/lib/storage';
import { Assignment, TaskPriority } from '@/types';
import { X, PlusCircle, Clock } from 'lucide-react';

export function AddTaskModal() {
  const { isAddTaskOpen, closeAddTask } = useUIStore();
  const { subjects, refreshData } = useSemesterData();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDays, setDueDays] = useState(2);

  if (!isAddTaskOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSubId = subjectId || subjects[0]?.id;
    if (!effectiveSubId) return;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    const newTask: Assignment = {
      id: `task-${Date.now()}`,
      subjectId: effectiveSubId,
      title,
      estimatedMinutes,
      priority,
      status: 'pending',
      dueDate: dueDate.toISOString(),
    };

    await assignmentRepository.save(newTask);
    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
    closeAddTask();
    setTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#3b3abf] dark:text-[#a0a0ff]" />
            <h3 className="text-base font-bold text-[var(--ink)]">Nueva Tarea o Entrega</h3>
          </div>
          <button
            onClick={closeAddTask}
            className="p-1 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">Título de la tarea</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Taller 5 de Derivadas parciales"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">Materia</label>
            <select
              value={subjectId || subjects[0]?.id}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Tiempo Estimado</label>
              <select
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1h 30m</option>
                <option value={120}>2 horas</option>
                <option value={180}>3 horas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Vence en</label>
              <select
                value={dueDays}
                onChange={(e) => setDueDays(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              >
                <option value={1}>Mañana</option>
                <option value={2}>En 2 días</option>
                <option value={3}>En 3 días</option>
                <option value={4}>En 4 días</option>
                <option value={7}>En 1 semana</option>
                <option value={14}>En 2 semanas</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">Nivel de Prioridad</label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    priority === p
                      ? 'bg-[#3b3abf] text-white border-[#3b3abf]'
                      : 'bg-[var(--paper)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--ink)]'
                  }`}
                >
                  {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 transition-all cursor-pointer"
            >
              Guardar Tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
