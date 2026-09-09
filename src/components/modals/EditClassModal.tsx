'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { scheduleRepository, subjectRepository } from '@/lib/storage';
import { ScheduleBlock, Subject, DayOfWeek } from '@/types';
import { X, Calendar, Trash2, Check, Clock, MapPin, BookOpen } from 'lucide-react';

export function EditClassModal() {
  const { isEditClassOpen, editingScheduleBlock, closeEditClass } = useUIStore();
  const { subjects, subjectsMap, refreshData, semester } = useSemesterData();

  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(1);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [subjectId, setSubjectId] = useState('');

  // Edición directa de la materia
  const [isEditingSubject, setIsEditingSubject] = useState(false);
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
        setSubjectName(sub.name);
        setSubjectCode(sub.code);
        setSubjectNrc(sub.nrc || '');
        setSubjectProfessor(sub.professor || '');
        setSubjectColor(sub.color);
        setSubjectMaxAbsences(sub.maxAbsences);
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
        setSubjectMaxAbsences(firstSub.maxAbsences);
      }
    }
  }, [editingScheduleBlock, subjects, subjectsMap]);

  if (!isEditClassOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetSubId = subjectId;

    // Si editó o creó datos de la materia
    if (isEditingSubject || !targetSubId) {
      const existing = subjectsMap[targetSubId];
      const updatedSubject: Subject = {
        id: targetSubId || `sub-${Date.now()}`,
        semesterId: semester?.id || 'sem-2026-2',
        name: subjectName || 'Nueva Materia',
        code: subjectCode || 'COD001',
        nrc: subjectNrc,
        professor: subjectProfessor,
        color: subjectColor,
        credits: existing?.credits || 3,
        maxAbsences: subjectMaxAbsences,
        passingGrade: existing?.passingGrade || 3.0,
      };

      await subjectRepository.save(updatedSubject);
      targetSubId = updatedSubject.id;
    }

    // Guardar bloque de clase
    const block: ScheduleBlock = {
      id: editingScheduleBlock ? editingScheduleBlock.id : `block-${Date.now()}`,
      subjectId: targetSubId,
      dayOfWeek,
      startTime,
      endTime,
      location,
    };

    await scheduleRepository.save(block);
    await refreshData();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
    closeEditClass();
  };

  const handleDelete = async () => {
    if (!editingScheduleBlock) return;
    if (confirm('¿Eliminar esta clase del horario semanal?')) {
      await scheduleRepository.delete(editingScheduleBlock.id);
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
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative transition-colors max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#3b3abf] dark:text-[#a0a0ff]" />
            <h3 className="text-base font-bold text-[var(--ink)]">
              {editingScheduleBlock ? 'Editar Bloque de Clase' : 'Añadir Nueva Clase'}
            </h3>
          </div>
          <button
            onClick={closeEditClass}
            className="p-1 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Materia Asociada */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[var(--ink)]">Materia</label>
              <button
                type="button"
                onClick={() => setIsEditingSubject(!isEditingSubject)}
                className="text-xs text-[#3b3abf] dark:text-[#a0a0ff] font-bold hover:underline cursor-pointer"
              >
                {isEditingSubject ? 'Usar lista de materias' : '+ Modificar datos de la materia'}
              </button>
            </div>

            {!isEditingSubject ? (
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  const sub = subjectsMap[e.target.value];
                  if (sub) {
                    setSubjectName(sub.name);
                    setSubjectCode(sub.code);
                    setSubjectNrc(sub.nrc || '');
                    setSubjectProfessor(sub.professor || '');
                    setSubjectColor(sub.color);
                    setSubjectMaxAbsences(sub.maxAbsences);
                  }
                }}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code} {sub.nrc && `· NRC ${sub.nrc}`})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--muted)] mb-1">Nombre</label>
                    <input
                      type="text"
                      required
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      placeholder="Ej: Optimización"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--muted)] mb-1">Código</label>
                    <input
                      type="text"
                      required
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      placeholder="Ej: IND 05359"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-mono text-[var(--ink)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--muted)] mb-1">NRC</label>
                    <input
                      type="text"
                      value={subjectNrc}
                      onChange={(e) => setSubjectNrc(e.target.value)}
                      placeholder="11830"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs font-mono text-[var(--ink)]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-[var(--muted)] mb-1">Profesor</label>
                    <input
                      type="text"
                      value={subjectProfessor}
                      onChange={(e) => setSubjectProfessor(e.target.value)}
                      placeholder="Nombre del docente"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--ink)]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--muted)] mb-1">Color</label>
                    <div className="flex items-center gap-1.5">
                      {colorPalette.map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setSubjectColor(c)}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                            subjectColor === c ? 'scale-125 ring-2 ring-white shadow-sm' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[var(--muted)] mb-1">Faltas Máx.</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={subjectMaxAbsences}
                      onChange={(e) => setSubjectMaxAbsences(Number(e.target.value))}
                      className="w-16 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-mono text-[var(--ink)] text-center"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Día de la semana */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">Día de la semana</label>
            <div className="grid grid-cols-6 gap-1.5">
              {dayLabels.map((d) => (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => setDayOfWeek(d.value as DayOfWeek)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    dayOfWeek === d.value
                      ? 'bg-[#3b3abf] text-white border-[#3b3abf]'
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
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Hora Fin</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              />
            </div>
          </div>

          {/* Salón / Ubicación */}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-1">Salón / Ubicación</label>
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

          {/* Botones de acción */}
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-3">
            {editingScheduleBlock ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
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
                <span>Guardar Clase</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
