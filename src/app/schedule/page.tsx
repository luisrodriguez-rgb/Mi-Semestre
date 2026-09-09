'use client';

import { useSemesterData } from '@/hooks/useSemesterData';
import { SmartTimetable } from '@/components/schedule/SmartTimetable';
import { Calendar, Sparkles } from 'lucide-react';

export default function SchedulePage() {
  const { scheduleBlocks, subjectsMap, routines, isLoading } = useSemesterData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#3b3abf] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#3b3abf] dark:text-[#a0a0ff]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Planificación Dinámica</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight mt-1">
            Horario Semanal Inteligente
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Visualiza tus clases universitarias y descubre tus <strong className="text-[#16a34a] dark:text-[#4ade80]">huecos libres</strong> de estudio calculados automáticamente.
          </p>
        </div>
      </div>

      <SmartTimetable
        classes={scheduleBlocks}
        subjectsMap={subjectsMap}
        routines={routines}
      />
    </div>
  );
}
