'use client';

import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { examRepository } from '@/lib/storage';
import { Exam } from '@/types';
import { X, Calendar } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export function AddExamModal() {
  const { isAddExamOpen, closeAddExam } = useUIStore();
  const { subjects, refreshData } = useSemesterData();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [weight, setWeight] = useState(25);
  const [inDays, setInDays] = useState(4);

  if (!isAddExamOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSubId = subjectId || subjects[0]?.id;
    if (!effectiveSubId) return;

    const examDate = new Date();
    examDate.setDate(examDate.getDate() + inDays);

    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      subjectId: effectiveSubId,
      title,
      weight,
      date: examDate.toISOString(),
      topics: ['Unidades temáticas del corte'],
    };

    await examRepository.save(newExam);
    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
    closeAddExam();
    setTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#7c3aed] dark:text-[#c084fc]" />
            <h3 className="text-base font-bold text-[var(--ink)]">Nuevo Parcial o Evaluación</h3>
          </div>
          <button
            onClick={closeAddExam}
            className="p-1 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">Nombre de la evaluación</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Parcial 2: Teorema de Stokes"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">Materia</label>
            <CustomSelect
              className="w-full"
              value={subjectId || subjects[0]?.id || ''}
              onChange={(val) => setSubjectId(val)}
              options={subjects.map((sub) => ({
                value: sub.id,
                label: sub.name,
                sublabel: sub.code,
                color: sub.color,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Ponderación (%)</label>
              <input
                type="number"
                min={5}
                max={50}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Fecha del Examen</label>
              <CustomSelect
                className="w-full"
                value={String(inDays)}
                onChange={(val) => setInDays(Number(val))}
                options={[
                  { value: '2', label: 'En 2 días', badge: 'Urgente' },
                  { value: '4', label: 'En 4 días', badge: 'Crítico' },
                  { value: '7', label: 'En 1 semana' },
                  { value: '14', label: 'En 2 semanas' },
                  { value: '21', label: 'En 3 semanas' },
                ]}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 transition-all cursor-pointer"
            >
              Registrar Parcial en Radar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
