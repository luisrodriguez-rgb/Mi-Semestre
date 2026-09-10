'use client';

import { useState } from 'react';
import { useSemesterData } from '@/hooks/useSemesterData';
import { useUIStore } from '@/stores/uiStore';
import { mockHistoryCourses, mockPendingCourses } from '@/lib/mockData';
import {
  Award,
  TrendingUp,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';

export default function BalanceAcademicoPage() {
  const { profile, subjects, semester, isLoading } = useSemesterData();
  const { openOnboarding } = useUIStore();
  const [activeTab, setActiveTab] = useState<'matriculadas' | 'historial' | 'pendientes'>('matriculadas');

  const studentName = profile?.name || 'Estudiante';
  const studentCode = profile?.studentCode || 'A00414805';
  const studentProgram = profile?.program || 'Ingeniería de Sistemas';
  const studentGpa = profile?.gpa || 4.3;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#3b3abf] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--muted)] font-mono">Cargando balance académico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Institucional Icesi */}
      <div className="card-academic p-6 sm:p-8 bg-[var(--surface)] transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#3b3abf] dark:text-[#a0a0ff]">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Sistema de Registro Académico · Universidad Icesi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight mt-1">
              Balance Académico Oficial
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)] mt-2 font-mono">
              <span>Estudiante: <strong className="text-[var(--ink)]">{studentName}</strong></span>
              <span>·</span>
              <span>Código: <strong className="text-[#3b3abf] dark:text-[#a0a0ff]">{studentCode}</strong></span>
              <span>·</span>
              <span>Programa: <strong className="text-[var(--ink)]">{studentProgram}</strong></span>
              {semester && (
                <>
                  <span>·</span>
                  <span>Semestre Activo: <strong className="text-[var(--ink)]">{semester.name}</strong></span>
                </>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={openOnboarding}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar / Actualizar Balance</span>
              </button>
            </div>
          </div>

          {/* Promedio Acumulado Card */}
          <div className="shrink-0 bg-gradient-to-br from-[#1e1e8a] to-[#3b3abf] dark:from-[#131535] dark:to-[#2b2b80] text-white p-5 rounded-2xl shadow-xl shadow-[#1e1e8a]/20 border border-white/10 min-w-[200px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[#c5c5ff] font-mono font-bold">
                Promedio Acumulado
              </span>
              <Award className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-4xl font-black tracking-tight mt-1">
              {studentGpa}
              <span className="text-sm font-normal text-[#c5c5ff]"> / 5.0</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-mono font-bold">
              <TrendingUp className="w-3 h-3 text-emerald-300" />
              <span>Semestre {profile?.semesterNumber || 4} · Estado Activo</span>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[var(--paper)] border border-[var(--border)] mt-6">
          <button
            onClick={() => setActiveTab('matriculadas')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matriculadas'
                ? 'bg-[#3b3abf] text-white shadow-md shadow-[#3b3abf]/20'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Materias Matriculadas ({subjects.length})
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'historial'
                ? 'bg-[#3b3abf] text-white shadow-md shadow-[#3b3abf]/20'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Historial Cursado ({mockHistoryCourses.length} aprobadas)
          </button>
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pendientes'
                ? 'bg-[#3b3abf] text-white shadow-md shadow-[#3b3abf]/20'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Ruta Hacia el Grado ({mockPendingCourses.length} por cursar)
          </button>
        </div>
      </div>

      {/* TAB 1: MATERIAS MATRICULADAS */}
      {activeTab === 'matriculadas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjects.length === 0 ? (
            <div className="col-span-full card-academic p-10 bg-[var(--surface)] text-center space-y-4 border border-[var(--border)]">
              <div className="w-14 h-14 rounded-2xl bg-[#3b3abf]/10 text-[#3b3abf] dark:text-[#a0a0ff] flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-black text-[var(--ink)]">
                  No tienes materias registradas en este semestre
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Importa el texto de tu Balance Académico oficial de Banner / Icesi para generar automáticamente todas las tarjetas con código, créditos, NRC, profesor y límite de faltas.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={openOnboarding}
                  className="px-5 py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all shadow-md shadow-[#3b3abf]/20 cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importar Balance de Icesi</span>
                </button>
              </div>
            </div>
          ) : (
            subjects.map((sub) => (
              <div key={sub.id} className="card-academic p-5 bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between transition-colors shadow-xs hover:border-[#3b3abf]/40">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--paper)] text-[#3b3abf] dark:text-[#a0a0ff] border border-[var(--border)]">
                      Código: {sub.code} {sub.nrc ? `· NRC: ${sub.nrc}` : ''}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#16a34a] dark:text-[#4ade80] bg-[#f0fdf4] dark:bg-[#072714] px-2 py-0.5 rounded border border-[#dcfce7] dark:border-[#14532d]">
                      {sub.credits} Créditos
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                    <h3 className="text-base font-extrabold text-[var(--ink)]">
                      {sub.name}
                    </h3>
                  </div>

                  {sub.professor && (
                    <p className="text-xs text-[var(--muted)] mt-1 font-medium">
                      Profesor: {sub.professor}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--muted)]">Límite inasistencias:</span>
                    <span className="font-bold text-[var(--ink)]">{sub.maxAbsences} faltas</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: HISTORIAL DE MATERIAS APROBADAS */}
      {activeTab === 'historial' && (
        <div className="card-academic p-6 bg-[var(--surface)] transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">
                Registro Histórico de Asignaturas Aprobadas
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Asignaturas aprobadas con promedio acumulado ponderado
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#f0fdf4] dark:bg-[#072714] text-[#16a34a] dark:text-[#4ade80] border border-[#dcfce7] dark:border-[#14532d]">
              {mockHistoryCourses.length} Asignaturas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mockHistoryCourses.map((c, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--border)] flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-[var(--muted)] block">
                    {c.period} · {c.code}
                  </span>
                  <div className="text-xs font-bold text-[var(--ink)] mt-0.5 line-clamp-1" title={c.name}>
                    {c.name}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span
                    className={`font-mono text-xs font-black px-2 py-1 rounded ${
                      typeof c.grade === 'number' && c.grade >= 4.5
                        ? 'bg-[#dcfce7] dark:bg-[#072714] text-[#16a34a] dark:text-[#4ade80]'
                        : typeof c.grade === 'number'
                        ? 'bg-[#f0f0ff] dark:bg-[#181a38] text-[#3b3abf] dark:text-[#a0a0ff]'
                        : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'
                    }`}
                  >
                    {c.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MATERIAS POR CURSAR */}
      {activeTab === 'pendientes' && (
        <div className="card-academic p-6 bg-[var(--surface)] transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">
                Plan de Estudios Restante
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Asignaturas requeridas de semestres superiores para completar el plan de grado
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#f0f0ff] dark:bg-[#181a38] text-[#3b3abf] dark:text-[#a0a0ff] border border-[var(--border)]">
              {mockPendingCourses.length} Asignaturas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mockPendingCourses.map((p, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff] block">
                    Semestre {p.semester} · {p.code}
                  </span>
                  <div className="text-xs font-bold text-[var(--ink)] mt-0.5">
                    {p.name}
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--paper)] text-[var(--muted)] border border-[var(--border)] shrink-0 ml-2">
                  Pendiente
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
