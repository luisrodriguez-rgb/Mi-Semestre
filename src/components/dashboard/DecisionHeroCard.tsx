'use client';

import { useState, useMemo } from 'react';
import {
  Clock,
  MapPin,
  User,
  ChevronRight,
  Play,
  Compass,
  Bookmark,
  Coffee,
  CheckCircle,
  Flame,
} from 'lucide-react';
import { Subject, ScheduleBlock, Assignment, Exam, FixedRoutine, DayOfWeek } from '@/types';
import { getCurrentBlock } from '@/lib/academic-engine/schedule/getCurrentBlock';
import { formatMinutesHuman } from '@/lib/academic-engine/utils/timeHelpers';
import { useUIStore } from '@/stores/uiStore';
import { CustomSelect, CustomSelectOption } from '@/components/ui/CustomSelect';

const SIMULATED_TIME_OPTIONS: CustomSelectOption[] = [
  { value: '08:15', label: '08:15', sublabel: 'Clase de mañana' },
  { value: '10:00', label: '10:00', sublabel: 'Hueco libre 2h 10m' },
  { value: '12:45', label: '12:45', sublabel: 'Hora de Almuerzo' },
  { value: '14:00', label: '14:00', sublabel: 'Clase tarde' },
  { value: '16:00', label: '16:00', sublabel: 'Hueco libre 1h 40m' },
  { value: '18:24', label: '18:24', sublabel: 'Estructuras de Datos' },
  { value: '20:15', label: '20:15', sublabel: 'Noche libre' },
];

interface DecisionHeroCardProps {
  classes: ScheduleBlock[];
  subjectsMap: Record<string, Subject>;
  routines: FixedRoutine[];
  assignments: Assignment[];
  exams: Exam[];
}

