'use client';

import { Layers3, ClipboardList, Calendar } from 'lucide-react';
import { Subject, Assignment, Exam } from '@/types';

interface GeneralProgressCardProps {
  progressPercentage?: number;
  currentWeek?: number;
  totalWeeks?: number;
  subjects: Subject[];
  assignments: Assignment[];
  exams: Exam[];
}

export function GeneralProgressCard({
  progressPercentage = 37,
  currentWeek = 6,
  totalWeeks = 16,
  subjects,
  assignments,
  exams,
}: GeneralProgressCardProps) {
  const pendingAssignmentsCount = assignments.filter((a) => a.status !== 'completed').length || 7;
  const upcomingExamsCount = exams.length || 2;
  const totalSubjectsCount = subjects.length || 5;

  // Donut SVG circumference math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] p-6 shadow-xs transition-colors">
      <h3 className="text-sm font-bold text-[#0f1330] dark:text-white tracking-tight">
        Tu progreso general
      </h3>

      {/* Donut Chart y Semanas */}
      <div className="flex items-center gap-4 mt-4">
        {/* Gráfico circular donut */}
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Círculo de fondo */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-[#e2e6f4] dark:text-[#1c224b]"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Círculo de progreso */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-[#202588] dark:text-[#4d56e2] transition-all duration-700 ease-out"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-black font-mono text-[#0f1330] dark:text-white">
            {progressPercentage}%
          </div>
        </div>

        {/* Resumen semana */}
        <div>
          <div className="text-sm font-black text-[#0f1330] dark:text-white">
            Semana {currentWeek} de {totalWeeks}
          </div>
          <div className="text-xs text-[#626c96] dark:text-[#8b95c2] mt-0.5 font-medium">
            {currentWeek} de {totalWeeks} semanas completadas
          </div>
        </div>
      </div>

      {/* Lista de métricas */}
      <div className="mt-5 pt-4 border-t border-[#f0f3fa] dark:border-[#181d42] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-[#505a88] dark:text-[#949ecb] font-medium">
            <Layers3 className="w-4 h-4 text-[#3b43a8] dark:text-[#8e98ec]" />
            <span>Materias</span>
          </div>
          <span className="font-mono font-bold text-[#0f1330] dark:text-white">
            {totalSubjectsCount} / {totalSubjectsCount}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-[#505a88] dark:text-[#949ecb] font-medium">
            <ClipboardList className="w-4 h-4 text-[#3b43a8] dark:text-[#8e98ec]" />
            <span>Tareas pendientes</span>
          </div>
          <span className="font-mono font-bold text-[#0f1330] dark:text-white">
            {pendingAssignmentsCount}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-[#505a88] dark:text-[#949ecb] font-medium">
            <Calendar className="w-4 h-4 text-[#3b43a8] dark:text-[#8e98ec]" />
            <span>Parciales próximos</span>
          </div>
          <span className="font-mono font-bold text-[#0f1330] dark:text-white">
            {upcomingExamsCount}
          </span>
        </div>
      </div>
    </div>
  );
}
