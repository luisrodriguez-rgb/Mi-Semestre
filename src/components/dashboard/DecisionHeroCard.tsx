'use client';

import { useState, useMemo } from 'react';
import {
  Clock,
  MapPin,
  User,
  Play,
  Compass,
  Bookmark,
  Coffee,
  CheckCircle,
  Flame,
  Calendar,
} from 'lucide-react';
import { Subject, ScheduleBlock, Assignment, Exam, FixedRoutine, DayOfWeek } from '@/types';
import { getCurrentBlock } from '@/lib/academic-engine/schedule/getCurrentBlock';
import { formatMinutesHuman } from '@/lib/academic-engine/utils/timeHelpers';
import { useUIStore } from '@/stores/uiStore';
import { translateReasonCode } from '@/lib/utils/formatters';

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
  const [nowTimestamp] = useState<number>(() => Date.now());

  // Día de hoy
  const todayDayOfWeek = useMemo<DayOfWeek>(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : (d as DayOfWeek);
  }, []);

  const now = new Date();
  const effectiveTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const dayFormatted = useMemo(() => {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dayNames[now.getDay()];
  }, [now]);

  // Formato limpio: "Miércoles · 6:24 p.m."
  const formattedTimeDisplay = useMemo(() => {
    const [hStr, mStr] = effectiveTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const period = h >= 12 ? 'p.m.' : 'a.m.';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${dayFormatted} · ${h12}:${m.toString().padStart(2, '0')} ${period}`;
  }, [dayFormatted, effectiveTime]);

  // Clases programadas hoy
  const todayClasses = useMemo(() => {
    return classes.filter((c) => c.dayOfWeek === todayDayOfWeek);
  }, [classes, todayDayOfWeek]);

  const hasClassesToday = todayClasses.length > 0;

  // 1. Ejecución del motor académico en tiempo real
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

  // 2. Selección inteligente de la siguiente mejor acción (coherencia estricta entre título y razón)
  const recommendedTask = useMemo(() => {
    type Candidate = {
      type: 'assignment' | 'exam';
      id: string;
      title: string;
      subjectId: string;
      priorityScore: number;
      estimatedMinutes: number;
      reason: string;
      reasonCodes: string[];
    };

    const candidates: Candidate[] = [];

    // Evaluar tareas pendientes
    const pending = assignments.filter((a) => a.status !== 'completed');
    for (const a of pending) {
      const dueDiffDays = Math.max(0, (new Date(a.dueDate).getTime() - nowTimestamp) / (1000 * 60 * 60 * 24));
      const reasonCodes: string[] = [];
      if (dueDiffDays <= 2.0) reasonCodes.push('APPROACHING_DEADLINE');
      if (a.priority === 'high') reasonCodes.push('HIGH_WEIGHT');
      if (a.estimatedMinutes && a.estimatedMinutes > 45) reasonCodes.push('STUDY_DEFICIT');

      const daysText = Math.ceil(dueDiffDays) <= 1 ? 'muy pronto' : `en ${Math.ceil(dueDiffDays)} días`;
      const sub = subjectsMap[a.subjectId];
      let score = 50 - dueDiffDays * 5;
      if (a.priority === 'high') score += 20;

      candidates.push({
        type: 'assignment',
        id: a.id,
        title: a.title,
        subjectId: a.subjectId,
        priorityScore: score,
        estimatedMinutes: a.estimatedMinutes || 45,
        reason: `Entrega de "${a.title}" ${daysText} (${sub?.name || 'Materia'}).`,
        reasonCodes,
      });
    }

    // Evaluar exámenes próximos (próximos 14 días)
    for (const e of exams) {
      const examDiffDays = (new Date(e.date).getTime() - nowTimestamp) / (1000 * 60 * 60 * 24);
      if (examDiffDays >= 0 && examDiffDays <= 14) {
        const reasonCodes: string[] = [];
        if (examDiffDays <= 3) reasonCodes.push('EXAM_SOON');
        if (e.weight >= 20) reasonCodes.push('HIGH_WEIGHT');
        reasonCodes.push('STUDY_DEFICIT');

        const sub = subjectsMap[e.subjectId];
        const daysText = Math.ceil(examDiffDays) <= 1 ? 'en menos de 24 horas' : `en ${Math.ceil(examDiffDays)} días`;
        let score = 65 - examDiffDays * 4 + (e.weight || 0) * 0.5;

        candidates.push({
          type: 'exam',
          id: e.id,
          title: `Preparar: ${e.title}`,
          subjectId: e.subjectId,
          priorityScore: score,
          estimatedMinutes: 60,
          reason: `Parcial ${daysText} (${e.weight}% de ponderación en ${sub?.name || 'la materia'}).`,
          reasonCodes,
        });
      }
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.priorityScore - a.priorityScore);

    const best = candidates[0];
    const subject = subjectsMap[best.subjectId];
    // Deduplicar códigos de razón de forma estricta
    const uniqueReasonCodes = Array.from(new Set(best.reasonCodes));

    return {
      task: {
        id: best.id,
        title: best.title,
        estimatedMinutes: best.estimatedMinutes,
      },
      subject,
      reason: best.reason,
      reasonCodes: uniqueReasonCodes,
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

  // Cálculo de tiempo disponible sin suposiciones exageradas
  const freeMinutesGross = currentBlockResult.currentFreeSlot?.remainingMinutes || 90;
  // Solo restar traslados y preparación si hay clases el día de hoy
  const transitMinutes = hasClassesToday ? 15 : 0;
  const prepMinutes = hasClassesToday ? 10 : 0;
  const usableMinutes = Math.max(0, freeMinutesGross - transitMinutes - prepMinutes);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] p-5 sm:p-6 shadow-xs transition-colors">
      {/* Cabecera contextual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f0f3fa] dark:border-[#181d42]">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#626c96] dark:text-[#8b95c2] font-semibold">
            <Clock className="w-3.5 h-3.5 text-[#3b43a8] dark:text-[#8e98ec]" />
            <span>{formattedTimeDisplay}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0f1330] dark:text-white tracking-tight mt-0.5">
            ¿Qué hago ahora?
          </h2>
        </div>
      </div>

      {/* Banner compacto de 1 línea cuando no hay clases programadas hoy */}
      {!hasClassesToday && !focusSession.isActive && (
        <div className="mt-3 py-2 px-3.5 rounded-xl bg-[#f8faff] dark:bg-[#141838] border border-[#e2e8f5] dark:border-[#1e2452] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#5a6491] dark:text-[#8e98c7]">
            <Calendar className="w-3.5 h-3.5 text-[#3b43a8] dark:text-[#8e98ec]" />
            <span className="font-bold text-[#0f1330] dark:text-white">Día sin clases</span>
            <span className="hidden sm:inline">· Horario libre para avanzar a tu propio ritmo</span>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300">
            Despejado
          </span>
        </div>
      )}

      {/* Grid: 2 columnas cuando hay clases o foco activo, 1 columna de ancho completo si el día está despejado */}
      <div
        className={`grid grid-cols-1 ${
          hasClassesToday || focusSession.isActive ? 'md:grid-cols-2' : ''
        } gap-4 mt-3`}
      >
        {/* COLUMNA 1: Solo visible cuando hay clases programadas o sesión de foco activa */}
        {(hasClassesToday || focusSession.isActive) && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#f8faff] dark:bg-[#141838] border border-[#e2e8f5] dark:border-[#1e2452] flex flex-col justify-between min-h-[190px]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5a6491] dark:text-[#8e98c7] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#3b43a8] dark:text-[#8e98ec]" />
                  <span>
                    {focusSession.isActive
                      ? 'Sesión de concentración'
                      : currentBlockResult.currentClass
                      ? `${currentBlockResult.currentClass.startTime} - ${currentBlockResult.currentClass.endTime}`
                      : currentBlockResult.currentRoutine
                      ? `${currentBlockResult.currentRoutine.startTime} - ${currentBlockResult.currentRoutine.endTime}`
                      : 'Franja libre'}
                  </span>
                </span>

              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
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
                  ? 'Foco en curso'
                  : currentBlockResult.status === 'in_class'
                  ? 'En aula'
                  : currentBlockResult.status === 'in_routine'
                  ? 'Pausa / Almuerzo'
                  : hasClassesToday
                  ? 'Tiempo disponible'
                  : 'Despejado'}
              </span>
            </div>

            <div className="mt-3">
              {focusSession.isActive ? (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0f1330] dark:text-white leading-snug">
                    {focusSession.taskTitle}
                  </h3>
                  <div className="mt-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>{Math.floor(focusSession.secondsRemaining / 60)} min restantes de foco</span>
                  </div>
                </div>
              ) : currentBlockResult.currentClass ? (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0f1330] dark:text-white leading-snug">
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
                  <h3 className="font-bold text-sm sm:text-base text-[#0f1330] dark:text-white leading-snug flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{currentBlockResult.currentRoutine.title}</span>
                  </h3>
                  <p className="mt-1.5 text-xs text-[#5a6491] dark:text-[#8e98c7]">
                    Pausa programada para recargar energía sin comprometer tu ritmo.
                  </p>
                </div>
              ) : hasClassesToday ? (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0f1330] dark:text-white leading-snug">
                    Tienes {formatMinutesHuman(usableMinutes)} libres
                  </h3>
                  <p className="mt-1.5 text-xs text-[#5a6491] dark:text-[#8e98c7]">
                    {currentBlockResult.nextBlock
                      ? `Próxima clase: ${currentBlockResult.nextBlock.title} a las ${currentBlockResult.nextBlock.startTime}.`
                      : 'Sin más clases programadas para hoy.'}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0f1330] dark:text-white leading-snug flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#3b43a8] dark:text-[#8e98ec]" />
                    <span>Día despejado de clases</span>
                  </h3>
                  <p className="mt-1.5 text-xs text-[#5a6491] dark:text-[#8e98c7]">
                    No tienes horarios fijos programados hoy. Puedes avanzar en tus entregas o tomar un descanso reparador.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#e8edf7] dark:border-[#1e2452] flex items-center justify-between text-xs text-[#6b75a6]">
            <span>Estado:</span>
            <span className="font-semibold text-[#14193d] dark:text-white">
              {focusSession.isActive
                ? 'Concentración activa'
                : currentBlockResult.currentClass
                ? `Termina en ${formatMinutesHuman(currentBlockResult.currentClass.remainingMinutes)}`
                : currentBlockResult.currentRoutine
                ? `Restan ${formatMinutesHuman(currentBlockResult.currentRoutine.remainingMinutes)}`
                : hasClassesToday
                ? `${usableMinutes} min útiles`
                : 'Horario libre'}
            </span>
          </div>
        </div>
        )}

        {/* COLUMNA 2: SIGUIENTE ACCIÓN (Coherente y con chips limpios en español) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#f8faff] dark:bg-[#141838] border border-[#e2e8f5] dark:border-[#1e2452] flex flex-col justify-between min-h-[190px]">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#3b43a8] dark:text-[#8e98ec]">
              <Compass className="w-3.5 h-3.5" />
              <span>
                {focusSession.isActive
                  ? 'Objetivo en curso'
                  : currentBlockResult.status === 'in_class'
                  ? 'Atención en aula'
                  : currentBlockResult.status === 'in_routine'
                  ? 'Pausa protegida'
                  : 'Siguiente acción recomendada'}
              </span>
            </div>

            <div className="mt-2.5">
              {focusSession.isActive ? (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0f1330] dark:text-white leading-tight">
                    {focusSession.taskTitle}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    <Flame className="w-3 h-3" />
                    <span>{focusSession.subjectName || 'Enfoque'}</span>
                  </div>
                  <p className="text-xs text-[#475569] dark:text-[#94a3b8] mt-2 leading-relaxed">
                    Mantén la inmersión en tu objetivo hasta sonar el temporizador.
                  </p>
                </div>
              ) : currentBlockResult.status === 'in_class' ? (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0f1330] dark:text-white leading-tight">
                    Atención al profesor y toma de notas
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-[#3b43a8] dark:text-[#a0aaff] font-semibold">
                    <Bookmark className="w-3 h-3" />
                    <span>{currentBlockResult.currentClass?.name}</span>
                  </div>
                  <p className="text-xs text-[#475569] dark:text-[#94a3b8] mt-2 leading-relaxed">
                    Tu prioridad ahora es el aula. Las sugerencias de estudio se reactivarán al terminar la clase.
                  </p>
                </div>
              ) : currentBlockResult.status === 'in_routine' ? (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0f1330] dark:text-white leading-tight">
                    Disfruta tu tiempo de desconexión
                  </h3>
                  <p className="text-xs text-[#475569] dark:text-[#94a3b8] mt-2 leading-relaxed">
                    El descanso planificado forma parte del rendimiento académico.
                  </p>
                </div>
              ) : recommendedTask ? (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0f1330] dark:text-white leading-tight">
                    {recommendedTask.task.title}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-1 text-xs text-[#3b43a8] dark:text-[#a0aaff] font-semibold">
                    <Bookmark className="w-3 h-3" />
                    <span>{recommendedTask.subject?.name || 'Materia'}</span>
                  </div>

                  {/* Chips en español traducidos y deduplicados */}
                  {recommendedTask.reasonCodes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {recommendedTask.reasonCodes.map((rc) => (
                        <span
                          key={rc}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#e0e7ff] text-[#3730a3] dark:bg-[#1e235e] dark:text-[#a5b4fc]"
                        >
                          {translateReasonCode(rc)}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-[#475569] dark:text-[#94a3b8] mt-2 leading-relaxed">
                    {recommendedTask.reason}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0f1330] dark:text-white leading-tight">
                    Todo al día
                  </h3>
                  <p className="text-xs text-[#475569] dark:text-[#94a3b8] mt-2 leading-relaxed">
                    No tienes entregas urgentes pendientes. Puedes adelantar lecturas o tomar un descanso libre.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3">
            {focusSession.isActive ? (
              <div className="w-full py-2 px-3.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/20 text-xs font-semibold flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Concentración en curso</span>
              </div>
            ) : currentBlockResult.status === 'in_class' ? (
              <button
                onClick={() => openAttendanceModal()}
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#3039d9] hover:bg-[#252ab8] active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Registrar asistencia de hoy</span>
              </button>
            ) : currentBlockResult.status === 'in_routine' ? (
              <div className="w-full py-2 px-3.5 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold flex items-center justify-center gap-2">
                <Coffee className="w-4 h-4 text-emerald-600" />
                <span>Hora de pausa</span>
              </div>
            ) : (
              <button
                onClick={handleStartFocus}
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#0c102a] dark:bg-[#282ea8] hover:bg-[#181f4a] dark:hover:bg-[#343cc4] active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Comenzar enfoque (Pomodoro)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
