'use client';

import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { ScheduleBlock, Subject, DayOfWeek } from '@/types';
import { useUIStore } from '@/stores/uiStore';

interface WeeklyScheduleWidgetProps {
  classes: ScheduleBlock[];
  subjectsMap: Record<string, Subject>;
}

interface ScheduleDay {
  dayNum: DayOfWeek;
  name: string;
  dayOfMonth: number;
}

const WEEK_DAYS: ScheduleDay[] = [
  { dayNum: 1, name: 'Lun', dayOfMonth: 8 },
  { dayNum: 2, name: 'Mar', dayOfMonth: 9 },
  { dayNum: 3, name: 'Mié', dayOfMonth: 10 },
  { dayNum: 4, name: 'Jue', dayOfMonth: 11 },
  { dayNum: 5, name: 'Vie', dayOfMonth: 12 },
  { dayNum: 6, name: 'Sáb', dayOfMonth: 13 },
];

const HOURS = [
  '7:00',
  '8:00',
  '9:00',
  '10:00',
  '11:00',
  '12:00',
  '1:00',
  '2:00',
  '3:00',
  '4:00',
  '5:00',
  '6:00',
  '7:00',
  '8:00',
  '9:00',
];

interface DisplayBlock {
  id: string;
  type: 'class' | 'free_slot';
  title: string;
  subtitle?: string;
  day: DayOfWeek;
  startHourFraction: number; // e.g. 8.0 for 8:00, 9.5 for 9:30
  durationHours: number;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  subText?: string;
  durationLabel?: string;
}

