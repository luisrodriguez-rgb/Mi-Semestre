'use client';

import { useMemo } from 'react';
import { useSemesterData } from '@/hooks/useSemesterData';
import { calculateSemesterMetrics } from '@/lib/academic-engine';
import { assignmentRepository } from '@/lib/storage';

import { CampusWelcomeBanner } from '@/components/dashboard/CampusWelcomeBanner';
import { DecisionHeroCard } from '@/components/dashboard/DecisionHeroCard';
import { GeneralProgressCard } from '@/components/dashboard/GeneralProgressCard';
import { SemesterRiskStatusCard } from '@/components/dashboard/SemesterRiskStatusCard';
import { WeeklyScheduleWidget } from '@/components/dashboard/WeeklyScheduleWidget';
import { RiskRadarWidget } from '@/components/dashboard/RiskRadarWidget';
import { UpcomingEventsWidget } from '@/components/dashboard/UpcomingEventsWidget';
import { RecentTasksWidget } from '@/components/dashboard/RecentTasksWidget';
import { DashboardFooterQuote } from '@/components/dashboard/DashboardFooterQuote';

export default function DashboardPage() {
  const {
    profile,
    semester,
    subjects,
    subjectsMap,
    scheduleBlocks,
    assignments,
    exams,
    routines,
    refreshData,
    isLoading,
  } = useSemesterData();

  const handleToggleTask = async (id: string) => {
    await assignmentRepository.toggleStatus(id);
    await refreshData();
  };

  const metrics = semester
    ? calculateSemesterMetrics({
        startDate: semester.startDate,
        endDate: semester.endDate,
      })
    : { currentWeek: 6, totalWeeks: 16, progressPercentage: 37, daysRemaining: 68 };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#1e1e8a] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-[var(--muted)]">Cargando semestre...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* ═════════════════════════════════════════════════════════════
          FILA 1: BANNER EDITORIAL + ¿QUÉ HAGO AHORA? + PROGRESO GENERAL
         ═════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
        {/* Columna Izquierda Ancha: Saludo y Centro de Decisión Operativa */}
        <div className="xl:col-span-8 space-y-4">
          <CampusWelcomeBanner studentName={profile?.name} />
          <DecisionHeroCard
            classes={scheduleBlocks}
            subjectsMap={subjectsMap}
            routines={routines}
            assignments={assignments}
            exams={exams}
          />
        </div>

        {/* Columna Derecha Estrecha: Tu Progreso General y Estado del Semestre */}
        <div className="xl:col-span-4 space-y-4">
          <GeneralProgressCard
            progressPercentage={metrics.progressPercentage}
            currentWeek={metrics.currentWeek}
            totalWeeks={metrics.totalWeeks}
            subjects={subjects}
            assignments={assignments}
            exams={exams}
          />
          <SemesterRiskStatusCard overallRisk="Medio" />
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          FILA 2: HORARIO SEMANAL (Col 1) · RADAR (Col 2) · EVENTOS & TAREAS (Col 3)
         ═════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Columna 1: Horario semanal interactivo con bloques de clase y huecos libres */}
        <div className="lg:col-span-6">
          <WeeklyScheduleWidget
            classes={scheduleBlocks}
            subjectsMap={subjectsMap}
            routines={routines}
          />
        </div>

        {/* Columna 2: Radar de Riesgo con barras indicadoras de semáforo */}
        <div className="lg:col-span-3">
          <RiskRadarWidget subjects={subjects} />
        </div>

        {/* Columna 3: Próximos eventos (exámenes/entregas) y Tareas recientes */}
        <div className="lg:col-span-3 space-y-4">
          <UpcomingEventsWidget exams={exams} />
          <RecentTasksWidget
            assignments={assignments}
            onToggleTask={handleToggleTask}
          />
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          PIE DE PÁGINA: FRASE INSPIRACIONAL Y BRANDING SOBERBIO
         ═════════════════════════════════════════════════════════════ */}
      <DashboardFooterQuote />
    </div>
  );
}
