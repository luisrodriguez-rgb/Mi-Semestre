'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { scheduleRepository, subjectRepository } from '@/lib/storage';
import { ScheduleBlock, Subject, DayOfWeek } from '@/types';
import { X, Calendar, Trash2, Check, Clock, MapPin, BookOpen, AlertTriangle } from 'lucide-react';

export function EditClassModal() {
  const { isEditClassOpen, editingScheduleBlock, closeEditClass } = useUIStore();
  const { subjects, subjectsMap, refreshData, semester } = useSemesterData();

  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(1);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [subjectId, setSubjectId] = useState('');

  // Edición directa y completa de la materia
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectNrc, setSubjectNrc] = useState('');
  const [subjectProfessor, setSubjectProfessor] = useState('');
  const [subjectColor, setSubjectColor] = useState('#3b3abf');
  const [subjectMaxAbsences, setSubjectMaxAbsences] = useState(4);

  useEffect(() => {
    if (editingScheduleBlock) {
      setDayOfWeek(editingScheduleBlock.dayOfWeek);
      setStartTime(editingScheduleBlock.startTime);
      setEndTime(editingScheduleBlock.endTime);
      setLocation(editingScheduleBlock.location || '');
      setSubjectId(editingScheduleBlock.subjectId);

      const sub = subjectsMap[editingScheduleBlock.subjectId];
      if (sub) {
        setSubjectName(sub.name || '');
        setSubjectCode(sub.code || '');
        setSubjectNrc(sub.nrc || '');
        setSubjectProfessor(sub.professor || '');
        setSubjectColor(sub.color || '#3b3abf');
        setSubjectMaxAbsences(sub.maxAbsences ?? 4);
      } else {
        setSubjectName('');
        setSubjectCode('');
        setSubjectNrc('');
        setSubjectProfessor('');
        setSubjectColor('#3b3abf');
        setSubjectMaxAbsences(4);
      }
    } else {
      // Nuevo bloque
      setDayOfWeek(1);
      setStartTime('08:00');
      setEndTime('10:00');
      setLocation('Campus Principal');
      const firstSub = subjects[0];
      if (firstSub) {
        setSubjectId(firstSub.id);
        setSubjectName(firstSub.name);
        setSubjectCode(firstSub.code);
        setSubjectNrc(firstSub.nrc || '');
        setSubjectProfessor(firstSub.professor || '');
        setSubjectColor(firstSub.color);
        setSubjectMaxAbsences(firstSub.maxAbsences ?? 4);
      } else {
        setSubjectId('');
        setSubjectName('');
        setSubjectCode('');
        setSubjectNrc('');
        setSubjectProfessor('');
        setSubjectColor('#3b3abf');
        setSubjectMaxAbsences(4);
      }
    }
  }, [editingScheduleBlock, subjects, subjectsMap]);

  if (!isEditClassOpen) return null;

  const handleSelectExistingSubject = (id: string) => {
    setSubjectId(id);
    const sub = subjectsMap[id];
    if (sub) {
      setSubjectName(sub.name);
      setSubjectCode(sub.code);
      setSubjectNrc(sub.nrc || '');
      setSubjectProfessor(sub.professor || '');
      setSubjectColor(sub.color);
      setSubjectMaxAbsences(sub.maxAbsences ?? 4);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetSubId = subjectId;

    // Actualizar o crear la materia siempre con los campos editados directamente
    const existing = targetSubId ? subjectsMap[targetSubId] : undefined;
    const updatedSubject: Subject = {
      id: targetSubId || `sub-${Date.now()}`,
      semesterId: semester?.id || 'sem-2026-2',
      name: subjectName.trim() || 'Materia',
      code: subjectCode.trim() || 'COD001',
      nrc: subjectNrc.trim(),
      professor: subjectProfessor.trim(),
      color: subjectColor,
      credits: existing?.credits || 3,
      maxAbsences: Number(subjectMaxAbsences) || 4,
      passingGrade: existing?.passingGrade || 3.0,
    };

    await subjectRepository.save(updatedSubject);
    targetSubId = updatedSubject.id;

    // Guardar bloque de clase
    const block: ScheduleBlock = {
      id: editingScheduleBlock ? editingScheduleBlock.id : `block-${Date.now()}`,
      subjectId: targetSubId,
      dayOfWeek,
      startTime,
      endTime,
      location: location.trim(),
    };

    await scheduleRepository.save(block);
    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
    closeEditClass();
  };

  const handleDeleteBlock = async () => {
    if (!editingScheduleBlock) return;
    if (confirm('¿Eliminar esta clase del horario semanal?')) {
      await scheduleRepository.delete(editingScheduleBlock.id);
      await refreshData();
      window.dispatchEvent(new CustomEvent('semester-data-updated'));
      closeEditClass();
    }
  };

  const handleDeleteFullSubject = async () => {
    if (!subjectId) return;
    const name = subjectName || 'esta materia';
    if (confirm(`¿Eliminar COMPLETAMENTE la materia "${name}" y todas sus clases asociadas?`)) {
      if (editingScheduleBlock) {
        await scheduleRepository.delete(editingScheduleBlock.id);
      }
      await subjectRepository.delete(subjectId);
      await refreshData();
      window.dispatchEvent(new CustomEvent('semester-data-updated'));
      closeEditClass();
    }
  };

  const dayLabels = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
  ];

  const colorPalette = [
    '#3b3abf',
    '#7c3aed',
    '#059669',
    '#d97706',
    '#dc2626',
    '#0284c7',
    '#4f46e5',
    '#e11d48',
    '#0891b2',
    '#475569',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative transition-colors max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#3b3abf] dark:text-[#a0a0ff]" />
            <h3 className="text-base font-bold text-[var(--ink)]">
              {editingScheduleBlock ? 'Editar Clase y Materia' : 'Añadir Nueva Clase'}
            </h3>
          </div>
          <button
            onClick={closeEditClass}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Selector de materia existente si hay */}
          {subjects.length > 0 && !editingScheduleBlock && (
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                Elegir materia existente o crear nueva
              </label>
              <select
                value={subjectId}
                onChange={(e) => handleSelectExistingSubject(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code} {sub.nrc ? `· NRC ${sub.nrc}` : ''})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sección de Datos de la Materia (Siempre editables directamente) */}
          <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#3b3abf] dark:text-[#a0a0ff] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Datos de la Asignatura
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                  Nombre de la Materia *
                </label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Ej: Optimización"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs font-semibold text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                  Código de la Materia *
                </label>
                <input
                  type="text"
                  required
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="Ej: IND 05359"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                  NRC
                </label>
                <input
                  type="text"
                  value={subjectNrc}
                  onChange={(e) => setSubjectNrc(e.target.value)}
                  placeholder="Ej: 11830"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                  Profesor / Docente
                </label>
                <input
                  type="text"
                  value={subjectProfessor}
                  onChange={(e) => setSubjectProfessor(e.target.value)}
                  placeholder="Ej: Carlos Gómez"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
              <div>
                <label className="block text-[11px] font-bold text-[var(--ink)] mb-1.5">
                  Color Identificador
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {colorPalette.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setSubjectColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                        subjectColor === c ? 'scale-125 ring-2 ring-black dark:ring-white shadow-sm' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                  <input
                    type="color"
                    value={subjectColor}
                    onChange={(e) => setSubjectColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    title="Color personalizado"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--ink)] mb-1.5">
                  Faltas Máximas Permitidas
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={subjectMaxAbsences}
                    onChange={(e) => setSubjectMaxAbsences(Number(e.target.value))}
                    className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-mono font-bold text-[var(--ink)] text-center focus:outline-none focus:border-[#3b3abf]"
                  />
                  <span className="text-[11px] text-[var(--muted)]">fallas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Día de la semana */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
              Día de la semana
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {dayLabels.map((d) => (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => setDayOfWeek(d.value as DayOfWeek)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    dayOfWeek === d.value
                      ? 'bg-[#3b3abf] text-white border-[#3b3abf] shadow-xs'
                      : 'bg-[var(--paper)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--ink)]'
                  }`}
                >
                  {d.label.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Horario Inicio y Fin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Hora Inicio</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono font-bold text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Hora Fin</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono font-bold text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              />
            </div>
          </div>

          {/* Salón / Ubicación */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">Salón / Aula</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[var(--muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Edificio C, Salón 201"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              />
            </div>
          </div>

          {/* Botones de acción y eliminación */}
          <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
            {editingScheduleBlock ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteBlock}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
                  title="Eliminar solo este bloque de horario"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar Bloque</span>
                </button>
                {subjectId && (
                  <button
                    type="button"
                    onClick={handleDeleteFullSubject}
                    className="flex items-center gap-1 text-[11px] font-medium text-[var(--muted)] hover:text-rose-600 transition-colors cursor-pointer"
                    title="Eliminar la materia completa y todas sus clases"
                  >
                    <span>Eliminar materia</span>
                  </button>
                )}
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeEditClass}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
