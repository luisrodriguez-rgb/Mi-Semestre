'use client';

import React, { useState, useMemo } from 'react';
import { Subject, Exam, Grade } from '@/types';
import { useUIStore } from '@/stores/uiStore';
import {
  calculateGradeStatus,
  buildEvaluationPlanFromExams,
  GradeCalculationResult,
} from '@/lib/academic-engine';
import { Calculator, ArrowRight, TrendingUp, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface GradeCalculatorQuickCardProps {
  subjects: Subject[];
  exams: Exam[];
  grades?: Grade[];
}

export function GradeCalculatorQuickCard({
  subjects = [],
  exams = [],
  grades = [],
}: GradeCalculatorQuickCardProps) {
  const { openGradeCalculator } = useUIStore();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id || ''
  );

  const activeSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null;
  }, [subjects, selectedSubjectId]);

  const gradeStatus: GradeCalculationResult | null = useMemo(() => {
    if (!activeSubject) return null;
    const plan = buildEvaluationPlanFromExams(activeSubject, exams, grades);
    return calculateGradeStatus({
      subjectId: activeSubject.id,
      evaluations: plan,
      passingGrade: activeSubject.passingGrade || 3.0,
    });
  }, [activeSubject, exams, grades]);

  if (subjects.length === 0) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROBADA_ANTICIPADA':
        return {
          bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          label: 'Aprobada anticipada',
          icon: CheckCircle,
        };
      case 'TRAYECTORIA_SEGURA':
        return {
          bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
          label: 'Trayectoria segura',
          icon: TrendingUp,
        };
      case 'EXIGE_ESFUERZO':
        return {
          bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          label: 'Exige esfuerzo',
          icon: Info,
        };
      case 'RIESGO_CRITICO':
        return {
          bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
          label: 'Riesgo crítico',
          icon: AlertTriangle,
        };
      case 'INVIABLE_MATEMATICAMENTE':
        return {
          bg: 'bg-rose-950/40 text-rose-300 border-rose-700/60',
          label: 'Inviable (> 5.0)',
          icon: AlertTriangle,
        };
      case 'COMPLETADA_REPROBADA':
        return {
          bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
          label: 'No aprobada',
          icon: X,
        };
      default:
        return {
          bg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
          label: 'Sin plan',
          icon: Info,
        };
    }
  };

  const badge = gradeStatus ? getStatusBadge(gradeStatus.status) : null;
  const BadgeIcon = badge ? badge.icon : Info;

  return (
    <div className="card-academic p-5 sm:p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl space-y-4 transition-colors shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#3b3abf]/10 text-[#3b3abf] dark:text-[#a0a0ff] flex items-center justify-center font-bold">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[var(--ink)] tracking-tight">
              Calculadora de Notas & Simulador
            </h3>
            <p className="text-[11px] text-[var(--muted)]">
              ¿Cuánto necesitas sacar en lo que falta para pasar?
            </p>
          </div>
        </div>

        <button
          onClick={() => openGradeCalculator(activeSubject?.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <span>Simular notas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Selector de chips de asignaturas */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {subjects.map((sub) => {
          const isSelected = sub.id === (activeSubject?.id || selectedSubjectId);
          return (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#3b3abf] text-white shadow-xs'
                  : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--border)]'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: sub.color }}
              />
              <span>{sub.name}</span>
            </button>
          );
        })}
      </div>

      {/* Resumen de la Asignatura Activa */}
      {gradeStatus && activeSubject && (
        <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--muted)] tracking-wider">
                Promedio en lo evaluado
              </span>
              <div className="text-lg sm:text-xl font-black text-[var(--ink)] tracking-tight">
                {gradeStatus.currentWeightedGrade !== null ? (
                  <>
                    Llevas{' '}
                    <span className="text-[#3b3abf] dark:text-[#a0a0ff]">
                      {gradeStatus.currentWeightedGrade.toFixed(2)}
                    </span>{' '}
                    en lo evaluado ({gradeStatus.evaluatedWeight}% del curso)
                  </>
                ) : (
                  <>Sin calificaciones registradas aún</>
                )}
              </div>
            </div>

            {badge && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase ${badge.bg} self-start sm:self-auto`}
              >
                <BadgeIcon className="w-3 h-3" />
                <span>{badge.label}</span>
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[var(--border)]/60 text-xs font-mono text-[var(--muted)]">
            <span>
              Acumulado real: <strong className="text-[var(--ink)]">{gradeStatus.currentAccumulatedScore.toFixed(2)}</strong> / 5.0
            </span>

            <div>
              {gradeStatus.requiredGrade !== null && gradeStatus.requiredGrade > 0 && gradeStatus.requiredGrade <= 5.0 ? (
                <span>
                  Necesitas promediar{' '}
                  <strong className="text-[#3b3abf] dark:text-[#a0a0ff]">
                    {gradeStatus.requiredGrade.toFixed(2)}
                  </strong>{' '}
                  en el {gradeStatus.remainingWeight}% restante
                </span>
              ) : gradeStatus.status === 'APROBADA_ANTICIPADA' ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Materia asegurada
                </span>
              ) : gradeStatus.status === 'INVIABLE_MATEMATICAMENTE' ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  Inviable (requeriría {gradeStatus.requiredGrade?.toFixed(1)})
                </span>
              ) : (
                <span>Faltan {gradeStatus.remainingWeight}% por evaluar</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
