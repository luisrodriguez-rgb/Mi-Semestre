'use client';

import { useState, useMemo } from 'react';
import {
  Clock,
  MapPin,
  Flame,
  Play,
  Calendar,
  Sparkles,
  CheckCircle2,
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
        recommendedTask.task.estimatedMinutes || 45
      );
    } else {
      startFocusSession('Sesión de estudio libre', 'General', 30);
    }
  };

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="card-cambas p-6 sm:p-8 bg-white relative overflow-hidden">
      {/* Header bar: Día, Saludo y Simulador temporal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#e0dff0]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#3b3abf] font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{dayNames[todayDayOfWeek - 1]} · Centro de Decisión en Tiempo Real</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0d0d14] mt-1">
            ¿Qué hago ahora?
          </h2>
        </div>

        {/* Simulador rápido para probar todos los estados */}
        <div className="flex items-center gap-2 bg-[#f5f5ff] p-1.5 rounded-xl border border-[#e0dff0] text-xs">
          <span className="text-[#7a7890] pl-2 font-mono text-[11px] font-semibold">Simular Hora:</span>
          <select
            value={effectiveTime}
            onChange={(e) => {
              setUseRealTime(false);
              setSimulatedTime(e.target.value);
            }}
            className="bg-white border border-[#e0dff0] text-[#0d0d14] rounded-lg px-2.5 py-1 font-mono text-xs font-semibold focus:outline-none focus:border-[#3b3abf]"
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
            className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition-all ${
              useRealTime
                ? 'bg-[#3b3abf] text-white'
                : 'bg-white text-[#7a7890] hover:text-[#0d0d14] border border-[#e0dff0]'
            }`}
          >
            {useRealTime ? 'Reloj Real ON' : 'Usar Reloj Real'}
          </button>
        </div>
      </div>

      {/* Grid de Estado: AHORA | DESPUÉS (Recomendación) | PRÓXIMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* 1. SECCIÓN AHORA */}
        <div className="flex flex-col justify-between rounded-2xl bg-[#f5f5ff] p-5 border border-[#e0dff0]">
          <div>
            <div className="flex items-center justify-between text-xs font-bold tracking-wide uppercase text-[#7a7890]">
              <span>Estado Actual ({effectiveTime})</span>
              {currentBlockResult.status === 'in_class' && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#ede9fe] text-[#7c3aed] border border-[#ddd6fe] text-[10px] font-mono font-bold">
                  EN CLASE
                </span>
              )}
              {currentBlockResult.status === 'in_free_slot' && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0] text-[10px] font-mono font-bold">
                  TIEMPO DISPONIBLE
                </span>
              )}
              {currentBlockResult.status === 'in_routine' && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#fef9c3] text-[#ca8a04] border border-[#fef08a] text-[10px] font-mono font-bold">
                  RUTINA FIJA
                </span>
              )}
              {currentBlockResult.status === 'off_hours' && (
                <span className="px-2.5 py-0.5 rounded-full bg-white text-[#7a7890] border border-[#e0dff0] text-[10px] font-mono font-bold">
                  DESCANSO
                </span>
              )}
            </div>

            {currentBlockResult.status === 'in_class' && currentBlockResult.currentClass && (
              <div className="mt-4">
                <div className="text-xl font-black text-[#0d0d14] tracking-tight">
                  {currentBlockResult.currentClass.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#7a7890] mt-1 font-medium">
                  <span className="font-mono text-[#3b3abf] font-bold">{currentBlockResult.currentClass.code}</span>
                  {currentBlockResult.currentClass.location && (
                    <span className="flex items-center gap-1">
                      · <MapPin className="w-3.5 h-3.5 text-[#a0a0ff]" />
                      {currentBlockResult.currentClass.location}
                    </span>
                  )}
                </div>
                <div className="mt-4 p-3 rounded-xl bg-white border border-[#e0dff0] text-xs flex items-center justify-between font-medium">
                  <span className="text-[#7a7890]">Termina en:</span>
                  <span className="font-mono font-bold text-sm text-[#3b3abf]">
                    {formatMinutesHuman(currentBlockResult.currentClass.remainingMinutes)}
                  </span>
                </div>
              </div>
            )}

            {currentBlockResult.status === 'in_free_slot' && currentBlockResult.currentFreeSlot && (
              <div className="mt-4">
                <div className="text-xl font-black text-[#16a34a] tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#16a34a]" />
                  <span>{formatMinutesHuman(currentBlockResult.currentFreeSlot.remainingMinutes)} libres</span>
                </div>
                <p className="text-xs text-[#7a7890] mt-2">
                  Ventana disponible hasta las <strong className="text-[#0d0d14]">{currentBlockResult.currentFreeSlot.endTime}</strong>. Momento ideal para avanzar sin interrupciones.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] text-[#16a34a] text-xs font-semibold">
                  Hueco utilizable detectado por el motor.
                </div>
              </div>
            )}

            {currentBlockResult.status === 'in_routine' && currentBlockResult.currentRoutine && (
              <div className="mt-4">
                <div className="text-xl font-black text-[#ca8a04] tracking-tight">
                  {currentBlockResult.currentRoutine.title}
                </div>
                <p className="text-xs text-[#7a7890] mt-2">
                  Compromiso fijo. Finaliza en {formatMinutesHuman(currentBlockResult.currentRoutine.remainingMinutes)}.
                </p>
              </div>
            )}

            {currentBlockResult.status === 'off_hours' && (
              <div className="mt-4">
                <div className="text-xl font-black text-[#0d0d14] tracking-tight">
                  Fuera de Jornada
                </div>
                <p className="text-xs text-[#7a7890] mt-2">
                  No hay clases activas en este horario.
                </p>
              </div>
            )}
          </div>

          {currentBlockResult.nextBlock && (
            <div className="mt-5 pt-3.5 border-t border-[#e0dff0] text-[11px] text-[#7a7890] flex items-center justify-between">
              <span>Siguiente:</span>
              <span className="font-bold text-[#0d0d14]">
                {currentBlockResult.nextBlock.title} ({currentBlockResult.nextBlock.startTime})
              </span>
            </div>
          )}
        </div>

        {/* 2. SECCIÓN RECOMENDACIÓN PRIORITARIA */}
        <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#1a1a5e] to-[#2828a8] text-white p-5 shadow-lg shadow-[#1a1a5e]/20 relative overflow-hidden">
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
        <div className="flex flex-col justify-between rounded-2xl bg-[#f5f5ff] p-5 border border-[#e0dff0]">
          <div>
            <div className="flex items-center justify-between text-xs font-bold tracking-wide uppercase text-[#7a7890]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#7c3aed]" />
                Próximo Parcial Crítico
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#7c3aed] border border-[#ede9fe] font-bold">
                Evaluación
              </span>
            </div>

            {nearestExam ? (
              <div className="mt-4">
                <div className="text-xs font-mono font-bold text-[#7c3aed]">
                  {subjectsMap[nearestExam.exam.subjectId]?.name || 'Materia'}
                </div>
                <div className="text-base font-bold text-[#0d0d14] tracking-tight mt-1">
                  {nearestExam.exam.title}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-md font-mono font-bold bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]">
                    En {nearestExam.diffDays === 0 ? 'hoy' : `${nearestExam.diffDays} días`}
                  </span>
                  <span className="text-xs text-[#7a7890] font-mono">
                    Ponderación: {nearestExam.exam.weight}%
                  </span>
                </div>
                {nearestExam.exam.topics && nearestExam.exam.topics.length > 0 && (
                  <div className="mt-3 text-[11px] text-[#7a7890]">
                    <span className="font-bold text-[#0d0d14]">Temas: </span>
                    {nearestExam.exam.topics.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 text-xs text-[#7a7890]">
                No hay exámenes agendados a corto plazo.
              </div>
            )}
          </div>

          <div className="mt-5 pt-3.5 border-t border-[#e0dff0] text-[11px] text-[#3b3abf] flex items-center justify-between font-semibold">
            <span>Preparación recomendada:</span>
            <span className="text-[#0d0d14]">4 horas de estudio previo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
