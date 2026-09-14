'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { examRepository } from '@/lib/storage';
import { Exam } from '@/types';
import { X, Calendar, MapPin, FileText, Sparkles, Tag, Clock } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export function AddExamModal() {
  const { isAddExamOpen, closeAddExam, editingExam } = useUIStore();
  const { subjects, refreshData } = useSemesterData();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [weight, setWeight] = useState(25);
  const [examDateStr, setExamDateStr] = useState('');
  const [examTimeStr, setExamTimeStr] = useState('08:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [topicsStr, setTopicsStr] = useState('');

  // Helper para formatear fecha a YYYY-MM-DD
  const formatDateToYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Sincronizar estado cuando se abre el modal (sea nuevo o edición)
  useEffect(() => {
    if (!isAddExamOpen) return;

    if (editingExam) {
      setTitle(editingExam.title || '');
      setSubjectId(editingExam.subjectId || subjects[0]?.id || '');
      setWeight(editingExam.weight || 25);
      setLocation(editingExam.location || '');
      setNotes(editingExam.notes || '');
      setTopicsStr(editingExam.topics?.join(', ') || '');

      const parsedDate = new Date(editingExam.date);
      if (!isNaN(parsedDate.getTime())) {
        setExamDateStr(formatDateToYMD(parsedDate));
        const hours = String(parsedDate.getHours()).padStart(2, '0');
        const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
        setExamTimeStr(`${hours}:${minutes}`);
      } else {
        const fallback = new Date();
        fallback.setDate(fallback.getDate() + 4);
        setExamDateStr(formatDateToYMD(fallback));
        setExamTimeStr('08:00');
      }
    } else {
      // Nuevo examen por defecto
      setTitle('');
      setSubjectId(subjects[0]?.id || '');
      setWeight(25);
      setLocation('');
      setNotes('');
      setTopicsStr('');

      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 4);
      setExamDateStr(formatDateToYMD(defaultDate));
      setExamTimeStr('08:00');
    }
  }, [isAddExamOpen, editingExam, subjects]);

  if (!isAddExamOpen) return null;

  // Acceso directo a atajos rápidos de fecha
  const applyDatePreset = (daysFromNow: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    setExamDateStr(formatDateToYMD(target));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSubId = subjectId || subjects[0]?.id;
    if (!effectiveSubId) return;

    // Construir fecha combinada ISO
    const combinedDate = new Date(`${examDateStr}T${examTimeStr || '08:00'}:00`);
    const dateIso = !isNaN(combinedDate.getTime())
      ? combinedDate.toISOString()
      : new Date().toISOString();

    const cleanTopics = topicsStr
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const examData: Exam = {
      id: editingExam?.id || `exam-${Date.now()}`,
      subjectId: effectiveSubId,
      title: title.trim(),
      weight,
      date: dateIso,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      topics: cleanTopics.length > 0 ? cleanTopics : ['Unidades temáticas del corte'],
    };

    await examRepository.save(examData);
    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
    closeAddExam();
  };

  // Formato amigable de previsualización
  const selectedDateObj = examDateStr ? new Date(`${examDateStr}T12:00:00`) : null;
  const friendlyDate = selectedDateObj && !isNaN(selectedDateObj.getTime())
    ? selectedDateObj.toLocaleDateString('es-CO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative transition-colors my-8">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed] dark:text-[#c084fc]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[var(--ink)]">
                {editingExam ? 'Editar Evaluación o Parcial' : 'Nuevo Parcial o Evaluación'}
              </h3>
              <p className="text-[11px] text-[var(--muted)]">
                Establece fecha exacta, aula, ponderación y requerimientos para el radar
              </p>
            </div>
          </div>
          <button
            onClick={closeAddExam}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Título de la evaluación */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">
              Nombre de la evaluación <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Parcial 2: Teorema de Stokes y Divergencia"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#3b3abf] focus:ring-2 focus:ring-[#3b3abf]/15 transition-all"
            />
          </div>

          {/* Materia vinculada */}
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

          {/* Ponderación y Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                Ponderación (% de la nota)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3.5 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] focus:ring-2 focus:ring-[#3b3abf]/15 transition-all font-mono"
                />
                <span className="absolute right-3 top-2 text-xs font-mono font-bold text-[var(--muted)]">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
                <span>Salón / Aula / Lugar</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Edificio C · Salón 201 o Lab 3"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#3b3abf] focus:ring-2 focus:ring-[#3b3abf]/15 transition-all"
              />
            </div>
          </div>

          {/* Selector de Fecha Exacta y Hora */}
          <div className="p-3.5 rounded-2xl bg-[var(--paper)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#c084fc]" />
                <span>Fecha y Hora del Examen</span>
              </span>
              {friendlyDate && (
                <span className="text-[11px] font-mono font-bold text-[#7c3aed] dark:text-[#c084fc] bg-[#7c3aed]/10 px-2 py-0.5 rounded-lg">
                  {friendlyDate} · {examTimeStr}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-[var(--muted)] mb-1">
                  Fecha exacta
                </label>
                <input
                  type="date"
                  required
                  value={examDateStr}
                  onChange={(e) => setExamDateStr(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink)] font-mono focus:outline-none focus:border-[#7c3aed] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-[var(--muted)] mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[var(--muted)]" />
                  <span>Hora de inicio</span>
                </label>
                <input
                  type="time"
                  required
                  value={examTimeStr}
                  onChange={(e) => setExamTimeStr(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink)] font-mono focus:outline-none focus:border-[#7c3aed] transition-colors"
                />
              </div>
            </div>

            {/* Chips de atajos rápidos */}
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--muted)] block mb-1.5">
                Atajos de fecha rápida:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'En 2 días', days: 2 },
                  { label: 'En 4 días', days: 4 },
                  { label: 'En 1 semana', days: 7 },
                  { label: 'En 2 semanas', days: 14 },
                  { label: 'En 3 semanas', days: 21 },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => applyDatePreset(preset.days)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--surface)] hover:bg-[#7c3aed]/10 hover:text-[#7c3aed] dark:hover:text-[#c084fc] border border-[var(--border)] text-[var(--muted)] transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notas / Qué llevar / Indicaciones */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Notas, requerimientos o qué llevar al examen</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Llevar calculadora programable TI, carné estudiantil, lápiz 2B y hojas cuadriculadas..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#3b3abf] focus:ring-2 focus:ring-[#3b3abf]/15 transition-all resize-none"
            />
          </div>

          {/* Temas Clave */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span>Temas clave (separados por coma)</span>
            </label>
            <input
              type="text"
              value={topicsStr}
              onChange={(e) => setTopicsStr(e.target.value)}
              placeholder="Ej: Transformada de Laplace, Convolución, Ecuaciones homogéneas"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#3b3abf] focus:ring-2 focus:ring-[#3b3abf]/15 transition-all"
            />
          </div>

          {/* Botón de Envío */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{editingExam ? 'Guardar Cambios de la Evaluación' : 'Registrar Parcial en Radar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
