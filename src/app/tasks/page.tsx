'use client';

import { useState } from 'react';
import { useSemesterData } from '@/hooks/useSemesterData';
import { useUIStore } from '@/stores/uiStore';
import { assignmentRepository } from '@/lib/storage';
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Filter,
  Search,
  Timer,
  AlertCircle,
  Check,
} from 'lucide-react';

export default function TasksPage() {
  const { assignments, subjects, subjectsMap, refreshData, isLoading } = useSemesterData();
  const { openAddTask, startFocusSession } = useUIStore();

  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleToggle = async (id: string) => {
    await assignmentRepository.toggleStatus(id);
    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta tarea?')) {
      await assignmentRepository.delete(id);
      await refreshData();
      window.dispatchEvent(new CustomEvent('semester-data-updated'));
    }
  };

  const filteredTasks = assignments.filter((task) => {
    if (filterSubject !== 'all' && task.subjectId !== filterSubject) return false;
    if (filterStatus === 'pending' && task.status === 'completed') return false;
    if (filterStatus === 'completed' && task.status !== 'completed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchSub = subjectsMap[task.subjectId]?.name.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchSub) return false;
    }
    return true;
  });

  const pendingCount = assignments.filter((t) => t.status !== 'completed').length;
  const completedCount = assignments.filter((t) => t.status === 'completed').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#3b3abf] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--muted)] font-mono">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3b3abf]/10 border border-[#3b3abf]/20 flex items-center justify-center text-[#3b3abf] dark:text-[#a0a0ff]">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--ink)] tracking-tight flex items-center gap-2">
              <span>Tareas y Entregas</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--paper)] text-[#3b3abf] dark:text-[#a0a0ff] border border-[var(--border)]">
                {pendingCount} pendientes
              </span>
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Gestiona entregas, lecturas, informes y talleres vinculados a tus asignaturas
            </p>
          </div>
        </div>

        <button
          onClick={openAddTask}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Tarea</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs text-xs transition-colors">
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Materia */}
          <div className="flex items-center gap-1.5 bg-[var(--paper)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
            <Filter className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="bg-transparent text-[var(--ink)] font-semibold outline-none cursor-pointer"
            >
              <option value="all">Todas las materias ({subjects.length})</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle de Estado */}
          <div className="flex items-center p-0.5 rounded-xl bg-[var(--paper)] border border-[var(--border)]">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-[#3b3abf] text-white shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Todas ({assignments.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-[#3b3abf] text-white shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'completed'
                  ? 'bg-[#3b3abf] text-white shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Completadas ({completedCount})
            </button>
          </div>
        </div>

        {/* Input de Búsqueda */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por título o materia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--paper)] border border-[var(--border)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] outline-none focus:border-[#3b3abf] transition-colors"
          />
        </div>
      </div>

      {/* Lista de Tareas */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-[var(--ink)]">
              No hay tareas en esta vista
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1">
              {assignments.length === 0
                ? 'Comienza añadiendo tus pendientes académicos del semestre.'
                : 'Intenta ajustando los filtros de búsqueda.'}
            </p>
            <button
              onClick={openAddTask}
              className="mt-4 px-4 py-2 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Tarea</span>
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const sub = subjectsMap[task.subjectId];
            const dueFormatted = task.dueDate
              ? new Date(task.dueDate).toLocaleDateString('es-CO', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Sin fecha límite';

            const priorityBadge = {
              high: { label: 'Alta', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
              medium: { label: 'Media', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
              low: { label: 'Baja', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
            }[task.priority || 'medium'];

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl bg-[var(--surface)] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                  isCompleted
                    ? 'border-[var(--border)] opacity-60'
                    : 'border-[var(--border)] hover:border-[#3b3abf]/50 shadow-xs'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  {/* Checkbox de toggle */}
                  <button
                    onClick={() => handleToggle(task.id)}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 mt-0.5 sm:mt-0 cursor-pointer ${
                      isCompleted
                        ? 'bg-[#3b3abf] border-[#3b3abf] text-white'
                        : 'border-[var(--border)] bg-[var(--paper)] group-hover:border-[#3b3abf]'
                    }`}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-bold leading-tight ${
                          isCompleted
                            ? 'line-through text-[var(--muted)]'
                            : 'text-[var(--ink)]'
                        }`}
                      >
                        {task.title}
                      </span>
                      {priorityBadge && (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full border ${priorityBadge.bg}`}>
                          {priorityBadge.label}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)] mt-1 flex-wrap">
                      {sub && (
                        <span
                          className="px-2 py-0.5 rounded-md font-bold text-[10px] text-white shadow-2xs"
                          style={{ backgroundColor: sub.color }}
                        >
                          {sub.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{dueFormatted}</span>
                      </span>
                      {task.estimatedMinutes && (
                        <span>· ~{task.estimatedMinutes} min</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() =>
                      startFocusSession(task.title, sub?.name || 'Estudio', task.estimatedMinutes || 25)
                    }
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--paper)] hover:bg-[#3b3abf] hover:text-white text-[#3b3abf] dark:text-[#a0a0ff] text-xs font-bold transition-all cursor-pointer border border-[var(--border)] shadow-2xs"
                    title="Iniciar sesión Pomodoro con esta tarea"
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Enfocar</span>
                  </button>

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 rounded-xl text-[var(--muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Eliminar tarea"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
