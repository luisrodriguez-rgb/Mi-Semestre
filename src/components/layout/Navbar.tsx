'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Layers,
  Upload,
  PlusCircle,
  Play,
  Pause,
  Square,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { calculateSemesterMetrics } from '@/lib/academic-engine';
import { resetDatabaseToDemo } from '@/lib/mockData';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

export function Navbar() {
  const pathname = usePathname();
  const {
    openImporter,
    openAddTask,
    openAddExam,
    focusSession,
    tickFocusSession,
    togglePauseFocus,
    stopFocusSession,
  } = useUIStore();

  const { semester, refreshData } = useSemesterData();
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pomodoro focus timer tick
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (focusSession.isActive && !focusSession.isPaused) {
      timer = setInterval(() => {
        tickFocusSession();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [focusSession.isActive, focusSession.isPaused, tickFocusSession]);

  // Trigger celebration when timer hits 0
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

  const navLinks = [
    { href: '/dashboard', label: '¿Qué hago ahora?', icon: Clock },
    { href: '/schedule', label: 'Horario Inteligente', icon: Calendar },
    { href: '/radar', label: 'Radar de Riesgo', icon: AlertTriangle },
    { href: '/timeline', label: 'Línea de Semanas', icon: Layers },
  ];

  const handleResetDemo = async () => {
    if (confirm('¿Restablecer datos del semestre al estado de demostración?')) {
      await resetDatabaseToDemo();
      await refreshData();
      window.location.reload();
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      {/* Barra de Sesión de Enfoque Activa */}
      {focusSession.isActive && (
        <div className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-indigo-950/90 border-b border-indigo-500/30 px-4 py-2 flex items-center justify-between text-xs font-medium text-indigo-100 animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-white tracking-wide uppercase">Sesión de Enfoque Activa:</span>
            <span className="text-indigo-200 font-mono text-sm font-bold bg-black/40 px-2 py-0.5 rounded border border-indigo-500/30">
              {formatTimer(focusSession.secondsRemaining)}
            </span>
            <span className="truncate max-w-xs text-white/90">
              {focusSession.taskTitle} {focusSession.subjectName && `· ${focusSession.subjectName}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={togglePauseFocus}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-all text-xs"
            >
              {focusSession.isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-300" />}
              {focusSession.isPaused ? 'Reanudar' : 'Pausar'}
            </button>
            <button
              onClick={stopFocusSession}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all text-xs"
            >
              <Square className="w-3 h-3" />
              Terminar
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Semester Badge */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                Mi Semestre
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase">
                  OS Estudiantil
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                <span>{semester?.name || 'Semestre 2026-2'}</span>
                {metrics && (
                  <span className="text-emerald-400 font-medium">
                    Semana {metrics.currentWeek}/{metrics.totalWeeks} · {metrics.progressPercentage}%
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (pathname === '/' && link.href === '/dashboard');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/5 text-slate-300 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentTimeStr || '16:00:00'}</span>
          </div>

          <button
            onClick={openAddTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold transition-all"
            title="Añadir Tarea Pendiente"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Tarea</span>
          </button>

          <button
            onClick={openAddExam}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold transition-all"
            title="Añadir Parcial o Examen"
          >
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Parcial</span>
          </button>

          <button
            onClick={openImporter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
            title="Importar horario de universidad"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Importar</span>
          </button>

          <button
            onClick={handleResetDemo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
            title="Restablecer datos de prueba"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
