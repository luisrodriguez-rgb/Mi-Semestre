'use client';

import { useState, useMemo } from 'react';
import {
  MapPin,
  Flame,
  Play,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Subject, ScheduleBlock, Assignment, Exam, FixedRoutine, DayOfWeek } from '@/types';
import { getCurrentBlock } from '@/lib/academic-engine/schedule/getCurrentBlock';
import { formatMinutesHuman } from '@/lib/academic-engine/utils/timeHelpers';
import { useUIStore } from '@/stores/uiStore';
import { CustomSelect, CustomSelectOption } from '@/components/ui/CustomSelect';

const NOW_SIMULATED_TIME_OPTIONS: CustomSelectOption[] = [
  { value: '07:30', label: '07:30', sublabel: 'En Clase' },
  { value: '09:15', label: '09:15', sublabel: 'Hueco Mañana' },
  { value: '12:30', label: '12:30', sublabel: 'Almuerzo' },
  { value: '16:20', label: '16:20', sublabel: 'Hueco Libre 1h 40m' },
  { value: '20:00', label: '20:00', sublabel: 'Noche / Libre' },
];

interface NowActionCardProps {
  classes: ScheduleBlock[];
  subjectsMap: Record<string, Subject>;
  routines: FixedRoutine[];
  assignments: Assignment[];
  exams: Exam[];
}

