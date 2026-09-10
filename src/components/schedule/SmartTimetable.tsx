'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ScheduleBlock,
  Subject,
  DayOfWeek,
  FixedRoutine,
  Assignment,
  Exam,
  AttendanceRecord,
} from '@/types';
import { calculateFreeSlots } from '@/lib/academic-engine/schedule/calculateFreeSlots';
import { detectConflicts } from '@/lib/academic-engine/schedule/detectConflicts';
import { formatMinutesHuman, timeToMinutes } from '@/lib/academic-engine/utils/timeHelpers';
import { useUIStore } from '@/stores/uiStore';
import { attendanceRepository } from '@/lib/storage';
import { SlotDecisionModal, FreeSlotDecisionData } from './SlotDecisionModal';
import { ClassDetailModal } from './ClassDetailModal';
import confetti from 'canvas-confetti';
import {
  Clock,
  Sparkles,
  MapPin,
  AlertCircle,
  Filter,
  Plus,
  UserCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coffee,
  ArrowRight,
} from 'lucide-react';

interface SmartTimetableProps {
  classes: ScheduleBlock[];
  subjectsMap: Record<string, Subject>;
  routines?: FixedRoutine[];
  assignments?: Assignment[];
  exams?: Exam[];
  attendance?: AttendanceRecord[];
  refreshData?: () => Promise<void>;
  onSlotClick?: (startTime: string, endTime: string, day: DayOfWeek) => void;
}

const DAY_MAP: Record<DayOfWeek, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

