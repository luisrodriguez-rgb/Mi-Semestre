'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Calendar, AlertTriangle, Layers, User, GraduationCap } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export function MobileNav() {
  const pathname = usePathname();
  const { openProfile } = useUIStore();

  const navItems = [
    { href: '/dashboard', label: 'Ahora', icon: Clock },
    { href: '/schedule', label: 'Horario', icon: Calendar },
    { href: '/radar', label: 'Radar', icon: AlertTriangle },
    { href: '/timeline', label: 'Semanas', icon: Layers },
    { href: '/balance', label: 'Balance', icon: GraduationCap },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--border)] px-3 py-2 flex items-center justify-around shadow-lg transition-colors">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || (pathname === '/' && item.href === '/dashboard');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center min-w-[54px] py-1 px-2 rounded-xl transition-all ${
              isActive
                ? 'text-[#3b3abf] dark:text-[#a0a0ff] font-bold'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                isActive ? 'bg-[#f0f0ff] dark:bg-[#1c1e38]' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}

      <button
        onClick={openProfile}
        className="flex flex-col items-center justify-center min-w-[54px] py-1 px-2 rounded-xl text-[var(--muted)] hover:text-[var(--ink)] transition-all cursor-pointer"
      >
        <div className="p-1 rounded-lg">
          <User className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Perfil</span>
      </button>
    </div>
  );
}
