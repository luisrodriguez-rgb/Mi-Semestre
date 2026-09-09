'use client';

import { useState, useMemo } from 'react';
import {
  Clock,
  MapPin,
  Flame,
  Play,
  Calendar,
  Sparkles,
  ArrowRight,
  Hourglass,
} from 'lucide-react';
import { Subject, ScheduleBlock, Assignment, Exam, FixedRoutine, DayOfWeek } from '@/types';
import { getCurrentBlock } from '@/lib/academic-engine/schedule/getCurrentBlock';
import { formatMinutesHuman } from '@/lib/academic-engine/utils/timeHelpers';
import { useUIStore } from '@/stores/uiStore';

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

  // Ejecutar el motor académico para determinar estado
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

  // Encontrar la tarea de mayor impacto para recomendar
  const recommendedTask = useMemo(() => {
    const pending = assignments.filter((a) => a.status !== 'completed');
    if (pending.length === 0) return null;

    const nowMs = Date.now();
    const sorted = [...pending].sort((a, b) => {
      const examA = exams.find((e) => e.subjectId === a.subjectId);
      const examB = exams.find((e) => e.subjectId === b.subjectId);
      const distA = examA ? new Date(examA.date).getTime() - nowMs : Infinity;
      const distB = examB ? new Date(examB.date).getTime() - nowMs : Infinity;

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
      reason = `Parcial de ${subject?.name || 'la materia'} en pocos días.`;
    }

    return {
      task: top,
      subject,
      reason,
    };
  }, [assignments, exams, subjectsMap]);

  // Próximo examen general
  const nearestExam = useMemo(() => {
    if (exams.length === 0) return null;
    const nowMs = Date.now();
    const sorted = [...exams]
      .map((e) => ({
        exam: e,
        diffDays: Math.ceil((new Date(e.date).getTime() - nowMs) / (1000 * 60 * 60 * 24)),
      }))
      .filter((e) => e.diffDays >= 0)
      .sort((a, b) => a.diffDays - b.diffDays);
    return sorted[0] || null;
  }, [exams]);

  const handleStartFocus = () => {
    if (recommendedTask) {
      startFocusSession(
        recommendedTask.task.title,
        recommendedTask.subject?.name || '',
        recommendedTask.task.estimatedMinutes || 45,
        recommendedTask.task.id
      );
    } else {
      startFocusSession('Sesión de estudio libre', 'General', 30);
    }
  };

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="card-cambas p-6 sm:p-8 bg-[var(--surface)] relative overflow-hidden transition-colors">
      {/* Header bar: Día, Saludo y Simulador temporal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#3b3abf] dark:text-[#a0a0ff] font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{dayNames[todayDayOfWeek - 1]} · Centro de Decisión en Tiempo Real</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)] mt-1">
            ¿Qué hago ahora?
          </h2>
        </div>

        {/* Simulador rápido para probar todos los estados */}
        <div className="flex items-center gap-2 bg-[var(--paper)] p-1.5 rounded-xl border border-[var(--border)] text-xs">
          <span className="text-[var(--muted)] pl-2 font-mono text-[11px] font-semibold">Simular Hora:</span>
          <select
            value={effectiveTime}
            onChange={(e) => {
              setUseRealTime(false);
              setSimulatedTime(e.target.value);
            }}
            className="bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] rounded-lg px-2.5 py-1 font-mono text-xs font-semibold focus:outline-none focus:border-[#3b3abf]"
          >
            <option value="07:30">07:30 (En Clase de Cálculo)</option>
            <option value="09:15">09:15 (Hueco Libre Mañana)</option>
            <option value="10:30">10:30 (En Clase de Física)</option>
            <option value="12:30">12:30 (Almuerzo / Rutina)</option>
            <option value="14:30">14:30 (En Clase de Álgebra)</option>
            <option value="16:20">16:20 (Hueco Libre Tarde - 1h 40m)</option>
            <option value="20:00">20:00 (Noche / Sin Clases)</option>
          </select>
          <button
            onClick={() => setUseRealTime(!useRealTime)}
            className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition-all cursor-pointer ${
              useRealTime
                ? 'bg-[#3b3abf] text-white'
                : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--border)]'
            }`}
          >
            {useRealTime ? 'Reloj Real ON' : 'Usar Reloj Real'}
          </button>
        </div>
      </div>

      {/* Grid de Estado: AHORA | DESPUÉS (Recomendación) | PRÓXIMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* 1. SECCIÓN AHORA */}
        <div className="flex flex-col justify-between rounded-2xl bg-[var(--paper)] p-5 border border-[var(--border)]">
          <div>
            <div className="flex items-center justify-between text-xs font-bold tracking-wide uppercase text-[var(--muted)]">
              <span>Estado Actual ({effectiveTime})</span>
              {currentBlockResult.status === 'in_class' && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#ede9fe] text-[#7c3aed] dark:bg-[#3b0764] dark:text-[#d8b4fe] border border-[#ddd6fe] dark:border-[#581c87] text-[10px] font-mono font-bold">
                  EN CLASE
                </span>
              )}
              {currentBlockResult.status === 'in_free_slot' && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] dark:bg-[#052e16] dark:text-[#4ade80] border border-[#bbf7d0] dark:border-[#14532d] text-[10px] font-mono font-bold">
                  TIEMPO DISPONIBLE
                </span>
              )}
              {currentBlockResult.status === 'in_routine' && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#fef9c3] text-[#ca8a04] dark:bg-[#422006] dark:text-[#facc15] border border-[#fef08a] dark:border-[#713f12] text-[10px] font-mono font-bold">
                  RUTINA FIJA
                </span>
              )}
              {currentBlockResult.status === 'off_hours' && (
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] text-[10px] font-mono font-bold">
                  DESCANSO
                </span>
              )}
            </div>

            {currentBlockResult.status === 'in_class' && currentBlockResult.currentClass && (
              <div className="mt-4">
                <div className="text-xl font-black text-[var(--ink)] tracking-tight">
                  {currentBlockResult.currentClass.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--muted)] mt-1 font-medium">
                  <span className="font-mono text-[#3b3abf] dark:text-[#a0a0ff] font-bold">{currentBlockResult.currentClass.code}</span>
                  {currentBlockResult.currentClass.location && (
                    <span className="flex items-center gap-1">
                      · <MapPin className="w-3.5 h-3.5 text-[#a0a0ff]" />
                      {currentBlockResult.currentClass.location}
                    </span>
                  )}
                </div>
                <div className="mt-4 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs flex items-center justify-between font-medium">
                  <span className="text-[var(--muted)]">Termina en:</span>
                  <span className="font-mono font-bold text-sm text-[#3b3abf] dark:text-[#a0a0ff]">
                    {formatMinutesHuman(currentBlockResult.currentClass.remainingMinutes)}
                  </span>
                </div>
              </div>
            )}

            {currentBlockResult.status === 'in_free_slot' && currentBlockResult.currentFreeSlot && (
              <div className="mt-4">
                <div className="text-xl font-black text-[#16a34a] dark:text-[#4ade80] tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#16a34a] dark:text-[#4ade80]" />
                  <span>{formatMinutesHuman(currentBlockResult.currentFreeSlot.remainingMinutes)} libres</span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1.5">
                  Ventana hasta las <strong className="text-[var(--ink)]">{currentBlockResult.currentFreeSlot.endTime}</strong> con cálculo de fricción real:
                </p>

                {/* Desglose de 3 niveles de disponibilidad real */}
                <div className="mt-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>1. Hueco Libre Bruto:</span>
                    <span className="font-bold text-[var(--ink)]">
                      {formatMinutesHuman(currentBlockResult.currentFreeSlot.durationMinutes)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>- Traslado y movimiento:</span>
                    <span className="font-bold text-[#dc2626] dark:text-[#f87171]">
                      -{currentBlockResult.currentFreeSlot.transitionBufferMinutes || 15}m
                    </span>
                  </div>
                  <div className="flex justify-between text-[var(--muted)]">
                    <span>- Preparación y setup:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      -10m
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[var(--border)] flex justify-between text-[#16a34a] dark:text-[#4ade80] font-bold">
                    <span>2. Tiempo Útil Real:</span>
                    <span>
                      {formatMinutesHuman(
                        Math.max(
                          20,
                          (currentBlockResult.currentFreeSlot.effectiveStudyMinutes ||
                            currentBlockResult.currentFreeSlot.durationMinutes - 25)
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {currentBlockResult.status === 'in_routine' && currentBlockResult.currentRoutine && (
              <div className="mt-4">
                <div className="text-xl font-black text-[#ca8a04] dark:text-[#facc15] tracking-tight">
                  {currentBlockResult.currentRoutine.title}
                </div>
                <p className="text-xs text-[var(--muted)] mt-2">
                  Compromiso fijo. Finaliza en {formatMinutesHuman(currentBlockResult.currentRoutine.remainingMinutes)}.
                </p>
              </div>
            )}

            {currentBlockResult.status === 'off_hours' && (
              <div className="mt-4">
                <div className="text-xl font-black text-[var(--ink)] tracking-tight">
                  Fuera de Jornada
                </div>
                <p className="text-xs text-[var(--muted)] mt-2">
                  No hay clases activas en este horario.
                </p>
              </div>
            )}
          </div>

          {currentBlockResult.nextBlock && (
            <div className="mt-5 pt-3.5 border-t border-[var(--border)] text-[11px] text-[var(--muted)] flex items-center justify-between">
              <span>Siguiente:</span>
              <span className="font-bold text-[var(--ink)]">
                {currentBlockResult.nextBlock.title} ({currentBlockResult.nextBlock.startTime})
              </span>
            </div>
          )}
        </div>

        {/* 2. SECCIÓN RECOMENDACIÓN PRIORITARIA */}
        <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#1a1a5e] to-[#2828a8] dark:from-[#10122e] dark:to-[#1d2159] text-white p-5 shadow-lg shadow-[#1a1a5e]/20 relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between text-xs font-bold tracking-wide uppercase text-[#c5c5ff]">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                Prioridad Recomendada
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white border border-white/15">
                Motor Académico
              </span>
            </div>

            {recommendedTask ? (
              <div className="mt-4">
                <div className="text-xs font-mono font-bold text-[#a0a0ff]">
                  {recommendedTask.subject?.name || 'Materia'}
                </div>
                <div className="text-base font-extrabold text-white tracking-tight mt-1">
                  {recommendedTask.task.title}
                </div>
                <div className="text-xs text-[#e8e8ff] mt-2.5 bg-black/25 p-3 rounded-xl border border-white/10">
                  <span className="font-bold text-[#a0a0ff]">Por qué ahora: </span>
                  {recommendedTask.reason}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#c5c5ff] mt-3 font-mono">
                  <span>Estimado: {formatMinutesHuman(recommendedTask.task.estimatedMinutes)}</span>
                  <span>·</span>
                  <span className="text-amber-300 font-bold uppercase">Alta Urgencia</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-[#c5c5ff]">
                No tienes tareas pendientes urgentes. Puedes adelantar lecturas o tomar un descanso reparador.
              </div>
            )}
          </div>

          <button
            onClick={handleStartFocus}
            className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-[#f0f0ff] active:scale-[0.98] text-[#1e1e8a] text-xs font-extrabold shadow-lg shadow-black/20 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-[#1e1e8a]" />
            <span>Comenzar Enfoque ({recommendedTask?.task.estimatedMinutes || 45}m)</span>
          </button>
        </div>

        {/* 3. SECCIÓN PRÓXIMO HITO CRÍTICO */}
        <div className="flex flex-col justify-between rounded-2xl bg-[var(--paper)] p-5 border border-[var(--border)]">
          <div>
            <div className="flex items-center justify-between text-xs font-bold tracking-wide uppercase text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a855f7]" />
                Próximo Parcial Crítico
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-[#7c3aed] dark:text-[#a855f7] border border-[#ede9fe] dark:border-[#581c87] font-bold">
                Evaluación
              </span>
            </div>

            {nearestExam ? (
              <div className="mt-4">
                <div className="text-xs font-mono font-bold text-[#7c3aed] dark:text-[#a855f7]">
                  {subjectsMap[nearestExam.exam.subjectId]?.name || 'Materia'}
                </div>
                <div className="text-base font-bold text-[var(--ink)] tracking-tight mt-1">
                  {nearestExam.exam.title}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-md font-mono font-bold bg-[#fee2e2] text-[#dc2626] dark:bg-[#390909] dark:text-[#f87171] border border-[#fecaca] dark:border-[#7f1d1d]">
                    En {nearestExam.diffDays === 0 ? 'hoy' : `${nearestExam.diffDays} días`}
                  </span>
                  <span className="text-xs text-[var(--muted)] font-mono">
                    Ponderación: {nearestExam.exam.weight}%
                  </span>
                </div>
                {nearestExam.exam.topics && nearestExam.exam.topics.length > 0 && (
                  <div className="mt-3 text-[11px] text-[var(--muted)]">
                    <span className="font-bold text-[var(--ink)]">Temas: </span>
                    {nearestExam.exam.topics.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 text-xs text-[var(--muted)]">
                No hay exámenes agendados a corto plazo.
              </div>
            )}
          </div>

          <div className="mt-5 pt-3.5 border-t border-[var(--border)] text-[11px] text-[#3b3abf] dark:text-[#a0a0ff] flex items-center justify-between font-semibold">
            <span>Preparación recomendada:</span>
            <span className="text-[var(--ink)]">4 horas de estudio previo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
