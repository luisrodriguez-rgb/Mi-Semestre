'use client';

import { useMemo } from 'react';
import { Subject, Exam, Assignment, AttendanceRecord } from '@/types';
import { calculateSubjectRisk } from '@/lib/academic-engine';
import { RiskCard } from './RiskCard';
import { ShieldAlert, Flame } from 'lucide-react';

interface DangerRadarProps {
  subjects: Subject[];
  exams: Exam[];
  assignments: Assignment[];
  attendance: AttendanceRecord[];
}

export function DangerRadar({
  subjects,
  exams,
  assignments,
  attendance,
}: DangerRadarProps) {
  // Calcular riesgo para cada materia de forma determinística
  const evaluatedRisks = useMemo(() => {
    return subjects
      .map((subject) => {
        return calculateSubjectRisk({
          subject,
          exams,
          assignments,
          attendanceRecords: attendance,
          availableStudyMinutesThisWeek: 300,
        });
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [subjects, exams, assignments, attendance]);

  const criticalCount = evaluatedRisks.filter((r) => r.level === 'CRÍTICO').length;
  const attentionCount = evaluatedRisks.filter((r) => r.level === 'ATENCIÓN').length;
  const stableCount = evaluatedRisks.filter((r) => r.level === 'ESTABLE').length;

  const highestRisk = evaluatedRisks[0];

  return (
    <div className="space-y-6">
      {/* Top Banner de Diagnóstico */}
      <div className="card-cambas p-6 sm:p-8 bg-[var(--surface)] border border-[var(--border)] transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-[#3b3abf] dark:text-[#a0a0ff]">
              <ShieldAlert className="w-4 h-4" />
              <span>Semáforo de Salud Académica</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight mt-1">
              Radar de Riesgo del Semestre
            </h2>
            <p className="text-xs text-[var(--muted)] mt-1 max-w-xl">
              Análisis cuantitativo de proximidad de parciales, sobrecarga de tareas, inasistencias y tiempo disponible. Cero adivinanzas, puras métricas explicables.
            </p>
          </div>

          {/* Resumen numérico */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#fef2f2] dark:bg-[#390909] border border-[#fecaca] dark:border-[#7f1d1d] px-3.5 py-2 rounded-xl text-[#dc2626] dark:text-[#f87171] font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-[#dc2626] dark:bg-[#ef4444]" />
              <span className="font-bold">{criticalCount}</span>
              <span className="text-[11px] uppercase tracking-wider font-semibold">Crítico</span>
            </div>

            <div className="flex items-center gap-2 bg-[#fefce8] dark:bg-[#351a04] border border-[#fef08a] dark:border-[#713f12] px-3.5 py-2 rounded-xl text-[#ca8a04] dark:text-[#facc15] font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-[#ca8a04] dark:bg-[#eab308]" />
              <span className="font-bold">{attentionCount}</span>
              <span className="text-[11px] uppercase tracking-wider font-semibold">Atención</span>
            </div>

            <div className="flex items-center gap-2 bg-[#f0fdf4] dark:bg-[#072714] border border-[#bbf7d0] dark:border-[#14532d] px-3.5 py-2 rounded-xl text-[#16a34a] dark:text-[#4ade80] font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-[#16a34a] dark:bg-[#22c55e]" />
              <span className="font-bold">{stableCount}</span>
              <span className="text-[11px] uppercase tracking-wider font-semibold">Estable</span>
            </div>
          </div>
        </div>

        {/* Diagnóstico clave de la materia de mayor riesgo */}
        {highestRisk && highestRisk.level !== 'ESTABLE' && (
          <div className="mt-5 p-4 rounded-xl bg-[#fef2f2] dark:bg-[#200505] border border-[#fecaca] dark:border-[#7f1d1d] flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#fee2e2] dark:bg-[#390909] text-[#dc2626] dark:text-[#f87171] mt-0.5">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#dc2626] dark:text-[#f87171] uppercase tracking-wide font-mono">
                Atención Inmediata Requerida: {highestRisk.subjectName}
              </div>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                Es actualmente tu materia con mayor presión académica debido a:{' '}
                <span className="font-semibold text-[#dc2626] dark:text-[#f87171]">
                  {highestRisk.reasons.join(' ')}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid de Materias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {evaluatedRisks.map((risk) => (
          <RiskCard key={risk.subjectId} risk={risk} />
        ))}
      </div>
    </div>
  );
}
