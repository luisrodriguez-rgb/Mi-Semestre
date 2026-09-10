'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Target, ChevronRight, ArrowRight } from 'lucide-react';
import { Subject, Assignment, Exam, AttendanceRecord } from '@/types';
import { calculateSubjectRisk } from '@/lib/academic-engine';

interface RiskRadarWidgetProps {
  subjects?: Subject[];
  assignments?: Assignment[];
  exams?: Exam[];
  attendance?: AttendanceRecord[];
}

export function RiskRadarWidget({
  subjects = [],
  assignments = [],
  exams = [],
  attendance = [],
}: RiskRadarWidgetProps) {
  const evaluatedSubjects = useMemo(() => {
    if (!subjects || subjects.length === 0) return [];

    return subjects.map((sub) => {
      const evaluation = calculateSubjectRisk({
        subject: sub,
        exams,
        assignments,
        attendanceRecords: attendance,
      });

      const status = evaluation.level;
      const statusColor: 'red' | 'amber' | 'green' =
        status === 'CRÍTICO' ? 'red' : status === 'ATENCIÓN' ? 'amber' : 'green';

      // Detalle legible y conciso
      const detail = evaluation.reasons[0] || 'Todo al día';

      return {
        id: sub.id,
        name: sub.name,
        code: sub.code,
        status,
        statusColor,
        score: evaluation.riskScore,
        detail,
      };
    }).sort((a, b) => b.score - a.score);
  }, [subjects, assignments, exams, attendance]);

  const atRiskCount = useMemo(() => {
    return evaluatedSubjects.filter((s) => s.status !== 'ESTABLE').length;
  }, [evaluatedSubjects]);

  const getBadgeStyle = (statusColor: 'red' | 'amber' | 'green') => {
    switch (statusColor) {
      case 'red':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'amber':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'green':
      default:
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
    }
  };

  const getBarColor = (statusColor: 'red' | 'amber' | 'green') => {
    switch (statusColor) {
      case 'red':
        return 'bg-rose-500';
      case 'amber':
        return 'bg-amber-500';
      case 'green':
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] p-5 shadow-xs transition-colors flex flex-col h-full">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#f0f3fa] dark:border-[#181d42]">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#3b43a8] dark:text-[#8e98ec]" />
          <h3 className="text-sm font-bold text-[#0f1330] dark:text-white tracking-tight">
            Radar de Riesgo
          </h3>
          <span className="text-[10px] font-mono font-bold text-[#626c96] dark:text-[#8b95c2] ml-1 bg-[#f0f3fa] dark:bg-[#141838] px-2 py-0.5 rounded-full border border-[#e2e6f2] dark:border-[#1e2552]">
            {subjects.length} materias
          </span>
        </div>
        <Link
          href="/radar"
          className="text-xs font-semibold text-[#3b43a8] dark:text-[#8e98ec] hover:underline flex items-center gap-0.5"
        >
          <span>Ver detalle</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Lista de Materias con Indicador Vertical - Llena el espacio de forma equilibrada */}
      <div className="mt-3 space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-0.5">
        {evaluatedSubjects.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#626c96] dark:text-[#8b95c2]">
            No hay materias matriculadas para evaluar.
          </div>
        ) : (
          evaluatedSubjects.map((item) => (
            <Link
              key={item.id}
              href="/radar"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#f8faff] dark:hover:bg-[#141838] transition-all group border border-transparent hover:border-[#e2e6f2] dark:hover:border-[#1e2552]"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Barra vertical indicadora */}
                <div className={`w-1 h-8 rounded-full shrink-0 ${getBarColor(item.statusColor)}`} />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0f1330] dark:text-white group-hover:text-[#3b43a8] dark:group-hover:text-[#8e98ec] transition-colors truncate">
                      {item.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full border ${getBadgeStyle(
                        item.statusColor
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#626c96] dark:text-[#8b95c2] mt-0.5 truncate font-mono">
                    {item.detail}
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[#a0a8d6] group-hover:text-[#3b43a8] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </Link>
          ))
        )}
      </div>

      {/* Síntesis de Salud del Semestre (Anclada limpiamente abajo sin hueco blanco vacío) */}
      <div className="mt-3 pt-3 border-t border-[#f0f3fa] dark:border-[#181d42]">
        <div className="p-3 rounded-xl bg-[#f8faff] dark:bg-[#141838] border border-[#e2e6f2] dark:border-[#1c224b] flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-[#0f1330] dark:text-white">
              Salud del semestre
            </div>
            <div className="text-[11px] text-[#626c96] dark:text-[#8b95c2] mt-0.5">
              {subjects.length} {subjects.length === 1 ? 'materia' : 'materias'} ·{' '}
              {atRiskCount === 0
                ? 'Todo en orden'
                : `${atRiskCount} ${atRiskCount === 1 ? 'requiere' : 'requieren'} atención`}
            </div>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              atRiskCount === 0
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20'
            }`}
          >
            {atRiskCount === 0 ? 'Estable' : 'Atención'}
          </span>
        </div>
      </div>
    </div>
  );
}
