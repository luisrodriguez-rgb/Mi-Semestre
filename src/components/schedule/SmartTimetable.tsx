'use client';

import { useMemo, useState } from 'react';
import { Subject, ScheduleBlock, FixedRoutine, DayOfWeek } from '@/types';
import { calculateFreeSlots, detectConflicts, formatMinutesHuman } from '@/lib/academic-engine';
import { useUIStore } from '@/stores/uiStore';
import { AlertCircle, MapPin, Sparkles, Filter, Plus } from 'lucide-react';

interface SmartTimetableProps {
  classes: ScheduleBlock[];
  subjectsMap: Record<string, Subject>;
  routines: FixedRoutine[];
}

export function SmartTimetable({
  classes,
  subjectsMap,
  routines,
}: SmartTimetableProps) {
  const { startFocusSession, openImporter } = useUIStore();
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [showSaturday, setShowSaturday] = useState<boolean>(false);

  const days: { day: DayOfWeek; name: string }[] = useMemo(() => {
    const list: { day: DayOfWeek; name: string }[] = [
      { day: 1, name: 'Lunes' },
      { day: 2, name: 'Martes' },
      { day: 3, name: 'Miércoles' },
      { day: 4, name: 'Jueves' },
      { day: 5, name: 'Viernes' },
    ];
    if (showSaturday) {
      list.push({ day: 6, name: 'Sábado' });
    }
    return list;
  }, [showSaturday]);

  // Detectar conflictos
  const conflicts = useMemo(() => {
    return detectConflicts({ classes, subjectsMap, routines });
  }, [classes, subjectsMap, routines]);

  // Horas del día a mostrar: 07:00 a 20:00
  const hours = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  ];

  // Calcular huecos libres por día
  const dailyFreeSlots = useMemo(() => {
    const map: Record<DayOfWeek, ReturnType<typeof calculateFreeSlots>> = {
      1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
    };
    days.forEach(({ day }) => {
      map[day] = calculateFreeSlots({
        dayOfWeek: day,
        classes,
        routines,
        dayStart: '07:00',
        dayEnd: '20:00',
      });
    });
    return map;
  }, [days, classes, routines]);

  const baseMinutes = 7 * 60; // 420 min
  const totalMinutes = 13 * 60; // 780 min

  const getTopAndHeight = (startTime: string, endTime: string) => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startM = sh * 60 + sm;
    const endM = eh * 60 + em;

    const topPercent = ((startM - baseMinutes) / totalMinutes) * 100;
    const heightPercent = ((endM - startM) / totalMinutes) * 100;

    return {
      top: `${Math.max(0, topPercent)}%`,
      height: `${Math.max(2, heightPercent)}%`,
    };
  };

  const handleStudyInGap = (gapDuration: number) => {
    startFocusSession('Aprovechar hueco para repasar', 'Autoestudio', gapDuration);
  };

  return (
    <div className="space-y-4">
      {/* Alerta de Conflictos si existen */}
      {conflicts.length > 0 && (
        <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 text-[#dc2626] text-xs flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-[#dc2626] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider block font-mono">
              ¡Conflicto de Horario Detectado!
            </span>
            {conflicts.map((c) => (
              <p key={c.id} className="mt-1 text-[#7a7890]">
                {c.description}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Controles de Filtros y Configuración */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#e0dff0] shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#3b3abf]" />
          <span className="text-xs text-[#7a7890] font-medium">Filtrar por Materia:</span>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="bg-[#f5f5ff] border border-[#e0dff0] text-[#0d0d14] rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#3b3abf]"
          >
            <option value="all">Todas las materias</option>
            {Object.values(subjectsMap).map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} ({sub.code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-2 text-[#0d0d14] font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={showSaturday}
              onChange={(e) => setShowSaturday(e.target.checked)}
              className="rounded bg-[#f5f5ff] border-[#e0dff0] text-[#3b3abf] focus:ring-0"
            />
            <span>Incluir Sábado</span>
          </label>

          <button
            onClick={openImporter}
            className="flex items-center gap-1.5 text-[#3b3abf] hover:text-[#1e1e8a] font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Editar o Reimportar</span>
          </button>
        </div>
      </div>

      {/* Cuadrícula del Horario Semanal */}
      <div className="card-cambas overflow-hidden bg-white">
        {/* Cabecera de Días estilo CAMBAS+ */}
        <div
          className="grid border-b border-[#e0dff0] bg-[#f5f5ff] text-center text-xs font-bold text-[#0d0d14]"
          style={{ gridTemplateColumns: `65px repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div className="p-3.5 text-[#7a7890] font-mono border-r border-[#e0dff0]">Hora</div>
          {days.map(({ day, name }) => (
            <div
              key={day}
              className="p-3.5 text-[#0d0d14] border-r border-[#e0dff0] last:border-r-0 font-mono font-bold"
            >
              <span>{name}</span>
            </div>
          ))}
        </div>

        {/* Cuerpo del Horario: Columnas y Líneas horarias */}
        <div
          className="relative grid bg-white"
          style={{ gridTemplateColumns: `65px repeat(${days.length}, minmax(0, 1fr))`, height: '760px' }}
        >
          {/* Columna lateral de Horas */}
          <div className="relative border-r border-[#e0dff0] text-[11px] font-mono text-[#7a7890] select-none bg-[#fafaff]">
            {hours.map((h, i) => (
              <div
                key={h}
                className="absolute w-full text-right pr-2.5 -translate-y-2 font-medium"
                style={{ top: `${(i / (hours.length - 1)) * 100}%` }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Columnas por Día */}
          {days.map(({ day }) => {
            const dayClasses = classes.filter((c) => {
              if (c.dayOfWeek !== day) return false;
              if (selectedSubjectFilter !== 'all' && c.subjectId !== selectedSubjectFilter) return false;
              return true;
            });

            const daySlots = dailyFreeSlots[day] || [];
            const usableGaps = daySlots.filter((s) => s.category === 'USABLE');

            return (
              <div key={day} className="relative border-r border-[#e0dff0] last:border-r-0 bg-white">
                {/* Líneas horizontales de guía */}
                {hours.map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-b border-[#f0f0ff]"
                    style={{ top: `${(i / (hours.length - 1)) * 100}%` }}
                  />
                ))}

                {/* Renderizar HUECOS LIBRES UTILIZABLES (>30 min) */}
                {usableGaps.map((slot, idx) => {
                  const { top, height } = getTopAndHeight(slot.startTime, slot.endTime);
                  return (
                    <div
                      key={`gap-${idx}`}
                      className="absolute inset-x-1.5 rounded-xl border border-dashed border-[#86efac] bg-[#f0fdf4] p-2 flex flex-col justify-between overflow-hidden group transition-all hover:bg-[#dcfce7]/60"
                      style={{ top, height }}
                    >
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#16a34a]">
                          <Sparkles className="w-3 h-3" />
                          <span>HUECO: {formatMinutesHuman(slot.durationMinutes)}</span>
                        </div>
                        <div className="text-[10px] text-[#7a7890] font-mono">
                          {slot.startTime} – {slot.endTime}
                        </div>
                      </div>

                      <button
                        onClick={() => handleStudyInGap(Math.min(60, slot.durationMinutes))}
                        className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1 px-2 py-0.5 rounded bg-white text-[#16a34a] border border-[#86efac] text-[9px] font-bold hover:bg-[#f0fdf4] shadow-xs"
                      >
                        Estudiar aquí
                      </button>
                    </div>
                  );
                })}

                {/* Renderizar BLOQUES DE CLASE */}
                {dayClasses.map((c) => {
                  const subject = subjectsMap[c.subjectId];
                  const { top, height } = getTopAndHeight(c.startTime, c.endTime);

                  return (
                    <div
                      key={c.id}
                      className="absolute inset-x-1.5 rounded-xl p-2.5 shadow-sm border flex flex-col justify-between overflow-hidden transition-all duration-150 hover:z-20 hover:scale-[1.02] hover:shadow-md"
                      style={{
                        top,
                        height,
                        backgroundColor: '#f5f5ff',
                        borderColor: '#c5c5ff',
                        borderLeftWidth: '4px',
                        borderLeftColor: subject?.color || '#3b3abf',
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-[#3b3abf] uppercase tracking-wide">
                            {subject?.code || 'CLASE'}
                          </span>
                          <span className="font-mono text-[10px] text-[#7a7890] font-semibold">
                            {c.startTime}
                          </span>
                        </div>

                        <div className="font-black text-xs text-[#0d0d14] mt-1 leading-tight truncate">
                          {subject?.name || 'Materia'}
                        </div>
                      </div>

                      <div className="space-y-0.5 text-[10px] text-[#7a7890] font-mono mt-1">
                        {c.location && (
                          <div className="flex items-center gap-1 truncate text-[#3e3d52] font-medium">
                            <MapPin className="w-3 h-3 text-[#7b7bff] shrink-0" />
                            <span className="truncate">{c.location}</span>
                          </div>
                        )}
                        <div className="text-[#7a7890] text-[9px]">
                          {c.startTime} – {c.endTime}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
