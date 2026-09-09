'use client';

import { RiskEvaluation, RiskLevel } from '@/types';
import { AlertTriangle, CheckCircle, Clock, FileText, HelpCircle, Hourglass } from 'lucide-react';
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
          badge: 'bg-[#fee2e2] text-[#dc2626] border-[#fecaca] dark:bg-[#390909] dark:text-[#f87171] dark:border-[#7f1d1d]',
          dot: 'bg-[#dc2626] dark:bg-[#ef4444]',
          icon: AlertTriangle,
          cardBorder: 'border-[#fecaca] dark:border-[#7f1d1d]',
          accentBg: 'bg-[#fef2f2] dark:bg-[#200505]',
        };
      case 'ATENCIÓN':
        return {
          badge: 'bg-[#fef9c3] text-[#ca8a04] border-[#fef08a] dark:bg-[#351a04] dark:text-[#facc15] dark:border-[#713f12]',
          dot: 'bg-[#ca8a04] dark:bg-[#eab308]',
          icon: Clock,
          cardBorder: 'border-[#fef08a] dark:border-[#713f12]',
          accentBg: 'bg-[#fffdf0] dark:bg-[#201102]',
        };
      case 'ESTABLE':
      default:
        return {
          badge: 'bg-[#dcfce7] text-[#16a34a] border-[#bbf7d0] dark:bg-[#072714] dark:text-[#4ade80] dark:border-[#14532d]',
          dot: 'bg-[#16a34a] dark:bg-[#22c55e]',
          icon: CheckCircle,
          cardBorder: 'border-[var(--border)]',
          accentBg: 'bg-transparent',
        };
    }
  };

  const style = getBadgeStyles(risk.level);
  const Icon = style.icon;

  return (
    <div
      className={`card-cambas-interactive p-5 flex flex-col justify-between border ${style.cardBorder} transition-colors`}
    >
      <div>
        {/* Header con Badge Tipográfico y Score Cuantificable */}
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black font-mono tracking-wider border uppercase ${style.badge}`}
          >
            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
            <Icon className="w-3.5 h-3.5" />
            <span>{risk.level}</span>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-[var(--muted)]">
              Presión: <strong className="text-[var(--ink)]">{risk.riskScore}</strong>/100
            </span>
          </div>
        </div>

        {/* Nombre de la Materia */}
        <div className="mt-3.5">
          <h3 className="text-base font-extrabold tracking-tight text-[var(--ink)] flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: risk.subjectColor }}
            />
            <span>{risk.subjectName}</span>
          </h3>
        </div>

        {/* Grid de 5 Señales Medibles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 text-xs font-mono">
          {/* 1. Parcial */}
          <div className="bg-[var(--paper)] p-2.5 rounded-xl border border-[var(--border)]">
            <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Parcial</span>
            <span className="font-black text-[var(--ink)] mt-0.5 block">
              {risk.signals.daysUntilExam !== null && risk.signals.daysUntilExam !== undefined
                ? `${risk.signals.daysUntilExam} días`
                : 'Sin examen'}
            </span>
          </div>

          {/* 2. Pendientes */}
          <div className="bg-[var(--paper)] p-2.5 rounded-xl border border-[var(--border)]">
            <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Pendientes</span>
            <span className="font-black text-[var(--ink)] mt-0.5 block flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#3b3abf] dark:text-[#a0a0ff]" />
              {risk.signals.pendingTasksCount} tareas
            </span>
          </div>

          {/* 3. Carga Estimada */}
          <div className="bg-[var(--paper)] p-2.5 rounded-xl border border-[var(--border)]">
            <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Carga Estimada</span>
            <span className="font-black text-[var(--ink)] mt-0.5 block">
              {formatMinutesHuman(risk.signals.estimatedStudyMinutes)}
            </span>
          </div>

          {/* 4. Tiempo Libre Disponible */}
          <div className="bg-[var(--paper)] p-2.5 rounded-xl border border-[var(--border)]">
            <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Disponible</span>
            <span className="font-black text-[#16a34a] dark:text-[#4ade80] mt-0.5 block flex items-center gap-1">
              <Hourglass className="w-3 h-3 text-[#16a34a] dark:text-[#4ade80]" />
              {formatMinutesHuman(risk.signals.availableMinutesThisWeek || 120)}
            </span>
          </div>

          {/* 5. Asistencia & Faltas */}
          <div className="col-span-2 sm:col-span-2 bg-[var(--paper)] p-2.5 rounded-xl border border-[var(--border)] flex items-center justify-between">
            <div>
              <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Asistencia</span>
              <span className="font-black text-[var(--ink)] mt-0.5 block">
                {risk.signals.attendanceRate}% ({risk.signals.absencesCount} faltas)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[var(--muted)] block text-[10px] uppercase font-bold">Margen</span>
              <span
                className={`font-black mt-0.5 block ${
                  risk.signals.remainingAllowedAbsences <= 1
                    ? 'text-[#dc2626] dark:text-[#f87171]'
                    : 'text-[#16a34a] dark:text-[#4ade80]'
                }`}
              >
                {risk.signals.remainingAllowedAbsences} permitidas
              </span>
            </div>
          </div>
        </div>

        {/* Bloque Explicable: ¿Por qué? */}
        <div className="mt-4 p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--ink)] uppercase font-mono tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
            <span>¿Por qué este cálculo?</span>
          </div>
          <div className="mt-2 space-y-1.5">
            {risk.reasons.map((reason, idx) => (
              <p key={idx} className="text-xs text-[var(--ink-secondary)] leading-snug flex items-start gap-1.5">
                <span className="text-[#3b3abf] dark:text-[#a0a0ff] font-black">•</span>
                <span>{reason}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {onPlanStudy && risk.level !== 'ESTABLE' && (
        <button
          onClick={() => onPlanStudy(risk.subjectId)}
          className="mt-4 w-full py-2.5 px-3 rounded-xl bg-[#f0f0ff] dark:bg-[#1c1e38] hover:bg-[#e8e8ff] dark:hover:bg-[#25284a] text-[#3b3abf] dark:text-[#a0a0ff] text-xs font-bold border border-[#c5c5ff] dark:border-[#333760] transition-all text-center cursor-pointer"
        >
          Organizar sesiones de estudio en huecos libres →
        </button>
      )}
    </div>
  );
}
