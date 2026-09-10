'use client';

import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { assignmentRepository } from '@/lib/storage';
import { Assignment, TaskPriority } from '@/types';
import { X, PlusCircle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

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
            <CustomSelect
              className="w-full"
              value={subjectId || subjects[0]?.id || ''}
              onChange={(val) => setSubjectId(val)}
              options={subjects.map((sub) => ({
                value: sub.id,
                label: sub.name,
                sublabel: sub.code,
                color: sub.color,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Tiempo Estimado</label>
              <CustomSelect
                className="w-full"
                value={String(estimatedMinutes)}
                onChange={(val) => setEstimatedMinutes(Number(val))}
                options={[
                  { value: '15', label: '15 minutos' },
                  { value: '30', label: '30 minutos' },
                  { value: '45', label: '45 minutos' },
                  { value: '60', label: '1 hora' },
                  { value: '90', label: '1h 30m' },
                  { value: '120', label: '2 horas' },
                  { value: '180', label: '3 horas' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Vence en</label>
              <CustomSelect
                className="w-full"
                value={String(dueDays)}
                onChange={(val) => setDueDays(Number(val))}
                options={[
                  { value: '1', label: 'Mañana' },
                  { value: '2', label: 'En 2 días' },
                  { value: '3', label: 'En 3 días' },
                  { value: '4', label: 'En 4 días' },
                  { value: '7', label: 'En 1 semana' },
                  { value: '14', label: 'En 2 semanas' },
                ]}
              />
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