export function NowActionCard({
  classes,
  subjectsMap,
  routines,
  assignments,
  exams,
}: NowActionCardProps) {
  const { startFocusSession } = useUIStore();

  // Permite simular horas del día para probar todos los estados
  const [simulatedTime, setSimulatedTime] = useState<string>('16:20');
  const [useRealTime, setUseRealTime] = useState<boolean>(false);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  // Obtener día de hoy (1 = Lun, 2 = Mar, ...)
  const todayDayOfWeek = useMemo<DayOfWeek>(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : (d as DayOfWeek);
  }, []);

  const effectiveTime = useMemo(() => {
    if (useRealTime) {
      const now = new Date();
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    return simulatedTime;
  }, [useRealTime, simulatedTime]);

  const dayNameFormatted = useMemo(() => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const now = new Date();
    return days[now.getDay()].toUpperCase();
  }, []);

  // Ejecutar el motor académico para determinar estado actual
  const currentBlockResult = useMemo(() => {
    return getCurrentBlock({
      dayOfWeek: todayDayOfWeek,
      currentTime: effectiveTime,
      classes,
      subjectsMap,
      routines,
      dayStart: '07:00',
      dayEnd: '21:30',
    });
  }, [todayDayOfWeek, effectiveTime, classes, subjectsMap, routines]);

  const [mountTime] = useState(() => Date.now());

  // Encontrar la tarea de mayor impacto para recomendar
  const recommendedTask = useMemo(() => {
    const pending = assignments.filter((a) => a.status !== 'completed');
    if (pending.length === 0) return null;

    const sorted = [...pending].sort((a, b) => {
      const examA = exams.find((e) => e.subjectId === a.subjectId);
      const examB = exams.find((e) => e.subjectId === b.subjectId);
      const distA = examA ? new Date(examA.date).getTime() - mountTime : Infinity;
      const distB = examB ? new Date(examB.date).getTime() - mountTime : Infinity;

      if (distA !== distB) return distA - distB;
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    const top = sorted[0];
    const subject = subjectsMap[top.subjectId];
    const relatedExam = exams.find((e) => e.subjectId === top.subjectId);
    let reason = 'Vence próximamente y requiere avance prioritario.';
    if (relatedExam) {
      reason = `Porque tienes el parcial de ${subject?.name || 'la materia'} en pocos días y requiere preparación.`;
    }

    return {
      task: top,
      subject,
      reason,
    };
  }, [assignments, exams, subjectsMap, mountTime]);

  // Próximo examen general
  const nearestExam = useMemo(() => {
    if (exams.length === 0) return null;
    const sorted = [...exams]
      .map((e) => ({
        exam: e,
        diffDays: Math.ceil((new Date(e.date).getTime() - mountTime) / (1000 * 60 * 60 * 24)),
      }))
      .filter((e) => e.diffDays >= 0)
      .sort((a, b) => a.diffDays - b.diffDays);
    return sorted[0] || null;
  }, [exams, mountTime]);

  const handleStartFocus = () => {
    if (recommendedTask) {
      startFocusSession(
        recommendedTask.task.title,
        recommendedTask.subject?.name || '',
        recommendedTask.task.estimatedMinutes || 45,
        recommendedTask.task.id
      );
    } else {
      startFocusSession('Sesión de Estudio Libre', 'Auto-estudio', 45);
    }
  };

  return (
    <section className="space-y-4">
      {/* Header Limpio y Dominante */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#1e1e8a] dark:text-[#a0a0ff]">
            <span>{dayNameFormatted} · {effectiveTime}</span>
            <span>·</span>
            <span className="text-[var(--muted)]">CENTRO DE DECISIÓN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight mt-1">
            ¿Qué hago ahora?
          </h1>
        </div>

        {/* Control discreto de simulación de horas */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="text-[11px] font-mono text-[var(--muted)] hover:text-[var(--ink)] underline cursor-pointer"
          >
            {showSimulator ? 'Ocultar simulador' : 'Simular hora...'}
          </button>

          {showSimulator && (
            <div className="flex items-center gap-1.5 bg-[var(--paper)] p-1 rounded-xl border border-[var(--border)] animate-in fade-in">
              <CustomSelect
                value={effectiveTime}
                onChange={(val) => {
                  setUseRealTime(false);
                  setSimulatedTime(val);
                }}
                options={NOW_SIMULATED_TIME_OPTIONS}
                align="right"
                buttonClassName="py-0.5 px-2 font-mono text-[11px]"
              />
              <button
                onClick={() => setUseRealTime(!useRealTime)}
                className={`px-2 py-1 rounded-xl font-mono text-[10px] font-bold transition-all cursor-pointer ${
                  useRealTime
                    ? 'bg-[#1e1e8a] text-white shadow-2xs'
                    : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'
                }`}
              >
                {useRealTime ? 'Reloj Real ON' : 'Real'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TRÍPTICO DE DECISIÓN: AHORA → MI MEJOR SIGUIENTE ACCIÓN → DESPUÉS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1. TARJETA AHORA (¿Dónde estoy? / ¿Cuánto tiempo tengo?) */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-xs transition-colors">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono font-bold tracking-wider uppercase text-[var(--muted)] pb-3 border-b border-[var(--border)]">
              <span>1. AHORA</span>
              {currentBlockResult.status === 'in_class' && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[10px] font-bold">
                  EN CLASE
                </span>
              )}
              {currentBlockResult.status === 'in_free_slot' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                  HUECO DISPONIBLE
                </span>
              )}
              {currentBlockResult.status === 'in_routine' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                  COMPROMISO FIJO
                </span>
              )}
              {currentBlockResult.status === 'off_hours' && (
                <span className="px-2 py-0.5 rounded-full bg-[var(--paper)] text-[var(--muted)] border border-[var(--border)] text-[10px]">
                  DESCANSO
                </span>
              )}
            </div>

            {/* ESTADO EN CLASE */}
            {currentBlockResult.status === 'in_class' && currentBlockResult.currentClass && (
              <div className="mt-4">
                <div className="text-xl font-black text-[var(--ink)] tracking-tight leading-snug">
                  {currentBlockResult.currentClass.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--muted)] mt-1.5 font-medium">
                  <span className="font-mono text-[#1e1e8a] dark:text-[#a0a0ff] font-bold">
                    {currentBlockResult.currentClass.code}
                  </span>
                  {currentBlockResult.currentClass.location && (
                    <span className="flex items-center gap-1">
                      · <MapPin className="w-3.5 h-3.5 text-[#1e1e8a] dark:text-[#a0a0ff]" />
                      {currentBlockResult.currentClass.location}
                    </span>
                  )}
                </div>
                <div className="mt-5 p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--border)] text-xs flex items-center justify-between">
                  <span className="text-[var(--muted)]">Tiempo restante:</span>
                  <span className="font-mono font-bold text-sm text-[#1e1e8a] dark:text-[#a0a0ff]">
                    {formatMinutesHuman(currentBlockResult.currentClass.remainingMinutes)}
                  </span>
                </div>
              </div>
            )}

            {/* ESTADO EN HUECO LIBRE: EL HUECO COMO UNIDAD DE DECISIÓN */}
            {currentBlockResult.status === 'in_free_slot' && currentBlockResult.currentFreeSlot && (
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    Ventana hasta las {currentBlockResult.currentFreeSlot.endTime}
                  </div>
                  <div className="text-2xl font-black text-[var(--ink)] tracking-tight mt-0.5">
                    Tienes {formatMinutesHuman(currentBlockResult.currentFreeSlot.remainingMinutes)} libres
                  </div>
                </div>

                {/* Desglose matemático claro de fricción */}
                <div className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--border)] space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>Tiempo bruto</span>
                    <span>{currentBlockResult.currentFreeSlot.remainingMinutes} min</span>
                  </div>
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>Traslados en campus</span>
                    <span>-15 min</span>
                  </div>
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>Preparación y setup</span>
                    <span>-10 min</span>
                  </div>
                  <div className="pt-2 border-t border-[var(--border)] flex justify-between font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    <span>Tiempo útil real</span>
                    <span>
                      {Math.max(
                        20,
                        currentBlockResult.currentFreeSlot.remainingMinutes - 25
                      )} min
                    </span>
                  </div>
                </div>

                {/* Inversión recomendada del hueco */}
                <div className="text-[11px] text-[var(--muted)] flex items-center justify-between pt-1">
                  <span>Recomendación de uso:</span>
                  <span className="font-bold text-[var(--ink)]">45m foco · 10m pausa</span>
                </div>
              </div>
            )}

            {/* ESTADO EN RUTINA */}
            {currentBlockResult.status === 'in_routine' && currentBlockResult.currentRoutine && (
              <div className="mt-4">
                <div className="text-xl font-black text-amber-700 dark:text-amber-300 tracking-tight">
                  {currentBlockResult.currentRoutine.title}
                </div>
                <p className="text-xs text-[var(--muted)] mt-2">
                  Compromiso fijo en curso. Finaliza en{' '}
                  <strong className="text-[var(--ink)]">
                    {formatMinutesHuman(currentBlockResult.currentRoutine.remainingMinutes)}
                  </strong>.
                </p>
              </div>
            )}

            {/* ESTADO FUERA DE HORAS */}
            {currentBlockResult.status === 'off_hours' && (
              <div className="mt-4">
                <div className="text-xl font-black text-[var(--ink)] tracking-tight">
                  Fuera de Jornada
                </div>
                <p className="text-xs text-[var(--muted)] mt-2">
                  No hay clases activas en este horario. Buen momento para descansar o adelantar con calma.
                </p>
              </div>
            )}
          </div>

          {currentBlockResult.status === 'in_free_slot' && (
            <button
              onClick={handleStartFocus}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Aprovechar este hueco</span>
            </button>
          )}
        </div>

        {/* 2. TARJETA MI MEJOR SIGUIENTE ACCIÓN (Héroe central de decisión) */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl bg-[#16164f] dark:bg-[#111328] text-white p-6 border border-[#2828a8]/40 shadow-lg shadow-[#16164f]/15 relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono font-bold tracking-wider uppercase text-[#c5c5ff] pb-3 border-b border-white/10">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                2. MI MEJOR SIGUIENTE ACCIÓN
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white border border-white/15">
                MOTOR ACADÉMICO
              </span>
            </div>

            {recommendedTask ? (
              <div className="mt-4 space-y-3">
                <div className="text-xs font-mono font-bold text-[#a0a0ff]">
                  {recommendedTask.subject?.name || 'Materia'}
                </div>

                <div className="text-xl font-black text-white tracking-tight leading-snug">
                  {recommendedTask.task.title}
                </div>

                {/* Explicación de causalidad directa */}
                <div className="text-xs text-[#e8e8ff] bg-black/25 p-3.5 rounded-xl border border-white/10 leading-relaxed">
                  <span className="font-bold text-[#a0a0ff]">Por qué ahora: </span>
                  {recommendedTask.reason}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#c5c5ff] font-mono pt-1">
                  <span>Tiempo estimado: <strong>{formatMinutesHuman(recommendedTask.task.estimatedMinutes)}</strong></span>
                  <span>·</span>
                  <span className="text-amber-300 font-bold uppercase">Alta Urgencia</span>
                </div>
              </div>
            ) : (
              <div className="mt-6 text-xs text-[#c5c5ff] leading-relaxed">
                No tienes entregas pendientes urgentes. Puedes avanzar en lecturas complementarias o tomar un descanso reparador.
              </div>
            )}
          </div>

          <button
            onClick={handleStartFocus}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-white hover:bg-[#f0f0ff] active:scale-[0.98] text-[#16164f] text-xs font-black shadow-lg shadow-black/20 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-[#16164f]" />
            <span>COMENZAR ENFOQUE ({recommendedTask?.task.estimatedMinutes || 45}m)</span>
          </button>
        </div>

        {/* 3. TARJETA DESPUÉS (¿Qué viene después? / Próximo hito) */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-xs transition-colors">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono font-bold tracking-wider uppercase text-[var(--muted)] pb-3 border-b border-[var(--border)]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1e1e8a] dark:text-[#a0a0ff]" />
                3. DESPUÉS
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--paper)] text-[var(--ink)] border border-[var(--border)] font-bold">
                PRÓXIMO HITO
              </span>
            </div>

            {/* Siguiente clase de hoy */}
            {currentBlockResult.nextBlock ? (
              <div className="mt-4 p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)]">
                <div className="text-[10px] font-mono uppercase text-[var(--muted)]">
                  Siguiente clase de hoy ({currentBlockResult.nextBlock.startTime})
                </div>
                <div className="text-xs font-bold text-[var(--ink)] mt-0.5">
                  {currentBlockResult.nextBlock.title}
                </div>
                {currentBlockResult.nextBlock.location && (
                  <div className="text-[10px] text-[var(--muted)] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#1e1e8a] dark:text-[#a0a0ff]" />
                    {currentBlockResult.nextBlock.location}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 p-2.5 rounded-xl bg-[var(--paper)] border border-[var(--border)] text-[11px] text-[var(--muted)]">
                No tienes más clases programadas hoy.
              </div>
            )}

            {/* Próximo Examen Crítico */}
            {nearestExam ? (
              <div className="mt-4 space-y-2">
                <div className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase">
                  Parcial Más Próximo
                </div>
                <div className="text-sm font-bold text-[var(--ink)] tracking-tight">
                  {nearestExam.exam.title}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {subjectsMap[nearestExam.exam.subjectId]?.name || 'Materia'}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-md font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                    En {nearestExam.diffDays === 0 ? 'hoy' : `${nearestExam.diffDays} días`}
                  </span>
                  <span className="text-xs text-[var(--muted)] font-mono">
                    Ponderación: {nearestExam.exam.weight}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-[var(--muted)]">
                Sin exámenes agendados a corto plazo.
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--muted)] flex items-center justify-between">
            <span>Preparación sugerida:</span>
            <span className="font-bold text-[var(--ink)]">4 horas de estudio previo</span>
          </div>
        </div>
      </div>
    </section>
  );
}
