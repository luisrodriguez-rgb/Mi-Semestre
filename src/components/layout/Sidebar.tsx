'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  Calendar,
  AlertTriangle,
  Layers,
  Sparkles,
  LogOut,
  Upload,
  PlusCircle,
  RotateCcw,
  User,
  GraduationCap,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { resetDatabaseToDemo } from '@/lib/mockData';

export function Sidebar() {
  const pathname = usePathname();
  const { openImporter, openAddTask, openAddExam, openProfile } = useUIStore();
  const { semester, refreshData } = useSemesterData();

  const navItems = [
    { href: '/dashboard', label: '¿Qué hago ahora?', icon: Clock },
    { href: '/schedule', label: 'Horario Semanal', icon: Calendar },
    { href: '/radar', label: 'Radar de Riesgo', icon: AlertTriangle },
    { href: '/timeline', label: 'Línea de Semanas', icon: Layers },
    { href: '/balance', label: 'Balance Académico', icon: GraduationCap },
  ];

  const handleReset = async () => {
    if (confirm('¿Restablecer datos del semestre al estado inicial de demostración?')) {
      await resetDatabaseToDemo();
      await refreshData();
      window.location.reload();
    }
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-[#16164f] dark:bg-[#0b0c1b] text-white flex-col justify-between border-r border-[#26266f] dark:border-[#1d1f3b] min-h-screen transition-colors">
      {/* Top Header & Brand */}
      <div>
        <div className="p-6 border-b border-[#252570]/60">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b3abf] to-[#5b5be8] flex items-center justify-center shadow-lg shadow-[#1a1a5e]/50 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1">
                MI SEMESTRE<span className="text-[#a0a0ff] font-black">+</span>
              </div>
              <div className="text-[11px] text-[#a0a0ff] font-medium">
                {semester?.name || 'Icesi · Semestre 2026-2'}
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="px-4 py-6 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#7a7890] font-semibold">
            Navegación
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (pathname === '/' && item.href === '/dashboard');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#3b3abf] text-white shadow-md shadow-[#1a1a5e]/40'
                    : 'text-[#a0a0ff] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#7b7bff]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Action Shortcuts */}
        <div className="px-4 pt-2 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#7a7890] font-semibold">
            Acciones Rápidas
          </div>
          <button
            onClick={openAddTask}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#c5c5ff] hover:text-white hover:bg-white/5 transition-all text-left"
          >
            <PlusCircle className="w-4 h-4 text-[#7b7bff]" />
            <span>Nueva Tarea</span>
          </button>
          <button
            onClick={openAddExam}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#c5c5ff] hover:text-white hover:bg-white/5 transition-all text-left"
          >
            <Calendar className="w-4 h-4 text-[#7b7bff]" />
            <span>Nuevo Parcial</span>
          </button>
          <button
            onClick={openImporter}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#c5c5ff] hover:text-white hover:bg-white/5 transition-all text-left"
          >
            <Upload className="w-4 h-4 text-[#7b7bff]" />
            <span>Importar Horario</span>
          </button>
        </div>
      </div>

      {/* User Card & Reset Footer */}
      <div className="p-4 border-t border-[#252570]/60 space-y-3">
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-[11px] text-[#7a7890] hover:text-[#c5c5ff] hover:bg-white/5 transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restablecer Datos Demo</span>
        </button>

        <button
          onClick={openProfile}
          className="w-full text-left flex items-center justify-between p-2.5 rounded-xl bg-[#1e1e8a]/40 hover:bg-[#1e1e8a]/70 border border-[#3b3abf]/30 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3b3abf] text-white font-black text-xs flex items-center justify-center shadow-sm">
              LR
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight group-hover:text-[#a0a0ff] transition-colors">
                Luis Felipe R.
              </div>
              <div className="text-[10px] font-mono text-[#a0a0ff]">A00389124 · Icesi</div>
            </div>
          </div>
          <User className="w-4 h-4 text-[#7a7890] group-hover:text-white transition-colors" />
        </button>
      </div>
    </aside>
  );
}
