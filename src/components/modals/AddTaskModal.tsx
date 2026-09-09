'use client';

import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { assignmentRepository } from '@/lib/storage';
import { TaskPriority } from '@/types';
import { X, PlusCircle, Clock, AlertTriangle } from 'lucide-react';

export function AddTaskModal() {
  const { isAddTaskOpen, closeAddTask } = useUIStore();
  const { subjects, refreshData } = useSemesterData();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [dueDays, setDueDays] = useState(3);

  if (!isAddTaskOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(dueDays));
    dueDate.setHours(23, 59, 0, 0);

    await assignmentRepository.save({
      id: `task-${Date.now()}`,
      subjectId: subjectId || subjects[0]?.id || 'sub-calculo',
      title,
      dueDate: dueDate.toISOString(),
      priority,
      estimatedMinutes: Number(estimatedMinutes),
      status: 'pending',
    });

    await refreshData();
    closeAddTask();
    setTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d0d14]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#e0dff0] shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#e0dff0]">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#3b3abf]" />
            <h3 className="text-base font-bold text-[#0d0d14]">Nueva Tarea o Entrega</h3>
          </div>
          <button onClick={closeAddTask} className="p-1 text-[#7a7890] hover:text-[#0d0d14]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0d0d14] mb-1">Título de la tarea</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Taller 5 de Derivadas parciales"
              className="w-full rounded-xl border border-[#e0dff0] px-3 py-2 text-xs text-[#0d0d14] focus:outline-none focus:border-[#3b3abf]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d14] mb-1">Materia</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-xl border border-[#e0dff0] px-3 py-2 text-xs text-[#0d0d14] focus:outline-none focus:border-[#3b3abf]"
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
              <label className="block text-xs font-bold text-[#0d0d14] mb-1">Tiempo Estimado</label>
              <select
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-[#e0dff0] px-3 py-2 text-xs text-[#0d0d14] focus:outline-none focus:border-[#3b3abf]"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1h 30m</option>
                <option value={120}>2 horas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0d0d14] mb-1">Vence en</label>
              <select
                value={dueDays}
                onChange={(e) => setDueDays(Number(e.target.value))}
                className="w-full rounded-xl border border-[#e0dff0] px-3 py-2 text-xs text-[#0d0d14] focus:outline-none focus:border-[#3b3abf]"
              >
                <option value={1}>Mañana</option>
                <option value={2}>En 2 días</option>
                <option value={4}>En 4 días</option>
                <option value={7}>En 1 semana</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d14] mb-1">Nivel de Prioridad</label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    priority === p
                      ? 'bg-[#3b3abf] text-white border-[#3b3abf]'
                      : 'bg-[#f5f5ff] text-[#7a7890] border-[#e0dff0] hover:text-[#0d0d14]'
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
              className="w-full py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 transition-all"
            >
              Guardar Tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
