'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, ArrowRight, Check } from 'lucide-react';
import { Assignment } from '@/types';

interface RecentTasksWidgetProps {
  assignments?: Assignment[];
  onToggleTask?: (id: string) => void;
}

interface RecentTask {
  id: string;
  title: string;
  dueLabel: string;
  completed: boolean;
}

const DEFAULT_RECENT_TASKS: RecentTask[] = [
  {
    id: 'task-fis-cine',
    title: 'Taller de Física - Cinemática',
    dueLabel: 'Hoy',
    completed: true,
  },
  {
    id: 'task-lec-crit',
    title: 'Lectura Crítica - Ensayo',
    dueLabel: 'Jue 11',
    completed: false,
  },
  {
    id: 'task-inf-inercia',
    title: 'Informe Laboratorio - Momento de Inercia',
    dueLabel: 'Vie 12',
    completed: false,
  },
];

export function RecentTasksWidget({ assignments, onToggleTask }: RecentTasksWidgetProps) {
  const [tasks, setTasks] = useState<RecentTask[]>(DEFAULT_RECENT_TASKS);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    if (onToggleTask) {
      onToggleTask(id);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] p-5 shadow-xs transition-colors">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#f0f3fa] dark:border-[#181d42]">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#3b43a8] dark:text-[#8e98ec]" />
          <h3 className="text-sm font-bold text-[#0f1330] dark:text-white tracking-tight">
            Tareas recientes
          </h3>
        </div>
        <Link
          href="/dashboard#tareas"
          className="text-xs font-semibold text-[#3b43a8] dark:text-[#8e98ec] hover:underline flex items-center gap-0.5"
        >
          <span>Ver todas</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Lista interactiva */}
      <div className="mt-3.5 space-y-2.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f8faff] dark:hover:bg-[#141838] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Checkbox cuadrado redondeado */}
              <div
                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                  task.completed
                    ? 'bg-[#202588] border-[#202588] text-white'
                    : 'border-[#d0d7ed] dark:border-[#2b3366] bg-white dark:bg-[#141838] group-hover:border-[#3b43a8]'
                }`}
              >
                {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>

              <span
                className={`text-xs font-medium truncate transition-colors ${
                  task.completed
                    ? 'line-through text-[#8b95c2] dark:text-[#626c96]'
                    : 'text-[#0f1330] dark:text-white group-hover:text-[#3b43a8] dark:group-hover:text-[#8e98ec]'
                }`}
              >
                {task.title}
              </span>
            </div>

            <span className="text-[10px] font-mono text-[#626c96] dark:text-[#8b95c2] shrink-0 ml-2">
              {task.dueLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
