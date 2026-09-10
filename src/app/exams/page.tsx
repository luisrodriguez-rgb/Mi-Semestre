'use client';

import { useState } from 'react';
import { useSemesterData } from '@/hooks/useSemesterData';
import { useUIStore } from '@/stores/uiStore';
import { examRepository } from '@/lib/storage';
import {
  Calendar,
  Plus,
  Trash2,
  Filter,
  Search,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function ExamsPage() {
  const { exams, subjects, subjectsMap, refreshData, isLoading } = useSemesterData();
  const { openAddExam, startFocusSession } = useUIStore();

  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este examen de la programación?')) {
      await examRepository.delete(id);
      await refreshData();
      window.dispatchEvent(new CustomEvent('semester-data-updated'));
    }
  };

  const filteredExams = exams.filter((exam) => {
    if (filterSubject !== 'all' && exam.subjectId !== filterSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = exam.title.toLowerCase().includes(q);
      const matchSub = subjectsMap[exam.subjectId]?.name.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchSub) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#3b3abf] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--muted)] font-mono">Cargando evaluaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3b3abf]/10 border border-[#3b3abf]/20 flex items-center justify-center text-[#3b3abf] dark:text-[#a0a0ff]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--ink)] tracking-tight flex items-center gap-2">
              <span>Evaluaciones y Parciales</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--paper)] text-[#3b3abf] dark:text-[#a0a0ff] border border-[var(--border)]">
                {exams.length} programados
              </span>
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Calendario semestral de parciales, entregas de proyecto y quices con ponderación
            </p>
          </div>
        </div>

        <button
          onClick={openAddExam}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Parcial</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs text-xs transition-colors">
        <div className="flex items-center gap-2">
          <CustomSelect
            value={filterSubject}
            onChange={setFilterSubject}
            options={[
              {
                value: 'all',
                label: 'Todas las materias',
                badge: String(subjects.length),
              },
              ...subjects.map((sub) => ({
                value: sub.id,
                label: sub.name,
                sublabel: sub.code,
                color: sub.color,
              })),
            ]}
            icon={Filter}
            buttonClassName="py-1.5"
          />
        </div>

        {/* Input de Búsqueda */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por tema o materia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--paper)] border border-[var(--border)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] outline-none focus:border-[#3b3abf] transition-colors"
          />
        </div>
      </div>

      {/* Grid de Parciales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExams.length === 0 ? (
          <div className="col-span-full text-center py-12 rounded-2xl bg-white dark:bg-[#0f1330] border border-[#e2e6f2] dark:border-[#1c224b] p-6">
            <Calendar className="w-10 h-10 text-[#3b3abf]/40 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-[#0f1330] dark:text-white">
              No hay evaluaciones programadas
            </h3>
            <p className="text-xs text-[#626c96] dark:text-[#8b95c2] mt-1">
              Programa tus parciales para que el radar preventivo calcule los días restantes.
            </p>
            <button
              onClick={openAddExam}
              className="mt-4 px-4 py-2 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Examen</span>
            </button>
          </div>
        ) : (
          filteredExams.map((exam) => {
            const sub = subjectsMap[exam.subjectId];
            const examDate = new Date(exam.date);
            const now = new Date();
            const diffDays = Math.ceil(
              (examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            const day = isNaN(examDate.getDate()) ? '15' : examDate.getDate().toString();
            const month = isNaN(examDate.getMonth())
              ? 'SEP'
              : examDate.toLocaleDateString('es-CO', { month: 'short' }).toUpperCase();
            const timeStr = isNaN(examDate.getTime())
              ? ''
              : examDate.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true });

            return (
              <div
                key={exam.id}
                className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs hover:border-[#3b3abf] transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Cuadro de Fecha */}
                      <div className="w-12 h-14 rounded-2xl bg-[var(--paper)] border border-[var(--border)] flex flex-col items-center justify-center shrink-0 shadow-2xs">
                        <span className="text-[10px] font-mono font-bold text-[var(--muted)] leading-none uppercase">
                          {month}
                        </span>
                        <span className="text-lg font-black text-[var(--ink)] leading-tight font-mono mt-0.5">
                          {day}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {sub && (
                            <span
                              className="px-2 py-0.5 rounded-md font-bold text-[10px] text-white shadow-2xs"
                              style={{ backgroundColor: sub.color }}
                            >
                              {sub.name}
                            </span>
                          )}
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
                            Peso: {exam.weight}%
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-[var(--ink)] mt-1.5 group-hover:text-[#3b3abf] dark:group-hover:text-[#a0a0ff] transition-colors">
                          {exam.title}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="p-2 text-[var(--muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar examen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Temas si están especificados */}
                  {exam.topics && exam.topics.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-[var(--border)]">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-bold mb-1.5">
                        Temas clave:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {exam.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2.5 py-0.5 rounded-lg bg-[var(--paper)] text-[var(--ink)] border border-[var(--border)] font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer de la tarjeta con tiempo restante y botón de estudio */}
                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--muted)]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {diffDays > 0
                        ? `Faltan ${diffDays} días`
                        : diffDays === 0
                        ? '¡Hoy!'
                        : 'Finalizado'}
                    </span>
                    {timeStr && <span>· {timeStr}</span>}
                  </div>

                  <button
                    onClick={() =>
                      startFocusSession(
                        `Estudio: ${exam.title}`,
                        sub?.name || 'Parcial',
                        50
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Sesión de Estudio</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
