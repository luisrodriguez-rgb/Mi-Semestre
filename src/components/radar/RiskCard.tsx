'use client';

import { RiskEvaluation, RiskLevel } from '@/types';
import { AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';
import { formatMinutesHuman } from '@/lib/academic-engine/utils/timeHelpers';

interface RiskCardProps {
  risk: RiskEvaluation;
  onPlanStudy?: (subjectId: string) => void;
}

export function RiskCard({ risk, onPlanStudy }: RiskCardProps) {
  const getBadgeStyles = (level: RiskLevel) => {
    switch (level) {
      case 'CRÍTICO':
        return {
          badge: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
          dot: 'bg-[#dc2626]',
          icon: AlertTriangle,
          cardBorder: 'border-[#fecaca]',
          cardHeaderBg: 'bg-[#fff5f5]',
        };
      case 'ATENCIÓN':
        return {
          badge: 'bg-[#fefce8] text-[#ca8a04] border-[#fef08a]',
          dot: 'bg-[#ca8a04]',
          icon: Clock,
          cardBorder: 'border-[#fef08a]',
          cardHeaderBg: 'bg-[#fffdf0]',
        };
      case 'ESTABLE':
      default:
        return {
          badge: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
          dot: 'bg-[#16a34a]',
          icon: CheckCircle,
          cardBorder: 'border-[#e0dff0]',
          cardHeaderBg: 'bg-white',
        };
    }
  };

  const style = getBadgeStyles(risk.level);
  const Icon = style.icon;

  return (
    <div
      className={`card-cambas-interactive p-5 flex flex-col justify-between border ${style.cardBorder}`}
    >
      <div>
        {/* Header con Badge Tipográfico y Score */}
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black font-mono tracking-wider border uppercase ${style.badge}`}
          >
            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
            <Icon className="w-3.5 h-3.5" />
            <span>{risk.level}</span>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-[#7a7890]">
              Presión: <strong className="text-[#0d0d14]">{risk.riskScore}</strong>/100
            </span>
          </div>
        </div>

        {/* Nombre de la Materia */}
        <div className="mt-3.5">
          <h3 className="text-base font-extrabold tracking-tight text-[#0d0d14] flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: risk.subjectColor }}
            />
            <span>{risk.subjectName}</span>
          </h3>
        </div>

        {/* Señales Medibles */}
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
          <div className="bg-[#f5f5ff] p-2.5 rounded-xl border border-[#e0dff0]">
            <span className="text-[#7a7890] block text-[10px] uppercase font-bold">Próximo Examen</span>
            <span className="font-black text-[#0d0d14] mt-0.5 block">
              {risk.signals.daysUntilExam !== null && risk.signals.daysUntilExam !== undefined
                ? `${risk.signals.daysUntilExam} días`
                : 'Sin examen'}
            </span>
          </div>

          <div className="bg-[#f5f5ff] p-2.5 rounded-xl border border-[#e0dff0]">
            <span className="text-[#7a7890] block text-[10px] uppercase font-bold">Tareas Pendientes</span>
            <span className="font-black text-[#0d0d14] mt-0.5 block flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#3b3abf]" />
              {risk.signals.pendingTasksCount} ({formatMinutesHuman(risk.signals.estimatedStudyMinutes)})
            </span>
          </div>

          <div className="bg-[#f5f5ff] p-2.5 rounded-xl border border-[#e0dff0]">
            <span className="text-[#7a7890] block text-[10px] uppercase font-bold">Asistencia</span>
            <span className="font-black text-[#0d0d14] mt-0.5 block">
              {risk.signals.attendanceRate}% ({risk.signals.absencesCount} faltas)
            </span>
          </div>

          <div className="bg-[#f5f5ff] p-2.5 rounded-xl border border-[#e0dff0]">
            <span className="text-[#7a7890] block text-[10px] uppercase font-bold">Margen Faltas</span>
            <span
              className={`font-black mt-0.5 block ${
                risk.signals.remainingAllowedAbsences <= 1
                  ? 'text-[#dc2626]'
                  : 'text-[#16a34a]'
              }`}
            >
              {risk.signals.remainingAllowedAbsences} permitidas
            </span>
          </div>
        </div>

        {/* Motivos Explicables */}
        <div className="mt-4 pt-3.5 border-t border-[#e0dff0] space-y-1.5">
          {risk.reasons.map((reason, idx) => (
            <p key={idx} className="text-xs text-[#7a7890] leading-snug flex items-start gap-1.5">
              <span className="text-[#3b3abf] font-black">•</span>
              <span>{reason}</span>
            </p>
          ))}
        </div>
      </div>

      {onPlanStudy && risk.level !== 'ESTABLE' && (
        <button
          onClick={() => onPlanStudy(risk.subjectId)}
          className="mt-4 w-full py-2 px-3 rounded-xl bg-[#f0f0ff] hover:bg-[#e8e8ff] text-[#3b3abf] text-xs font-bold border border-[#c5c5ff] transition-all text-center"
        >
          Organizar sesiones de estudio →
        </button>
      )}
    </div>
  );
}
