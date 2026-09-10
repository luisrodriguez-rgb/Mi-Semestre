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
  Sparkles,
} from 'lucide-react';
import { Subject, ScheduleBlock, Assignment, Exam, FixedRoutine, DayOfWeek } from '@/types';
import { getCurrentBlock } from '@/lib/academic-engine/schedule/getCurrentBlock';
import { formatMinutesHuman } from '@/lib/academic-engine/utils/timeHelpers';
import { useUIStore } from '@/stores/uiStore';

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
  const { startFocusSession } = useUIStore();

  const [simulatedTime, setSimulatedTime] = useState<string>('18:24');
  const [useRealTime, setUseRealTime] = useState<boolean>(true);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

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

  // Ejecución del motor académico
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

  // Selección inteligente de la siguiente mejor acción
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

    let reason = 'Porque tienes un parcial próximo y el trabajo requiere avance prioritario.';
    if (relatedExam) {
      reason = `Porque tienes el parcial de ${subject?.name || 'la materia'} próximo y el trabajo requiere ~1h 15m.`;
    }

    return {
      task: top,
      subject,
      reason,
    };
  }, [assignments, exams, subjectsMap]);

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

  // Cálculos de fricción para el hueco de tiempo disponible
  const freeMinutesGross = currentBlockResult.currentFreeSlot?.remainingMinutes || 100;
  const transitMinutes = 15;
  const prepMinutes = 10;
  const usableMinutes = Math.max(20, freeMinutesGross - transitMinutes - prepMinutes);

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
              <span>En tiempo real</span>
            </span>
          </div>
        </div>

        {/* Ajuste discreto de hora para pruebas */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowTimePicker(!showTimePicker)}
            className="text-[11px] font-mono text-[#7b85b2] hover:text-[#3b43a8] dark:hover:text-[#a0aaff] underline cursor-pointer"
          >
            {showTimePicker ? 'Cerrar selector' : 'Simular reloj'}
          </button>
          {showTimePicker && (
            <div className="flex items-center gap-1 bg-[#f0f3fa] dark:bg-[#161c42] p-1 rounded-xl border border-[#dce2f2] dark:border-[#22295a]">
              <select
                value={effectiveTime}
                onChange={(e) => {
                  setUseRealTime(false);
                  setSimulatedTime(e.target.value);
                }}
                className="bg-white dark:bg-[#0f1330] border border-[#d0d7ed] dark:border-[#28306a] text-xs font-mono font-bold rounded-lg px-2 py-0.5"
              >
                <option value="08:15">08:15 (Clase de mañana)</option>
                <option value="10:00">10:00 (Hueco libre 2h 10m)</option>
                <option value="14:00">14:00 (Clase tarde)</option>
                <option value="16:00">16:00 (Hueco libre 1h 40m)</option>
                <option value="18:24">18:24 (Estructuras de Datos)</option>
                <option value="20:15">20:15 (Noche libre)</option>
              </select>
              <button
                onClick={() => setUseRealTime(!useRealTime)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  useRealTime
                    ? 'bg-[#252ab8] text-white'
                    : 'bg-white dark:bg-[#0f1330] text-[#6b75a6]'
                }`}
              >
                {useRealTime ? 'Real ON' : 'Fijar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid de 3 tarjetas: AHORA · DESPUÉS · RECOMENDACIÓN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {/* 1. TARJETA AHORA */}
        <div className="p-4 rounded-xl bg-[#f8faff] dark:bg-[#141838] border border-[#e2e8f5] dark:border-[#1e2452] flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#5a6491] dark:text-[#8e98c7] font-semibold">
                <Clock className="w-3.5 h-3.5 text-[#3b43a8] dark:text-[#8e98ec]" />
                <span>
                  {currentBlockResult.currentClass
                    ? `${currentBlockResult.currentClass.startTime} - ${currentBlockResult.currentClass.endTime}`
                    : '6:00 p.m. - 8:00 p.m.'}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e0e7ff] text-[#3730a3] dark:bg-[#1e235e] dark:text-[#a5b4fc]">
                En clase
              </span>
            </div>

            <div className="mt-3">
              <h3 className="font-black text-sm sm:text-base text-[#0f1330] dark:text-white tracking-tight leading-snug">
                {currentBlockResult.currentClass?.name || 'Estructuras de Datos'}
              </h3>

              <div className="mt-2 space-y-1 text-xs text-[#5a6491] dark:text-[#8e98c7]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#3b43a8] dark:text-[#8e98ec] shrink-0" />
                  <span>
                    {currentBlockResult.currentClass?.location || 'Salón 204 · Edificio A'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#3b43a8] dark:text-[#8e98ec] shrink-0" />
                  <span>
                    {(currentBlockResult.currentClass
                      ? subjectsMap[currentBlockResult.currentClass.subjectId]?.professor
                      : null) || 'Prof. Carlos Méndez'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#e8edf7] dark:border-[#1e2452] flex items-center justify-between text-[11px] font-mono text-[#6b75a6]">
            <span>Termina en</span>
            <span className="font-bold text-[#14193d] dark:text-white">
              {currentBlockResult.currentClass
                ? formatMinutesHuman(currentBlockResult.currentClass.remainingMinutes)
                : '1h 36m'}
            </span>
          </div>
        </div>

        {/* 2. TARJETA DESPUÉS (El Hueco Libre como recurso convertible) */}
        <div className="p-4 rounded-xl bg-[#f0fdf4] dark:bg-[#072515] border border-[#86efac]/80 dark:border-[#15803d]/40 flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#16a34a] dark:text-[#4ade80]">
                DESPUÉS
              </span>
              <ChevronRight className="w-4 h-4 text-[#16a34a] dark:text-[#4ade80]" />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#16a34a] dark:text-[#4ade80] shrink-0" />
              <div className="text-xs font-black text-[#15803d] dark:text-[#4ade80] tracking-tight uppercase">
                TIENES 1h 40m LIBRES
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

          <div className="mt-2 text-[10px] text-[#166534] dark:text-[#86efac] font-mono text-center">
            75 min utilizables para estudio sin prisa
          </div>
        </div>

        {/* 3. TARJETA RECOMENDACIÓN (Mi mejor siguiente acción) */}
        <div className="p-4 rounded-xl bg-[#f8faff] dark:bg-[#141838] border border-[#e2e8f5] dark:border-[#1e2452] flex flex-col justify-between min-h-[175px]">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-[#3b43a8] dark:text-[#8e98ec]">
              <Compass className="w-3.5 h-3.5 text-[#3b43a8] dark:text-[#8e98ec]" />
              <span>RECOMENDACIÓN</span>
            </div>

            <div className="mt-2">
              <h3 className="font-bold text-xs sm:text-sm text-[#0f1330] dark:text-white leading-tight">
                {recommendedTask?.task.title || 'Informe de Laboratorio: Momento de Inercia'}
              </h3>

              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#3b43a8] dark:text-[#a0aaff] font-semibold">
                <Bookmark className="w-3 h-3 text-[#3b43a8] dark:text-[#8e98ec]" />
                <span>{recommendedTask?.subject?.name || 'Física Mecánica'}</span>
              </div>

              <div className="text-[11px] text-[#6b75a6] dark:text-[#8b95c2] font-mono mt-1">
                45 min de trabajo · 10 min margen
              </div>

              <p className="text-[11px] text-[#475569] dark:text-[#94a3b8] mt-1.5 leading-relaxed italic">
                "{recommendedTask?.reason || 'Porque tienes un parcial próximo y el trabajo requiere ~1h 15m.'}"
              </p>
            </div>
          </div>

          <button
            onClick={handleStartFocus}
            className="w-full mt-3 py-2 px-3.5 rounded-xl bg-[#0c102a] hover:bg-[#181f4a] active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Comenzar Enfoque</span>
          </button>
        </div>
      </div>
    </div>
  );
}
