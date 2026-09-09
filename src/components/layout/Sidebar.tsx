'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  Calendar,
  AlertTriangle,
  Layers,
  Sparkles,
  PlusCircle,
  RotateCcw,
  User,
  GraduationCap,
  Award,
  CheckSquare,
  Settings,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { resetDatabaseToDemo } from '@/lib/mockData';

export function Sidebar() {
  const pathname = usePathname();
  const { openOnboarding, openAddTask, openAddExam, openProfile } = useUIStore();
  const { profile, semester, refreshData } = useSemesterData();

  const handleReset = async () => {
    if (confirm('¿Restablecer datos del semestre al estado inicial de demostración?')) {
      await resetDatabaseToDemo();
      await refreshData();
      window.location.reload();
    }
  };

  const isDashboard = pathname === '/dashboard' || pathname === '/';

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-[#16164f] dark:bg-[#0b0c1b] text-white flex-col justify-between border-r border-[#26266f] dark:border-[#1d1f3b] h-screen sticky top-0 overflow-y-auto transition-colors z-40">
      {/* Top Header & Brand */}
      <div>
        <div className="p-5 border-b border-[#252570]/60">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#3b3abf] flex items-center justify-center shadow-md shadow-black/20 group-hover:scale-105 transition-transform">
              <span className="font-black text-xs text-white">MS</span>
            </div>
            <div>
              <div className="font-black text-sm tracking-tight text-white flex items-center gap-1">
                MI SEMESTRE<span className="text-[#a0a0ff]">+</span>
              </div>
              <div className="text-[10px] text-[#a0a0ff] font-mono truncate max-w-[150px]">
                {semester?.name || 'Icesi · Semestre 2026-2'}
              </div>
            </div>
          </Link>
        </div>

        {/* ══════════════════════════════════════════════════════════
            NAVEGACIÓN CATEGORIZADA: CENTRO · ORGANIZAR · ENTENDER
           ══════════════════════════════════════════════════════════ */}
        <div className="px-3 py-4 space-y-4">
          {/* SECCIÓN 1: CENTRO */}
          <div>
            <div className="px-3 pb-1.5 text-[9px] font-mono uppercase tracking-widest text-[#7a7890] font-bold">
              Centro
            </div>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isDashboard
                  ? 'bg-[#3b3abf] text-white shadow-md shadow-[#1a1a5e]/40'
                  : 'text-[#c5c5ff] hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className={`w-4 h-4 ${isDashboard ? 'text-white' : 'text-[#7b7bff]'}`} />
              <span>¿Qué hago ahora?</span>
            </Link>
          </div>

          {/* SECCIÓN 2: ORGANIZAR */}
          <div className="space-y-0.5">
            <div className="px-3 pb-1.5 text-[9px] font-mono uppercase tracking-widest text-[#7a7890] font-bold">
              Organizar
            </div>
            <Link
              href="/schedule"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                pathname === '/schedule'
                  ? 'bg-[#3b3abf] text-white shadow-md shadow-[#1a1a5e]/40'
                  : 'text-[#c5c5ff] hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className={`w-4 h-4 ${pathname === '/schedule' ? 'text-white' : 'text-[#7b7bff]'}`} />
              <span>Horario Semanal</span>
            </Link>

            <button
              onClick={openAddTask}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#c5c5ff] hover:text-white hover:bg-white/5 transition-all text-left cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-[#7b7bff]" />
              <span>+ Nueva Tarea</span>
            </button>

            <button
              onClick={openAddExam}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#c5c5ff] hover:text-white hover:bg-white/5 transition-all text-left cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#7b7bff]" />
              <span>+ Nuevo Parcial</span>
            </button>
          </div>

          {/* SECCIÓN 3: ENTENDER */}
          <div className="space-y-0.5">
            <div className="px-3 pb-1.5 text-[9px] font-mono uppercase tracking-widest text-[#7a7890] font-bold">
              Entender
            </div>
            <Link
              href="/radar"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                pathname === '/radar'
                  ? 'bg-[#3b3abf] text-white shadow-md shadow-[#1a1a5e]/40'
                  : 'text-[#c5c5ff] hover:text-white hover:bg-white/5'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 ${pathname === '/radar' ? 'text-white' : 'text-[#7b7bff]'}`} />
              <span>Radar de Riesgo</span>
            </Link>

            <Link
              href="/timeline"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                pathname === '/timeline'
                  ? 'bg-[#3b3abf] text-white shadow-md shadow-[#1a1a5e]/40'
                  : 'text-[#c5c5ff] hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className={`w-4 h-4 ${pathname === '/timeline' ? 'text-white' : 'text-[#7b7bff]'}`} />
              <span>Línea de Semanas</span>
            </Link>

            <Link
              href="/balance"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                pathname === '/balance'
                  ? 'bg-[#3b3abf] text-white shadow-md shadow-[#1a1a5e]/40'
                  : 'text-[#c5c5ff] hover:text-white hover:bg-white/5'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${pathname === '/balance' ? 'text-white' : 'text-[#7b7bff]'}`} />
              <span>Balance Académico</span>
            </Link>
          </div>

          {/* SECCIÓN 4: CONFIGURAR */}
          <div className="space-y-0.5">
            <div className="px-3 pb-1.5 text-[9px] font-mono uppercase tracking-widest text-[#7a7890] font-bold">
              Configurar
            </div>
            <button
              onClick={openOnboarding}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Asistente IA</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#3b3abf] text-white font-bold">
                SETUP
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* User Card & Reset Footer */}
      <div className="p-3 border-t border-[#252570]/60 space-y-2">
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[10px] font-mono text-[#7a7890] hover:text-[#c5c5ff] hover:bg-white/5 transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restablecer Demo</span>
        </button>

        <button
          onClick={openProfile}
          className="w-full text-left flex items-center justify-between p-2 rounded-xl bg-[#1e1e8a]/30 hover:bg-[#1e1e8a]/60 border border-[#3b3abf]/30 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#3b3abf] text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
              {(profile?.name || 'Luis Felipe')
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white leading-tight group-hover:text-[#a0a0ff] transition-colors truncate">
                {profile?.name || 'Luis Felipe R.'}
              </div>
              <div className="text-[10px] font-mono text-[#a0a0ff] truncate">
                {profile?.studentCode ? `${profile.studentCode} · Icesi` : 'A00414805 · Icesi'}
              </div>
            </div>
          </div>
          <User className="w-3.5 h-3.5 text-[#7b7bff] group-hover:text-white shrink-0" />
        </button>
      </div>
    </aside>
  );
}
