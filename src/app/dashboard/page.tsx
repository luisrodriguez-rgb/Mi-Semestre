'use client';

import { useSemesterData } from '@/hooks/useSemesterData';
import { NowActionCard } from '@/components/dashboard/NowActionCard';
import { DangerRadar } from '@/components/radar/DangerRadar';
import { assignmentRepository } from '@/lib/storage';
import { CheckCircle2, Circle, Clock, Sparkles, BookOpen, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const {
    semester,
    subjectsMap,
    scheduleBlocks,
    assignments,
    exams,
    attendance,
    routines,
    refreshData,
    isLoading,
  } = useSemesterData();

  const handleToggleTask = async (id: string) => {
    await assignmentRepository.toggleStatus(id);
    await refreshData();
  };

  const pendingAssignments = assignments.filter((a) => a.status !== 'completed');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#3b3abf] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-[#7a7890]">Cargando semestre...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner de Bienvenida estilo CAMBAS+ (como en la captura del usuario) */}
      <div className="banner-cambas p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#c5c5ff]">
            <Sparkles className="w-4 h-4 text-[#a0a0ff]" />
            <span>Sistema Operativo del Semestre</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
            Bienvenido, Icesista 👋
          </h1>
          <p className="text-sm text-[#e8e8ff] mt-2 leading-relaxed">
            Tu centro inteligente de control académico. Consulta tu horario en tiempo real, detecta tus huecos disponibles y toma decisiones claras sobre qué estudiar hoy.
          </p>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium text-white border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>5 Materias Inscritas</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium text-white border border-white/15">
              <Clock className="w-3.5 h-3.5 text-[#c5c5ff]" />
              <span>10 Horarios Semanales</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium text-white border border-white/15">
              <FileText className="w-3.5 h-3.5 text-[#c5c5ff]" />
              <span>{pendingAssignments.length} Tareas Pendientes</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex md:flex-col gap-3">
          <Link
            href="/schedule"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#f0f0ff] text-[#1e1e8a] text-xs font-bold shadow-lg shadow-black/10 transition-all"
          >
            <span>Ver Horario Completo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/radar"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all"
          >
            <span>Ver Radar de Riesgo</span>
          </Link>
        </div>
      </div>

      {/* COMPONENTE ESTRELLA: ¿Qué hago ahora? */}
      <NowActionCard
        classes={scheduleBlocks}
        subjectsMap={subjectsMap}
        routines={routines}
        assignments={assignments}
        exams={exams}
      />

      {/* Grid de 2 Columnas: Tareas Pendientes y Resumen del Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Tareas Pendientes (2 cols) */}
        <div className="lg:col-span-2 card-cambas p-6 bg-[var(--surface)] border border-[var(--border)] transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">
                Entregas y Tareas Pendientes
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Haz clic en el círculo para marcar como completada
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#f0f0ff] dark:bg-[#1c1e38] text-[#3b3abf] dark:text-[#a0a0ff] border border-[var(--border)]">
              {pendingAssignments.length} pendientes
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {pendingAssignments.length > 0 ? (
              pendingAssignments.map((task) => {
                const sub = subjectsMap[task.subjectId];
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)] flex items-center justify-between gap-4 transition-all hover:border-[#a0a0ff]"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="mt-0.5 text-[var(--muted)] hover:text-[#16a34a] transition-colors cursor-pointer"
                        title="Marcar como completada"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="text-xs font-bold text-[var(--ink)]">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] mt-1">
                          <span
                            className="font-bold font-mono px-1.5 py-0.5 rounded text-[10px]"
                            style={{
                              backgroundColor: `${sub?.color || '#3b3abf'}18`,
                              color: sub?.color || '#3b3abf',
                            }}
                          >
                            {sub?.name || 'Materia'}
                          </span>
                          <span>·</span>
                          <span className="font-mono">
                            {task.estimatedMinutes} min estimados
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded uppercase ${
                        task.priority === 'high'
                          ? 'bg-[#fee2e2] dark:bg-[#390909] text-[#dc2626] dark:text-[#f87171] border border-[#fecaca] dark:border-[#7f1d1d]'
                          : 'bg-[#fef9c3] dark:bg-[#351a04] text-[#ca8a04] dark:text-[#facc15] border border-[#fef08a] dark:border-[#713f12]'
                      }`}
                    >
                      {task.priority === 'high' ? 'Alta' : 'Media'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-[var(--muted)] text-xs">
                <CheckCircle2 className="w-8 h-8 text-[#16a34a] mx-auto mb-2 opacity-80" />
                ¡Todas tus tareas están al día! Excelente ritmo académico.
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Resumen Rápido del Radar de Salud */}
        <div className="card-cambas p-6 flex flex-col justify-between bg-[var(--surface)] border border-[var(--border)] transition-colors">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">
                  Diagnóstico Rápido
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Estado general de las materias
                </p>
              </div>
              <Link
                href="/radar"
                className="text-xs text-[#3b3abf] dark:text-[#a0a0ff] font-bold hover:underline"
              >
                Ver todo →
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {/* Cálculo en riesgo */}
              <div className="p-3.5 rounded-xl bg-[#fef2f2] dark:bg-[#390909]/40 border border-[#fee2e2] dark:border-[#7f1d1d]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#dc2626] dark:text-[#f87171] uppercase font-mono">
                    CRÍTICO
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">Parcial en 4d</span>
                </div>
                <div className="text-xs font-bold text-[var(--ink)] mt-1">
                  Cálculo Multivariado
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">
                  Examen próximo y 3 tareas acumuladas.
                </div>
              </div>

              {/* Física en atención */}
              <div className="p-3.5 rounded-xl bg-[#fefce8] dark:bg-[#351a04]/40 border border-[#fef9c3] dark:border-[#713f12]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#ca8a04] dark:text-[#facc15] uppercase font-mono">
                    ATENCIÓN
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">Informe lab</span>
                </div>
                <div className="text-xs font-bold text-[var(--ink)] mt-1">
                  Física Mecánica
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">
                  Entrega de informe pendiente esta semana.
                </div>
              </div>

              {/* Otras materias */}
              <div className="p-3.5 rounded-xl bg-[#f0fdf4] dark:bg-[#072714]/40 border border-[#dcfce7] dark:border-[#14532d]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#16a34a] dark:text-[#4ade80] uppercase font-mono">
                    ESTABLE
                  </span>
                  <span className="text-[10px] font-mono text-[#16a34a] dark:text-[#4ade80]">Al día</span>
                </div>
                <div className="text-xs font-bold text-[var(--ink)] mt-1">
                  Álgebra, Estructuras e Inglés
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">
                  Asistencia excelente y sin alarmas inminentes.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border)]">
            <Link
              href="/timeline"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--paper)] hover:bg-[var(--surface-raised)] text-[#3b3abf] dark:text-[#a0a0ff] text-xs font-bold border border-[var(--border)] transition-all"
            >
              <span>Ver cronograma de semanas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
