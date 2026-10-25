'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useSemesterData } from '@/hooks/useSemesterData';
import { buildEvaluationPlanFromExams, calculateGradeStatus } from '@/lib/academic-engine';

interface CampusWelcomeBannerProps {
  studentName?: string;
}

export function CampusWelcomeBanner({ studentName }: CampusWelcomeBannerProps) {
  const { profile, subjects, exams, assignments, grades } = useSemesterData();

  // Tomar solo el primer nombre
  const rawName = studentName || profile?.name || 'Estudiante';
  const firstName = rawName.trim().split(' ')[0] || 'Estudiante';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '¡Buenos días';
    if (hour >= 12 && hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  }, []);

  // Diagnóstico rápido de materias que requieren atención
  const attentionStats = useMemo(() => {
    let attentionCount = 0;
    for (const sub of subjects) {
      const plan = buildEvaluationPlanFromExams(sub, exams, grades);
      const res = calculateGradeStatus({
        subjectId: sub.id,
        evaluations: plan,
        passingGrade: sub.passingGrade || 3.0,
      });
      if (res.status === 'RIESGO_CRITICO' || res.status === 'EXIGE_ESFUERZO' || (res.requiredGrade && res.requiredGrade > 3.8)) {
        attentionCount++;
      }
    }

    // Entregas o parciales en los próximos 7 días
    const now = Date.now();
    const urgentItemsCount = [
      ...assignments.filter((a) => {
        if (a.status === 'completed') return false;
        const diff = (new Date(a.dueDate).getTime() - now) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      }),
      ...exams.filter((e) => {
        const diff = (new Date(e.date).getTime() - now) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      }),
    ].length;

    return { attentionCount, urgentItemsCount };
  }, [subjects, exams, assignments, grades]);

  // Verificar si el estudiante ya registró alguna nota en el semestre
  const hasAnyGrades = useMemo(() => {
    return (
      grades.some((g) => g.value !== null && g.value !== undefined) ||
      subjects.some((sub) => {
        const plan = buildEvaluationPlanFromExams(sub, exams, grades);
        return plan.some((item) => item.grade !== null && item.grade !== undefined);
      })
    );
  }, [grades, subjects, exams]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0b102b] text-white border border-[#1c224b] shadow-xs py-4 px-5 sm:px-6 flex items-center justify-between transition-colors">
      {/* Texto de bienvenida reducido y accionable */}
      <div className="relative z-20 max-w-[75%] sm:max-w-[70%] md:max-w-xl">
        <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
          {greeting}, {firstName}!
        </h1>
        <p className="text-xs sm:text-[13px] text-[#cbd5e1] mt-1 leading-relaxed">
          {!hasAnyGrades
            ? 'Anota tus notas para ver cómo vas.'
            : attentionStats.attentionCount > 0
            ? `${attentionStats.attentionCount} ${attentionStats.attentionCount === 1 ? 'materia requiere' : 'materias requieren'} atención prioritaria para asegurar aprobación.`
            : attentionStats.urgentItemsCount > 0
            ? `Tienes ${attentionStats.urgentItemsCount} ${attentionStats.urgentItemsCount === 1 ? 'evaluación o entrega programada' : 'evaluaciones o entregas programadas'} para los próximos 7 días.`
            : 'Semestre al día: todas tus asignaturas están en trayectoria estable.'}
        </p>
      </div>

      {/* Imagen decorativa de campus */}
      <div className="absolute right-0 top-0 bottom-0 w-[35%] md:w-[40%] pointer-events-none select-none overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0b102b] via-[#0b102b]/85 to-transparent" />
        <Image
          src="/campus_icesi.webp"
          alt="Campus Universitario Icesi"
          fill
          priority
          className="object-cover object-center opacity-50"
          sizes="(max-width: 768px) 35vw, 40vw"
        />
      </div>
    </div>
  );
}
