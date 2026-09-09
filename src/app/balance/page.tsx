'use client';

import { useState } from 'react';
import { defaultProfile, mockSubjects, mockHistoryCourses, mockPendingCourses } from '@/lib/mockData';
import {
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

export default function BalanceAcademicoPage() {
  const [activeTab, setActiveTab] = useState<'matriculadas' | 'historial' | 'pendientes'>('matriculadas');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Institucional Icesi */}
      <div className="card-cambas p-6 sm:p-8 bg-[var(--surface)] transition-colors">
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
              <span>Estudiante: <strong className="text-[var(--ink)]">{defaultProfile.name}</strong></span>
              <span>·</span>
              <span>Código: <strong className="text-[#3b3abf] dark:text-[#a0a0ff]">{defaultProfile.studentCode}</strong></span>
              <span>·</span>
              <span>Documento: <strong className="text-[var(--ink)]">{defaultProfile.documentId}</strong></span>
              <span>·</span>
              <span>Programa: <strong className="text-[var(--ink)]">{defaultProfile.program}</strong></span>
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
              {defaultProfile.gpa}
              <span className="text-sm font-normal text-[#c5c5ff]"> / 5.0</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-mono font-bold">
              <TrendingUp className="w-3 h-3 text-emerald-300" />
              <span>Cohorte {defaultProfile.cohort} · Semestre {defaultProfile.semesterNumber}</span>
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
            Materias Matriculadas 2026-2 ({mockSubjects.length})
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

      {/* TAB 1: MATERIAS MATRICULADAS CON SUS COMPONENTES DE NOTA */}
      {activeTab === 'matriculadas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {mockSubjects.map((sub) => (
            <div key={sub.id} className="card-cambas p-5 bg-[var(--surface)] flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--paper)] text-[#3b3abf] dark:text-[#a0a0ff] border border-[var(--border)]">
                    Código: {sub.code} · NRC: {sub.nrc}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#16a34a] dark:text-[#4ade80] bg-[#f0fdf4] dark:bg-[#072714] px-2 py-0.5 rounded border border-[#dcfce7] dark:border-[#14532d]">
                    {sub.credits} Créditos
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-[var(--ink)] mt-2.5">
                  {sub.name}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5 font-medium">
                  Profesor: {sub.professor}
                </p>

                {/* Desglose de componentes según syllabus del balance académico */}
                <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-1.5 text-xs">
                  <span className="text-[10px] font-mono uppercase font-bold text-[var(--muted)] block mb-1">
                    Componentes de Evaluación Oficial:
                  </span>
                  {sub.id === 'sub-optimizacion' && (
                    <>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Cuadernos Google Colab en grupo (x3)</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">30%</span>
                      </div>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Jornadas Solución de Problemas (Unidades 1, 2, 3)</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">60%</span>
                      </div>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Proyecto Final de Optimización</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">10%</span>
                      </div>
                    </>
                  )}
                  {sub.id === 'sub-estadistica-2' && (
                    <>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Tres Exámenes Parciales (20% c/u)</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">60%</span>
                      </div>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Proyecto Integrador de Análisis Estadístico</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">25%</span>
                      </div>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Entregables continuos</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">15%</span>
                      </div>
                    </>
                  )}
                  {sub.id === 'sub-electricidad' && (
                    <>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Exámenes Parciales 1, 2 y 3</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">70%</span>
                      </div>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Informes de Laboratorio Semanal</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">30%</span>
                      </div>
                    </>
                  )}
                  {sub.id === 'sub-matematicas-3' && (
                    <>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Exámenes Parciales</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">60%</span>
                      </div>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Talleres y Quices continuos</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">40%</span>
                      </div>
                    </>
                  )}
                  {sub.id === 'sub-contabilidad' && (
                    <>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Evaluaciones Parciales y Casos</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">70%</span>
                      </div>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Talleres Prácticos Financieros</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">30%</span>
                      </div>
                    </>
                  )}
                  {sub.id === 'sub-academic-comm-2' && (
                    <>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Written Argumentative Tasks</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">50%</span>
                      </div>
                      <div className="flex justify-between text-[var(--ink)]">
                        <span>Oral Presentations & Seminars</span>
                        <span className="font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">50%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs font-mono">
                <span className="text-[var(--muted)]">Límite inasistencias:</span>
                <span className="font-bold text-[var(--ink)]">{sub.maxAbsences} faltas</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: HISTORIAL DE MATERIAS APROBADAS */}
      {activeTab === 'historial' && (
        <div className="card-cambas p-6 bg-[var(--surface)] transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">
                Registro Histórico de Asignaturas Aprobadas
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Semestres 1 a 3 aprobados con promedio acumulado de 4.3
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

      {/* TAB 3: MATERIAS POR CURSAR (MALLA INGENIERÍA INDUSTRIAL) */}
      {activeTab === 'pendientes' && (
        <div className="card-cambas p-6 bg-[var(--surface)] transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">
                Plan de Estudios Restante — Grado en Ingeniería Industrial
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Asignaturas requeridas de semestres 5 a 9
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
