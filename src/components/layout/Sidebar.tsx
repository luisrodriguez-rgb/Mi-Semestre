'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  CheckSquare,
  AlertTriangle,
  Layers,
  GraduationCap,
  Sparkles,
  Settings,
  ChevronDown,
  ListTodo,
  Layers3,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';

export function Sidebar() {
  const pathname = usePathname();
  const { openOnboarding, openAddTask, openAddExam, openProfile } = useUIStore();
  const { profile, semester } = useSemesterData();

  const isCurrent = (path: string) =>
    pathname === path || (path === '/dashboard' && pathname === '/');

  const navItems = [
    { href: '/dashboard', label: '¿Qué hago ahora?', icon: Home },
    { href: '/schedule', label: 'Horario Semanal', icon: Calendar },
    { href: '/dashboard#tareas', label: 'Tareas', icon: ListTodo },
    { href: '/dashboard#evaluaciones', label: 'Evaluaciones', icon: CheckSquare },
    { href: '/radar', label: 'Radar de Riesgo', icon: AlertTriangle },
    { href: '/timeline', label: 'Línea de Semanas', icon: Layers },
    { href: '/balance', label: 'Balance Académico', icon: GraduationCap },
  ];

  const studentName = profile?.name || 'Diego Rodríguez';
  const studentProgram = profile?.program || 'Ingeniería de Sistemas';
  const initials = studentName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-[#0c102a] dark:bg-[#070919] text-white flex-col justify-between border-r border-[#1e2348] h-screen sticky top-0 overflow-y-auto transition-colors z-40 select-none">
      <div>
        {/* Logo Superior CAMBAS+ ICESI */}
        <div className="p-6 pb-5 flex items-center gap-3 border-b border-[#1b2046]/50">
          <img
            src="/logo.webp"
            alt="CAMBAS+ ICESI"
            className="w-9 h-9 rounded-xl object-contain shadow-md shadow-[#252ab8]/20"
          />
          <div>
            <div className="font-black text-sm tracking-wider text-white flex items-center gap-1">
              CAMBAS<span className="text-[#656cf5] font-black">+</span>
            </div>
            <div className="text-[10px] font-mono tracking-widest text-[#7a85b8] uppercase font-bold">
              ICESI
            </div>
          </div>
        </div>

        {/* Lista de Navegación Principal */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrent(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#2b31a8] text-white shadow-md shadow-[#1b2046]/60 font-bold'
                    : 'text-[#8b96c8] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#6b76ad]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sección "MI SEMESTRE" */}
        <div className="px-4 pt-4">
          <button
            onClick={openOnboarding}
            className="w-full flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#636f9e] font-bold pb-2 hover:text-[#9eaae0] transition-colors"
          >
            <span>MI SEMESTRE</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <div
            onClick={openOnboarding}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#141838]/60 hover:bg-[#191f48] border border-[#202758] transition-all cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-[#252ab8]/40 border border-[#3b41d0]/50 flex items-center justify-center text-[#8e97ff] text-[11px] font-mono font-bold">
              S
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-bold text-white group-hover:text-[#8e97ff] transition-colors truncate">
                {semester?.name?.includes('Industrial') ? 'Semestre 2026-2' : 'Semestre 2026-2'}
              </div>
              <div className="text-[10px] text-[#7a85b8] font-mono truncate">
                {studentProgram}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pie de Usuario y Branding */}
      <div className="p-3 border-t border-[#1b2046]/50 space-y-3">
        {/* Tarjeta Usuario */}
        <div
          onClick={openProfile}
          className="flex items-center justify-between p-2 rounded-xl bg-[#141838]/80 hover:bg-[#191f48] border border-[#202758] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e2380] to-[#3a42d8] border border-[#525bf4]/40 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white group-hover:text-[#8e97ff] transition-colors truncate">
                {studentName}
              </div>
              <div className="text-[10px] text-[#7a85b8] font-mono truncate">
                {studentProgram}
              </div>
            </div>
          </div>
          <Settings className="w-4 h-4 text-[#6b76ad] group-hover:text-white transition-colors shrink-0" />
        </div>

        {/* Footer CAMBAS+ ICESI */}
        <div className="px-2 pt-1 flex items-center gap-2 text-[#56618e]">
          <img
            src="/logo.webp"
            alt="CAMBAS+ ICESI"
            className="w-4 h-4 rounded-md object-contain opacity-75"
          />
          <div>
            <div className="text-[10px] font-bold font-mono tracking-wider uppercase text-[#6f7aa8]">
              CAMBAS+ <span className="text-[9px] font-normal opacity-70">ICESI</span>
            </div>
            <div className="text-[9px] text-[#56618e] font-sans">
              Tu semestre, en tus manos.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
