'use client';

import React from 'react';
import Link from 'next/link';
import { useSemesterData } from '@/hooks/useSemesterData';
import { useUIStore } from '@/stores/uiStore';
import { SubjectsSummaryWidget } from '@/components/dashboard/SubjectsSummaryWidget';
import {
  GraduationCap,
  Calendar,
  Plus,
  BookOpen,
  ArrowRight,
  Calculator,
} from 'lucide-react';

export default function NotasPage() {
  const { subjects, exams, grades, isLoading } = useSemesterData();
  const { openGradeCalculator } = useUIStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#3b3abf] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--muted)] font-mono">Cargando libreta de notas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-150 pb-16">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#3b3abf]/10 text-[#3b3abf] dark:text-[#a0a0ff]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight">
                Libreta de Notas
              </h1>
              <p className="text-xs text-[var(--muted)]">
                Seguimiento de notas, porcentaje evaluado y cuánto necesitas para aprobar.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openGradeCalculator()}
            className="px-3.5 py-2 rounded-xl bg-[#3b3abf] hover:bg-[#2d2cb0] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Abrir libreta de notas</span>
          </button>

          <Link
            href="/exams"
            className="px-3 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--paper)] text-[var(--ink)] text-xs font-semibold transition-all border border-[var(--border)] flex items-center gap-1.5"
            title="Ver calendario de parciales y exámenes"
          >
            <Calendar className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span className="hidden sm:inline">Calendario de parciales</span>
            <span className="sm:hidden">Parciales</span>
            <ArrowRight className="w-3 h-3 text-[var(--muted)]" />
          </Link>
        </div>
      </div>

      {/* Lista de Tus Materias a pantalla completa */}
      {subjects.length > 0 ? (
        <div className="space-y-4">
          <SubjectsSummaryWidget
            subjects={subjects}
            exams={exams}
            grades={grades}
          />

          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--muted)] flex items-start gap-3">
            <Calculator className="w-4 h-4 text-[#3b3abf] dark:text-[#a0a0ff] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[var(--ink)]">¿Cómo funciona el cálculo?</span>
              <p className="mt-0.5 leading-relaxed">
                Toca cualquier materia para ver el desglose de evaluaciones, anotar nuevas notas o simular escenarios. La nota necesaria se calcula matemáticamente para alcanzar 3.0 en el porcentaje que falta evaluar del curso.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
          <BookOpen className="w-8 h-8 text-[var(--muted)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--ink)]">No tienes materias registradas</h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            Configura tus materias en el horario para comenzar a registrar notas y calcular tus promedios.
          </p>
          <Link
            href="/schedule"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3b3abf] text-white text-xs font-bold hover:bg-[#2d2cb0] transition-all"
          >
            <span>Ir a Horario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
