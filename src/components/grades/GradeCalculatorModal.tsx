'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import {
  calculateGradeStatus,
  buildEvaluationPlanFromExams,
  EvaluationItem,
  GradeCalculationResult,
  extractEvaluationItemsFromText,
  extractEvaluationPlanHybrid,
} from '@/lib/academic-engine';
import { gradeRepository, examRepository } from '@/lib/storage';
import { Grade } from '@/types';
import { formatHumanDate } from '@/lib/utils/formatters';
import {
  BookOpen,
  X,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  ClipboardPaste,
  HelpCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react';

type InputMode = 'detailed' | 'quick' | 'paste';

interface EditableEvaluationItem extends EvaluationItem {
  isSimulating?: boolean;
  simulatedGrade?: number | null;
}

export function GradeCalculatorModal() {
  const { isGradeCalculatorOpen, gradeCalculatorSubjectId, closeGradeCalculator } = useUIStore();
  const { subjects, exams, grades, refreshData } = useSemesterData();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [evaluations, setEvaluations] = useState<EditableEvaluationItem[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>('detailed');

  // Estado para el modo rápido "¿Cuánto llevas?"
  const [quickEvaluatedWeight, setQuickEvaluatedWeight] = useState<string>('40');
  const [quickAverageGrade, setQuickAverageGrade] = useState<string>('3.5');

  // Estado para el modo pegar texto
  const [pasteRawText, setPasteRawText] = useState<string>('');
  const [pastePreviewItems, setPastePreviewItems] = useState<EditableEvaluationItem[]>([]);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [isExtractingWithAI, setIsExtractingWithAI] = useState<boolean>(false);

  // Estado de auto-guardado
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const lastSavedPayloadRef = useRef<string>('');
  const newRowRef = useRef<HTMLInputElement | null>(null);

  // Seleccionar materia por defecto al abrir el modal
  useEffect(() => {
    if (isGradeCalculatorOpen) {
      if (gradeCalculatorSubjectId && subjects.some((s) => s.id === gradeCalculatorSubjectId)) {
        setSelectedSubjectId(gradeCalculatorSubjectId);
      } else if (subjects.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subjects[0].id);
      }
    }
  }, [isGradeCalculatorOpen, gradeCalculatorSubjectId, subjects, selectedSubjectId]);

  const selectedSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null;
  }, [subjects, selectedSubjectId]);

  // Cargar el plan de evaluación de la materia seleccionada
  useEffect(() => {
    if (!selectedSubject) {
      setEvaluations([]);
      return;
    }
    const initialPlan = buildEvaluationPlanFromExams(selectedSubject, exams, grades);
    setEvaluations(initialPlan);
    isInitialLoadRef.current = true;
    lastSavedPayloadRef.current = JSON.stringify(
      initialPlan.map((it) => ({ id: it.id, name: it.name, weight: it.weight, grade: it.grade }))
    );

    // Si la materia no tiene componentes o notas registradas, sugerir las 3 opciones de entrada
    const hasData = initialPlan.some((it) => (it.grade !== null && it.grade !== undefined) || it.weight > 0);
    if (!hasData) {
      setInputMode('quick');
    } else {
      setInputMode('detailed');
    }
  }, [selectedSubject, exams, grades]);

  // Persistir cambios automáticamente en background con debounce
  const persistChanges = useCallback(
    async (itemsToSave: EditableEvaluationItem[]) => {
      if (!selectedSubject) return;

      const payload = JSON.stringify(
        itemsToSave.map((it) => ({ id: it.id, name: it.name, weight: it.weight, grade: it.grade }))
      );

      // Si no ha cambiado nada con respecto a lo último guardado, no hacer nada
      if (payload === lastSavedPayloadRef.current) return;

      setSaveStatus('saving');

      try {
        const gradesToPersist: Grade[] = [];
        for (const item of itemsToSave) {
          let gradeId = item.id;
          if (item.examId) {
            gradeId = item.id.startsWith('gr-') ? item.id : `gr-${item.examId}`;
          } else if (!gradeId.startsWith('gr-') && !gradeId.startsWith('ev-custom-') && !gradeId.startsWith('ev-ext-')) {
            gradeId = `gr-${item.id}`;
          }

          gradesToPersist.push({
            id: gradeId,
            subjectId: selectedSubject.id,
            name: item.name,
            value: typeof item.grade === 'number' && !isNaN(item.grade) ? item.grade : null,
            weight: typeof item.weight === 'number' ? item.weight : 0,
            examId: item.examId,
          });
        }

        await gradeRepository.deleteBySubject(selectedSubject.id);
        if (gradesToPersist.length > 0) {
          await gradeRepository.bulkSave(gradesToPersist);
        }

        // Sincronizar exámenes si cambiaron
        for (const item of itemsToSave) {
          if (item.examId) {
            const originalExam = exams.find((e) => e.id === item.examId);
            if (originalExam) {
              const hasWeightChanged = originalExam.weight !== item.weight;
              const hasTitleChanged = originalExam.title !== item.name;
              if (hasWeightChanged || hasTitleChanged) {
                await examRepository.save({
                  ...originalExam,
                  weight: typeof item.weight === 'number' ? item.weight : 0,
                  title: item.name,
                });
              }
            }
          }
        }

        lastSavedPayloadRef.current = payload;
        await refreshData();
        window.dispatchEvent(new CustomEvent('semester-data-updated'));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Error al guardar automáticamente en la libreta:', err);
        setSaveStatus('idle');
      }
    },
    [selectedSubject, exams, refreshData]
  );

  // Escuchar cambios en evaluations y disparar auto-guardado con debounce
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      persistChanges(evaluations);
    }, 450);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [evaluations, persistChanges]);

  // Cálculo del estado real considerando posibles notas simuladas temporalmente con "¿y si?"
  const calculationPlan: EvaluationItem[] = useMemo(() => {
    return evaluations.map((item) => {
      // Si la fila tiene simulación activa y valor de nota simulada, usamos esa nota temporalmente
      if (item.isSimulating && typeof item.simulatedGrade === 'number') {
        return {
          ...item,
          grade: item.simulatedGrade,
        };
      }
      return item;
    });
  }, [evaluations]);

  const hasAnyActiveSimulation = useMemo(() => {
    return evaluations.some((item) => item.isSimulating && typeof item.simulatedGrade === 'number');
  }, [evaluations]);

  const currentStatus: GradeCalculationResult = useMemo(() => {
    if (!selectedSubject) {
      return {
        subjectId: '',
        passingGrade: 3.0,
        totalConfiguredWeight: 0,
        evaluatedWeight: 0,
        remainingWeight: 100,
        currentAccumulatedScore: 0,
        currentWeightedGrade: null,
        requiredGrade: 3.0,
        status: 'SIN_NOTAS',
        statusMessage: 'Sin notas todavía.',
        weightsIncomplete: true,
        isComplete: false,
      };
    }
    return calculateGradeStatus({
      subjectId: selectedSubject.id,
      evaluations: calculationPlan,
      passingGrade: selectedSubject.passingGrade || 3.0,
    });
  }, [selectedSubject, calculationPlan]);

  // Construcción de la frase humana principal solicitada por el usuario
  const headline = useMemo(() => {
    const passing = selectedSubject?.passingGrade || 3.0;

    // Caso 1: Sin notas registradas aún (0% evaluado)
    if (currentStatus.evaluatedWeight === 0) {
      return {
        primary: 'Aún no tienes notas registradas en esta materia.',
        secondary: `Anota tus notas y porcentajes para saber al instante cuánto necesitas para pasar con ${passing.toFixed(1)}.`,
        badgeColor: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
        badgeText: 'Por comenzar',
      };
    }

    const avgStr = currentStatus.currentWeightedGrade !== null ? currentStatus.currentWeightedGrade.toFixed(2) : '0.00';
    const evalStr = `${currentStatus.evaluatedWeight}%`;

    // Caso 2: Aprobada anticipada
    if (currentStatus.status === 'APROBADA_ANTICIPADA') {
      return {
        primary: `Llevas ${avgStr} con el ${evalStr} evaluado. Ya tienes asegurada la materia.`,
        secondary: `Tu acumulado actual supera la nota mínima de ${passing.toFixed(1)}. Lo que saques en lo que falta subirá tu promedio general.`,
        badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        badgeText: 'Materia asegurada',
      };
    }

    // Caso 3: Inviable matemáticamente
    if (currentStatus.status === 'INVIABLE_MATEMATICAMENTE' || (currentStatus.requiredGrade !== null && currentStatus.requiredGrade > 5.0)) {
      return {
        primary: `Llevas ${avgStr} con el ${evalStr} evaluado. Requerirías más de 5.0 en lo restante.`,
        secondary: currentStatus.weightsIncomplete && currentStatus.totalConfiguredWeight < 100
          ? `Matemáticamente el porcentaje restante no alcanza para llegar a ${passing.toFixed(1)} (asumiendo que el ${(100 - currentStatus.totalConfiguredWeight).toFixed(0)}% restante aún no se ha evaluado).`
          : `Matemáticamente el porcentaje restante no alcanza para llegar a ${passing.toFixed(1)}. Te recomendamos hablar con tu profesor o evaluar opciones de cancelación oportuna.`,
        badgeColor: 'bg-rose-950/40 text-rose-300 border-rose-700/60',
        badgeText: 'Inviable matemáticamente',
      };
    }

    // Caso 4: Materia finalizada
    if (currentStatus.isComplete) {
      const finalGrade = currentStatus.currentWeightedGrade !== null ? currentStatus.currentWeightedGrade : currentStatus.currentAccumulatedScore;
      const passed = finalGrade >= passing;
      return {
        primary: `Semestre completado: Nota final ${finalGrade.toFixed(2)}.`,
        secondary: passed ? `Aprobaste la materia satisfactoriamente.` : `No alcanzaste el mínimo aprobatorio de ${passing.toFixed(1)}.`,
        badgeColor: passed
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
        badgeText: passed ? 'Aprobada' : 'Reprobada',
      };
    }

    // Caso 5: Estándar activo (Ej: "Llevas 2.00 con el 35% evaluado. Necesitas 3.54 en el 65% que falta.")
    const reqStr = currentStatus.requiredGrade !== null ? currentStatus.requiredGrade.toFixed(2) : passing.toFixed(2);
    const effortLevel = (currentStatus.requiredGrade || 0) > 4.0;
    const isIncompleteWeights = currentStatus.weightsIncomplete && currentStatus.totalConfiguredWeight < 100;
    const missingWeight = (100 - currentStatus.totalConfiguredWeight).toFixed(0);

    return {
      primary: `Llevas ${avgStr} con el ${evalStr} evaluado. Necesitas ${reqStr} en el ${currentStatus.remainingWeight}% que falta.`,
      secondary: isIncompleteWeights
        ? `Asumiendo que el ${missingWeight}% restante aún no se ha evaluado.`
        : effortLevel
        ? `La meta exige un desempeño alto (> 4.0) en el ${currentStatus.remainingWeight}% pendiente.`
        : `Tienes un margen favorable para asegurar tu aprobación con ${passing.toFixed(1)}.`,
      badgeColor: effortLevel
        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
        : (currentStatus.requiredGrade || 0) <= 3.0
        ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      badgeText: effortLevel ? 'Exige esfuerzo alto' : 'En camino a pasar',
    };
  }, [currentStatus, selectedSubject]);

  // Actualizar ítem en la tabla detallada
  const handleUpdateItem = (id: string, updates: Partial<EditableEvaluationItem>) => {
    setEvaluations((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  };

  // Agregar nueva fila editable
  const handleAddItem = (focusOnName = false) => {
    if (!selectedSubject) return;
    const newItem: EditableEvaluationItem = {
      id: `ev-custom-${Date.now()}`,
      subjectId: selectedSubject.id,
      name: `Componente ${evaluations.length + 1}`,
      weight: 0,
      grade: null,
      hasMissingWeight: false, // No marcar error prematuro
    };
    setEvaluations((prev) => [...prev, newItem]);

    if (focusOnName) {
      setTimeout(() => {
        if (newRowRef.current) {
          newRowRef.current.focus();
          newRowRef.current.select();
        }
      }, 50);
    }
  };

  // Eliminar fila
  const handleRemoveItem = (id: string) => {
    setEvaluations((prev) => prev.filter((it) => it.id !== id));
  };

  // Guardar Modo Rápido "¿Cuánto llevas?"
  const handleApplyQuickMode = () => {
    if (!selectedSubject) return;
    const weightNum = parseFloat(quickEvaluatedWeight) || 0;
    const avgNum = parseFloat(quickAverageGrade) || 0;

    if (weightNum <= 0 || weightNum > 100) {
      alert('Por favor ingresa un porcentaje evaluado válido entre 1 y 100.');
      return;
    }
    if (avgNum < 0 || avgNum > 5.0) {
      alert('La nota actual debe estar entre 0.0 y 5.0.');
      return;
    }

    const singleItem: EditableEvaluationItem = {
      id: `ev-custom-${Date.now()}`,
      subjectId: selectedSubject.id,
      name: 'Acumulado anterior',
      weight: weightNum,
      grade: avgNum,
      hasMissingWeight: false,
    };

    const newPlan = [singleItem];
    setEvaluations(newPlan);
    setInputMode('detailed');
    persistChanges(newPlan);
  };

  // Procesar pegado de texto de sílabo / Moodle (híbrido: determinístico + IA Gemini si hay dudas)
  const handleProcessPastedText = async () => {
    setPasteError(null);
    if (!pasteRawText.trim()) {
      setPasteError('Por favor pega el texto de tu sílabo o de la tabla de calificaciones.');
      return;
    }

    setIsExtractingWithAI(true);
    try {
      const { items } = await extractEvaluationPlanHybrid(
        pasteRawText,
        selectedSubject
          ? { id: selectedSubject.id, name: selectedSubject.name, code: selectedSubject.code }
          : undefined
      );

      if (items.length === 0) {
        setPasteError(
          'No pudimos detectar componentes o porcentajes claros en el texto. Prueba escribiendo los nombres con sus % (ej. Parcial 1 25%).'
        );
        return;
      }

      setPastePreviewItems(
        items.map((item) => ({
          ...item,
          subjectId: selectedSubject ? selectedSubject.id : '',
        }))
      );
    } catch (err) {
      console.error('Error al procesar texto de sílabo:', err);
      setPasteError('Ocurrió un error al procesar el texto. Por favor intenta de nuevo.');
    } finally {
      setIsExtractingWithAI(false);
    }
  };

  // Confirmar y aplicar los ítems pegados a la libreta
  const handleApplyPastedItems = () => {
    if (pastePreviewItems.length === 0) return;
    setEvaluations(pastePreviewItems);
    setInputMode('detailed');
    setPasteRawText('');
    setPastePreviewItems([]);
    persistChanges(pastePreviewItems);
  };

  // Manejar tecla Enter en la tabla para agregar automáticamente una nueva fila
  const handleKeyDownOnRow = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem(true);
    }
  };

  if (!isGradeCalculatorOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Limpia */}
        <div className="p-5 sm:p-6 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--surface)]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3b3abf]/10 text-[#3b3abf] dark:text-[#a0a0ff] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--ink)] tracking-tight">
                  Libreta de Notas
                </h2>
                {saveStatus === 'saving' && (
                  <span className="text-[11px] text-[var(--muted)] flex items-center gap-1 font-medium animate-pulse">
                    Guardando...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    Guardado
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted)]">
                Anota tus notas y porcentajes para saber al instante cuánto necesitas para pasar
              </p>
            </div>
          </div>

          <button
            onClick={closeGradeCalculator}
            className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-all cursor-pointer"
            aria-label="Cerrar libreta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Materia y Selector de Modo */}
        <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-[var(--border)]/60 bg-[var(--paper)]/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--muted)]">Materia:</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] transition-all cursor-pointer"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Pestañas de modo de entrada: Control segmentado que no se desborda en móvil */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)] text-xs font-semibold shrink-0">
              <button
                onClick={() => setInputMode('detailed')}
                className={`px-3 py-1.5 rounded-lg text-center transition-all cursor-pointer whitespace-nowrap ${
                  inputMode === 'detailed'
                    ? 'bg-[#3b3abf] text-white font-bold shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Libreta
              </button>
              <button
                onClick={() => setInputMode('quick')}
                className={`px-3 py-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  inputMode === 'quick'
                    ? 'bg-[#3b3abf] text-white font-bold shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Rápido</span>
              </button>
              <button
                onClick={() => setInputMode('paste')}
                className={`px-3 py-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  inputMode === 'paste'
                    ? 'bg-[#3b3abf] text-white font-bold shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <ClipboardPaste className="w-3 h-3" />
                <span>Pegar</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            1. VISTA MODO RÁPIDO: "¿Cuánto llevas?"
           ═════════════════════════════════════════════════════════════ */}
        {inputMode === 'quick' && (
          <div className="p-6 space-y-5 animate-in fade-in duration-150">
            <div className="p-5 rounded-2xl bg-[#3b3abf]/5 border border-[#3b3abf]/20 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                <Sparkles className="w-4 h-4 text-[#3b3abf] dark:text-[#a0a0ff]" />
                <span>Llenar en un minuto con tu acumulado actual</span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Si ya estás a mitad de semestre y te sabes tu nota actual de memoria, solo ingresa estos dos números.
                Quedará guardado como tu base inicial y luego podrás anotar las notas que te falten.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ink)]">
                    Porcentaje evaluado hasta hoy (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={quickEvaluatedWeight}
                      onChange={(e) => setQuickEvaluatedWeight(e.target.value)}
                      placeholder="Ej: 40"
                      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-base font-bold text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--muted)]">
                      %
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ink)]">
                    Promedio actual que llevas (0.0 - 5.0)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.01"
                    value={quickAverageGrade}
                    onChange={(e) => setQuickAverageGrade(e.target.value)}
                    placeholder="Ej: 3.4"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-base font-bold text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setInputMode('detailed')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyQuickMode}
                  className="px-5 py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2e2eb0] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Guardar acumulado y ver mi libreta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            2. VISTA PEGAR TEXTO: Sílabo o Moodle / Banner
           ═════════════════════════════════════════════════════════════ */}
        {inputMode === 'paste' && (
          <div className="p-6 space-y-4 animate-in fade-in duration-150">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--ink)] block">
                Pega el plan de evaluación del sílabo o la tabla de notas
              </label>
              <textarea
                rows={5}
                value={pasteRawText}
                onChange={(e) => setPasteRawText(e.target.value)}
                placeholder="Ejemplo copiado:&#10;Primer Parcial 25% 3.8&#10;Segundo Parcial 25%&#10;Talleres y Quices 20% 4.2&#10;Proyecto Final 30%"
                className="w-full bg-[var(--paper)] border border-[var(--border)] rounded-2xl p-4 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] transition-all"
              />
              {pasteError && (
                <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pasteError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setInputMode('detailed')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                Volver a la libreta
              </button>
              <button
                type="button"
                disabled={isExtractingWithAI}
                onClick={handleProcessPastedText}
                className="px-4 py-2 rounded-xl bg-[#3b3abf] hover:bg-[#2e2eb0] disabled:opacity-60 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isExtractingWithAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analizando con IA...</span>
                  </>
                ) : (
                  <>
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Analizar texto</span>
                  </>
                )}
              </button>
            </div>

            {/* Vista previa de componentes detectados */}
            {pastePreviewItems.length > 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-[var(--paper)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--ink)]">
                    Vista previa: {pastePreviewItems.length} componentes encontrados
                  </h4>
                  <span className="text-xs text-[var(--muted)]">
                    Total: {pastePreviewItems.reduce((acc, it) => acc + (it.weight || 0), 0)}%
                  </span>
                </div>

                <div className="divide-y divide-[var(--border)] text-xs">
                  {pastePreviewItems.map((item, idx) => (
                    <div key={item.id} className="py-2 flex items-center justify-between gap-3">
                      <span className="font-semibold text-[var(--ink)] truncate">{item.name}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[var(--muted)]">{item.weight}%</span>
                        <span className="font-bold text-[#3b3abf] dark:text-[#a0a0ff]">
                          {item.grade !== null ? `Nota: ${item.grade}` : 'Sin nota'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleApplyPastedItems}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Confirmar y aplicar a mi libreta
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            3. VISTA PRINCIPAL: LIBRETA DETALLADA CON TABLA EDITABLE
           ═════════════════════════════════════════════════════════════ */}
        {inputMode === 'detailed' && (
          <div className="p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
            {/* Frase Grande Central (Sin términos técnicos) */}
            <div className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--border)] space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border w-fit ${headline.badgeColor}`}
                >
                  <span>{headline.badgeText}</span>
                  {hasAnyActiveSimulation && (
                    <span className="text-[10px] bg-white/20 dark:bg-black/20 px-1.5 py-0.2 rounded font-bold">
                      Simulado
                    </span>
                  )}
                </span>

                <div className="text-xs text-[var(--muted)] flex items-center gap-2">
                  <span>Evaluado:</span>
                  <div className="w-24 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3b3abf] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, currentStatus.evaluatedWeight)}%` }}
                    />
                  </div>
                  <span className="font-bold text-[var(--ink)]">{currentStatus.evaluatedWeight}%</span>
                </div>
              </div>

              <div className="text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight leading-snug">
                {headline.primary}
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                {headline.secondary}
              </p>

              {hasAnyActiveSimulation && (
                <div className="pt-1 flex items-center justify-between text-xs text-[#3b3abf] dark:text-[#a0a0ff] font-medium">
                  <span>Viendo resultado con notas simuladas activas.</span>
                  <button
                    onClick={() => {
                      setEvaluations((prev) =>
                        prev.map((it) => ({ ...it, isSimulating: false, simulatedGrade: null }))
                      );
                    }}
                    className="flex items-center gap-1 text-xs hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restablecer notas reales</span>
                  </button>
                </div>
              )}
            </div>

            {/* Tabla Editable en Línea */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink)] tracking-tight">
                    Tus evaluaciones
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Total configurado: {currentStatus.totalConfiguredWeight}% de 100%
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddItem(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3b3abf]/10 hover:bg-[#3b3abf]/20 text-[#3b3abf] dark:text-[#a0a0ff] text-xs font-bold transition-all border border-[#3b3abf]/20 cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar fila</span>
                </button>
              </div>

              {/* Contenedor de la tabla */}
              <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--paper)]">
                {/* Encabezado de columnas */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[var(--surface)] border-b border-[var(--border)] text-xs font-bold text-[var(--muted)]">
                  <div className="col-span-6 sm:col-span-6">Evaluación</div>
                  <div className="col-span-3 sm:col-span-2 text-center">Peso (%)</div>
                  <div className="col-span-3 sm:col-span-3 text-center">Nota</div>
                  <div className="hidden sm:block sm:col-span-1 text-right"></div>
                </div>

                {evaluations.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <p className="text-xs text-[var(--muted)]">
                      Aún no tienes notas registradas en esta materia.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleAddItem(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#3b3abf] text-white text-xs font-bold hover:bg-[#2f2fa3] transition-all cursor-pointer"
                      >
                        Crear primera fila
                      </button>
                      <button
                        onClick={() => setInputMode('quick')}
                        className="px-3.5 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] text-xs font-bold hover:bg-[var(--border)] transition-all cursor-pointer"
                      >
                        Modo rápido
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {evaluations.map((item, index) => {
                      const isPending = item.grade === null || item.grade === undefined;
                      const neededGradePlaceholder =
                        currentStatus.requiredGrade !== null && currentStatus.requiredGrade > 0
                          ? `necesitas ${currentStatus.requiredGrade.toFixed(1)}`
                          : 'sin nota';

                      return (
                        <div
                          key={item.id}
                          className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs transition-colors ${
                            item.isSimulating ? 'bg-[#3b3abf]/5' : ''
                          }`}
                        >
                          {/* Columna Nombre */}
                          <div className="col-span-6 sm:col-span-6 space-y-0.5">
                            <input
                              ref={index === evaluations.length - 1 ? newRowRef : null}
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                              onKeyDown={handleKeyDownOnRow}
                              placeholder="Nombre (ej. Parcial 1)"
                              className="w-full bg-transparent font-semibold text-[var(--ink)] focus:outline-none focus:underline"
                            />
                            {item.date && (
                              <div className="text-[11px] text-[var(--muted)]">
                                {formatHumanDate(item.date)}
                              </div>
                            )}
                          </div>

                          {/* Columna Peso (%) */}
                          <div className="col-span-3 sm:col-span-2 flex items-center justify-center">
                            <div className="relative w-full max-w-[72px]">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={item.weight > 0 ? item.weight : ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  handleUpdateItem(item.id, { weight: val });
                                }}
                                onKeyDown={handleKeyDownOnRow}
                                placeholder="0"
                                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-1.5 px-2 text-center font-bold text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] font-bold pointer-events-none">
                                %
                              </span>
                            </div>
                          </div>

                          {/* Columna Nota */}
                          <div className="col-span-3 sm:col-span-3 flex flex-col items-center gap-1">
                            {item.isSimulating ? (
                              <div className="w-full max-w-[110px] flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="0.1"
                                  value={item.simulatedGrade !== null && item.simulatedGrade !== undefined ? item.simulatedGrade : ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                    handleUpdateItem(item.id, { simulatedGrade: val });
                                  }}
                                  placeholder="¿Y si saco?"
                                  className="w-full bg-amber-500/10 border border-amber-500/40 text-amber-800 dark:text-amber-200 rounded-xl py-1.5 px-2 text-center font-bold focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItem(item.id, { isSimulating: false, simulatedGrade: null })}
                                  className="p-1 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                                  title="Quitar simulación"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="w-full max-w-[110px] flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="5"
                                  step="0.1"
                                  value={item.grade !== null && item.grade !== undefined ? item.grade : ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                    handleUpdateItem(item.id, { grade: val });
                                  }}
                                  onKeyDown={handleKeyDownOnRow}
                                  placeholder={neededGradePlaceholder}
                                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-1.5 px-2 text-center font-bold text-[var(--ink)] placeholder:text-[var(--muted)] placeholder:font-normal focus:outline-none focus:border-[#3b3abf] [&::-webkit-inner-spin-button]:appearance-none [appearance:textfield]"
                                />
                                {isPending && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateItem(item.id, {
                                        isSimulating: true,
                                        simulatedGrade: currentStatus.requiredGrade || 3.5,
                                      })
                                    }
                                    className="p-1 rounded-lg text-[10px] font-bold text-[#3b3abf] dark:text-[#a0a0ff] hover:bg-[#3b3abf]/10 cursor-pointer shrink-0"
                                    title="¿Y si saco X? Simular sin guardar nota real"
                                  >
                                    ¿y si?
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Columna Acciones */}
                          <div className="hidden sm:flex sm:col-span-1 justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1.5 text-[var(--muted)] hover:text-rose-500 rounded-lg hover:bg-[var(--surface)] transition-colors cursor-pointer"
                              title="Eliminar fila"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--muted)] pt-1 px-1">
                <span>Pulsa Enter en cualquier campo para agregar una fila nueva.</span>
                <span>Los cambios se guardan automáticamente.</span>
              </div>
            </div>
          </div>
        )}

        {/* Pie Limpio */}
        <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between sticky bottom-0 z-10">
          <div className="text-xs text-[var(--muted)]">
            Nota aprobatoria oficial en Icesi:{' '}
            <strong className="text-[var(--ink)]">
              {selectedSubject?.passingGrade ? selectedSubject.passingGrade.toFixed(1) : '3.0'}
            </strong>
          </div>

          <button
            type="button"
            onClick={closeGradeCalculator}
            className="px-5 py-2.5 rounded-xl bg-[var(--paper)] hover:bg-[var(--border)] text-[var(--ink)] text-xs font-bold transition-all border border-[var(--border)] cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