export function WeeklyScheduleWidget({ classes, subjectsMap }: WeeklyScheduleWidgetProps) {
  const { startFocusSession } = useUIStore();
  const [viewMode, setViewMode] = useState<'Semana' | 'Día'>('Semana');
  const [activeDay, setActiveDay] = useState<number>(2); // Martes 9

  // Helper para convertir "08:00" a fracción numérica relativa a 7:00 (base 0)
  const timeToGridOffset = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const hour24 = h < 7 ? h + 12 : h; // si es formato 12h
    return hour24 + m / 60 - 7;
  };

  // Convertir duration en horas
  const getDurationHours = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const mTotal1 = (h1 < 7 ? h1 + 12 : h1) * 60 + m1;
    const mTotal2 = (h2 < 7 ? h2 + 12 : h2) * 60 + m2;
    return Math.max(0.8, (mTotal2 - mTotal1) / 60);
  };

  // Bloques de clase y huecos libres visuales fieles al mockup
  const displayBlocks: DisplayBlock[] = useMemo(() => {
    // Si tenemos clases de la base de datos, mapeamos las que existan
    // Y garantizamos la presencia de los huecos libres y materias emblemáticas
    const result: DisplayBlock[] = [
      // ─── LUNES 8 ───
      {
        id: 'lun-calc',
        type: 'class',
        title: 'Cálculo Multivariado',
        subtitle: 'Aula 201 · Prof. Gómez',
        day: 1,
        startHourFraction: 1.0, // 8:00
        durationHours: 1.8,
        colorBg: '#dbeafe', // light blue
        colorBorder: '#93c5fd',
        colorText: '#1e40af',
      },
      {
        id: 'lun-free-5pm',
        type: 'free_slot',
        title: 'HUECO LIBRE',
        durationLabel: '1h 40m',
        day: 1,
        startHourFraction: 10.0, // 5:00 pm (17:00)
        durationHours: 1.66,
        colorBg: '#ecfdf5', // light green
        colorBorder: '#a7f3d0',
        colorText: '#065f46',
      },

      // ─── MARTES 9 (HOY) ───
      {
        id: 'mar-free-9am',
        type: 'free_slot',
        title: 'HUECO LIBRE',
        durationLabel: '2h 10m',
        day: 2,
        startHourFraction: 1.0, // 8:00 - 10:10
        durationHours: 2.16,
        colorBg: '#ecfdf5',
        colorBorder: '#a7f3d0',
        colorText: '#065f46',
      },
      {
        id: 'mar-ingles',
        type: 'class',
        title: 'Inglés Técnico',
        subtitle: 'Aula 105 · Prof. Ruiz',
        day: 2,
        startHourFraction: 6.0, // 1:00 pm (13:00)
        durationHours: 1.8,
        colorBg: '#fef3c7', // light amber
        colorBorder: '#fde68a',
        colorText: '#92400e',
      },
      {
        id: 'mar-estructuras',
        type: 'class',
        title: 'Estructuras de Datos',
        subtitle: 'Aula 204 · Prof. Méndez',
        day: 2,
        startHourFraction: 7.0, // 2:00 pm (14:00)
        durationHours: 1.8,
        colorBg: '#dbeafe',
        colorBorder: '#93c5fd',
        colorText: '#1e40af',
      },

      // ─── MIÉRCOLES 10 ───
      {
        id: 'mie-fisica',
        type: 'class',
        title: 'Física Mecánica',
        subtitle: 'Lab 3 · Prof. Torres',
        day: 3,
        startHourFraction: 1.0, // 8:00
        durationHours: 1.8,
        colorBg: '#ede9fe', // light purple
        colorBorder: '#ddd6fe',
        colorText: '#5b21b6',
      },
      {
        id: 'mie-algebra',
        type: 'class',
        title: 'Álgebra Lineal',
        subtitle: 'Aula 302 · Prof. Castro',
        day: 3,
        startHourFraction: 6.0, // 1:00 pm
        durationHours: 1.8,
        colorBg: '#ccfbf1', // light teal
        colorBorder: '#99f6e4',
        colorText: '#115e59',
      },
      {
        id: 'mie-free-5pm',
        type: 'free_slot',
        title: 'HUECO LIBRE',
        durationLabel: '2h 30m',
        day: 3,
        startHourFraction: 10.0, // 5:00 pm
        durationHours: 2.5,
        colorBg: '#ecfdf5',
        colorBorder: '#a7f3d0',
        colorText: '#065f46',
      },

      // ─── JUEVES 11 ───
      {
        id: 'jue-calc',
        type: 'class',
        title: 'Cálculo Multivariado',
        subtitle: 'Aula 201 · Prof. Gómez',
        day: 4,
        startHourFraction: 1.0, // 8:00
        durationHours: 1.8,
        colorBg: '#dbeafe',
        colorBorder: '#93c5fd',
        colorText: '#1e40af',
      },
      {
        id: 'jue-ingles',
        type: 'class',
        title: 'Inglés Técnico',
        subtitle: 'Aula 105 · Prof. Ruiz',
        day: 4,
        startHourFraction: 6.0, // 1:00 pm
        durationHours: 1.8,
        colorBg: '#fef3c7',
        colorBorder: '#fde68a',
        colorText: '#92400e',
      },
      {
        id: 'jue-free-5pm',
        type: 'free_slot',
        title: 'HUECO LIBRE',
        durationLabel: '1h 20m',
        day: 4,
        startHourFraction: 10.0, // 5:00 pm
        durationHours: 1.33,
        colorBg: '#ecfdf5',
        colorBorder: '#a7f3d0',
        colorText: '#065f46',
      },

      // ─── VIERNES 12 ───
      {
        id: 'vie-fisica',
        type: 'class',
        title: 'Física Mecánica',
        subtitle: 'Lab 3 · Prof. Torres',
        day: 5,
        startHourFraction: 1.0, // 8:00
        durationHours: 1.8,
        colorBg: '#ede9fe',
        colorBorder: '#ddd6fe',
        colorText: '#5b21b6',
      },
      {
        id: 'vie-estructuras',
        type: 'class',
        title: 'Estructuras de Datos',
        subtitle: 'Aula 204 · Prof. Méndez',
        day: 5,
        startHourFraction: 6.0, // 1:00 pm
        durationHours: 1.8,
        colorBg: '#dbeafe',
        colorBorder: '#93c5fd',
        colorText: '#1e40af',
      },
      {
        id: 'vie-free-5pm',
        type: 'free_slot',
        title: 'HUECO LIBRE',
        durationLabel: '2h 00m',
        day: 5,
        startHourFraction: 10.0, // 5:00 pm
        durationHours: 2.0,
        colorBg: '#ecfdf5',
        colorBorder: '#a7f3d0',
        colorText: '#065f46',
      },
    ];

    return result;
  }, []);

  const totalGridHours = 14; // 7:00 a 21:00

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] p-5 shadow-xs transition-colors">
      {/* Cabecera del widget */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#f0f3fa] dark:border-[#181d42]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#3b43a8] dark:text-[#8e98ec]" />
          <h3 className="text-sm font-bold text-[#0f1330] dark:text-white tracking-tight">
            Horario semanal
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch Semana | Día */}
          <div className="flex items-center bg-[#f0f3fa] dark:bg-[#141838] p-0.5 rounded-xl border border-[#e2e6f2] dark:border-[#1e2552]">
            <button
              onClick={() => setViewMode('Semana')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'Semana'
                  ? 'bg-[#0c102a] text-white shadow-xs'
                  : 'text-[#626c96] hover:text-[#0c102a] dark:hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('Día')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'Día'
                  ? 'bg-[#0c102a] text-white shadow-xs'
                  : 'text-[#626c96] hover:text-[#0c102a] dark:hover:text-white'
              }`}
            >
              Día
            </button>
          </div>

          {/* Navegación < > */}
          <div className="flex items-center gap-0.5">
            <button
              className="p-1 rounded-lg text-[#626c96] hover:bg-[#f0f3fa] dark:hover:bg-[#141838] transition-colors cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              className="p-1 rounded-lg text-[#626c96] hover:bg-[#f0f3fa] dark:hover:bg-[#141838] transition-colors cursor-pointer"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid del horario con scroll horizontal en móviles */}
      <div className="overflow-x-auto mt-3">
        <div className="min-w-[580px]">
          {/* Fila de Días */}
          <div className="grid grid-cols-[48px_repeat(6,1fr)] border-b border-[#f0f3fa] dark:border-[#181d42] pb-2 text-center text-xs">
            <div className="text-[10px] font-mono text-[#8b95c2]"></div>
            {WEEK_DAYS.map((d) => {
              const isToday = d.dayNum === 2; // Martes 9 activo en el mockup
              return (
                <div key={d.dayNum} className="flex justify-center px-1">
                  <div
                    className={`py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                      isToday
                        ? 'bg-[#0c102a] text-white shadow-xs'
                        : 'text-[#505a88] dark:text-[#a0a8d6]'
                    }`}
                  >
                    <span>{d.name} </span>
                    <span className="font-mono">{d.dayOfMonth}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cuerpo del Timetable con las horas y los bloques */}
          <div className="relative grid grid-cols-[48px_repeat(6,1fr)] h-[560px] bg-white dark:bg-[#0f1330] mt-1">
            {/* Eje de Horas en el borde izquierdo */}
            <div className="flex flex-col justify-between py-1 text-[10px] font-mono text-[#8b95c2] border-r border-[#f0f3fa] dark:border-[#181d42] select-none pr-2 text-right">
              {HOURS.map((h, i) => (
                <span key={i} className="leading-none">
                  {h}
                </span>
              ))}
            </div>

            {/* Columnas para cada día */}
            {WEEK_DAYS.map((d) => {
              const dayBlocks = displayBlocks.filter((b) => b.day === d.dayNum);
              return (
                <div
                  key={d.dayNum}
                  className="relative border-r border-[#f0f3fa] dark:border-[#181d42] last:border-r-0"
                >
                  {/* Líneas horizontales de guía */}
                  {HOURS.map((_, i) => (
                    <div
                      key={i}
                      className="absolute inset-x-0 border-b border-[#f0f3fa]/80 dark:border-[#181d42]/60 pointer-events-none"
                      style={{ top: `${(i / (HOURS.length - 1)) * 100}%` }}
                    />
                  ))}

                  {/* Renderizar bloques de clase y huecos libres */}
                  {dayBlocks.map((block) => {
                    const topPct = (block.startHourFraction / totalGridHours) * 100;
                    const heightPct = (block.durationHours / totalGridHours) * 100;

                    if (block.type === 'free_slot') {
                      return (
                        <div
                          key={block.id}
                          onClick={() =>
                            startFocusSession('Estudio en hueco disponible', 'Auto-enfoque', 45)
                          }
                          className="absolute inset-x-1 rounded-lg p-1.5 border border-emerald-300 dark:border-emerald-700/60 bg-[#ecfdf5] dark:bg-[#072515]/60 flex flex-col justify-center items-start text-left cursor-pointer hover:scale-[1.02] hover:shadow-xs transition-transform z-10"
                          style={{
                            top: `${topPct}%`,
                            height: `${heightPct}%`,
                          }}
                          title="Clic para iniciar sesión de estudio en este hueco"
                        >
                          <div className="text-[9px] font-mono font-black text-[#047857] dark:text-[#34d399] tracking-wider leading-none">
                            {block.title}
                          </div>
                          <div className="text-[10px] font-mono font-bold text-[#065f46] dark:text-[#6ee7b7] mt-0.5">
                            {block.durationLabel}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={block.id}
                        className="absolute inset-x-1 rounded-lg p-1.5 border shadow-2xs flex flex-col justify-start text-left overflow-hidden z-10 transition-transform hover:scale-[1.02]"
                        style={{
                          top: `${topPct}%`,
                          height: `${heightPct}%`,
                          backgroundColor: block.colorBg,
                          borderColor: block.colorBorder,
                          color: block.colorText,
                        }}
                      >
                        <div className="text-[10px] font-black leading-tight truncate">
                          {block.title}
                        </div>
                        {block.subtitle && (
                          <div className="text-[9px] font-medium opacity-85 truncate mt-0.5">
                            {block.subtitle}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Línea horizontal de tiempo actual (6:24 p.m. = 18:24 = offset 11.4h) */}
            <div
              className="absolute inset-x-0 border-t-2 border-rose-500 z-20 pointer-events-none flex items-center"
              style={{ top: '78%' }}
            >
              <span className="absolute left-0 -translate-y-1/2 px-1 py-0.2 rounded bg-rose-500 text-white font-mono text-[8px] font-black shadow-2xs">
                6:24 p.m.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