export function DecisionHeroCard({
  classes,
  subjectsMap,
  routines,
  assignments,
  exams,
}: DecisionHeroCardProps) {
  const { startFocusSession, focusSession, openAttendanceModal } = useUIStore();

  const [simulatedTime, setSimulatedTime] = useState<string>('18:24');
  const [useRealTime, setUseRealTime] = useState<boolean>(true);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [nowTimestamp] = useState<number>(() => Date.now());

  // Día de hoy
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

  const dayFormatted = useMemo(() => {
    const now = new Date();
    const dayNames = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    return dayNames[now.getDay()];
  }, []);

  // Formato para mostrar: "MIÉRCOLES · 6:24 p.m."
  const formattedTimeDisplay = useMemo(() => {
    const [hStr, mStr] = effectiveTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const period = h >= 12 ? 'p.m.' : 'a.m.';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${dayFormatted} · ${h12}:${m.toString().padStart(2, '0')} ${period}`;
  }, [dayFormatted, effectiveTime]);

  // 1. HARD CONSTRAINTS: Ejecución del motor académico en tiempo real
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

  // 2. CANDIDATE ELIGIBILITY & SCORING: Selección inteligente de la siguiente mejor acción
  const recommendedTask = useMemo(() => {
    const pending = assignments.filter((a) => a.status !== 'completed');
    if (pending.length === 0) return null;

    const sorted = [...pending].sort((a, b) => {
      const examA = exams.find((e) => e.subjectId === a.subjectId);
      const examB = exams.find((e) => e.subjectId === b.subjectId);
      const timeA = examA ? new Date(examA.date).getTime() : Infinity;
      const timeB = examB ? new Date(examB.date).getTime() : Infinity;

      if (timeA !== timeB) return timeA - timeB;
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    const top = sorted[0];
    const subject = subjectsMap[top.subjectId];
    const relatedExam = exams.find((e) => e.subjectId === top.subjectId);

    const reasonCodes: string[] = [];
    let reason = 'Entrega pendiente que requiere avance prioritario.';
    if (relatedExam) {
      const diffDays = Math.max(0, (new Date(relatedExam.date).getTime() - nowTimestamp) / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) reasonCodes.push('EXAM_SOON');
      if (relatedExam.weight >= 20) reasonCodes.push('HIGH_WEIGHT');
      reason = `Parcial próximo de ${subject?.name || 'la materia'} (${relatedExam.weight}%). Requiere avance de preparación.`;
    }

    const dueDiffDays = Math.max(0, (new Date(top.dueDate).getTime() - nowTimestamp) / (1000 * 60 * 60 * 24));
    if (dueDiffDays <= 2.0) reasonCodes.push('APPROACHING_DEADLINE');
    if (top.priority === 'high') reasonCodes.push('HIGH_WEIGHT');
    if (top.estimatedMinutes && top.estimatedMinutes > 45) reasonCodes.push('STUDY_DEFICIT');

    return {
      task: top,
      subject,
      reason,
      reasonCodes,
    };
  }, [assignments, exams, subjectsMap, nowTimestamp]);

  const handleStartFocus = () => {
    if (recommendedTask) {
      startFocusSession(
        recommendedTask.task.title,
        recommendedTask.subject?.name || 'Materia',
        recommendedTask.task.estimatedMinutes || 45,
        recommendedTask.task.id
      );
    } else {
      startFocusSession('Sesión de Enfoque Académico', 'Auto-estudio', 45);
    }
  };

  // Cálculos de fricción temporal para el hueco de tiempo disponible
  const freeMinutesGross = currentBlockResult.currentFreeSlot?.remainingMinutes || 90;
  const transitMinutes = 15;
  const prepMinutes = 10;
  const usableMinutes = Math.max(0, freeMinutesGross - transitMinutes - prepMinutes);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] p-6 shadow-xs transition-colors">
      {/* Cabecera contextual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f0f3fa] dark:border-[#181d42]">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider uppercase text-[#626c96] dark:text-[#8b95c2]">
            <Clock className="w-3.5 h-3.5 text-[#3b43a8] dark:text-[#8e98ec]" />
            <span>{formattedTimeDisplay}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#0f1330] dark:text-white tracking-tight">
              ¿Qué hago ahora?
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ecfdf5] text-[#059669] dark:bg-[#064e3b]/40 dark:text-[#34d399] border border-[#a7f3d0] dark:border-[#059669]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              <span>Jerarquía de Decisión Activa</span>
            </span>
          </div>
        </div>

        {/* Ajuste discreto de hora para pruebas de decisión */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowTimePicker(!showTimePicker)}
            className="text-[11px] font-mono text-[#7b85b2] hover:text-[#3b43a8] dark:hover:text-[#a0aaff] underline cursor-pointer"
          >
            {showTimePicker ? 'Cerrar selector' : 'Simular reloj'}
          </button>
          {showTimePicker && (
            <div className="flex items-center gap-1.5 bg-[#f0f3fa] dark:bg-[#161c42] p-1 rounded-xl border border-[#dce2f2] dark:border-[#22295a]">
              <CustomSelect
                value={effectiveTime}
                onChange={(val) => {
                  setUseRealTime(false);
                  setSimulatedTime(val);
                }}
                options={SIMULATED_TIME_OPTIONS}
                align="right"
                buttonClassName="py-0.5 px-2.5 font-mono text-xs"
              />
              <button
                onClick={() => setUseRealTime(!useRealTime)}
                className={`px-2 py-1 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  useRealTime
                    ? 'bg-[#252ab8] text-white shadow-2xs'
                    : 'bg-white dark:bg-[#0f1330] text-[#6b75a6] border border-[#dce2f2] dark:border-[#22295a]'
                }`}
              >
                {useRealTime ? 'Real ON' : 'Fijar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid de 3 tarjetas: ESTADO ACTUAL · RECURSO TEMPORAL · ACCIÓN PRIORITARIA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {/* 1. TARJETA AHORA (Restricciones duras en vivo) */}
        <div className="p-4 rounded-xl bg-[#f8faff] dark:bg-[#141838] border border-[#e2e8f5] dark:border-[#1e2452] flex flex-col justify-between min-h-[185px]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#5a6491] dark:text-[#8e98c7] font-semibold">
                <Clock className="w-3.5 h-3.5 text-[#3b43a8] dark:text-[#8e98ec]" />
                <span>
                  {focusSession.isActive
                    ? 'Sesión de Foco Activa'
                    : currentBlockResult.currentClass
                    ? `${currentBlockResult.currentClass.startTime} - ${currentBlockResult.currentClass.endTime}`
                    : currentBlockResult.currentRoutine
                    ? `${currentBlockResult.currentRoutine.startTime} - ${currentBlockResult.currentRoutine.endTime}`
                    : 'Franja Libre'}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  focusSession.isActive
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : currentBlockResult.status === 'in_class'
                    ? 'bg-[#e0e7ff] text-[#3730a3] dark:bg-[#1e235e] dark:text-[#a5b4fc]'
                    : currentBlockResult.status === 'in_routine'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                }`}
              >
                {focusSession.isActive
                  ? 'Pomodoro en curso'
                  : currentBlockResult.status === 'in_class'
                  ? 'En clase'
                  : currentBlockResult.status === 'in_routine'
                  ? 'Rutina / Almuerzo'
                  : 'Tiempo libre'}
              </span>
            </div>

            <div className="mt-3">
              {focusSession.isActive ? (
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[#0f1330] dark:text-white tracking-tight leading-snug">
                    {focusSession.taskTitle}
                  </h3>
                  <div className="mt-2 text-xs font-mono text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>{Math.floor(focusSession.secondsRemaining / 60)} min restantes de foco</span>
                  </div>
                </div>
              ) : currentBlockResult.currentClass ? (
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[#0f1330] dark:text-white tracking-tight leading-snug">
                    {currentBlockResult.currentClass.name}
                  </h3>
                  <div className="mt-2 space-y-1 text-xs text-[#5a6491] dark:text-[#8e98c7]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#3b43a8] dark:text-[#8e98ec] shrink-0" />
                      <span>{currentBlockResult.currentClass.location || 'Campus Universitario'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#3b43a8] dark:text-[#8e98ec] shrink-0" />
                      <span>{subjectsMap[currentBlockResult.currentClass.subjectId]?.professor || 'Docente'}</span>
                    </div>
                  </div>
                </div>
              ) : currentBlockResult.currentRoutine ? (
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[#0f1330] dark:text-white tracking-tight leading-snug flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{currentBlockResult.currentRoutine.title}</span>
                  </h3>
                  <p className="mt-2 text-xs text-[#5a6491] dark:text-[#8e98c7]">
                    Pausa fija programada en tu horario para recargar energía.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[#0f1330] dark:text-white tracking-tight leading-snug">
                    Ventana Disponible
                  </h3>
                  <p className="mt-2 text-xs text-[#5a6491] dark:text-[#8e98c7]">
                    {currentBlockResult.nextBlock
                      ? `Próximo compromiso: ${currentBlockResult.nextBlock.title} a las ${currentBlockResult.nextBlock.startTime}`
                      : 'Sin más clases programadas para el resto del día.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#e8edf7] dark:border-[#1e2452] flex items-center justify-between text-[11px] font-mono text-[#6b75a6]">
            <span>Estado</span>
            <span className="font-bold text-[#14193d] dark:text-white">
              {focusSession.isActive
                ? 'Concentración activa'
                : currentBlockResult.currentClass
                ? `Termina en ${formatMinutesHuman(currentBlockResult.currentClass.remainingMinutes)}`
                : currentBlockResult.currentRoutine
                ? `Restan ${formatMinutesHuman(currentBlockResult.currentRoutine.remainingMinutes)}`
                : 'Disponible'}
            </span>
          </div>
        </div>

        {/* 2. TARJETA DESPUÉS / RECURSO (Disponibilidad y Fricción) */}
        <div className="p-4 rounded-xl bg-[#f0fdf4] dark:bg-[#072515] border border-[#86efac]/80 dark:border-[#15803d]/40 flex flex-col justify-between min-h-[185px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#16a34a] dark:text-[#4ade80]">
                {currentBlockResult.status === 'in_routine' ? 'TIEMPO PROTEGIDO' : 'RECURSO DE TIEMPO'}
              </span>
              <ChevronRight className="w-4 h-4 text-[#16a34a] dark:text-[#4ade80]" />
            </div>

            {currentBlockResult.status === 'in_routine' ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-[#15803d] dark:text-[#4ade80] uppercase">
                  <Coffee className="w-4 h-4 shrink-0" />
                  <span>ALMUERZO / DESCANSO ACTIVO</span>
                </div>
                <p className="text-xs text-[#4b5563] dark:text-[#9ca3af] leading-relaxed">
                  El sistema no programa sesiones de estudio durante tus horas de almuerzo para proteger tu salud cognitiva.
                </p>
              </div>
            ) : (
              <div>
                <div className="mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#16a34a] dark:text-[#4ade80] shrink-0" />
                  <div className="text-xs font-black text-[#15803d] dark:text-[#4ade80] tracking-tight uppercase">
                    TIENES {formatMinutesHuman(freeMinutesGross)} LIBRES
                  </div>
                </div>

                {/* Desglose de fricción temporal */}
                <div className="mt-2.5 p-2.5 rounded-lg bg-white/70 dark:bg-[#051c10]/60 border border-[#bbf7d0] dark:border-[#14532d] text-[11px] font-mono space-y-1">
                  <div className="flex justify-between text-[#4b5563] dark:text-[#9ca3af]">
                    <span>Tiempo bruto</span>
                    <span>{freeMinutesGross} min</span>
                  </div>
                  <div className="flex justify-between text-amber-700 dark:text-amber-400">
                    <span>Traslados</span>
                    <span>-{transitMinutes} min</span>
                  </div>
                  <div className="flex justify-between text-amber-700 dark:text-amber-400">
                    <span>Preparación</span>
                    <span>-{prepMinutes} min</span>
                  </div>
                  <div className="pt-1 border-t border-[#bbf7d0] dark:border-[#14532d] flex justify-between font-black text-[#15803d] dark:text-[#4ade80] text-xs">
                    <span>Tiempo útil</span>
                    <span>{usableMinutes} min</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 text-[10px] text-[#166534] dark:text-[#86efac] font-mono text-center">
            {currentBlockResult.status === 'in_routine'
              ? 'Protección contra agotamiento mental'
              : `${usableMinutes} min utilizables sin saturación`}
          </div>
        </div>

        {/* 3. TARJETA RECOMENDACIÓN / DECISIÓN (Pipeline de Acción) */}
        <div className="p-4 rounded-xl bg-[#f8faff] dark:bg-[#141838] border border-[#e2e8f5] dark:border-[#1e2452] flex flex-col justify-between min-h-[185px]">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-[#3b43a8] dark:text-[#8e98ec]">
              <Compass className="w-3.5 h-3.5 text-[#3b43a8] dark:text-[#8e98ec]" />
              <span>
                {focusSession.isActive
                  ? 'OBJETIVO EN EJECUCIÓN'
                  : currentBlockResult.status === 'in_class'
                  ? 'ATENCIÓN EN AULA'
                  : currentBlockResult.status === 'in_routine'
                  ? 'PAUSA PROTEGIDA'
                  : 'SIGUIENTE ACCIÓN'}
              </span>
            </div>

            <div className="mt-2">
              {focusSession.isActive ? (
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#0f1330] dark:text-white leading-tight">
                    {focusSession.taskTitle}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    <Flame className="w-3 h-3" />
                    <span>{focusSession.subjectName || 'Enfoque'}</span>
                  </div>
                  <p className="text-[11px] text-[#475569] dark:text-[#94a3b8] mt-2 leading-relaxed">
                    Mantén la inmersión en tu objetivo actual sin cambiar de foco hasta sonar el temporizador.
                  </p>
                </div>
              ) : currentBlockResult.status === 'in_class' ? (
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#0f1330] dark:text-white leading-tight">
                    Atención al Profesor y Toma de Notas
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#3b43a8] dark:text-[#a0aaff] font-semibold">
                    <Bookmark className="w-3 h-3 text-[#3b43a8] dark:text-[#8e98ec]" />
                    <span>{currentBlockResult.currentClass?.name}</span>
                  </div>
                  <p className="text-[11px] text-[#475569] dark:text-[#94a3b8] mt-2 leading-relaxed italic">
                    &ldquo;Tu prioridad ahora es el aula. Las recomendaciones de estudio se habilitarán al finalizar la clase.&rdquo;
                  </p>
                </div>
              ) : currentBlockResult.status === 'in_routine' ? (
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#0f1330] dark:text-white leading-tight">
                    Disfruta tu tiempo de desconexión
                  </h3>
                  <p className="text-[11px] text-[#475569] dark:text-[#94a3b8] mt-2 leading-relaxed italic">
                    &ldquo;El descanso planificado forma parte del rendimiento académico. No recomendamos estudiar con la comida.&rdquo;
                  </p>
                </div>
              ) : recommendedTask ? (
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#0f1330] dark:text-white leading-tight">
                    {recommendedTask.task.title}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#3b43a8] dark:text-[#a0aaff] font-semibold">
                    <Bookmark className="w-3 h-3 text-[#3b43a8] dark:text-[#8e98ec]" />
                    <span>{recommendedTask.subject?.name || 'Materia'}</span>
                  </div>

                  {/* Etiquetas auditables reasonCodes */}
                  {recommendedTask.reasonCodes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {recommendedTask.reasonCodes.map((rc) => (
                        <span
                          key={rc}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#e0e7ff] text-[#3730a3] dark:bg-[#1e235e] dark:text-[#a5b4fc]"
                        >
                          {rc}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-[#475569] dark:text-[#94a3b8] mt-1.5 leading-relaxed italic">
                    &ldquo;{recommendedTask.reason}&rdquo;
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-[#0f1330] dark:text-white leading-tight">
                    ¡Todo al día!
                  </h3>
                  <p className="text-[11px] text-[#475569] dark:text-[#94a3b8] mt-2 leading-relaxed">
                    No tienes tareas urgentes pendientes. Puedes adelantar lecturas o tomar un descanso libre.
                  </p>
                </div>
              )}
            </div>
          </div>

          {focusSession.isActive ? (
            <div className="w-full mt-3 py-2 px-3.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/20 text-xs font-bold flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Foco en Progreso</span>
            </div>
          ) : currentBlockResult.status === 'in_class' ? (
            <button
              onClick={() => openAttendanceModal()}
              className="w-full mt-3 py-2 px-3.5 rounded-xl bg-[#3039d9] hover:bg-[#252ab8] active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Registrar Asistencia de Hoy</span>
            </button>
          ) : currentBlockResult.status === 'in_routine' ? (
            <div className="w-full mt-3 py-2 px-3.5 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold flex items-center justify-center gap-2">
              <Coffee className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hora de Desconexión</span>
            </div>
          ) : (
            <button
              onClick={handleStartFocus}
              className="w-full mt-3 py-2 px-3.5 rounded-xl bg-[#0c102a] hover:bg-[#181f4a] active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Comenzar Enfoque</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
