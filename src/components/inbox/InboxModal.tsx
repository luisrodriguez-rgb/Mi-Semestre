'use client';

import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import { InboxItem } from '@/lib/ai/schemas';
import { preprocessInboxText } from '@/lib/ai/preprocessor';
import { db } from '@/lib/storage/database';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  X,
  Check,
  Calendar,
  Clock,
  BookOpen,
  Edit2,
  AlertTriangle,
  Send,
  Loader2,
} from 'lucide-react';

export function InboxModal() {
  const { isInboxOpen, closeInbox } = useUIStore();
  const { subjects, refreshData } = useSemesterData();

  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<InboxItem[]>([]);
  const [sourceEngine, setSourceEngine] = useState<'gemini' | 'preprocessor' | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  if (!isInboxOpen) return null;

  const enrolledContext = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
  }));

  const handleProcess = async () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    setEditingItemId(null);

    try {
      // 1. Intentar llamar al Route Handler de Next.js
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawText.trim(),
          enrolledSubjects: enrolledContext,
          baseDate: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setExtractedItems(data.items);
          setSourceEngine(data.sourceEngine);
          setIsProcessing(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Fallo en API /api/ai/extract, usando preprocesador cliente:', err);
    }

    // 2. Fallback determinístico directo en cliente
    const fallback = preprocessInboxText(rawText.trim(), enrolledContext, new Date());
    setExtractedItems(fallback);
    setSourceEngine('preprocessor');
    setIsProcessing(false);
  };

  const handleUpdateItem = (id: string, updates: Partial<InboxItem>) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setExtractedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleConfirmAndSave = async () => {
    if (extractedItems.length === 0) return;

    try {
      for (const item of extractedItems) {
        let subjectId = item.matchedSubjectId;

        // Si no está asignado pero hay materias, vincular a la primera o crear
        if (!subjectId && subjects.length > 0) {
          subjectId = subjects[0].id;
        }

        if (!subjectId) continue;

        if (item.type === 'exam') {
          await db.exams.add({
            id: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            subjectId,
            title: item.title,
            date: item.date ? `${item.date} ${item.startTime || '08:00'}` : new Date().toISOString(),
            weight: item.weight || 20,
            topics: item.description ? [item.description] : [],
            source: 'ai_inbox',
          });
        } else if (item.type === 'assignment') {
          await db.assignments.add({
            id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            subjectId,
            title: item.title,
            description: item.sourceText,
            dueDate: item.date ? `${item.date} ${item.startTime || '23:59'}` : new Date().toISOString(),
            priority: 'high',
            estimatedMinutes: 60,
            status: 'pending',
            source: 'ai_inbox',
          });
        }
      }

      await refreshData();
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {
        // no-op
      }
      setExtractedItems([]);
      setRawText('');
      closeInbox();
    } catch (err) {
      console.error('Error al guardar items del buzón:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--paper)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[var(--ink)]">Buzón Inteligente</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                  Auditable & Zod
                </span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Pega avisos de WhatsApp o apuntes. El sistema propone, tú confirmas.
              </p>
            </div>
          </div>
          <button
            onClick={closeInbox}
            className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Input caótico */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--ink-secondary)] block">
              Pega cualquier mensaje o apunte aquí:
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Ejemplo: 'Muchachos el parcial de estadística quedó para el 24 a las 2, vale 20%. El ejercicio 3 se entrega mañana en parejas.'"
              rows={3}
              className="w-full bg-[var(--paper)] border border-[var(--border)] rounded-2xl p-3.5 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-indigo-500 transition-colors resize-none font-sans leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--muted)]">
                Atajo rápido: <kbd className="font-mono bg-[var(--paper)] px-1.5 py-0.5 rounded border border-[var(--border)] text-[10px]">⌘K</kbd>
              </span>
              <button
                onClick={handleProcess}
                disabled={isProcessing || !rawText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Procesar en Buzón</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Resultados de la Extracción */}
          {extractedItems.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[var(--ink)] uppercase tracking-wider">
                  Encontré {extractedItems.length} {extractedItems.length === 1 ? 'elemento' : 'elementos'}:
                </span>
                <span className="text-[10px] font-mono text-[var(--muted)]">
                  Motor: {sourceEngine === 'gemini' ? 'Gemini Structured AI' : 'Preprocesador Determinístico'}
                </span>
              </div>

              <div className="space-y-3">
                {extractedItems.map((item) => {
                  const isEditing = editingItemId === item.id;
                  const isHigh = item.confidence === 'high';
                  const isMed = item.confidence === 'medium';

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--border)] space-y-2.5 transition-all shadow-2xs"
                    >
                      {/* Cabecera Tarjeta */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md ${
                              item.type === 'exam'
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {item.type === 'exam' ? 'Parcial' : 'Tarea'}
                          </span>

                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              isHigh
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : isMed
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            ● Confianza {isHigh ? 'Alta' : isMed ? 'Media' : 'Baja'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingItemId(isEditing ? null : item.id)}
                            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                            title="Editar datos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Descartar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Modo Visual vs Modo Edición */}
                      {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                          <div>
                            <label className="text-[10px] text-[var(--muted)] block">Título</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1.5 text-xs text-[var(--ink)]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--muted)] block">Materia</label>
                            <select
                              value={item.matchedSubjectId || ''}
                              onChange={(e) => {
                                const selected = subjects.find((s) => s.id === e.target.value);
                                handleUpdateItem(item.id, {
                                  matchedSubjectId: e.target.value,
                                  subjectName: selected?.name || null,
                                });
                              }}
                              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1.5 text-xs text-[var(--ink)]"
                            >
                              <option value="">Seleccionar materia...</option>
                              {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.code})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--muted)] block">Fecha</label>
                            <input
                              type="date"
                              value={item.date || ''}
                              onChange={(e) => handleUpdateItem(item.id, { date: e.target.value })}
                              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1.5 text-xs text-[var(--ink)]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--muted)] block">Hora</label>
                            <input
                              type="time"
                              value={item.startTime || '08:00'}
                              onChange={(e) => handleUpdateItem(item.id, { startTime: e.target.value })}
                              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1.5 text-xs text-[var(--ink)]"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-sm font-bold text-[var(--ink)]">{item.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)] mt-1 font-mono">
                            {item.subjectName && (
                              <div className="flex items-center gap-1 text-[var(--ink-secondary)]">
                                <BookOpen className="w-3 h-3" />
                                <span>{item.subjectName}</span>
                              </div>
                            )}
                            {item.date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-indigo-500" />
                                <span>{item.date}</span>
                              </div>
                            )}
                            {item.startTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-indigo-500" />
                                <span>{item.startTime}</span>
                              </div>
                            )}
                            {item.weight !== null && item.weight !== undefined && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                                Peso: {item.weight}%
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Desambiguación interactiva si aplica */}
                      {item.ambiguities && item.ambiguities.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Confirmación requerida en fecha:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.ambiguities[0].options.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  const dateMatch = opt.match(/^\d{4}-\d{2}-\d{2}/);
                                  if (dateMatch) {
                                    handleUpdateItem(item.id, {
                                      date: dateMatch[0],
                                      ambiguities: [],
                                      confidence: 'high',
                                    });
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-indigo-600 hover:text-white border border-[var(--border)] text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Auditoría sourceText */}
                      <div className="p-2 rounded-xl bg-[var(--surface)] text-[11px] text-[var(--muted)] border border-[var(--border)]/50 italic">
                        Detectado a partir de: &ldquo;{item.sourceText}&rdquo;
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--paper)]">
          <button
            onClick={closeInbox}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
          >
            Cerrar
          </button>

          {extractedItems.length > 0 && (
            <button
              onClick={handleConfirmAndSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar y Guardar {extractedItems.length} {extractedItems.length === 1 ? 'Elemento' : 'Elementos'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
