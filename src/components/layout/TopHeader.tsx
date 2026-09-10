'use client';

import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { calculateSemesterMetrics } from '@/lib/academic-engine';
import {
  Calendar,
  Clock,
  Plus,
  CloudUpload,
  Play,
  Pause,
  Bell,
  Sparkles,
  Timer,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export function TopHeader() {
  const {
    openImporter,
    openOnboarding,
    openAddTask,
    openAddExam,
    openProfile,
    focusSession,
    tickFocusSession,
    togglePauseFocus,
    stopFocusSession,
    openFocusCompletion,
  } = useUIStore();

  const { semester, profile } = useSemesterData();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true })
      );
      // Ej: Mié, 9 de sep. 2026
      const formattedDate = now.toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      setDateStr(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (focusSession.isActive && !focusSession.isPaused) {
      t = setInterval(tickFocusSession, 1000);
    }
    return () => clearInterval(t);
  }, [focusSession.isActive, focusSession.isPaused, tickFocusSession]);

  useEffect(() => {
    if (focusSession.isActive && focusSession.secondsRemaining === 0) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      const elapsedMinutes = Math.round((focusSession.totalMinutes * 60 - focusSession.secondsRemaining) / 60);
      openFocusCompletion({
        taskId: focusSession.taskId,
        taskTitle: focusSession.taskTitle,
        subjectName: focusSession.subjectName,
        minutesPlanned: focusSession.totalMinutes,
        minutesElapsed: Math.max(1, elapsedMinutes),
      });
      stopFocusSession();
    }
  }, [focusSession, openFocusCompletion, stopFocusSession]);

  const metrics = semester
    ? calculateSemesterMetrics({
        startDate: semester.startDate,
        endDate: semester.endDate,
        totalWeeks: semester.totalWeeks || 16,
      })
    : { currentWeek: 6, totalWeeks: 16, progressPercentage: 37, daysRemaining: 68 };

  const studentName = profile?.name || 'Estudiante';
  const initials = studentName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0a0d20]/95 backdrop-blur-md border-b border-[#e2e6f2] dark:border-[#191f42] transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Lado Izquierdo: Fecha y Progreso Semestral */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Fecha y Hora en vivo */}
          <div className="flex items-center gap-2.5 text-xs text-[#2c3258] dark:text-[#c4cbef]">
            <div className="p-1 rounded-md bg-[#f0f3fa] dark:bg-[#141938] text-[#38418f] dark:text-[#8e98ec]">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="font-semibold">
              <span className="text-[11px] text-[#69729a] dark:text-[#828cb8] block leading-none">
                {dateStr || 'Mié, 9 de sep. 2026'}
              </span>
              <span className="text-xs font-black text-[#14193d] dark:text-white mt-0.5 block font-mono">
                {timeStr || '6:24 p.m.'}
              </span>
            </div>
          </div>

          <div className="hidden md:block w-px h-6 bg-[#e2e6f2] dark:bg-[#202750]" />

          {/* Barra de Progreso Semanal */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="text-[11px] font-bold text-[#14193d] dark:text-[#c4cbef]">
              Semana {metrics.currentWeek} de {metrics.totalWeeks}
            </div>
            <div className="w-24 bg-[#e5e9f5] dark:bg-[#1b2247] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#2a30b0] dark:bg-[#5b64f5] h-full rounded-full transition-all"
                style={{ width: `${metrics.progressPercentage}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-[#626c96] dark:text-[#8894c7]">
              {metrics.progressPercentage}%
            </span>
          </div>
        </div>

        {/* Lado Derecho: Enfoque, Acciones y Avatar */}
        <div className="flex items-center gap-2.5">
          {/* Mini Enfoque Pomodoro: Solo visible cuando hay sesión activa para descongestionar el header */}
          {focusSession.isActive && (
            <div className="flex items-center gap-2 bg-[#f4f7fd] dark:bg-[#121636] px-3 py-1.5 rounded-xl border border-[#e2e6f2] dark:border-[#1e2552] text-xs animate-in fade-in zoom-in-95 duration-200">
              <Timer className="w-3.5 h-3.5 text-[#3b43a8] dark:text-[#8e98ec] animate-pulse" />
              <div className="text-left">
                <div className="text-[9px] font-mono uppercase text-[#737da8] leading-none truncate max-w-[90px]">
                  {focusSession.taskTitle || 'Enfoque'}
                </div>
                <div className="font-mono font-black text-xs text-[#14193d] dark:text-white">
                  {`${Math.floor(focusSession.secondsRemaining / 60)}:${(focusSession.secondsRemaining % 60).toString().padStart(2, '0')}`}
                </div>
              </div>
              <button
                onClick={togglePauseFocus}
                className="w-6 h-6 rounded-full bg-[#202588] dark:bg-[#434bd8] text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer ml-1"
                title={focusSession.isPaused ? 'Reanudar' : 'Pausar'}
              >
                {focusSession.isPaused ? (
                  <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
                ) : (
                  <Pause className="w-2.5 h-2.5" />
                )}
              </button>
            </div>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Botón + Tarea */}
          <button
            onClick={openAddTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#141938] hover:bg-[#f5f8ff] text-[#202758] dark:text-[#c4cbef] border border-[#d6dced] dark:border-[#222958] text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#2b32a0] dark:text-[#8e98ec]" />
            <span>Tarea</span>
          </button>

          {/* Botón + Parcial */}
          <button
            onClick={openAddExam}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#141938] hover:bg-[#f5f8ff] text-[#202758] dark:text-[#c4cbef] border border-[#d6dced] dark:border-[#222958] text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#2b32a0] dark:text-[#8e98ec]" />
            <span>Parcial</span>
          </button>

          {/* Botón Importar Horario / Setup */}
          <button
            onClick={openOnboarding}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0c102a] dark:bg-[#181d45] hover:bg-[#161c47] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <CloudUpload className="w-3.5 h-3.5 text-[#8e98ec]" />
            <span className="hidden md:inline">Importar Horario</span>
          </button>

          {/* Notificaciones */}
          <button
            className="p-2 rounded-xl text-[#6b76ad] hover:text-[#202758] dark:hover:text-white hover:bg-[#f0f3fa] dark:hover:bg-[#141938] transition-colors cursor-pointer"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Avatar Header */}
          <div
            onClick={openProfile}
            className="w-8 h-8 rounded-full bg-[#202588] text-white font-black text-xs flex items-center justify-center cursor-pointer shadow-xs border border-white/20"
            title={studentName}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
