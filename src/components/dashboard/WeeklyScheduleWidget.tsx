'use client';

import { useState, useMemo } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { ScheduleBlock, Subject, DayOfWeek, FixedRoutine } from '@/types';
import { useUIStore } from '@/stores/uiStore';
import { calculateFreeSlots } from '@/lib/academic-engine/schedule/calculateFreeSlots';
import { formatMinutesHuman } from '@/lib/academic-engine/utils/timeHelpers';

interface WeeklyScheduleWidgetProps {
  classes: ScheduleBlock[];
  subjectsMap: Record<string, Subject>;
  routines?: FixedRoutine[];
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
  type: 'class' | 'free_slot' | 'routine';
  title: string;
  subtitle?: string;
  day: DayOfWeek;
  startHourFraction: number; // e.g. 1.0 for 8:00
  durationHours: number;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  subText?: string;
  durationLabel?: string;
  rawClass?: ScheduleBlock;
  rawRoutine?: FixedRoutine;
  durationMinutes?: number;
}

export function WeeklyScheduleWidget({
  classes = [],
  subjectsMap = {},
  routines = [],
}: WeeklyScheduleWidgetProps) {
  const { startFocusSession, openEditClass, openRoutineModal } = useUIStore();
  const [viewMode, setViewMode] = useState<'Semana' | 'Día'>('Semana');
  const [activeDay, setActiveDay] = useState<number>(2); // Martes 9

  // Helper para convertir "08:00" a fracción numérica relativa a 7:00 (base 0)
  const timeToGridOffset = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    const hour24 = h < 7 ? h + 12 : h;
    return Math.max(0, hour24 + (m || 0) / 60 - 7);
  };

  // Convertir duration en horas
  const getDurationHours = (start: string, end: string) => {
    if (!start || !end) return 1.5;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const mTotal1 = (h1 < 7 ? h1 + 12 : h1) * 60 + (m1 || 0);
    const mTotal2 = (h2 < 7 ? h2 + 12 : h2) * 60 + (m2 || 0);
    return Math.max(0.6, (mTotal2 - mTotal1) / 60);
  };

  // Bloques reales de clase, rutinas y huecos libres
  const displayBlocks: DisplayBlock[] = useMemo(() => {
    const result: DisplayBlock[] = [];

    // 1. Mapear clases de la base de datos
    classes.forEach((c) => {
      const sub = subjectsMap[c.subjectId];
      const startOffset = timeToGridOffset(c.startTime);
      const duration = getDurationHours(c.startTime, c.endTime);

      const color = sub?.color || '#3b3abf';

      result.push({
        id: `class-${c.id}`,
        type: 'class',
        title: sub?.name || 'Clase',
        subtitle: `${c.location || 'Campus'} · ${sub?.code || ''}`,
        day: c.dayOfWeek,
        startHourFraction: startOffset,
        durationHours: duration,
        colorBg: `${color}18`,
        colorBorder: color,
        colorText: color,
        rawClass: c,
      });
    });

    // 2. Mapear rutinas / tiempos fijos (almuerzo, gym, etc.)
    routines.forEach((r) => {
      const startOffset = timeToGridOffset(r.startTime);
      const duration = getDurationHours(r.startTime, r.endTime);
      const daysList: DayOfWeek[] = r.dayOfWeek ? [r.dayOfWeek] : [];
      const rTitle = r.title || 'Tiempo Fijo';

      daysList.forEach((dayNum) => {
        result.push({
          id: `routine-${r.id}-${dayNum}`,
          type: 'routine',
          title: rTitle,
          subtitle: r.type ? `Tiempo fijo · ${r.type}` : 'Tiempo fijo',
          day: dayNum as DayOfWeek,
          startHourFraction: startOffset,
          durationHours: duration,
          colorBg: 'rgba(245, 158, 11, 0.12)',
          colorBorder: '#f59e0b',
          colorText: '#b45309',
          rawRoutine: r,
        });
      });
    });

    // 3. Calcular huecos libres reales por cada día
    WEEK_DAYS.forEach((d) => {
      try {
        const freeSlots = calculateFreeSlots({
          dayOfWeek: d.dayNum,
          classes,
          routines,
          dayStart: '07:00',
          dayEnd: '21:00',
        });

        freeSlots
          .filter((s) => s.category === 'USABLE' && s.durationMinutes >= 45)
          .forEach((slot, idx) => {
            result.push({
              id: `free-${d.dayNum}-${idx}`,
              type: 'free_slot',
              title: 'HUECO LIBRE',
              durationLabel: formatMinutesHuman(slot.durationMinutes),
              durationMinutes: slot.durationMinutes,
              day: d.dayNum,
              startHourFraction: timeToGridOffset(slot.startTime),
              durationHours: Math.max(0.6, slot.durationMinutes / 60),
              colorBg: '#ecfdf5',
              colorBorder: '#a7f3d0',
              colorText: '#065f46',
            });
          });
      } catch {
        // Fallback en caso de cálculo
      }
    });

    return result;
  }, [classes, subjectsMap, routines]);

  const totalGridHours = 14; // 7:00 a 21:00

  const uniqueSubjectsCount = useMemo(() => {
    return new Set(classes.map((c) => c.subjectId)).size;
  }, [classes]);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] p-5 shadow-xs transition-colors">
      {/* Cabecera del Widget con Título y Controles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[#f0f3fa] dark:border-[#181d42]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#3b43a8] dark:text-[#8e98ec]" />
          <h3 className="text-sm font-bold text-[#0f1330] dark:text-white tracking-tight">
            Horario semanal
          </h3>
          <span className="text-[10px] font-mono font-bold text-[#626c96] dark:text-[#8b95c2] ml-1 bg-[#f0f3fa] dark:bg-[#141838] px-2 py-0.5 rounded-full border border-[#e2e6f2] dark:border-[#1e2552]">
            {uniqueSubjectsCount} {uniqueSubjectsCount === 1 ? 'materia' : 'materias'} · {classes.length} {classes.length === 1 ? 'bloque' : 'bloques'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón rápido para añadir clase */}
          <button
            onClick={() => openEditClass()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Añadir clase al horario"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Clase</span>
          </button>

          {/* Toggle Semana / Día */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#f0f3fa] dark:bg-[#141838] text-xs font-medium">
            <button
              onClick={() => setViewMode('Semana')}
              className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'Semana'
                  ? 'bg-white dark:bg-[#202758] text-[#0c102a] dark:text-white font-bold shadow-2xs'
                  : 'text-[#626c96] hover:text-[#0c102a] dark:hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('Día')}
              className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'Día'
                  ? 'bg-white dark:bg-[#202758] text-[#0c102a] dark:text-white font-bold shadow-2xs'
                  : 'text-[#626c96] hover:text-[#0c102a] dark:hover:text-white'
              }`}
            >
              Día
            </button>
          </div>
        </div>
      </div>

      {/* Grid del horario con scroll horizontal */}
      <div className="overflow-x-auto mt-3">
        <div className="min-w-[580px]">
          {/* Fila de Días */}
          <div className="grid grid-cols-[56px_repeat(6,1fr)] border-b border-[#f0f3fa] dark:border-[#181d42] pb-2 text-center text-xs">
            <div className="text-[10px] font-mono text-[#8b95c2]"></div>
            {WEEK_DAYS.map((d) => {
              const isToday = d.dayNum === activeDay;
              return (
                <div key={d.dayNum} className="flex justify-center px-1">
                  <button
                    onClick={() => setActiveDay(d.dayNum)}
                    className={`py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isToday
                        ? 'bg-[#0c102a] dark:bg-[#252ab8] text-white shadow-xs'
                        : 'text-[#505a88] dark:text-[#a0a8d6] hover:bg-[#f0f3fa] dark:hover:bg-[#141838]'
                    }`}
                  >
                    <span>{d.name} </span>
                    <span className="font-mono">{d.dayOfMonth}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cuerpo del Timetable con las horas y los bloques */}
          <div className="relative grid grid-cols-[56px_repeat(6,1fr)] h-[460px] bg-white dark:bg-[#0f1330] mt-1">
            {/* Eje de Horas en el borde izquierdo */}
            <div className="flex flex-col justify-between py-1 text-[10px] font-mono text-[#8b95c2] border-r border-[#f0f3fa] dark:border-[#181d42] select-none pr-2 text-right">
              {HOURS.map((h, i) => (
                <span key={i} className="leading-none whitespace-nowrap">
                  {h}
                </span>
              ))}
            </div>

            {/* Columnas para cada día */}
            {WEEK_DAYS.map((d) => {
              if (viewMode === 'Día' && d.dayNum !== activeDay) {
                return null;
              }

              const dayBlocks = displayBlocks.filter((b) => b.day === d.dayNum);

              // Resolver solapamientos entre bloques de rutina en este día
              const routineBlocks = dayBlocks.filter((b) => b.type === 'routine');
              const routineLayout = new Map<string, { colIndex: number; totalCols: number }>();
              const clusters: (typeof routineBlocks)[] = [];

              routineBlocks.forEach((r) => {
                const rStart = r.startHourFraction;
                const rEnd = r.startHourFraction + r.durationHours;
                const cluster = clusters.find((c) =>
                  c.some((item) => {
                    const itemStart = item.startHourFraction;
                    const itemEnd = item.startHourFraction + item.durationHours;
                    return rStart < itemEnd && itemStart < rEnd;
                  })
                );
                if (cluster) {
                  cluster.push(r);
                } else {
                  clusters.push([r]);
                }
              });

              clusters.forEach((cluster) => {
                const total = cluster.length;
                cluster.forEach((item, idx) => {
                  routineLayout.set(item.id, { colIndex: idx, totalCols: total });
                });
              });

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

                  {/* Renderizar bloques de clase, rutinas y huecos libres */}
                  {dayBlocks.map((block) => {
                    const topPct = (block.startHourFraction / totalGridHours) * 100;
                    const heightPct = (block.durationHours / totalGridHours) * 100;

                    if (block.type === 'free_slot') {
                      return (
                        <div
                          key={block.id}
                          onClick={() =>
                            startFocusSession(
                              'Estudio en hueco disponible',
                              'Auto-enfoque',
                              block.durationMinutes || 45
                            )
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

                    if (block.type === 'routine') {
                      const layout = routineLayout.get(block.id) || { colIndex: 0, totalCols: 1 };
                      const colWidth = 100 / layout.totalCols;
                      const left = layout.colIndex * colWidth;

                      return (
                        <div
                          key={block.id}
                          onClick={() => openRoutineModal(block.rawRoutine)}
                          className="absolute rounded-lg p-1.5 border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-2xs flex flex-col justify-start text-left overflow-hidden z-10 transition-transform hover:scale-[1.02] cursor-pointer"
                          style={{
                            top: `${topPct}%`,
                            height: `${heightPct}%`,
                            left: layout.totalCols > 1 ? `calc(${left}% + 2px)` : '4px',
                            width: layout.totalCols > 1 ? `calc(${colWidth}% - 4px)` : 'calc(100% - 8px)',
                          }}
                          title="Tiempo fijo personal (clic para gestionar)"
                        >
                          <div className="text-[10px] font-black leading-tight truncate">
                            ⏱ {block.title}
                          </div>
                          {block.subtitle && (
                            <div className="text-[9px] font-medium opacity-85 truncate mt-0.5">
                              {block.subtitle}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={block.id}
                        onClick={() => block.rawClass && openEditClass(block.rawClass)}
                        className="absolute inset-x-1 rounded-lg p-1.5 border shadow-2xs flex flex-col justify-start text-left overflow-hidden z-10 transition-transform hover:scale-[1.02] cursor-pointer hover:shadow-md group"
                        style={{
                          top: `${topPct}%`,
                          height: `${heightPct}%`,
                          backgroundColor: block.colorBg,
                          borderColor: block.colorBorder,
                          color: block.colorText,
                        }}
                        title="Clic para editar esta clase o materia"
                      >
                        <div className="text-[10px] font-black leading-tight truncate flex items-center justify-between">
                          <span className="truncate">{block.title}</span>
                          <span className="text-[8px] opacity-0 group-hover:opacity-100 font-mono transition-opacity">
                            ✎
                          </span>
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

            {/* Línea horizontal de tiempo actual dinámica */}
            <div
              className="absolute inset-x-0 border-t-2 border-rose-500 z-20 pointer-events-none flex items-center"
              style={{
                top: `${Math.min(
                  96,
                  Math.max(
                    4,
                    (((new Date().getHours() + new Date().getMinutes() / 60 - 7) / totalGridHours) *
                      100)
                  )
                )}%`,
              }}
            >
              <span className="absolute left-0 -translate-y-1/2 px-1 py-0.2 rounded bg-rose-500 text-white font-mono text-[8px] font-black shadow-2xs">
                {new Date().toLocaleTimeString('es-CO', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
