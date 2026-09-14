'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { assignmentRepository } from '@/lib/storage';
import { Assignment, TaskPriority } from '@/types';
import { X, PlusCircle, Calendar, Clock, MapPin, FileText, CheckCircle } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export function AddTaskModal() {
  const { isAddTaskOpen, closeAddTask, editingTask } = useUIStore();
  const { subjects, refreshData } = useSemesterData();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDateStr, setDueDateStr] = useState('');
  const [dueTimeStr, setDueTimeStr] = useState('23:59');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Helper para formatear fecha a YYYY-MM-DD
  const formatDateToYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!isAddTaskOpen) return;

    if (editingTask) {
      setTitle(editingTask.title || '');
      setSubjectId(editingTask.subjectId || subjects[0]?.id || '');
      setEstimatedMinutes(editingTask.estimatedMinutes || 45);
      setPriority(editingTask.priority || 'medium');
      setLocation(editingTask.location || '');
      setNotes(editingTask.notes || editingTask.description || '');

      const parsed = new Date(editingTask.dueDate);
      if (!isNaN(parsed.getTime())) {
        setDueDateStr(formatDateToYMD(parsed));
        const hh = String(parsed.getHours()).padStart(2, '0');
        const mm = String(parsed.getMinutes()).padStart(2, '0');
        setDueTimeStr(`${hh}:${mm}`);
      } else {
        const fallback = new Date();
        fallback.setDate(fallback.getDate() + 2);
        setDueDateStr(formatDateToYMD(fallback));
        setDueTimeStr('23:59');
      }
    } else {
      setTitle('');
      setSubjectId(subjects[0]?.id || '');
      setEstimatedMinutes(45);
      setPriority('medium');
      setLocation('');
      setNotes('');

      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 2);
      setDueDateStr(formatDateToYMD(defaultDate));
      setDueTimeStr('23:59');
    }
  }, [isAddTaskOpen, editingTask, subjects]);

  if (!isAddTaskOpen) return null;

  const applyDatePreset = (daysFromNow: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    setDueDateStr(formatDateToYMD(target));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSubId = subjectId || subjects[0]?.id;
    if (!effectiveSubId) return;

    const combinedDate = new Date(`${dueDateStr}T${dueTimeStr || '23:59'}:00`);
    const dateIso = !isNaN(combinedDate.getTime())
      ? combinedDate.toISOString()
      : new Date().toISOString();

    const taskData: Assignment = {
      id: editingTask?.id || `task-${Date.now()}`,
      subjectId: effectiveSubId,
      title: title.trim(),
      estimatedMinutes,
      priority,
      status: editingTask?.status || 'pending',
      dueDate: dateIso,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      description: notes.trim() || undefined,
    };

    await assignmentRepository.save(taskData);
    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
    closeAddTask();
  };

  const selectedDateObj = dueDateStr ? new Date(`${dueDateStr}T12:00:00`) : null;
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
            <div className="w-9 h-9 rounded-xl bg-[#3b3abf]/10 border border-[#3b3abf]/20 flex items-center justify-center text-[#3b3abf] dark:text-[#a0a0ff]">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[var(--ink)]">
                {editingTask ? 'Editar Tarea o Entrega' : 'Nueva Tarea o Entrega'}
              </h3>
              <p className="text-[11px] text-[var(--muted)]">
                Define plazo exacto, aula/modalidad y notas o material a llevar
              </p>
            </div>
          </div>
          <button
            onClick={closeAddTask}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Título de la tarea */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">
              Título de la tarea o entrega <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Taller 5 de Derivadas parciales y optimización"
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

          {/* Tiempo estimado y Salón/Modalidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Tiempo Estimado</label>
              <CustomSelect
                className="w-full"
                value={String(estimatedMinutes)}
                onChange={(val) => setEstimatedMinutes(Number(val))}
                options={[
                  { value: '15', label: '15 minutos' },
                  { value: '30', label: '30 minutos' },
                  { value: '45', label: '45 minutos' },
                  { value: '60', label: '1 hora' },
                  { value: '90', label: '1h 30m' },
                  { value: '120', label: '2 horas' },
                  { value: '180', label: '3 horas' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
                <span>Salón / Modalidad de entrega</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Salón B-102, Teams, Moodle o Físico"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#3b3abf] focus:ring-2 focus:ring-[#3b3abf]/15 transition-all"
              />
            </div>
          </div>

          {/* Selector de Fecha Exacta y Hora Límite */}
          <div className="p-3.5 rounded-2xl bg-[var(--paper)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
                <span>Fecha y Hora de Entrega</span>
              </span>
              {friendlyDate && (
                <span className="text-[11px] font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff] bg-[#3b3abf]/10 px-2 py-0.5 rounded-lg">
                  {friendlyDate} · {dueTimeStr}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-[var(--muted)] mb-1">
                  Fecha exacta de entrega
                </label>
                <input
                  type="date"
                  required
                  value={dueDateStr}
                  onChange={(e) => setDueDateStr(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink)] font-mono focus:outline-none focus:border-[#3b3abf] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-[var(--muted)] mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[var(--muted)]" />
                  <span>Hora límite</span>
                </label>
                <input
                  type="time"
                  required
                  value={dueTimeStr}
                  onChange={(e) => setDueTimeStr(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink)] font-mono focus:outline-none focus:border-[#3b3abf] transition-colors"
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
                  { label: 'Hoy', days: 0 },
                  { label: 'Mañana', days: 1 },
                  { label: 'En 2 días', days: 2 },
                  { label: 'En 3 días', days: 3 },
                  { label: 'En 4 días', days: 4 },
                  { label: 'En 1 semana', days: 7 },
                  { label: 'En 2 semanas', days: 14 },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => applyDatePreset(preset.days)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--surface)] hover:bg-[#3b3abf]/10 hover:text-[#3b3abf] dark:hover:text-[#a0a0ff] border border-[var(--border)] text-[var(--muted)] transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Nivel de Prioridad */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">Nivel de Prioridad</label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    priority === p
                      ? 'bg-[#3b3abf] text-white border-[#3b3abf] shadow-xs'
                      : 'bg-[var(--paper)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--ink)]'
                  }`}
                >
                  {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
                </button>
              ))}
            </div>
          </div>

          {/* Notas / Qué llevar / Indicaciones */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Notas, qué llevar o especificaciones</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Llevar impreso a doble cara, incluir rúbrica, llevar computador con batería cargada..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#3b3abf] focus:ring-2 focus:ring-[#3b3abf]/15 transition-all resize-none"
            />
          </div>

          {/* Botón de Guardar */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <CheckCircle className="w-3.5 h-3.5 text-white" />
              <span>{editingTask ? 'Guardar Cambios de la Tarea' : 'Guardar Tarea'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
