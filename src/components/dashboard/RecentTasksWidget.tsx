'use client';

import Link from 'next/link';
import { ClipboardList, ArrowRight, Check, Plus } from 'lucide-react';
import { Assignment } from '@/types';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { assignmentRepository } from '@/lib/storage';

interface RecentTasksWidgetProps {
  assignments?: Assignment[];
  onToggleTask?: (id: string) => void;
}

export function RecentTasksWidget({ assignments: propAssignments, onToggleTask }: RecentTasksWidgetProps) {
  const { openAddTask } = useUIStore();
  const { assignments: hookAssignments, subjectsMap, refreshData } = useSemesterData();

  const assignmentsList = propAssignments && propAssignments.length > 0 ? propAssignments : hookAssignments;

  const toggleTask = async (id: string) => {
    if (onToggleTask) {
      onToggleTask(id);
    } else {
      await assignmentRepository.toggleStatus(id);
      await refreshData();
      window.dispatchEvent(new CustomEvent('semester-data-updated'));
    }
  };

  // Mostrar las primeras 4 tareas ordenadas por fecha/estado
  const displayTasks = [...assignmentsList]
    .sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 4);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] p-5 shadow-xs transition-colors">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#f0f3fa] dark:border-[#181d42]">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#3b43a8] dark:text-[#8e98ec]" />
          <h3 className="text-sm font-bold text-[#0f1330] dark:text-white tracking-tight">
            Tareas recientes
          </h3>
          <span className="text-[10px] font-mono font-bold text-[#626c96] dark:text-[#8b95c2] ml-1 bg-[#f0f3fa] dark:bg-[#141838] px-2 py-0.5 rounded-full border border-[#e2e6f2] dark:border-[#1e2552]">
            {assignmentsList.filter((t) => t.status !== 'completed').length}{' '}
            {assignmentsList.filter((t) => t.status !== 'completed').length === 1 ? 'pendiente' : 'pendientes'}
          </span>
        </div>
        <Link
          href="/tasks"
          className="text-xs font-semibold text-[#3b43a8] dark:text-[#8e98ec] hover:underline flex items-center gap-0.5"
        >
          <span>Ver todas</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Lista interactiva */}
      <div className="mt-3.5 space-y-2.5">
        {displayTasks.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-xs text-[#626c96] dark:text-[#8b95c2]">
              No tienes tareas pendientes.
            </p>
            <button
              onClick={openAddTask}
              className="mt-2 text-xs font-bold text-[#3b43a8] dark:text-[#8e98ec] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Añadir primera tarea</span>
            </button>
          </div>
        ) : (
          displayTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const sub = subjectsMap[task.subjectId];
            const dueFormatted = task.dueDate
              ? new Date(task.dueDate).toLocaleDateString('es-CO', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })
              : 'Sin fecha';

            return (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f8faff] dark:hover:bg-[#141838] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  {/* Checkbox cuadrado redondeado */}
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      isCompleted
                        ? 'bg-[#202588] border-[#202588] text-white'
                        : 'border-[#d0d7ed] dark:border-[#2b3366] bg-white dark:bg-[#141838] group-hover:border-[#3b43a8]'
                    }`}
                  >
                    {isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs font-semibold leading-tight block truncate ${
                        isCompleted
                          ? 'line-through text-[#8b95c2] dark:text-[#5e699c]'
                          : 'text-[#0f1330] dark:text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    {sub && (
                      <span className="text-[10px] text-[var(--muted)] truncate block">
                        {sub.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fecha / Plazo */}
                <span
                  className={`text-[10px] font-mono font-bold shrink-0 ml-2 px-2 py-0.5 rounded-full ${
                    isCompleted
                      ? 'text-[#8b95c2] bg-[#f0f3fa] dark:bg-[#161c40]'
                      : 'text-[#3b43a8] dark:text-[#8e98ec] bg-[#f0f3ff] dark:bg-[#171c48]'
                  }`}
                >
                  {dueFormatted}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
