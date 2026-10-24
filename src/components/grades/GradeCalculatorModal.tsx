'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import {
  calculateGradeStatus,
  buildEvaluationPlanFromExams,
  simulateGrade,
  EvaluationItem,
  GradeCalculationResult,
} from '@/lib/academic-engine';
import { gradeRepository, examRepository } from '@/lib/storage';
import { Grade } from '@/types';
import {
  Calculator,
  X,
  Plus,
  Trash2,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  Save,
  Check,
} from 'lucide-react';

export function GradeCalculatorModal() {
  const { isGradeCalculatorOpen, gradeCalculatorSubjectId, closeGradeCalculator } = useUIStore();
  const { subjects, exams, grades, refreshData } = useSemesterData();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [simulatedItemId, setSimulatedItemId] = useState<string>('');
  const [simulatedGradeValue, setSimulatedGradeValue] = useState<number>(3.5);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Seleccionar materia por defecto cuando se abre el modal
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

  // Construir el plan de evaluación de la materia seleccionada
  useEffect(() => {
    if (!selectedSubject) {
      setEvaluations([]);
      return;
    }
    const initialPlan = buildEvaluationPlanFromExams(selectedSubject, exams, grades);
    setEvaluations(initialPlan);

    // Preseleccionar el primer ítem sin nota para la simulación
    const firstPending = initialPlan.find((item) => item.grade === null || item.grade === undefined);
    if (firstPending) {
      setSimulatedItemId(firstPending.id);
    } else if (initialPlan.length > 0) {
      setSimulatedItemId(initialPlan[0].id);
    }
  }, [selectedSubject, exams, grades]);

  // Cálculo del estado real actual
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
        status: 'SIN_PLAN',
        statusMessage: 'Sin plan de evaluación.',
        weightsIncomplete: true,
        isComplete: false,
      };
    }
    return calculateGradeStatus({
      subjectId: selectedSubject.id,
      evaluations,
      passingGrade: selectedSubject.passingGrade || 3.0,
    });
  }, [selectedSubject, evaluations]);

  // Cálculo del escenario simulado
  const simulationResult: GradeCalculationResult | null = useMemo(() => {
    if (!selectedSubject || !simulatedItemId || evaluations.length === 0) return null;
    return simulateGrade({
      evaluations,
      targetItemId: simulatedItemId,
      simulatedGrade: simulatedGradeValue,
      passingGrade: selectedSubject.passingGrade || 3.0,
    });
  }, [selectedSubject, simulatedItemId, simulatedGradeValue, evaluations]);

  const handleUpdateItem = (id: string, updates: Partial<EvaluationItem>) => {
    setEvaluations((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  };

  const handleAddItem = () => {
    if (!selectedSubject) return;
    const newItem: EvaluationItem = {
      id: `ev-custom-${Date.now()}`,
      subjectId: selectedSubject.id,
      name: `Nuevo componente (${evaluations.length + 1})`,
      weight: 15,
      grade: null,
    };
    setEvaluations((prev) => [...prev, newItem]);
    if (!simulatedItemId) {
      setSimulatedItemId(newItem.id);
    }
  };

  const handleRemoveItem = (id: string) => {
    setEvaluations((prev) => prev.filter((it) => it.id !== id));
    if (simulatedItemId === id) {
      setSimulatedItemId('');
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedSubject) return;

    try {
      // 1. Guardar o actualizar calificaciones en gradeRepository
      const gradesToPersist: Grade[] = [];
      for (const item of evaluations) {
        if (typeof item.grade === 'number' && !isNaN(item.grade)) {
          gradesToPersist.push({
            id: item.id.startsWith('ev-custom-') ? item.id : `gr-${item.id}`,
            subjectId: selectedSubject.id,
            name: item.name,
            value: item.grade,
            weight: item.weight,
          });
        }
      }

      await gradeRepository.deleteBySubject(selectedSubject.id);
      if (gradesToPersist.length > 0) {
        await gradeRepository.bulkSave(gradesToPersist);
      }

      // 2. Si un examen cambió su peso o nota, sincronizar
      for (const item of evaluations) {
        if (item.examId) {
          const originalExam = exams.find((e) => e.id === item.examId);
          if (originalExam && originalExam.weight !== item.weight) {
            await examRepository.save({
              ...originalExam,
              weight: item.weight,
            });
          }
        }
      }

      await refreshData();
      window.dispatchEvent(new CustomEvent('semester-data-updated'));
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2500);
    } catch (err) {
      console.error('Error al guardar calificaciones:', err);
    }
  };

  if (!isGradeCalculatorOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROBADA_ANTICIPADA':
        return {
          bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          label: 'Aprobada anticipada',
          icon: CheckCircle,
        };
      case 'TRAYECTORIA_SEGURA':
        return {
          bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
          label: 'Trayectoria segura',
          icon: TrendingUp,
        };
      case 'EXIGE_ESFUERZO':
        return {
          bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          label: 'Exige esfuerzo sostenido',
          icon: Info,
        };
      case 'RIESGO_CRITICO':
        return {
          bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
          label: 'Riesgo académico alto',
          icon: AlertTriangle,
        };
      case 'INVIABLE_MATEMATICAMENTE':
        return {
          bg: 'bg-rose-950/40 text-rose-300 border-rose-700/60',
          label: 'Inviable matemáticamente (> 5.0)',
          icon: AlertTriangle,
        };
      case 'COMPLETADA_REPROBADA':
        return {
          bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
          label: 'Materia no aprobada',
          icon: X,
        };
      default:
        return {
          bg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
          label: 'Sin plan configurado',
          icon: Info,
        };
    }
  };

  const badge = getStatusBadge(currentStatus.status);
  const BadgeIcon = badge.icon;

  const simBadge = simulationResult ? getStatusBadge(simulationResult.status) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="p-5 sm:p-6 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--surface)]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3b3abf]/10 text-[#3b3abf] dark:text-[#a0a0ff] flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[var(--ink)] tracking-tight">
                Calculadora de Notas & Simulador
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Proyección determinística de notas necesarias y análisis de umbral de aprobación
              </p>
            </div>
          </div>

          <button
            onClick={closeGradeCalculator}
            className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-all cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Asignatura */}
        <div className="px-5 sm:px-6 pt-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono font-bold uppercase text-[var(--muted)]">
                Materia:
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-[var(--paper)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] transition-all cursor-pointer"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)]">
              <span>Nota aprobatoria Icesi:</span>
              <strong className="text-[var(--ink)]">
                {selectedSubject?.passingGrade ? selectedSubject.passingGrade.toFixed(1) : '3.0'}
              </strong>
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-6 pb-6 space-y-6">
          {/* ═════════════════════════════════════════════════════════════
              CARD 1: DIAGNÓSTICO EN VIVO (Cifra Principal: Promedio en lo evaluado)
             ═════════════════════════════════════════════════════════════ */}
          <div className="card-academic p-5 sm:p-6 bg-[var(--paper)] border border-[var(--border)] rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Badge de Estado Cualitativo */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border uppercase tracking-wider ${badge.bg}`}
              >
                <BadgeIcon className="w-3.5 h-3.5" />
                <span>{badge.label}</span>
              </div>

              {/* Porcentaje evaluado en barra visual */}
              <div className="text-xs font-mono text-[var(--muted)] flex items-center gap-2">
                <span>Evaluado:</span>
                <div className="w-24 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3b3abf] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, currentStatus.evaluatedWeight)}%` }}
                  />
                </div>
                <strong className="text-[var(--ink)]">{currentStatus.evaluatedWeight}%</strong>
              </div>
            </div>

            {/* CIFRA PRINCIPAL EXIGIDA: Promedio en lo evaluado */}
            <div className="pt-2">
              <span className="text-[11px] font-mono uppercase font-bold text-[var(--muted)] tracking-wider">
                Situación real del semestre
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight mt-0.5">
                {currentStatus.currentWeightedGrade !== null ? (
                  <>
                    Llevas{' '}
                    <span className="text-[#3b3abf] dark:text-[#a0a0ff]">
                      {currentStatus.currentWeightedGrade.toFixed(2)}
                    </span>{' '}
                    en lo evaluado ({currentStatus.evaluatedWeight}% del curso)
                  </>
                ) : (
                  <>Aún no tienes notas registradas en esta materia</>
                )}
              </div>

              {/* Detalle secundario honesto: acumulado bruto sobre 5.0 */}
              <p className="text-xs text-[var(--muted)] font-mono mt-1">
                Acumulado bruto para el cálculo: {currentStatus.currentAccumulatedScore.toFixed(2)} / 5.0 ·
                Falta evaluar el {currentStatus.remainingWeight}% restante
              </p>
            </div>

            {/* Mensaje de orientación y nota necesaria */}
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink-secondary)] leading-relaxed">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-[#3b3abf] dark:text-[#a0a0ff] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{currentStatus.statusMessage}</span>
                  {currentStatus.requiredGrade !== null && currentStatus.requiredGrade > 0 && currentStatus.requiredGrade <= 5.0 && (
                    <div className="mt-1 text-xs font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">
                      Meta en evaluaciones futuras: {currentStatus.requiredGrade.toFixed(2)} en promedio.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════
              CARD 2: SIMULADOR INTERACTIVO ("¿Y si saco X en el siguiente examen?")
             ═════════════════════════════════════════════════════════════ */}
          <div className="card-academic p-5 sm:p-6 bg-gradient-to-br from-[#12163b]/5 to-[#3b3abf]/5 dark:from-[#0d102c] dark:to-[#171b48] border border-[#3b3abf]/30 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#3b3abf] dark:text-[#a0a0ff]" />
              <h3 className="text-sm font-black text-[var(--ink)] tracking-tight uppercase font-mono">
                Simulador: ¿Y si saco X en el siguiente examen?
              </h3>
            </div>

            {evaluations.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">
                Agrega al menos una evaluación abajo para comenzar la simulación interactiva.
              </p>
            ) : (
              <div className="space-y-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-mono text-[var(--muted)]">Simular nota en:</label>
                    <select
                      value={simulatedItemId}
                      onChange={(e) => setSimulatedItemId(e.target.value)}
                      className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] cursor-pointer"
                    >
                      {evaluations.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.weight}%) {item.grade !== null && item.grade !== undefined ? `[Nota actual: ${item.grade}]` : '[Pendiente]'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Botones de nota rápida */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-[var(--muted)] mr-1">Rápido:</span>
                    {[3.0, 3.5, 4.0, 4.5, 5.0].map((val) => (
                      <button
                        key={val}
                        onClick={() => setSimulatedGradeValue(val)}
                        className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          simulatedGradeValue === val
                            ? 'bg-[#3b3abf] text-white shadow-xs'
                            : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--border)]'
                        }`}
                      >
                        {val.toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slider interactivo */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--muted)]">Nota simulada:</span>
                    <strong className="text-base text-[#3b3abf] dark:text-[#a0a0ff]">
                      {simulatedGradeValue.toFixed(1)} / 5.0
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="5.0"
                    step="0.1"
                    value={simulatedGradeValue}
                    onChange={(e) => setSimulatedGradeValue(parseFloat(e.target.value))}
                    className="w-full accent-[#3b3abf] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[var(--muted)]">
                    <span>0.0</span>
                    <span>2.5</span>
                    <span>3.0 (Aprobatoria)</span>
                    <span>4.0</span>
                    <span>5.0</span>
                  </div>
                </div>

                {/* Resultado de la simulación */}
                {simulationResult && (
                  <div className="p-4 rounded-xl bg-[var(--surface)] border border-[#3b3abf]/30 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-xs text-[var(--ink)] font-bold">
                        Si obtienes {simulatedGradeValue.toFixed(1)}:
                      </div>
                      {simBadge && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${simBadge.bg}`}
                        >
                          {simBadge.label}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
                      <div>
                        <span className="text-[var(--muted)] block text-[10px]">Nuevo promedio evaluado</span>
                        <strong className="text-[var(--ink)] text-sm">
                          {simulationResult.currentWeightedGrade !== null
                            ? simulationResult.currentWeightedGrade.toFixed(2)
                            : '---'}{' '}
                          ({simulationResult.evaluatedWeight}%)
                        </strong>
                      </div>
                      <div>
                        <span className="text-[var(--muted)] block text-[10px]">Nota requerida en lo demás</span>
                        <strong
                          className={`text-sm ${
                            (simulationResult.requiredGrade || 0) > 4.0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {simulationResult.requiredGrade !== null
                            ? `${simulationResult.requiredGrade.toFixed(2)} en el ${simulationResult.remainingWeight}%`
                            : 'Materia finalizada'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═════════════════════════════════════════════════════════════
              CARD 3: PLAN DE EVALUACIÓN (Lista editable de exámenes y pesos)
             ═════════════════════════════════════════════════════════════ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[var(--ink)] tracking-tight">
                  Componentes del Curso & Ponderación
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Total configurado: {currentStatus.totalConfiguredWeight}%{' '}
                  {currentStatus.weightsIncomplete && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      (No suma 100% aún)
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--paper)] hover:bg-[var(--border)] text-[var(--ink)] text-xs font-bold transition-all border border-[var(--border)] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
                <span>Agregar componente</span>
              </button>
            </div>

            {/* Tabla de ítems */}
            <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--paper)]">
              {evaluations.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--muted)]">
                  No hay componentes configurados en esta materia. Pulsa &quot;Agregar componente&quot; para estructurar tus parciales o talleres.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {evaluations.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                          className="w-full bg-transparent font-bold text-[var(--ink)] focus:outline-none focus:underline"
                          placeholder="Nombre del componente"
                        />
                        {item.date && (
                          <span className="text-[10px] font-mono text-[var(--muted)]">
                            Fecha: {item.date}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Peso % */}
                        <div className="flex items-center gap-1 font-mono">
                          <label className="text-[10px] text-[var(--muted)] uppercase">Peso:</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={item.weight}
                            onChange={(e) =>
                              handleUpdateItem(item.id, { weight: parseFloat(e.target.value) || 0 })
                            }
                            className="w-14 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1 text-center font-bold text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
                          />
                          <span className="text-[var(--muted)]">%</span>
                        </div>

                        {/* Calificación obtenida */}
                        <div className="flex items-center gap-1 font-mono">
                          <label className="text-[10px] text-[var(--muted)] uppercase">Nota:</label>
                          <input
                            type="number"
                            min="0.0"
                            max="5.0"
                            step="0.1"
                            placeholder="---"
                            value={item.grade !== null && item.grade !== undefined ? item.grade : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateItem(item.id, {
                                grade: val === '' ? null : parseFloat(val),
                              });
                            }}
                            className="w-14 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1 text-center font-bold text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[#3b3abf]"
                          />
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-[var(--muted)] hover:text-rose-500 rounded-lg hover:bg-[var(--surface)] transition-colors cursor-pointer"
                          title="Eliminar componente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pie del Modal con Guardado */}
        <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between sticky bottom-0 z-10">
          <div className="text-xs font-mono text-[var(--muted)]">
            {isSavedNotice && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Calificaciones y porcentajes guardados correctamente
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={closeGradeCalculator}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <button
              onClick={handleSaveChanges}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all shadow-md shadow-[#3b3abf]/20 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Guardar notas y recalcular</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
