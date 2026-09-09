'use client';

import { useMemo } from 'react';
import { useSemesterData } from '@/hooks/useSemesterData';
import { NowActionCard } from '@/components/dashboard/NowActionCard';
import { assignmentRepository } from '@/lib/storage';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  BookOpen,
  ChevronRight,
  FileText,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const DAYS_SHORT = [
  { dayNum: 1, label: 'LUN', name: 'Lunes' },
  { dayNum: 2, label: 'MAR', name: 'Martes' },
  { dayNum: 3, label: 'MIÉ', name: 'Miércoles' },
  { dayNum: 4, label: 'JUE', name: 'Jueves' },
  { dayNum: 5, label: 'VIE', name: 'Viernes' },
];

export default function DashboardPage() {
  const {
    semester,
    subjects,
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

  // Día de la semana actual (1 = Lun, ..., 5 = Vie)
  const currentDayNum = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  }, []);

  // Clases agrupadas por día para la tira semanal "Tu Semana"
  const classesByDay = useMemo(() => {
    const map: Record<number, typeof scheduleBlocks> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    scheduleBlocks.forEach((b) => {
      if (map[b.dayOfWeek]) {
        map[b.dayOfWeek].push(b);
      }
    });
    // Ordenar cada día por hora de inicio
    Object.keys(map).forEach((k) => {
      map[Number(k)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return map;
  }, [scheduleBlocks]);

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
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ═════════════════════════════════════════════════════════════
          HÉROE PRINCIPAL: ¿QUÉ HAGO AHORA? (Domina visualmente la app)
         ═════════════════════════════════════════════════════════════ */}
      <NowActionCard
        classes={scheduleBlocks}
        subjectsMap={subjectsMap}
        routines={routines}
        assignments={assignments}
        exams={exams}
      />

      {/* ═════════════════════════════════════════════════════════════
          TU SEMANA: Tira Semanal Compacta (Visualizador rápido L-V)
         ═════════════════════════════════════════════════════════════ */}
      <section className="rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-xs transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1e1e8a] dark:text-[#a0a0ff]" />
            <h2 className="text-sm font-extrabold text-[var(--ink)] tracking-tight">
              Tu Semana
            </h2>
            <span className="text-xs text-[var(--muted)] hidden sm:inline">
              · Panorama de clases y disponibilidad
            </span>
          </div>

          <Link
            href="/schedule"
            className="text-xs font-bold text-[#1e1e8a] dark:text-[#a0a0ff] hover:underline flex items-center gap-1"
          >
            <span>Ver horario semanal completo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-4">
          {DAYS_SHORT.map((d) => {
            const isToday = currentDayNum === d.dayNum;
            const dayClasses = classesByDay[d.dayNum] || [];

            return (
              <div
                key={d.dayNum}
                className={`p-3.5 rounded-xl border transition-all ${
                  isToday
                    ? 'bg-[#1e1e8a]/5 dark:bg-[#1e1e8a]/20 border-[#1e1e8a] shadow-xs'
                    : 'bg-[var(--paper)] border-[var(--border)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-[var(--ink)]">
                    {d.label}
                  </span>
                  {isToday ? (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#1e1e8a] text-white">
                      HOY
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[var(--muted)]">
                      {dayClasses.length} {dayClasses.length === 1 ? 'clase' : 'clases'}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 space-y-1.5 min-h-[60px]">
                  {dayClasses.length > 0 ? (
                    dayClasses.map((c) => {
                      const sub = subjectsMap[c.subjectId];
                      return (
                        <div
                          key={c.id}
                          className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[10px] font-medium"
                        >
                          <div className="flex items-center gap-1 font-bold text-[var(--ink)] truncate">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: sub?.color || '#1e1e8a' }}
                            />
                            <span className="truncate">{sub?.name || 'Clase'}</span>
                          </div>
                          <div className="text-[9px] font-mono text-[var(--muted)] mt-0.5">
                            {c.startTime} - {c.endTime}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-[var(--muted)] font-mono py-3">
                      Día libre
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SEGUNDO BLOQUE: ENTREGAS PENDIENTES & DIAGNÓSTICO RÁPIDO
         ═════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Entregas y Tareas Inmediatas (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div>
              <h3 className="text-sm font-extrabold text-[var(--ink)] tracking-tight">
                Entregas y Tareas Pendientes
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Haz clic en el círculo para registrar avance o marcar como completada
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--paper)] text-[var(--ink)] border border-[var(--border)]">
              {pendingAssignments.length} pendientes
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {pendingAssignments.length > 0 ? (
              pendingAssignments.map((task) => {
                const sub = subjectsMap[task.subjectId];
                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-[var(--paper)] hover:bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between gap-4 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="text-[var(--muted)] hover:text-[#1e1e8a] dark:hover:text-[#a0a0ff] transition-colors cursor-pointer shrink-0"
                        title="Marcar completada"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[var(--ink)] group-hover:text-[#1e1e8a] dark:group-hover:text-[#a0a0ff] transition-colors truncate">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--muted)] mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-[var(--surface)] border border-[var(--border)] font-bold text-[#1e1e8a] dark:text-[#a0a0ff]">
                            {sub?.name || 'Materia'}
                          </span>
                          <span>·</span>
                          <span>{task.estimatedMinutes} min estimados</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          task.priority === 'high'
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {task.priority === 'high' ? 'ALTA' : 'MEDIA'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-[var(--muted)] flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <span className="font-bold text-[var(--ink)]">¡Estás al día!</span>
                <span>No tienes tareas pendientes urgentes en este momento.</span>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Diagnóstico Rápido / Semáforo de Materias (1 col) */}
        <div className="rounded-2xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-xs transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-extrabold text-[var(--ink)] tracking-tight">
                Diagnóstico Rápido
              </h3>
              <Link
                href="/radar"
                className="text-xs font-bold text-[#1e1e8a] dark:text-[#a0a0ff] hover:underline flex items-center gap-0.5"
              >
                <span>Ver radar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {/* Tarjeta Alerta Crítica */}
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-rose-700 dark:text-rose-300 uppercase">
                    CRÍTICO
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">Parcial en 4d</span>
                </div>
                <div className="text-xs font-bold text-[var(--ink)] mt-1">
                  {subjects[0]?.name || 'Materia Principal'}
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Examen próximo y 3 tareas acumuladas. Requiere enfoque prioritario.
                </p>
              </div>

              {/* Tarjeta Atención */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-amber-700 dark:text-amber-300 uppercase">
                    ATENCIÓN
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">Informe lab</span>
                </div>
                <div className="text-xs font-bold text-[var(--ink)] mt-1">
                  {subjects[1]?.name || 'Física'}
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Entrega pendiente esta semana con tiempo útil ajustado.
                </p>
              </div>

              {/* Tarjeta Estable */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-emerald-700 dark:text-emerald-300 uppercase">
                    ESTABLE
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">Al día</span>
                </div>
                <div className="text-xs font-bold text-[var(--ink)] mt-1">
                  {subjects.slice(2, 4).map((s) => s.name).join(', ') || 'Otras materias'}
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Asistencia excelente y sin alarmas inminentes.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/timeline"
            className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[var(--paper)] hover:bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--ink)] transition-all flex items-center justify-center gap-1.5"
          >
            <span>Ver cronograma de semanas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
