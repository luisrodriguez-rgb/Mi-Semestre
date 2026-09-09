'use client';

import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { calculateSemesterMetrics } from '@/lib/academic-engine';
import { Clock, PlusCircle, Calendar, Upload, Play, Pause, Square, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

import { ThemeToggle } from '@/components/common/ThemeToggle';

export function TopHeader() {
  const {
    openImporter,
    openOnboarding,
    openAddTask,
    openAddExam,
    focusSession,
    tickFocusSession,
    togglePauseFocus,
    stopFocusSession,
    openFocusCompletion,
  } = useUIStore();

  const { semester } = useSemesterData();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      setTimeStr(
        new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      );
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
  }, [focusSession.isActive, focusSession.secondsRemaining, focusSession.totalMinutes, focusSession.taskId, focusSession.taskTitle, focusSession.subjectName, openFocusCompletion, stopFocusSession]);

  const handleManualStop = () => {
    const elapsedMinutes = Math.round((focusSession.totalMinutes * 60 - focusSession.secondsRemaining) / 60);
    openFocusCompletion({
      taskId: focusSession.taskId,
      taskTitle: focusSession.taskTitle,
      subjectName: focusSession.subjectName,
      minutesPlanned: focusSession.totalMinutes,
      minutesElapsed: Math.max(1, elapsedMinutes),
    });
    stopFocusSession();
  };

  const metrics = semester
    ? calculateSemesterMetrics({
        startDate: semester.startDate,
        endDate: semester.endDate,
      })
    : null;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="sticky top-0 z-30 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] transition-colors">
      {/* Banner de Enfoque Activo si está corriendo */}
      {focusSession.isActive && (
        <div className="bg-[#1e1e8a] dark:bg-[#151738] text-white px-6 py-2 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="uppercase tracking-wider text-[#c5c5ff]">Sesión de Enfoque:</span>
            <span className="font-mono text-sm font-bold bg-[#10103e] dark:bg-[#090a14] px-2 py-0.5 rounded border border-[#3b3abf]">
              {formatTimer(focusSession.secondsRemaining)}
            </span>
            <span className="text-white/90 truncate max-w-md">
              {focusSession.taskTitle} {focusSession.subjectName && `(${focusSession.subjectName})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePauseFocus}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              {focusSession.isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-300" />}
              {focusSession.isPaused ? 'Reanudar' : 'Pausar'}
            </button>
            <button
              onClick={handleManualStop}
              className="px-2.5 py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <Square className="w-3 h-3" />
              Finalizar
            </button>
          </div>
        </div>
      )}

      {/* Main Top Header Bar */}
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Brand (hidden on desktop because sidebar is visible) */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#3b3abf] text-white flex items-center justify-center font-black text-xs shadow-sm">
              MS
            </div>
            <div className="font-extrabold text-sm text-[var(--ink)]">
              MI SEMESTRE<span className="text-[#3b3abf]">+</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[var(--muted)] bg-[var(--paper)] px-3 py-1.5 rounded-full border border-[var(--border)]">
            <Clock className="w-3.5 h-3.5 text-[#3b3abf]" />
            <span className="font-bold text-[var(--ink)]">{timeStr || '16:00'}</span>
          </div>

          {metrics && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-full shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Semana {metrics.currentWeek} de {metrics.totalWeeks} ({metrics.progressPercentage}% completado)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          <button
            onClick={openAddTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--paper)] text-[#1e1e8a] dark:text-[#a0a0ff] border border-[var(--border)] text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Añadir Tarea"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#3b3abf]" />
            <span className="hidden sm:inline">+ Tarea</span>
          </button>

          <button
            onClick={openAddExam}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--paper)] text-[#1e1e8a] dark:text-[#a0a0ff] border border-[var(--border)] text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Añadir Parcial"
          >
            <Calendar className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span className="hidden sm:inline">+ Parcial</span>
          </button>

          <button
            onClick={openOnboarding}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#3b3abf] to-[#7c3aed] hover:opacity-95 text-white text-xs font-extrabold shadow-md shadow-[#3b3abf]/30 transition-all cursor-pointer"
            title="Asistente de Configuración Inteligente (IA / Plantillas / Desde Cero)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Configurar Semestre</span>
          </button>
        </div>
      </div>
    </div>
  );
}