export function SmartTimetable({
  classes,
  subjectsMap,
  routines = [],
  assignments = [],
  exams = [],
  attendance = [],
  refreshData,
}: SmartTimetableProps) {
  const {
    openEditClass,
    openAttendanceModal,
    openRoutineModal,
    openCalendarModal,
  } = useUIStore();

  // Estados de vista y filtros
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'agenda'>('week');
  const [typeFilter, setTypeFilter] = useState<'all' | 'classes' | 'slots' | 'routines'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [showSaturday, setShowSaturday] = useState<boolean>(false);

  // Modal Contextual de Nivel 3 (Ficha de Clase) y Modal de Decisión de Hueco
  const [selectedSlotForDecision, setSelectedSlotForDecision] = useState<FreeSlotDecisionData | null>(null);
  const [selectedClassForDetail, setSelectedClassForDetail] = useState<{
    block: ScheduleBlock;
    subject: Subject;
  } | null>(null);

  // Hora actual en tiempo real para la línea "AHORA"
  const [nowState, setNowState] = useState<{ day: DayOfWeek; minutes: number; timeStr: string }>(() => {
    const d = new Date();
    const day = d.getDay() === 0 ? 7 : (d.getDay() as DayOfWeek);
    const minutes = d.getHours() * 60 + d.getMinutes();
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    return { day, minutes, timeStr };
  });

  // Día activo para la vista 'day' (inicia en hoy si es lun-vie, o 1)
  const [activeDay, setActiveDay] = useState<DayOfWeek>(() => {
    const d = new Date();
    const day = d.getDay() === 0 ? 7 : (d.getDay() as DayOfWeek);
    return day <= 5 ? day : 1;
  });

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const day = d.getDay() === 0 ? 7 : (d.getDay() as DayOfWeek);
      const minutes = d.getHours() * 60 + d.getMinutes();
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      setNowState({ day, minutes, timeStr });
    };
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  // Conflictos de horario
  const conflicts = useMemo(() => {
    return detectConflicts({ classes, subjectsMap });
  }, [classes, subjectsMap]);

  // Rango de horas (07:00 a 21:00)
  const hours = useMemo(() => Array.from({ length: 15 }, (_, i) => i + 7), []);

  const days: { day: DayOfWeek; name: string; short: string }[] = useMemo(() => {
    const list: { day: DayOfWeek; name: string; short: string }[] = [
      { day: 1, name: 'Lunes', short: 'Lun' },
      { day: 2, name: 'Martes', short: 'Mar' },
      { day: 3, name: 'Miércoles', short: 'Mié' },
      { day: 4, name: 'Jueves', short: 'Jue' },
      { day: 5, name: 'Viernes', short: 'Vie' },
    ];
    if (showSaturday) {
      list.push({ day: 6, name: 'Sábado', short: 'Sáb' });
    }
    return list;
  }, [showSaturday]);

  // Filtrar clases según materia
  const filteredClasses = useMemo(() => {
    if (selectedSubjectFilter === 'all') return classes;
    return classes.filter((c) => c.subjectId === selectedSubjectFilter);
  }, [classes, selectedSubjectFilter]);

  // Helper para posicionar bloques en el grid relativo a 07:00 - 21:00 (840 minutos en total)
  const getTopAndHeight = (startTime: string, endTime: string) => {
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    const dayStartMins = 7 * 60; // 07:00
    const dayTotalMins = 14 * 60; // 14 horas = 840 mins

    const top = `${Math.max(0, ((startMins - dayStartMins) / dayTotalMins) * 100)}%`;
    const height = `${Math.max(2.8, ((endMins - startMins) / dayTotalMins) * 100)}%`;
    const durationMinutes = endMins - startMins;
    return { top, height, durationMinutes };
  };

  // Posición de la línea "AHORA"
  const isNowWithinSchedule = nowState.minutes >= 420 && nowState.minutes <= 1260;
  const nowTopPercent = Math.max(0, Math.min(100, ((nowState.minutes - 420) / 840) * 100));

  // Manejo de asistencias en ClassDetailModal
  const handleAddAbsence = async (subjectId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subjectId,
      date: todayStr,
      status: 'absent',
    };
    await attendanceRepository.save(newRecord);
    if (refreshData) await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
  };

  const handleAddPresent = async (subjectId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subjectId,
      date: todayStr,
      status: 'present',
    };
    await attendanceRepository.save(newRecord);
    if (refreshData) await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
    confetti({
      particleCount: 35,
      spread: 45,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#6ee7b7'],
    });
  };

  const handleRemoveAbsence = async (subjectId: string) => {
    const subjectAbsences = attendance.filter(
      (a) => a.subjectId === subjectId && a.status === 'absent'
    );
    if (subjectAbsences.length === 0) return;
    const last = subjectAbsences[subjectAbsences.length - 1];
    await attendanceRepository.delete(last.id);
    if (refreshData) await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
  };

  return (
    <div className="space-y-4">
      {/* Alerta de Conflictos */}
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

      {/* Barra de Control y Acciones UX */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface)] p-3 rounded-2xl border border-[var(--border)] shadow-xs transition-colors">
        {/* Lado Izquierdo: Selector de Vistas y Botón 'Hoy' */}
        <div className="flex items-center gap-2">
          {/* Selector de Vistas: Semana / Día / Agenda */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--paper)] border border-[var(--border)]">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-[#3b3abf] text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => {
                setViewMode('day');
                setActiveDay(nowState.day <= 5 ? nowState.day : 1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-[#3b3abf] text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-[#3b3abf] text-white shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Agenda
            </button>
          </div>

          {/* Botón [ Hoy ] para centrarse o volver al día presente */}
          <button
            onClick={() => {
              setActiveDay(nowState.day <= 5 ? nowState.day : 1);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--paper)] hover:bg-[var(--surface-raised)] text-[var(--ink)] border border-[var(--border)] text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Centrar en el día de hoy"
          >
            <Calendar className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
            <span>Hoy</span>
          </button>
        </div>

        {/* Lado Central: Filtros de Contenido */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por Tipo */}
          <div className="hidden md:flex items-center gap-1 text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-[#3b3abf]/10 text-[#3b3abf] dark:text-[#a0a0ff] font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Todo
            </button>
            <button
              onClick={() => setTypeFilter('classes')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                typeFilter === 'classes'
                  ? 'bg-[#3b3abf]/10 text-[#3b3abf] dark:text-[#a0a0ff] font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Clases
            </button>
            <button
              onClick={() => setTypeFilter('slots')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                typeFilter === 'slots'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Huecos
            </button>
            <button
              onClick={() => setTypeFilter('routines')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                typeFilter === 'routines'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Personales
            </button>
          </div>

          <div className="h-4 w-px bg-[var(--border)] hidden md:block" />

          {/* Selector de Materias */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[var(--muted)]" />
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="bg-[var(--paper)] border border-[var(--border)] text-[var(--ink)] rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-[#3b3abf]"
            >
              <option value="all">Todas las materias ({Object.keys(subjectsMap).length})</option>
              {Object.values(subjectsMap).map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-[var(--ink)] text-xs font-medium cursor-pointer ml-1">
            <input
              type="checkbox"
              checked={showSaturday}
              onChange={(e) => setShowSaturday(e.target.checked)}
              className="rounded bg-[var(--paper)] border-[var(--border)] text-[#3b3abf] focus:ring-0"
            />
            <span>Sáb</span>
          </label>
        </div>

        {/* Lado Derecho: Acciones Principales */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => openEditClass()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Añadir clase al horario"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Clase</span>
          </button>

          <button
            onClick={openRoutineModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--paper)] hover:bg-[var(--surface-raised)] text-[var(--ink)] border border-[var(--border)] font-bold transition-all cursor-pointer shadow-2xs"
            title="Añadir bloque personal (almuerzo, gym, estudio)"
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Bloque personal</span>
          </button>

          <button
            onClick={openAttendanceModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--paper)] hover:bg-[var(--surface-raised)] text-[var(--ink)] border border-[var(--border)] font-bold transition-all cursor-pointer shadow-2xs"
            title="Control de asistencias y faltas"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Asistencias</span>
          </button>

          <button
            onClick={openCalendarModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--paper)] hover:bg-[var(--surface-raised)] text-[var(--ink)] border border-[var(--border)] font-bold transition-all cursor-pointer shadow-2xs"
            title="Sincronizar o importar calendario (.ICS / Google / Outlook)"
          >
            <Calendar className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
            <span className="hidden sm:inline">Calendario</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISTA 1: SEMANA (Cuadrícula Completa)                     */}
      {/* ========================================================= */}
      {viewMode === 'week' && (
        <div className="card-academic overflow-hidden bg-[var(--surface)] border border-[var(--border)] transition-colors shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[720px] sm:min-w-full">
              {/* Encabezado de Columnas por Día */}
              <div
                className="grid border-b border-[var(--border)] bg-[var(--paper)] text-center text-xs font-bold text-[var(--ink)]"
                style={{
                  gridTemplateColumns: `64px repeat(${days.length}, 1fr)`,
                }}
              >
                <div className="p-3.5 text-[var(--muted)] border-r border-[var(--border)] font-mono text-[11px] flex items-center justify-center">
                  Hora
                </div>
                {days.map(({ day, name, short }) => {
                  const isToday = day === nowState.day;
                  return (
                    <div
                      key={day}
                      className={`p-3 border-r border-[var(--border)] last:border-r-0 font-mono font-bold transition-colors ${
                        isToday ? 'bg-[#3b3abf]/[0.08] text-[#3b3abf] dark:text-[#a0a0ff]' : 'text-[var(--ink)]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="hidden sm:inline">{name}</span>
                        <span className="sm:hidden">{short}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded bg-[#3b3abf] text-white text-[9px] font-black uppercase tracking-wider shadow-2xs animate-pulse">
                            HOY
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid del Horario (07:00 a 21:00) */}
              <div
                className="relative grid bg-[var(--surface)] transition-colors"
                style={{
                  gridTemplateColumns: `64px repeat(${days.length}, 1fr)`,
                  height: '780px',
                }}
              >
                {/* Eje de Horas con etiquetas */}
                <div className="border-r border-[var(--border)] bg-[var(--paper)] font-mono text-[10px] text-[var(--muted)] flex flex-col justify-between py-1 select-none">
                  {hours.map((h) => (
                    <div key={h} className="text-center h-full flex items-start justify-center pt-0.5">
                      {h.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Columnas de cada día */}
                {days.map(({ day, name }) => {
                  const isToday = day === nowState.day;
                  const dayClasses = filteredClasses.filter((c) => c.dayOfWeek === day);

                  // Huecos libres calculados automáticamente
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
                      className={`relative border-r border-[var(--border)] last:border-r-0 transition-colors ${
                        isToday ? 'bg-[#3b3abf]/[0.02] dark:bg-[#3b3abf]/[0.05]' : 'bg-[var(--surface)]'
                      }`}
                    >
                      {/* Sub-líneas de cuadrícula: Hora en punto sólida + Media hora (:30) punteada sutil */}
                      {hours.map((h, i) => {
                        const topHour = (i / (hours.length - 1)) * 100;
                        const halfHourOffset = (1 / (hours.length - 1) / 2) * 100;
                        const isLast = i === hours.length - 1;
                        return (
                          <div key={h}>
                            <div
                              className="absolute w-full border-b border-[var(--border)]/35 pointer-events-none"
                              style={{ top: `${topHour}%` }}
                            />
                            {!isLast && (
                              <div
                                className="absolute w-full border-b border-dashed border-[var(--border)]/20 pointer-events-none"
                                style={{ top: `${topHour + halfHourOffset}%` }}
                              />
                            )}
                          </div>
                        );
                      })}

                      {/* Línea horizontal en vivo "AHORA" si es el día de hoy */}
                      {isToday && isNowWithinSchedule && (
                        <div
                          className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                          style={{ top: `${nowTopPercent}%` }}
                        >
                          <div className="w-full border-t-2 border-rose-500 shadow-sm relative flex items-center">
                            <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-500/20 flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            </div>
                            <span className="ml-3 px-1.5 py-0.2 rounded bg-rose-500 text-white font-mono text-[9px] font-black tracking-wider shadow-2xs select-none">
                              AHORA · {nowState.timeStr}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 1. HUECOS LIBRES (Capacidad disponible de decisión) */}
                      {typeFilter !== 'classes' &&
                        typeFilter !== 'routines' &&
                        usableGaps.map((slot, idx) => {
                          const { top, height, durationMinutes } = getTopAndHeight(
                            slot.startTime,
                            slot.endTime
                          );
                          return (
                            <div
                              key={`gap-${idx}`}
                              onClick={() =>
                                setSelectedSlotForDecision({
                                  startTime: slot.startTime,
                                  endTime: slot.endTime,
                                  durationMinutes,
                                  dayOfWeek: day,
                                  dayName: name,
                                })
                              }
                              className="absolute inset-x-1 rounded-xl border border-dashed border-emerald-400/50 dark:border-emerald-700/50 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 p-2 flex flex-col justify-between overflow-hidden group transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                              style={{ top, height }}
                              title="Hueco libre: Clic para planificar o iniciar enfoque"
                            >
                              <div>
                                <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  <Sparkles className="w-3 h-3 shrink-0" />
                                  <span className="truncate">
                                    HUECO: {formatMinutesHuman(durationMinutes)}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[var(--muted)] font-mono mt-0.5">
                                  {slot.startTime} – {slot.endTime}
                                </div>
                              </div>

                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                                <span>Aprovechar</span>
                                <ArrowRight className="w-2.5 h-2.5" />
                              </div>
                            </div>
                          );
                        })}

                      {/* 2. BLOQUES PERSONALES / RUTINAS (Franjas horizontales discretas) */}
                      {typeFilter !== 'classes' &&
                        typeFilter !== 'slots' &&
                        routines
                          .filter((r) => r.dayOfWeek === day)
                          .map((r) => {
                            const { top, height } = getTopAndHeight(r.startTime, r.endTime);
                            return (
                              <div
                                key={`routine-${r.id}-${day}`}
                                onClick={openRoutineModal}
                                className="absolute inset-x-1 rounded-lg px-2 py-1 border border-amber-300/70 dark:border-amber-700/50 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 flex items-center justify-between overflow-hidden transition-all hover:bg-amber-100/80 cursor-pointer shadow-2xs"
                                style={{ top, height }}
                                title="Bloque personal (clic para editar)"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <Coffee className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span className="font-bold text-[10px] truncate">{r.title}</span>
                                </div>
                                <span className="text-[9px] font-mono opacity-80 shrink-0 ml-1">
                                  {r.startTime}
                                </span>
                              </div>
                            );
                          })}

                      {/* 3. BLOQUES DE CLASE (Nivel 1 con borde temático + Altura adaptativa) */}
                      {typeFilter !== 'slots' &&
                        typeFilter !== 'routines' &&
                        dayClasses.map((c) => {
                          const subject = subjectsMap[c.subjectId];
                          const { top, height, durationMinutes } = getTopAndHeight(
                            c.startTime,
                            c.endTime
                          );

                          // Inasistencias de la materia para el tooltip Nivel 2
                          const subAbsences = attendance.filter(
                            (a) => a.subjectId === c.subjectId && a.status === 'absent'
                          ).length;
                          const maxAbs = subject?.maxAbsences ?? 4;

                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                if (subject) {
                                  setSelectedClassForDetail({ block: c, subject });
                                } else {
                                  openEditClass(c);
                                }
                              }}
                              className="absolute inset-x-1 rounded-xl p-2 shadow-2xs border border-[var(--border)] flex flex-col justify-between overflow-hidden transition-all duration-150 hover:z-20 hover:scale-[1.015] hover:shadow-md cursor-pointer group bg-[var(--surface)]"
                              style={{
                                top,
                                height,
                                borderLeftWidth: '4px',
                                borderLeftColor: subject?.color || '#3b3abf',
                              }}
                              title="Clic para ver ficha académica, tareas y asistencia"
                            >
                              {/* Formato Adaptativo según Duración */}
                              {durationMinutes >= 90 ? (
                                <>
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono text-[9px] font-bold text-[#3b3abf] dark:text-[#a0a0ff] uppercase tracking-wide">
                                        {subject?.code || 'CLASE'}
                                      </span>
                                      <span className="font-mono text-[10px] text-[var(--muted)] font-semibold">
                                        {c.startTime}
                                      </span>
                                    </div>
                                    <div className="font-bold text-xs text-[var(--ink)] mt-1 leading-snug line-clamp-2">
                                      {subject?.name || 'Materia'}
                                    </div>
                                  </div>

                                  <div className="space-y-0.5 text-[9px] text-[var(--muted)] font-mono mt-1">
                                    {c.location && (
                                      <div className="flex items-center gap-1 truncate text-[var(--ink-secondary)] font-medium">
                                        <MapPin className="w-2.5 h-2.5 text-[#7b7bff] shrink-0" />
                                        <span className="truncate">{c.location}</span>
                                      </div>
                                    )}
                                    <div>
                                      {c.startTime} – {c.endTime}
                                    </div>
                                  </div>
                                </>
                              ) : durationMinutes >= 60 ? (
                                <>
                                  <div>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-[11px] text-[var(--ink)] truncate">
                                        {subject?.name || 'Materia'}
                                      </span>
                                      <span className="font-mono text-[9px] text-[var(--muted)] shrink-0">
                                        {c.startTime}
                                      </span>
                                    </div>
                                    {c.location && (
                                      <div className="flex items-center gap-1 truncate text-[9px] text-[var(--muted)] mt-0.5">
                                        <MapPin className="w-2.5 h-2.5 text-[#7b7bff] shrink-0" />
                                        <span className="truncate">{c.location}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-[9px] text-[var(--muted)] font-mono">
                                    {c.startTime} – {c.endTime}
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center justify-between gap-1 text-[11px] h-full">
                                  <span className="font-bold text-[var(--ink)] truncate">
                                    {subject?.name || 'Materia'}
                                  </span>
                                  <span className="font-mono text-[9px] text-[var(--muted)] shrink-0">
                                    {c.startTime}
                                  </span>
                                </div>
                              )}

                              {/* Nivel 2: Tooltip Flotante al Pasar el Cursor */}
                              <div className="hidden group-hover:block absolute bottom-1 right-1 z-40 bg-[var(--surface-raised)] border border-[var(--border)] px-1.5 py-0.5 rounded-md shadow-sm text-[9px] font-mono text-[var(--muted)]">
                                {subAbsences}/{maxAbs} faltas
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
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 2: DÍA (Vista Vertical de Ejecución Diaria)          */}
      {/* ========================================================= */}
      {viewMode === 'day' && (
        <div className="space-y-3">
          {/* Navegador de Días */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <button
              onClick={() => setActiveDay((prev) => (prev > 1 ? ((prev - 1) as DayOfWeek) : 5))}
              className="p-1.5 rounded-xl hover:bg-[var(--paper)] text-[var(--ink)] transition-colors cursor-pointer"
              title="Día anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {days.map(({ day, name }) => {
                const isSelected = day === activeDay;
                const isToday = day === nowState.day;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#3b3abf] text-white shadow-xs'
                        : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <span>{name}</span>
                    {isToday && (
                      <span
                        className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#3b3abf] text-white'
                        }`}
                      >
                        HOY
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setActiveDay((prev) => (prev < (showSaturday ? 6 : 5) ? ((prev + 1) as DayOfWeek) : 1))}
              className="p-1.5 rounded-xl hover:bg-[var(--paper)] text-[var(--ink)] transition-colors cursor-pointer"
              title="Día siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Columna Diaria a Pantalla Completa */}
          <div className="card-academic overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-sm">
            <div
              className="relative grid bg-[var(--surface)]"
              style={{
                gridTemplateColumns: '70px 1fr',
                height: '800px',
              }}
            >
              {/* Horas */}
              <div className="border-r border-[var(--border)] bg-[var(--paper)] font-mono text-[11px] text-[var(--muted)] flex flex-col justify-between py-1 select-none">
                {hours.map((h) => (
                  <div key={h} className="text-center h-full flex items-start justify-center pt-0.5">
                    {h.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Contenido del Día */}
              <div className="relative">
                {/* Cuadrícula horaria y sub-líneas */}
                {hours.map((h, i) => {
                  const topHour = (i / (hours.length - 1)) * 100;
                  const halfHourOffset = (1 / (hours.length - 1) / 2) * 100;
                  const isLast = i === hours.length - 1;
                  return (
                    <div key={h}>
                      <div
                        className="absolute w-full border-b border-[var(--border)]/35 pointer-events-none"
                        style={{ top: `${topHour}%` }}
                      />
                      {!isLast && (
                        <div
                          className="absolute w-full border-b border-dashed border-[var(--border)]/20 pointer-events-none"
                          style={{ top: `${topHour + halfHourOffset}%` }}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Línea AHORA en vista Día */}
                {activeDay === nowState.day && isNowWithinSchedule && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                    style={{ top: `${nowTopPercent}%` }}
                  >
                    <div className="w-full border-t-2 border-rose-500 shadow-sm relative flex items-center">
                      <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-500/20 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      </div>
                      <span className="ml-3 px-2 py-0.5 rounded bg-rose-500 text-white font-mono text-[10px] font-black tracking-wider shadow-2xs select-none">
                        AHORA · {nowState.timeStr}
                      </span>
                    </div>
                  </div>
                )}

                {/* Huecos en Vista Día */}
                {typeFilter !== 'classes' &&
                  typeFilter !== 'routines' &&
                  calculateFreeSlots({
                    dayOfWeek: activeDay,
                    classes: filteredClasses,
                    routines,
                  })
                    .filter((s) => s.category === 'USABLE' && s.durationMinutes >= 30)
                    .map((slot, idx) => {
                      const { top, height, durationMinutes } = getTopAndHeight(
                        slot.startTime,
                        slot.endTime
                      );
                      return (
                        <div
                          key={`day-gap-${idx}`}
                          onClick={() =>
                            setSelectedSlotForDecision({
                              startTime: slot.startTime,
                              endTime: slot.endTime,
                              durationMinutes,
                              dayOfWeek: activeDay,
                              dayName: DAY_MAP[activeDay],
                            })
                          }
                          className="absolute inset-x-3 rounded-xl border border-dashed border-emerald-400/60 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 p-3 flex items-center justify-between overflow-hidden group cursor-pointer transition-all shadow-2xs"
                          style={{ top, height }}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Hueco Libre: {formatMinutesHuman(durationMinutes)}</span>
                            </div>
                            <div className="text-[11px] text-[var(--muted)] font-mono mt-0.5">
                              {slot.startTime} – {slot.endTime} · Toca para decidir qué estudiar o enfocar
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 group-hover:translate-x-0.5 transition-transform">
                            <span>Aprovechar</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })}

                {/* Rutinas en Vista Día */}
                {typeFilter !== 'classes' &&
                  typeFilter !== 'slots' &&
                  routines
                    .filter((r) => r.dayOfWeek === activeDay)
                    .map((r) => {
                      const { top, height } = getTopAndHeight(r.startTime, r.endTime);
                      return (
                        <div
                          key={`day-routine-${r.id}`}
                          onClick={openRoutineModal}
                          className="absolute inset-x-3 rounded-xl px-3 py-1.5 border border-amber-300 dark:border-amber-700/50 bg-amber-50/90 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 flex items-center justify-between overflow-hidden cursor-pointer hover:bg-amber-100 transition-colors shadow-2xs"
                          style={{ top, height }}
                        >
                          <div className="flex items-center gap-2">
                            <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="font-bold text-xs">{r.title}</span>
                          </div>
                          <span className="text-xs font-mono opacity-80">
                            {r.startTime} – {r.endTime}
                          </span>
                        </div>
                      );
                    })}

                {/* Clases en Vista Día */}
                {typeFilter !== 'slots' &&
                  typeFilter !== 'routines' &&
                  filteredClasses
                    .filter((c) => c.dayOfWeek === activeDay)
                    .map((c) => {
                      const subject = subjectsMap[c.subjectId];
                      const { top, height } = getTopAndHeight(c.startTime, c.endTime);

                      return (
                        <div
                          key={`day-class-${c.id}`}
                          onClick={() => {
                            if (subject) {
                              setSelectedClassForDetail({ block: c, subject });
                            } else {
                              openEditClass(c);
                            }
                          }}
                          className="absolute inset-x-3 rounded-xl p-3 shadow-sm border border-[var(--border)] flex flex-col justify-between overflow-hidden transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer group bg-[var(--surface)]"
                          style={{
                            top,
                            height,
                            borderLeftWidth: '5px',
                            borderLeftColor: subject?.color || '#3b3abf',
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-[#3b3abf] dark:text-[#a0a0ff] uppercase tracking-wide">
                                {subject?.code || 'CLASE'}
                              </span>
                              <span className="font-mono text-xs text-[var(--muted)] font-semibold">
                                {c.startTime} – {c.endTime}
                              </span>
                            </div>
                            <div className="font-black text-sm text-[var(--ink)] mt-1">
                              {subject?.name || 'Materia'}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-[var(--muted)] mt-1 font-mono">
                            {c.location && (
                              <div className="flex items-center gap-1.5 text-[var(--ink-secondary)] font-medium">
                                <MapPin className="w-3.5 h-3.5 text-[#7b7bff]" />
                                <span>{c.location}</span>
                              </div>
                            )}
                            {subject?.professor && <span>Prof. {subject.professor}</span>}
                          </div>
                        </div>
                      );
                    })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 3: AGENDA (Feed Cronológico Secuencial)             */}
      {/* ========================================================= */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {days.map(({ day, name }) => {
            const isToday = day === nowState.day;
            const dayClasses = filteredClasses.filter((c) => c.dayOfWeek === day);
            const dayRoutines = routines.filter((r) => r.dayOfWeek === day);
            const daySlots = calculateFreeSlots({
              dayOfWeek: day,
              classes: filteredClasses,
              routines,
            }).filter((s) => s.category === 'USABLE' && s.durationMinutes >= 30);

            // Unificar todos los eventos y ordenar cronológicamente
            type AgendaItem =
              | { type: 'class'; data: ScheduleBlock; start: number }
              | { type: 'routine'; data: FixedRoutine; start: number }
              | {
                  type: 'slot';
                  data: { startTime: string; endTime: string; durationMinutes: number };
                  start: number;
                };

            const items: AgendaItem[] = [
              ...dayClasses.map((c) => ({
                type: 'class' as const,
                data: c,
                start: timeToMinutes(c.startTime),
              })),
              ...dayRoutines.map((r) => ({
                type: 'routine' as const,
                data: r,
                start: timeToMinutes(r.startTime),
              })),
              ...daySlots.map((s) => ({
                type: 'slot' as const,
                data: {
                  startTime: s.startTime,
                  endTime: s.endTime,
                  durationMinutes: s.durationMinutes,
                },
                start: timeToMinutes(s.startTime),
              })),
            ].sort((a, b) => a.start - b.start);

            return (
              <div
                key={`agenda-day-${day}`}
                className={`p-4 rounded-2xl border transition-colors ${
                  isToday
                    ? 'bg-[var(--surface)] border-[#3b3abf]/50 shadow-sm'
                    : 'bg-[var(--surface)] border-[var(--border)]'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-[var(--ink)] tracking-tight">
                      {name}
                    </h3>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-[#3b3abf] text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                        HOY
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--muted)] font-mono">
                    {items.length} actividades
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="text-xs text-[var(--muted)] py-3 text-center">
                    No hay actividades programadas para este día.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {items.map((item, idx) => {
                      if (item.type === 'class') {
                        const c = item.data;
                        const subject = subjectsMap[c.subjectId];
                        return (
                          <div
                            key={`agenda-class-${c.id}-${idx}`}
                            onClick={() => {
                              if (subject) setSelectedClassForDetail({ block: c, subject });
                              else openEditClass(c);
                            }}
                            className="p-3 rounded-xl border border-[var(--border)] bg-[var(--paper)] hover:bg-[var(--surface-raised)] transition-all flex items-center justify-between gap-3 cursor-pointer group"
                            style={{
                              borderLeftWidth: '4px',
                              borderLeftColor: subject?.color || '#3b3abf',
                            }}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-[#3b3abf] dark:text-[#a0a0ff]">
                                  {c.startTime} — {c.endTime}
                                </span>
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
                                  {subject?.code}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-[var(--ink)] mt-0.5">
                                {subject?.name || 'Clase'}
                              </h4>
                              {c.location && (
                                <div className="flex items-center gap-1 text-[11px] text-[var(--muted)] mt-1">
                                  <MapPin className="w-3 h-3 text-[#7b7bff]" />
                                  <span>{c.location}</span>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (subject) setSelectedClassForDetail({ block: c, subject });
                              }}
                              className="shrink-0 p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--muted)] group-hover:text-[var(--ink)] transition-colors cursor-pointer"
                              title="Ver ficha"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      }

                      if (item.type === 'routine') {
                        const r = item.data;
                        return (
                          <div
                            key={`agenda-routine-${r.id}-${idx}`}
                            onClick={openRoutineModal}
                            className="p-2.5 rounded-xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span className="font-bold text-xs">{r.title}</span>
                              <span className="text-[10px] font-mono opacity-75">
                                ({r.startTime} – {r.endTime})
                              </span>
                            </div>
                            <span className="text-[10px] uppercase font-mono opacity-80">
                              Bloque Personal
                            </span>
                          </div>
                        );
                      }

                      if (item.type === 'slot') {
                        const s = item.data;
                        return (
                          <div
                            key={`agenda-slot-${idx}`}
                            onClick={() =>
                              setSelectedSlotForDecision({
                                startTime: s.startTime,
                                endTime: s.endTime,
                                durationMinutes: s.durationMinutes,
                                dayOfWeek: day,
                                dayName: name,
                              })
                            }
                            className="p-3 rounded-xl border border-dashed border-emerald-400/60 dark:border-emerald-700/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/50 transition-all flex items-center justify-between cursor-pointer group"
                          >
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <div>
                                <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                                  Hueco Libre · {formatMinutesHuman(s.durationMinutes)}
                                </span>
                                <span className="text-[11px] font-mono text-[var(--muted)] ml-2">
                                  {s.startTime} – {s.endTime}
                                </span>
                              </div>
                            </div>

                            <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold transition-all shadow-2xs group-hover:scale-105 cursor-pointer">
                              <span>Aprovechar</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: Ficha Contextual de Clase (Nivel 3)              */}
      {/* ========================================================= */}
      {selectedClassForDetail && (
        <ClassDetailModal
          block={selectedClassForDetail.block}
          subject={selectedClassForDetail.subject}
          assignments={assignments}
          exams={exams}
          attendance={attendance}
          onClose={() => setSelectedClassForDetail(null)}
          onEdit={(block) => {
            setSelectedClassForDetail(null);
            openEditClass(block);
          }}
          onAddAbsence={handleAddAbsence}
          onAddPresent={handleAddPresent}
          onRemoveAbsence={handleRemoveAbsence}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 2: Decisión y Aprovechamiento de Hueco Libre        */}
      {/* ========================================================= */}
      {selectedSlotForDecision && (
        <SlotDecisionModal
          slot={selectedSlotForDecision}
          onClose={() => setSelectedSlotForDecision(null)}
          subjectsMap={subjectsMap}
          assignments={assignments}
          exams={exams}
        />
      )}
    </div>
  );
}
