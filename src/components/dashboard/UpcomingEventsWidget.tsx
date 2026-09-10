'use client';

import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { Exam } from '@/types';

interface UpcomingEventsWidgetProps {
  exams?: Exam[];
}

interface EventItem {
  id: string;
  day: string;
  month: string;
  title: string;
  timeAndPlace: string;
  type: 'Examen' | 'Tarea' | 'Taller';
}

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: 'ev-1',
    day: '11',
    month: 'SEP',
    title: 'Parcial - Cálculo Multivariado',
    timeAndPlace: '8:00 a.m. · Aula 201',
    type: 'Examen',
  },
  {
    id: 'ev-2',
    day: '12',
    month: 'SEP',
    title: 'Entrega - Informe Laboratorio',
    timeAndPlace: '4:00 p.m. · Plataforma',
    type: 'Tarea',
  },
  {
    id: 'ev-3',
    day: '18',
    month: 'SEP',
    title: 'Taller - Física Mecánica',
    timeAndPlace: '10:00 a.m. · Lab 3',
    type: 'Taller',
  },
  {
    id: 'ev-4',
    day: '25',
    month: 'SEP',
    title: 'Parcial - Estructuras de Datos',
    timeAndPlace: '2:00 p.m. · Aula 204',
    type: 'Examen',
  },
];

export function UpcomingEventsWidget({ exams }: UpcomingEventsWidgetProps) {
  const events = DEFAULT_EVENTS;

  const getTypeStyle = (type: EventItem['type']) => {
    switch (type) {
      case 'Examen':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'Tarea':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
      case 'Taller':
      default:
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20';
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] p-5 shadow-xs transition-colors">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#f0f3fa] dark:border-[#181d42]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#3b43a8] dark:text-[#8e98ec]" />
          <h3 className="text-sm font-bold text-[#0f1330] dark:text-white tracking-tight">
            Próximos eventos
          </h3>
        </div>
        <Link
          href="/dashboard#evaluaciones"
          className="text-xs font-semibold text-[#3b43a8] dark:text-[#8e98ec] hover:underline flex items-center gap-0.5"
        >
          <span>Ver todos</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Lista de eventos */}
      <div className="mt-3.5 space-y-2.5">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#f8faff] dark:hover:bg-[#141838] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Caja de fecha */}
              <div className="w-10 h-10 rounded-xl bg-[#f0f3fa] dark:bg-[#161c42] border border-[#e2e6f2] dark:border-[#22295a] flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-black font-mono text-[#0f1330] dark:text-white leading-none">
                  {ev.day}
                </span>
                <span className="text-[8px] font-mono font-bold text-[#626c96] dark:text-[#8b95c2] leading-none mt-0.5">
                  {ev.month}
                </span>
              </div>

              <div className="min-w-0">
                <div className="text-xs font-bold text-[#0f1330] dark:text-white truncate">
                  {ev.title}
                </div>
                <div className="text-[10px] font-mono text-[#626c96] dark:text-[#8b95c2] mt-0.5 truncate">
                  {ev.timeAndPlace}
                </div>
              </div>
            </div>

            {/* Badge de tipo */}
            <span
              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ml-2 ${getTypeStyle(
                ev.type
              )}`}
            >
              {ev.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
