import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, ChevronRight, ArrowRight, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { Subject, Assignment, Exam, AttendanceRecord, Grade } from '@/types';
import { calculateSubjectRisk, buildEvaluationPlanFromExams } from '@/lib/academic-engine';
import { useUIStore } from '@/stores/uiStore';

interface RiskRadarWidgetProps {
  subjects?: Subject[];
  assignments?: Assignment[];
  exams?: Exam[];
  attendance?: AttendanceRecord[];
  grades?: Grade[];
}

export function RiskRadarWidget({
  subjects = [],
  assignments = [],
  exams = [],
  attendance = [],
  grades = [],
}: RiskRadarWidgetProps) {
  const { openGradeCalculator } = useUIStore();
  const [prioritySubjectId, setPrioritySubjectId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mi_semestre_priority_subject_id');
      if (stored) {
        setPrioritySubjectId(stored);
      }
    }
  }, []);

  const evaluatedSubjects = useMemo(() => {
    if (!subjects || subjects.length === 0) return [];

    return subjects.map((sub) => {
      const evaluations = buildEvaluationPlanFromExams(sub, exams, grades);
      const evaluation = calculateSubjectRisk({
        subject: sub,
        exams,
        assignments,
        attendanceRecords: attendance,
        evaluations,
      });

      const status = evaluation.level;
      const statusColor: 'red' | 'amber' | 'green' =
        status === 'CRÍTICO' ? 'red' : status === 'ATENCIÓN' ? 'amber' : 'green';

      // Detalle legible y conciso incorporando notas si existen
      let detail = evaluation.reasons[0] || 'Todo al día';
      if (evaluation.signals.gradeStatus === 'INVIABLE_MATEMATICAMENTE') {
        detail = 'Inviable (> 5.0) · Hablar con profesor o cancelar';
      } else if (
        typeof evaluation.signals.requiredGrade === 'number' &&
        evaluation.signals.requiredGrade > 0 &&
        evaluation.signals.requiredGrade <= 5.0
      ) {
        detail = `Req: ${evaluation.signals.requiredGrade.toFixed(2)} para pasar (${evaluation.signals.evaluatedWeight || 0}% evaluado)`;
      } else if (evaluation.signals.gradeStatus === 'APROBADA_ANTICIPADA') {
        detail = 'Materia asegurada anticipadamente';
      }

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
  }, [subjects, assignments, exams, attendance, grades]);

  const atRiskCount = useMemo(() => {
    return evaluatedSubjects.filter((s) => s.status !== 'ESTABLE').length;
  }, [evaluatedSubjects]);

  // Progressive Disclosure: si hay materia prioritaria, destacar esa primero
  const { visibleItems, hiddenItems } = useMemo(() => {
    if (!prioritySubjectId) {
      return { visibleItems: evaluatedSubjects, hiddenItems: [] };
    }

    const priorityItem = evaluatedSubjects.find((s) => s.id === prioritySubjectId);
    if (!priorityItem) {
      return { visibleItems: evaluatedSubjects, hiddenItems: [] };
    }

    const others = evaluatedSubjects.filter((s) => s.id !== prioritySubjectId);
    return {
      visibleItems: [priorityItem],
      hiddenItems: others,
    };
  }, [evaluatedSubjects, prioritySubjectId]);

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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openGradeCalculator()}
            className="text-xs font-semibold text-[#3b43a8] dark:text-[#8e98ec] hover:underline flex items-center gap-1 cursor-pointer"
            title="Abrir calculadora de notas"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Notas</span>
          </button>
          <Link
            href="/radar"
            className="text-xs font-semibold text-[#3b43a8] dark:text-[#8e98ec] hover:underline flex items-center gap-0.5"
          >
            <span>Ver radar</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Lista de Materias con Indicador Vertical - Con Progressive Disclosure */}
      <div className="mt-3 space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-0.5">
        {evaluatedSubjects.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#626c96] dark:text-[#8b95c2]">
            No hay materias matriculadas para evaluar.
          </div>
        ) : (
          <>
            {/* Materias visibles (prioridad de enfoque en primer ingreso) */}
            {visibleItems.map((item) => (
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
                      {prioritySubjectId === item.id && (
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 shrink-0">
                          Tu Enfoque
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#626c96] dark:text-[#8b95c2] mt-0.5 truncate font-mono">
                      {item.detail}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openGradeCalculator(item.id);
                    }}
                    className="p-1 rounded-lg text-[#626c96] hover:text-[#3b43a8] dark:hover:text-[#a0a0ff] hover:bg-white/10 transition-colors"
                    title="Calcular y simular notas"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-[#a0a8d6] group-hover:text-[#3b43a8] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}

            {/* Toggle de Progressive Disclosure para materias estables */}
            {hiddenItems.length > 0 && !isExpanded && (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#f0f3fa] dark:bg-[#141838] hover:bg-[#e4ebf8] dark:hover:bg-[#192048] text-xs font-semibold text-[#3b43a8] dark:text-[#8e98ec] flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#e2e6f2] dark:border-[#1e2552] mt-1"
              >
                <span>Ver las otras {hiddenItems.length} materias estables</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Materias desplegadas */}
            {hiddenItems.length > 0 && isExpanded && (
              <div className="space-y-2 pt-1 border-t border-[#f0f3fa] dark:border-[#181d42]">
                {hiddenItems.map((item) => (
                  <Link
                    key={item.id}
                    href="/radar"
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#f8faff] dark:hover:bg-[#141838] transition-all group border border-transparent hover:border-[#e2e6f2] dark:hover:border-[#1e2552]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
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

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openGradeCalculator(item.id);
                        }}
                        className="p-1 rounded-lg text-[#626c96] hover:text-[#3b43a8] dark:hover:text-[#a0a0ff] hover:bg-white/10 transition-colors"
                        title="Calcular y simular notas"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-[#a0a8d6] group-hover:text-[#3b43a8] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="w-full py-1 text-[11px] font-mono text-[#626c96] dark:text-[#8b95c2] hover:text-[#0f1330] dark:hover:text-white flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Colapsar materias estables</span>
                  <ChevronUp className="w-3 h-3" />
                </button>
              </div>
            )}
          </>
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
