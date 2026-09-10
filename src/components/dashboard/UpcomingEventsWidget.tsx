'use client';

import Link from 'next/link';
import { Calendar, ArrowRight, Plus } from 'lucide-react';
import { Exam } from '@/types';
import { useSemesterData } from '@/hooks/useSemesterData';
import { useUIStore } from '@/stores/uiStore';

interface UpcomingEventsWidgetProps {
  exams?: Exam[];
}

export function UpcomingEventsWidget({ exams: propExams }: UpcomingEventsWidgetProps) {
  const { openAddExam } = useUIStore();
  const { exams: hookExams, subjectsMap } = useSemesterData();

  const examsList = propExams && propExams.length > 0 ? propExams : hookExams;

  // Ordenar los exámenes por fecha más cercana
  const sortedExams = [...examsList]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] p-5 shadow-xs transition-colors">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#f0f3fa] dark:border-[#181d42]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#3b43a8] dark:text-[#8e98ec]" />
          <h3 className="text-sm font-bold text-[#0f1330] dark:text-white tracking-tight">
            Próximos exámenes
          </h3>
          <span className="text-[10px] font-mono font-bold text-[#626c96] dark:text-[#8b95c2] ml-1 bg-[#f0f3fa] dark:bg-[#141838] px-2 py-0.5 rounded-full border border-[#e2e6f2] dark:border-[#1e2552]">
            {examsList.length} parciales
          </span>
        </div>
        <Link
          href="/exams"
          className="text-xs font-semibold text-[#3b43a8] dark:text-[#8e98ec] hover:underline flex items-center gap-0.5"
        >
          <span>Ver todos</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Lista de eventos */}
      <div className="mt-3.5 space-y-2.5">
        {sortedExams.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-xs text-[#626c96] dark:text-[#8b95c2]">
              No tienes parciales programados aún.
            </p>
            <button
              onClick={openAddExam}
              className="mt-2 text-xs font-bold text-[#3b43a8] dark:text-[#8e98ec] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Añadir primer examen</span>
            </button>
          </div>
        ) : (
          sortedExams.map((exam) => {
            const sub = subjectsMap[exam.subjectId];
            const examDate = new Date(exam.date);
            const day = isNaN(examDate.getDate()) ? '15' : examDate.getDate().toString();
            const month = isNaN(examDate.getMonth())
              ? 'SEP'
              : examDate.toLocaleDateString('es-CO', { month: 'short' }).toUpperCase();
            const timeStr = isNaN(examDate.getTime())
              ? ''
              : examDate.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });

            return (
              <div
                key={exam.id}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f8faff] dark:hover:bg-[#141838] transition-colors group cursor-default"
              >
                {/* Cuadro de Fecha Tipo Calendario */}
                <div className="w-10 h-11 rounded-xl bg-[#f0f3fa] dark:bg-[#161c42] border border-[#e2e6f2] dark:border-[#22295a] flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-mono font-bold text-[#626c96] dark:text-[#8894c7] leading-none uppercase">
                    {month}
                  </span>
                  <span className="text-sm font-black text-[#0f1330] dark:text-white leading-tight font-mono mt-0.5">
                    {day}
                  </span>
                </div>

                {/* Detalles */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-[#0f1330] dark:text-white truncate">
                      {exam.title}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20">
                      {exam.weight}%
                    </span>
                  </div>
                  <div className="text-[10px] text-[#626c96] dark:text-[#8b95c2] truncate mt-0.5">
                    {sub?.name || 'Materia'} {timeStr ? `· ${timeStr}` : ''}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
