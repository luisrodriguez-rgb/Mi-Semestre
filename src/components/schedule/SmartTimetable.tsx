'use client';

import { useState, useMemo } from 'react';
import { ScheduleBlock, Subject, DayOfWeek, FixedRoutine } from '@/types';
import { calculateFreeSlots } from '@/lib/academic-engine/schedule/calculateFreeSlots';
import { detectConflicts } from '@/lib/academic-engine/schedule/detectConflicts';
import { formatMinutesHuman, timeToMinutes } from '@/lib/academic-engine/utils/timeHelpers';
import { useUIStore } from '@/stores/uiStore';
import {
  Clock,
  Sparkles,
  MapPin,
  AlertCircle,
  Filter,
  Plus,
  Pencil,
  UserCheck,
} from 'lucide-react';

interface SmartTimetableProps {
  classes: ScheduleBlock[];
  subjectsMap: Record<string, Subject>;
  routines?: FixedRoutine[];
  onSlotClick?: (startTime: string, endTime: string, day: DayOfWeek) => void;
}

export function SmartTimetable({
  classes,
  subjectsMap,
  routines = [],
}: SmartTimetableProps) {
  const {
    startFocusSession,
    openEditClass,
    openAttendanceModal,
    openRoutineModal,
  } = useUIStore();

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [showSaturday, setShowSaturday] = useState<boolean>(false);
  const [mobileDay, setMobileDay] = useState<DayOfWeek>(1);
  const [mobileViewMode, setMobileViewMode] = useState<'single' | 'full'>('full');

  // Detectar conflictos automáticamente
  const conflicts = useMemo(() => {
    return detectConflicts({ classes, subjectsMap });
  }, [classes, subjectsMap]);

  // Horas del día (07:00 a 21:00)
  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 to 21

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

  // Filtrar clases si hay filtro activo
  const filteredClasses = useMemo(() => {
    if (selectedSubjectFilter === 'all') return classes;
    return classes.filter((c) => c.subjectId === selectedSubjectFilter);
  }, [classes, selectedSubjectFilter]);

  // Helper para posicionar bloques en el grid relativo a 07:00 - 21:00
  const getTopAndHeight = (startTime: string, endTime: string) => {
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    const dayStartMins = 7 * 60; // 07:00
    const dayTotalMins = 14 * 60; // 14 hours

    const top = `${Math.max(0, ((startMins - dayStartMins) / dayTotalMins) * 100)}%`;
    const height = `${Math.max(3, ((endMins - startMins) / dayTotalMins) * 100)}%`;
    return { top, height };
  };

  const handleStudyInGap = (minutes: number) => {
    startFocusSession('Estudio en hueco de horario', 'Auto-enfoque', minutes);
  };

  return (
    <div className="space-y-4">
      {/* Alerta si hay conflictos */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#fee2e2] dark:bg-[#390909]/40 border border-[#fecaca] dark:border-[#7f1d1d] flex items-start gap-3 text-xs text-[#dc2626] dark:text-[#f87171]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">
              Conflicto de Horario Detectado ({conflicts.length}):
            </span>
            {conflicts.map((c) => (
              <p key={c.id} className="mt-1 text-[var(--ink-secondary)]">
                {c.description}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Controles de Filtros y Configuración */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface)] p-3.5 rounded-2xl border border-[var(--border)] shadow-sm transition-colors">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-[#3b3abf] dark:text-[#a0a0ff]" />
          <span className="text-xs text-[var(--muted)] font-medium">Filtrar:</span>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="bg-[var(--paper)] border border-[var(--border)] text-[var(--ink)] rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#3b3abf]"
          >
            <option value="all">Todas las materias ({Object.keys(subjectsMap).length})</option>
            {Object.values(subjectsMap).map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} ({sub.code})
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-[var(--ink)] text-xs font-medium cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={showSaturday}
              onChange={(e) => setShowSaturday(e.target.checked)}
              className="rounded bg-[var(--paper)] border-[var(--border)] text-[#3b3abf] focus:ring-0"
            />
            <span>Sábado</span>
          </label>
        </div>

        {/* Botones de acción directa sobre el horario */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => openEditClass()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white font-bold transition-all shadow-xs cursor-pointer"
            title="Añadir nueva clase al horario"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Clase</span>
          </button>

          <button
            onClick={openRoutineModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--paper)] hover:bg-[var(--surface-raised)] text-[var(--ink)] border border-[var(--border)] font-bold transition-all cursor-pointer"
            title="Añadir tiempos fijos (almuerzo, transporte, etc.)"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Tiempo Fijo</span>
          </button>

          <button
            onClick={openAttendanceModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--paper)] hover:bg-[var(--surface-raised)] text-[var(--ink)] border border-[var(--border)] font-bold transition-all cursor-pointer"
            title="Control de asistencias y faltas"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Asistencias</span>
          </button>

          {/* Mobile view switch pills */}
          <div className="flex sm:hidden items-center p-1 rounded-xl bg-[var(--paper)] border border-[var(--border)]">
            <button
              onClick={() => setMobileViewMode('single')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                mobileViewMode === 'single' ? 'bg-[#3b3abf] text-white' : 'text-[var(--muted)]'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setMobileViewMode('full')}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                mobileViewMode === 'full' ? 'bg-[#3b3abf] text-white' : 'text-[var(--muted)]'
              }`}
            >
              Semana
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Días en móviles cuando viewMode === 'single' */}
      <div className="flex sm:hidden overflow-x-auto gap-1.5 p-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
        {days.map(({ day, name }) => (
          <button
            key={day}
            onClick={() => setMobileDay(day)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
              mobileDay === day && mobileViewMode === 'single'
                ? 'bg-[#3b3abf] text-white shadow-sm'
                : 'text-[var(--muted)] hover:bg-[var(--paper)]'
            }`}
          >
            {name.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Cuadrícula del Horario Semanal */}
      <div className="card-academic overflow-hidden bg-[var(--surface)] border border-[var(--border)] transition-colors">
        <div className="overflow-x-auto">
          <div className="min-w-[650px] sm:min-w-full">
            {/* Header de Columnas de Días */}
            <div
              className="grid border-b border-[var(--border)] bg-[var(--paper)] text-center text-xs font-bold text-[var(--ink)]"
              style={{
                gridTemplateColumns: `64px repeat(${
                  mobileViewMode === 'single' ? 1 : days.length
                }, 1fr)`,
              }}
            >
              <div className="p-3.5 text-[var(--muted)] border-r border-[var(--border)] font-mono text-[11px]">
                Hora
              </div>
              {(mobileViewMode === 'single' ? days.filter((d) => d.day === mobileDay) : days).map(
                ({ day, name }) => (
                  <div
                    key={day}
                    className="p-3.5 text-[var(--ink)] border-r border-[var(--border)] last:border-r-0 font-mono font-bold"
                  >
                    {name}
                  </div>
                )
              )}
            </div>

            {/* Cuerpo del Calendario con Horas y Bloques */}
            <div
              className="relative grid bg-[var(--surface)] transition-colors"
              style={{
                gridTemplateColumns: `64px repeat(${
                  mobileViewMode === 'single' ? 1 : days.length
                }, 1fr)`,
                height: '750px',
              }}
            >
              {/* Eje de Horas (07:00 a 21:00) */}
              <div className="border-r border-[var(--border)] bg-[var(--paper)] font-mono text-[10px] text-[var(--muted)] flex flex-col justify-between py-1 select-none">
                {hours.map((h) => (
                  <div key={h} className="text-center h-full flex items-start justify-center pt-0.5">
                    {h.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Columnas por Día */}
              {(mobileViewMode === 'single' ? days.filter((d) => d.day === mobileDay) : days).map(
                ({ day }) => {
                  const dayClasses = filteredClasses.filter((c) => c.dayOfWeek === day);

                  // Calcular huecos libres de este día mediante el Motor Académico
                  const dayFreeSlots = calculateFreeSlots({
                    dayOfWeek: day,
                    classes: filteredClasses,
                    routines,
                    dayStart: '07:00',
                    dayEnd: '21:00',
                  });

                  const usableGaps = dayFreeSlots.filter(
                    (s) => s.category === 'USABLE' && s.durationMinutes >= 30
                  );

                  return (
                    <div
                      key={day}
                      className="relative border-r border-[var(--border)] last:border-r-0 bg-[var(--surface)] transition-colors"
                    >
                      {/* Líneas horizontales de fondo */}
                      {hours.map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-full border-b border-[var(--border)]/30 pointer-events-none"
                          style={{ top: `${(i / (hours.length - 1)) * 100}%` }}
                        />
                      ))}

                      {/* Renderizar HUECOS LIBRES UTILIZABLES */}
                      {usableGaps.map((slot, idx) => {
                        const { top, height } = getTopAndHeight(slot.startTime, slot.endTime);
                        return (
                          <div
                            key={`gap-${idx}`}
                            className="absolute inset-x-1.5 rounded-xl border border-dashed border-[#86efac] dark:border-[#166534] bg-[#f0fdf4] dark:bg-[#072714]/40 p-2 flex flex-col justify-between overflow-hidden group transition-all hover:bg-[#dcfce7]/60 dark:hover:bg-[#072714]/70"
                            style={{ top, height }}
                          >
                            <div>
                              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#16a34a] dark:text-[#4ade80]">
                                <Sparkles className="w-3 h-3" />
                                <span>HUECO: {formatMinutesHuman(slot.durationMinutes)}</span>
                              </div>
                              <div className="text-[10px] text-[var(--muted)] font-mono">
                                {slot.startTime} – {slot.endTime}
                              </div>
                            </div>

                            <button
                              onClick={() => handleStudyInGap(Math.min(60, slot.durationMinutes))}
                              className="opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1 px-2 py-0.5 rounded bg-[var(--surface)] text-[#16a34a] dark:text-[#4ade80] border border-[#86efac] dark:border-[#166534] text-[9px] font-bold hover:bg-[#f0fdf4] shadow-xs cursor-pointer"
                            >
                              Estudiar aquí
                            </button>
                          </div>
                        );
                      })}

                      {/* Renderizar RUTINAS / TIEMPOS FIJOS (Almuerzo, Gym, Transporte, etc.) */}
                      {routines
                        .filter((r) => r.dayOfWeek === day)
                        .map((r) => {
                          const { top, height } = getTopAndHeight(r.startTime, r.endTime);
                          return (
                            <div
                              key={`routine-${r.id}-${day}`}
                              onClick={openRoutineModal}
                              className="absolute inset-x-1.5 rounded-xl p-2 shadow-2xs border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex flex-col justify-between overflow-hidden transition-all hover:z-20 hover:scale-[1.02] cursor-pointer"
                              style={{ top, height }}
                              title="Tiempo fijo personal (clic para gestionar)"
                            >
                              <div className="font-bold text-xs leading-tight truncate">
                                ⏱ {r.title || 'Tiempo Fijo'}
                              </div>
                              <div className="text-[9px] font-mono opacity-80 truncate">
                                {r.startTime} – {r.endTime}
                              </div>
                            </div>
                          );
                        })}

                      {/* Renderizar BLOQUES DE CLASE INTERACTIVOS */}
                      {dayClasses.map((c) => {
                        const subject = subjectsMap[c.subjectId];
                        const { top, height } = getTopAndHeight(c.startTime, c.endTime);

                        return (
                          <div
                            key={c.id}
                            onClick={() => openEditClass(c)}
                            className="absolute inset-x-1.5 rounded-xl p-2.5 shadow-sm border flex flex-col justify-between overflow-hidden transition-all duration-150 hover:z-20 hover:scale-[1.02] hover:shadow-md cursor-pointer group"
                            style={{
                              top,
                              height,
                              backgroundColor: 'var(--surface)',
                              borderColor: 'var(--border)',
                              borderLeftWidth: '4px',
                              borderLeftColor: subject?.color || '#3b3abf',
                            }}
                            title="Clic para editar horario, materia o eliminar clase"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] font-bold text-[#3b3abf] dark:text-[#a0a0ff] uppercase tracking-wide">
                                  {subject?.code || 'CLASE'}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-[10px] text-[var(--muted)] font-semibold">
                                    {c.startTime}
                                  </span>
                                  <Pencil className="w-3 h-3 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>

                              <div className="font-black text-xs text-[var(--ink)] mt-1 leading-tight truncate">
                                {subject?.name || 'Materia'}
                              </div>
                            </div>

                            <div className="space-y-0.5 text-[10px] text-[var(--muted)] font-mono mt-1">
                              {c.location && (
                                <div className="flex items-center gap-1 truncate text-[var(--ink-secondary)] font-medium">
                                  <MapPin className="w-3 h-3 text-[#7b7bff] shrink-0" />
                                  <span className="truncate">{c.location}</span>
                                </div>
                              )}
                              <div className="text-[var(--muted)] text-[9px]">
                                {c.startTime} – {c.endTime}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
