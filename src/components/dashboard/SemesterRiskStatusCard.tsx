'use client';

import Link from 'next/link';
import { BarChart3, ChevronRight } from 'lucide-react';

interface SemesterRiskStatusCardProps {
  overallRisk?: 'Bajo' | 'Medio' | 'Alto';
}

export function SemesterRiskStatusCard({ overallRisk = 'Medio' }: SemesterRiskStatusCardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Alto':
        return 'text-rose-600 dark:text-rose-400';
      case 'Medio':
        return 'text-amber-600 dark:text-amber-400';
      case 'Bajo':
      default:
        return 'text-emerald-600 dark:text-emerald-400';
    }
  };

  return (
    <Link
      href="/radar"
      className="rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] p-5 shadow-xs flex items-center justify-between hover:bg-[#f8faff] dark:hover:bg-[#141838] transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-[#0f1330] dark:text-white">
            Estado del semestre
          </div>
          <div className="text-[11px] text-[#626c96] dark:text-[#8b95c2] mt-0.5">
            Riesgo general:{' '}
            <span className={`font-bold ${getRiskColor(overallRisk)}`}>
              {overallRisk}
            </span>
          </div>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-[#8b95c2] group-hover:text-[#3b43a8] group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
