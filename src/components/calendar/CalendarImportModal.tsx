'use client';

import { useState, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { parseIcsCalendar } from '@/lib/importer/icsParser';
import { resolveBlockDeduplication } from '@/lib/importer/deduplication';
import { generateIcsCalendar, downloadIcsFile } from '@/lib/importer/calendarExporter';
import { NormalizedCalendarEvent, ScheduleBlock, Subject } from '@/types';
import { db } from '@/lib/storage/database';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Upload,
  Link,
  Download,
  X,
  Check,
  AlertCircle,
  Clock,
  MapPin,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export function CalendarImportModal() {
  const { isCalendarModalOpen, closeCalendarModal } = useUIStore();
  const { semester, subjects, subjectsMap, scheduleBlocks, exams, routines, refreshData } = useSemesterData();

  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'export'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedEvents, setParsedEvents] = useState<NormalizedCalendarEvent[]>([]);
  const [dedupSummary, setDedupSummary] = useState<{
    toCreate: number;
    toUpdate: number;
    toSkip: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isCalendarModalOpen) return null;

  const handleProcessIcsText = (icsText: string, sourceName: string) => {
    try {
      setErrorMessage(null);
      const events = parseIcsCalendar(icsText, { sourceCalendar: sourceName });
      if (events.length === 0) {
        setErrorMessage('No se encontraron eventos o clases válidas en el archivo.');
        return;
      }

      setParsedEvents(events);

      // Calcular deduplicación preliminar para clases
      let toCreate = 0;
      let toUpdate = 0;
      let toSkip = 0;

      for (const ev of events) {
        if (ev.suggestedType === 'class') {
          const res = resolveBlockDeduplication(
            {
              subjectId: ev.matchedSubjectId || 'unknown',
              subjectNameOrCode: ev.title,
              dayOfWeek: ev.dayOfWeek || 1,
              startTime: ev.startTimeStr,
              endTime: ev.endTimeStr,
              location: ev.location,
              externalUid: ev.uid,
              source: 'ics',
            },
            scheduleBlocks,
            subjectsMap
          );

          if (res.action === 'create') toCreate++;
          else if (res.action === 'update') toUpdate++;
          else toSkip++;
        } else {
          toCreate++;
        }
      }

      setDedupSummary({ toCreate, toUpdate, toSkip });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al parsear el archivo .ics');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessIcsText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/calendar/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Error al conectar con la URL');
        setIsLoading(false);
        return;
      }

      handleProcessIcsText(data.content, 'Enlace Remoto');
    } catch {
      setErrorMessage('Error de red al intentar descargar el calendario.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (parsedEvents.length === 0) return;
    setIsLoading(true);

    try {
      // 1. Asegurar o emparejar materias
      const existingSubList = [...subjects];

      for (const ev of parsedEvents) {
        if (ev.suggestedType === 'class') {
          // Buscar materia existente por título o código
          let targetSubject = existingSubList.find((s) =>
            ev.title.toLowerCase().includes(s.name.toLowerCase()) ||
            s.name.toLowerCase().includes(ev.title.toLowerCase())
          );

          if (!targetSubject) {
            // Crear materia automáticamente
            const newSub: Subject = {
              id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              semesterId: semester?.id || 'sem_active',
              name: ev.title,
              code: ev.title.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, ''),
              credits: 3,
              color: '#3b3abf',
              maxAbsences: 4,
              passingGrade: 3.0,
            };
            await db.subjects.add(newSub);
            existingSubList.push(newSub);
            targetSubject = newSub;
          }

          // Resolver deduplicación
          const dedup = resolveBlockDeduplication(
            {
              subjectId: targetSubject.id,
              subjectNameOrCode: targetSubject.name,
              dayOfWeek: ev.dayOfWeek || 1,
              startTime: ev.startTimeStr,
              endTime: ev.endTimeStr,
              location: ev.location,
              externalUid: ev.uid,
              source: 'ics',
            },
            scheduleBlocks,
            subjectsMap
          );

          if (dedup.action === 'create') {
            await db.scheduleBlocks.add({
              id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              subjectId: targetSubject.id,
              dayOfWeek: ev.dayOfWeek || 1,
              startTime: ev.startTimeStr,
              endTime: ev.endTimeStr,
              location: ev.location || 'Salón por asignar',
              source: 'ics',
              externalUid: ev.uid,
            });
          } else if (dedup.action === 'update' && dedup.existingId) {
            await db.scheduleBlocks.update(dedup.existingId, {
              location: ev.location || 'Salón actualizado',
            });
          }
        } else if (ev.suggestedType === 'exam') {
          const defaultSub = existingSubList[0];
          if (defaultSub) {
            await db.exams.add({
              id: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              subjectId: defaultSub.id,
              title: ev.title,
              date: ev.start.toISOString(),
              weight: 20,
              source: 'ics',
              externalUid: ev.uid,
            });
          }
        }
      }

      await refreshData();
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {
        // no-op
      }

      setParsedEvents([]);
      setDedupSummary(null);
      closeCalendarModal();
    } catch (err) {
      console.error('Error guardando eventos de calendario:', err);
      setErrorMessage('Error al sincronizar datos en la base de datos local.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const icsContent = generateIcsCalendar({
      semesterName: semester?.name || 'Mi Semestre',
      subjectsMap,
      blocks: scheduleBlocks,
      exams,
      routines,
    });
    downloadIcsFile('mi_semestre_horario.ics', icsContent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--paper)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#3b3abf]/10 text-[#3b3abf] dark:text-[#a0a0ff] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--ink)]">Sincronización de Calendarios</h2>
              <p className="text-xs text-[var(--muted)]">Google Calendar · Microsoft Outlook · Apple Calendar</p>
            </div>
          </div>
          <button
            onClick={closeCalendarModal}
            className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de pestañas */}
        <div className="flex border-b border-[var(--border)] bg-[var(--paper)] px-5 gap-2 text-xs font-bold">
          <button
            onClick={() => { setActiveTab('file'); setParsedEvents([]); setDedupSummary(null); }}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'border-[#3b3abf] text-[#3b3abf] dark:text-[#a0a0ff]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Archivo .ICS</span>
          </button>

          <button
            onClick={() => { setActiveTab('url'); setParsedEvents([]); setDedupSummary(null); }}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'url'
                ? 'border-[#3b3abf] text-[#3b3abf] dark:text-[#a0a0ff]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Enlace WebCal / iCal</span>
          </button>

          <button
            onClick={() => { setActiveTab('export'); setParsedEvents([]); setDedupSummary(null); }}
            className={`py-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-[#3b3abf] text-[#3b3abf] dark:text-[#a0a0ff]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Semestre</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".ics,text/calendar"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border)] hover:border-[#3b3abf] rounded-3xl p-8 text-center cursor-pointer transition-all bg-[var(--paper)] hover:bg-[#3b3abf]/5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#3b3abf]/10 text-[#3b3abf] dark:text-[#a0a0ff] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[var(--ink)]">Haz clic para subir tu archivo .ics</h3>
                <p className="text-xs text-[var(--muted)] mt-1 max-w-sm mx-auto">
                  Exporta tu calendario desde Google Calendar, Outlook Web o Apple Calendar y selecciónalo aquí.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--ink-secondary)] block">
                  Enlace público o privado iCal (WebCal / HTTPS):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                    className="flex-1 bg-[var(--paper)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#3b3abf]"
                  />
                  <button
                    onClick={handleFetchUrl}
                    disabled={isLoading || !urlInput.trim()}
                    className="px-4 py-2 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Sincronizar</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--muted)]">
                  Protegido con verificación anti-SSRF y límite de 2MB.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Download className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">Exportar Horario a tus Dispositivos</h3>
                <p className="text-xs text-[var(--muted)] mt-1 max-w-sm mx-auto">
                  Descarga un archivo universal .ics con tus clases recurrentes, salones y parciales agendados para abrirlos en tu celular.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md cursor-pointer inline-flex items-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Descargar horario_mi_semestre.ics</span>
              </button>
            </div>
          )}

          {/* Resumen de Deduplicación y Vista Previa */}
          {parsedEvents.length > 0 && dedupSummary && (
            <div className="space-y-3 pt-3 border-t border-[var(--border)]">
              <div className="p-3.5 rounded-2xl bg-[var(--paper)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-[var(--ink)]">Resumen de Análisis:</span>
                  <span className="font-mono text-[var(--muted)]">{parsedEvents.length} eventos detectados</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <span className="text-lg font-black block">{dedupSummary.toCreate}</span>
                    <span className="text-[10px] font-bold uppercase">Nuevos</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <span className="text-lg font-black block">{dedupSummary.toUpdate}</span>
                    <span className="text-[10px] font-bold uppercase">Actualizan Salón</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
                    <span className="text-lg font-black block">{dedupSummary.toSkip}</span>
                    <span className="text-[10px] font-bold uppercase">Ya Registrados</span>
                  </div>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {parsedEvents.slice(0, 8).map((ev, i) => (
                  <div
                    key={`${ev.uid}_${i}`}
                    className="p-2.5 rounded-xl bg-[var(--paper)] border border-[var(--border)] text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-[var(--ink)] block">{ev.title}</span>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] font-mono">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-[#3b3abf]" />
                          {ev.startTimeStr} - {ev.endTimeStr}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-amber-500" />
                            {ev.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)] font-bold uppercase">
                      {ev.suggestedType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--paper)]">
          <button
            onClick={closeCalendarModal}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
          >
            Cerrar
          </button>

          {parsedEvents.length > 0 && (
            <button
              onClick={handleConfirmImport}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] disabled:opacity-50 text-white text-xs font-black transition-all shadow-md cursor-pointer active:scale-95"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Importar y Actualizar Horario</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
