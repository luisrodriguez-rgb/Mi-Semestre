'use client';

import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { examRepository } from '@/lib/storage';
import { X, Calendar } from 'lucide-react';

export function AddExamModal() {
  const { isAddExamOpen, closeAddExam } = useUIStore();
  const { subjects, refreshData } = useSemesterData();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [weight, setWeight] = useState(25);
  const [inDays, setInDays] = useState(5);

  if (!isAddExamOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const examDate = new Date();
    examDate.setDate(examDate.getDate() + Number(inDays));
    examDate.setHours(8, 0, 0, 0);

    await examRepository.save({
      id: `exam-${Date.now()}`,
      subjectId: subjectId || subjects[0]?.id || 'sub-calculo',
      title,
      date: examDate.toISOString(),
      weight: Number(weight),
      topics: ['Temas del corte'],
    });

    await refreshData();
    closeAddExam();
    setTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d0d14]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#e0dff0] shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#e0dff0]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#7c3aed]" />
            <h3 className="text-base font-bold text-[#0d0d14]">Nuevo Parcial o Evaluación</h3>
          </div>
          <button onClick={closeAddExam} className="p-1 text-[#7a7890] hover:text-[#0d0d14]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0d0d14] mb-1">Nombre de la evaluación</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Parcial 2: Teorema de Stokes"
              className="w-full rounded-xl border border-[#e0dff0] px-3 py-2 text-xs text-[#0d0d14] focus:outline-none focus:border-[#3b3abf]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0d0d14] mb-1">Materia</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-xl border border-[#e0dff0] px-3 py-2 text-xs text-[#0d0d14] focus:outline-none focus:border-[#3b3abf]"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0d0d14] mb-1">Ponderación (%)</label>
              <input
                type="number"
                min={5}
                max={50}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full rounded-xl border border-[#e0dff0] px-3 py-2 text-xs text-[#0d0d14] focus:outline-none focus:border-[#3b3abf]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0d0d14] mb-1">Fecha del Examen</label>
              <select
                value={inDays}
                onChange={(e) => setInDays(Number(e.target.value))}
                className="w-full rounded-xl border border-[#e0dff0] px-3 py-2 text-xs text-[#0d0d14] focus:outline-none focus:border-[#3b3abf]"
              >
                <option value={3}>En 3 días (Crítico)</option>
                <option value={5}>En 5 días</option>
                <option value={8}>En 8 días</option>
                <option value={14}>En 2 semanas</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 transition-all"
            >
              Registrar Parcial en Radar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
