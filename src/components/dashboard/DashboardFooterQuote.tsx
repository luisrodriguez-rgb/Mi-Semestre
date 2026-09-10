'use client';

import { Sparkles } from 'lucide-react';

export function DashboardFooterQuote() {
  return (
    <footer className="rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] px-6 py-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-colors">
      <div className="flex items-center gap-3 text-center sm:text-left">
        <div className="w-7 h-7 rounded-full bg-[#f0f3fa] dark:bg-[#161c42] border border-[#e2e6f2] dark:border-[#22295a] flex items-center justify-center text-[#3b43a8] dark:text-[#8e98ec] shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="text-[#505a88] dark:text-[#949ecb]">
          <strong className="text-[#0f1330] dark:text-white font-bold">
            Disciplina hoy, libertad mañana.
          </strong>{' '}
          <span className="text-[#626c96] dark:text-[#8b95c2]">
            La constancia también es una forma de inteligencia.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#7a85b8] uppercase font-bold shrink-0">
        <img
          src="/icon.png"
          alt="Mi Semestre"
          className="w-4 h-4 object-contain"
        />
        <span>MI SEMESTRE <span className="text-[#3b43a8] dark:text-[#8e98ec] font-black">|</span> ICESI</span>
      </div>
    </footer>
  );
}
