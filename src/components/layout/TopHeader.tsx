'use client';

import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { calculateSemesterMetrics } from '@/lib/academic-engine';
import { Clock, PlusCircle, Calendar, Upload, Play, Pause, Square } from 'lucide-react';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

export function TopHeader() {
  const {
    openImporter,
    openAddTask,
    openAddExam,
    focusSession,
    tickFocusSession,
    togglePauseFocus,
    stopFocusSession,
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
      stopFocusSession();
    }
  }, [focusSession.isActive, focusSession.secondsRemaining, stopFocusSession]);

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
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e0dff0]">
      {/* Banner de Enfoque Activo si está corriendo */}
      {focusSession.isActive && (
        <div className="bg-[#1e1e8a] text-white px-6 py-2 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="uppercase tracking-wider text-[#c5c5ff]">Sesión de Enfoque:</span>
            <span className="font-mono text-sm font-bold bg-[#10103e] px-2 py-0.5 rounded border border-[#3b3abf]">
              {formatTimer(focusSession.secondsRemaining)}
            </span>
            <span className="text-white/90 truncate max-w-md">
              {focusSession.taskTitle} {focusSession.subjectName && `(${focusSession.subjectName})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePauseFocus}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1"
            >
              {focusSession.isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-300" />}
              {focusSession.isPaused ? 'Reanudar' : 'Pausar'}
            </button>
            <button
              onClick={stopFocusSession}
              className="px-2.5 py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 text-xs font-medium flex items-center gap-1"
            >
              <Square className="w-3 h-3" />
              Finalizar
            </button>
          </div>
        </div>
      )}

      {/* Main Top Header Bar */}
      <div className="px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7a7890] bg-[#f5f5ff] px-3 py-1.5 rounded-full border border-[#e0dff0]">
            <Clock className="w-3.5 h-3.5 text-[#3b3abf]" />
            <span className="font-bold text-[#0d0d14]">{timeStr || '16:00'}</span>
          </div>

          {metrics && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#0d0d14] font-medium bg-[#f0fdf4] border border-[#dcfce7] px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              <span>Semana {metrics.currentWeek} de {metrics.totalWeeks} ({metrics.progressPercentage}% completado)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openAddTask}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#f0f0ff] text-[#1e1e8a] border border-[#e0dff0] text-xs font-bold transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#3b3abf]" />
            <span>+ Tarea</span>
          </button>

          <button
            onClick={openAddExam}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#f0f0ff] text-[#1e1e8a] border border-[#e0dff0] text-xs font-bold transition-all shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span>+ Parcial</span>
          </button>

          <button
            onClick={openImporter}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold shadow-md shadow-[#3b3abf]/25 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Horario</span>
          </button>
        </div>
      </div>
    </div>
  );
}
