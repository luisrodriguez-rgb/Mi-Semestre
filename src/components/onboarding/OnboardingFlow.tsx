'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  UploadCloud,
  FileText,
  Zap,
  GraduationCap,
  School,
  AlertCircle,
  Coffee,
  Flame,
  ShieldCheck,
  Check,
  ChevronRight,
  BookOpen,
  Calculator,
  Sliders,
} from 'lucide-react';
import { calculateGradeStatus } from '@/lib/academic-engine';
import { ingestAcademicEvidence } from '@/lib/importer/universal/pipeline';
import { commitAcademicDataAtomically } from '@/lib/importer/universal/committer';
import { gradeRepository } from '@/lib/storage';
import {
  IngestResult,
  ParsedAcademicData,
  ParsedSubject,
  ParsedScheduleBlock,
} from '@/lib/importer/universal/types';
import { getSharedSemesterFromLocation, SharedSemesterPayload } from '@/lib/share/semesterShare';
import { lookupNRCCourse, extractAllNRCsFromText } from '@/lib/importer/nrcCatalog';
import { ACADEMIC_TEMPLATES, getTemplateForProgram } from '@/lib/templates/academicTemplates';

function createSyntheticIngestResult(data: ParsedAcademicData, sourceLabel: string): IngestResult {
  return {
    data,
    detections: [
      {
        container: 'text',
        documentType: 'schedule',
        confidence: 'high',
        signals: [
          {
            id: 'SOURCE_SIGNAL',
            description: sourceLabel,
            weight: 1,
          },
        ],
      },
    ],
    unresolved: [],
    warnings: [],
    confidence: 'high',
    evidenceGraph: [],
    summary: {
      subjectsCount: data.subjects.length,
      scheduleBlocksCount: data.scheduleBlocks.length,
      examsCount: null,
      assignmentsCount: null,
      missingRoomsCount: 0,
      hasStudentProfile: Boolean(data.student?.name),
    },
  };
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSelectDemo: () => void;
}

const ICESI_PROGRAMS = [
  'Ingeniería Industrial',
  'Ingeniería de Sistemas',
  'Economía y Negocios Internacionales',
  'Ingeniería Telemática',
  'Diseño de Medios Interactivos',
  'Administración de Empresas',
  'Medicina',
  'Biología con concentración en Conservación',
  'Derecho',
  'Psicología',
];

const POPULAR_PROGRAM_CHIPS = [
  'Ingeniería Industrial',
  'Ingeniería de Sistemas',
  'Economía y Negocios Internacionales',
  'Diseño de Medios Interactivos',
];

export function OnboardingFlow({ onComplete, onSelectDemo }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Paso 1: Identidad & Calculadora Instantánea
  const [studentName, setStudentName] = useState('');
  const [university] = useState('Universidad Icesi');
  const [program, setProgram] = useState('Ingeniería Industrial');
  const [semesterNumber, setSemesterNumber] = useState(4);

  // Calculadora Rápida Interactiva de Supervivencia (Fase 4)
  const [quickEvaluatedWeight, setQuickEvaluatedWeight] = useState(40);
  const [quickWeightedGrade, setQuickWeightedGrade] = useState(2.8);

  const quickGradeCalculation = React.useMemo(() => {
    return calculateGradeStatus({
      subjectId: 'onboarding-quick',
      evaluations: [
        {
          id: 'ev-eval',
          subjectId: 'onboarding-quick',
          name: 'Evaluado hasta hoy',
          weight: quickEvaluatedWeight,
          grade: quickWeightedGrade,
        },
        {
          id: 'ev-pending',
          subjectId: 'onboarding-quick',
          name: 'Restante por evaluar',
          weight: Math.max(0, 100 - quickEvaluatedWeight),
        },
      ],
      passingGrade: 3.0,
    });
  }, [quickEvaluatedWeight, quickWeightedGrade]);

  // Paso 2: Magic Drop & Texto
  const [magicTab, setMagicTab] = useState<'paste' | 'file' | 'template'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [detectedNRCsCount, setDetectedNRCsCount] = useState(0);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paso 3: Revelación de valor & Pregunta clave
  const [freeGapHours, setFreeGapHours] = useState(24);
  const [busiestDay, setBusiestDay] = useState('Miércoles');
  const [longestGap, setLongestGap] = useState({ day: 'Martes', hours: 4 });
  const [sharedAuthor, setSharedAuthor] = useState<string | null>(null);

  // Pregunta activadora de riesgo
  const [selectedUrgentSubjectId, setSelectedUrgentSubjectId] = useState<string>('');
  const [urgentExamTimeline, setUrgentExamTimeline] = useState<'2_days' | '7_days' | '14_days'>('2_days');
  const [isFinishing, setIsFinishing] = useState(false);

  // Guardar cálculo rápido como acumulado inicial de una materia
  const [saveQuickAccumulated, setSaveQuickAccumulated] = useState(true);
  const [quickAccumulatedSubjectId, setQuickAccumulatedSubjectId] = useState<string>('');

  // Detectar NRCs en tiempo real al escribir/pegar
  useEffect(() => {
    if (pastedText.trim()) {
      const found = extractAllNRCsFromText(pastedText);
      setDetectedNRCsCount(found.length);
    } else {
      setDetectedNRCsCount(0);
    }
  }, [pastedText]);

  // 1. Detectar si viene de un enlace compartido (?share=...)
  useEffect(() => {
    const shared = getSharedSemesterFromLocation();
    if (shared) {
      handleLoadSharedSemester(shared);
    }
  }, []);

  const handleLoadSharedSemester = (shared: SharedSemesterPayload) => {
    setIsProcessing(true);
    setProcessingStage('Reconstruyendo semestre compartido desde enlace...');
    setProgram(shared.c || 'Ingeniería Industrial');
    setSemesterNumber(shared.s || 4);
    if (shared.author) {
      setSharedAuthor(shared.author);
    }

    const subjectsMap = new Map<string, ParsedSubject>();
    const scheduleBlocks: ParsedScheduleBlock[] = [];

    shared.nrcs.forEach((nrc) => {
      const info = lookupNRCCourse(nrc);
      if (info) {
        const subId = `sub-nrc-${nrc}`;
        subjectsMap.set(subId, {
          id: subId,
          code: info.code,
          nrc: info.nrc,
          name: info.name,
          credits: info.credits,
          color: '#3b3abf',
          professor: info.professor,
          maxAbsences: 4,
        });

        info.blocks.forEach((b, idx) => {
          scheduleBlocks.push({
            id: `sb-${subId}-${idx}`,
            subjectId: subId,
            dayOfWeek: b.dayOfWeek,
            startTime: b.startTime,
            endTime: b.endTime,
            location: b.location,
          });
        });
      }
    });

    const parsed: ParsedAcademicData = {
      student: {
        name: 'Estudiante',
        university: shared.u,
        program: shared.c,
        semesterNumber: shared.s,
      },
      semester: {
        name: `${shared.s}° Semestre · ${shared.c}`,
        startDate: '2026-08-01',
        endDate: '2026-12-05',
        totalWeeks: 16,
      },
      subjects: Array.from(subjectsMap.values()),
      scheduleBlocks,
    };

    calculateMetricsFromBlocks(scheduleBlocks);

    const syntheticResult = createSyntheticIngestResult(parsed, 'Semestre compartido por enlace');

    setIngestResult(syntheticResult);
    if (parsed.subjects.length > 0) {
      setSelectedUrgentSubjectId(parsed.subjects[0].id);
      setQuickAccumulatedSubjectId(parsed.subjects[0].id);
    }
    setIsProcessing(false);
    setCurrentStep(3);
  };

  const calculateMetricsFromBlocks = (blocks: Array<{ dayOfWeek: number; startTime: string; endTime: string }>) => {
    if (!blocks || blocks.length === 0) {
      setFreeGapHours(24);
      setBusiestDay('Miércoles');
      setLongestGap({ day: 'Martes', hours: 4 });
      return;
    }

    const dayClassHours: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const dayNames: Record<number, string> = {
      1: 'Lunes',
      2: 'Martes',
      3: 'Miércoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sábado',
    };

    blocks.forEach((b) => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      const durationHours = eh + em / 60 - (sh + sm / 60);
      dayClassHours[b.dayOfWeek] = (dayClassHours[b.dayOfWeek] || 0) + Math.max(0, durationHours);
    });

    let maxDay = 1;
    let maxHours = 0;
    let totalClassHours = 0;

    Object.entries(dayClassHours).forEach(([dayStr, hours]) => {
      const d = Number(dayStr);
      totalClassHours += hours;
      if (hours > maxHours) {
        maxHours = hours;
        maxDay = d;
      }
    });

    const estimatedCampusHours = 50;
    const computedFreeHours = Math.max(12, Math.round(estimatedCampusHours - totalClassHours));

    setFreeGapHours(computedFreeHours);
    setBusiestDay(dayNames[maxDay] || 'Miércoles');
    setLongestGap({
      day: maxDay === 2 ? 'Jueves' : 'Martes',
      hours: Math.min(5, Math.max(3, Math.round(computedFreeHours / 6))),
    });
  };

  const processEvidence = async (text?: string, file?: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setProcessingStage('Detectando códigos y firmas académicas en Icesi...');

    try {
      const evidenceList: any[] = [];
      if (file) {
        evidenceList.push({ file });
      }
      if (text && text.trim()) {
        evidenceList.push({ text: text.trim() });
      }

      setProcessingStage('Cruzando salones y códigos con el catálogo oficial...');
      const result = await ingestAcademicEvidence(evidenceList);

      if (!result.data.subjects || result.data.subjects.length === 0) {
        setErrorMsg(
          'No logramos detectar materias en el texto pegado. Prueba pegando los códigos de tu horario o usa la plantilla oficial en 1 clic.'
        );
        setIsProcessing(false);
        return;
      }

      result.data.student = {
        name: studentName.trim() || result.data.student?.name || 'Estudiante',
        university,
        program,
        semesterNumber,
      };

      setIngestResult(result);
      calculateMetricsFromBlocks(result.data.scheduleBlocks);

      if (result.data.subjects.length > 0) {
        setSelectedUrgentSubjectId(result.data.subjects[0].id);
        setQuickAccumulatedSubjectId(result.data.subjects[0].id);
      }

      setProcessingStage('Calculando tus huecos libres y margen de inasistencias...');
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep(3);
      }, 500);
    } catch (err: any) {
      console.error('Error al procesar horario:', err);
      setErrorMsg('Ocurrió un error al analizar la evidencia. Intenta con la plantilla en 1 clic.');
      setIsProcessing(false);
    }
  };

  const handleUseOfficialTemplate = async (overrideTmpl?: typeof ACADEMIC_TEMPLATES[0]) => {
    setIsProcessing(true);
    const tmpl = overrideTmpl || getTemplateForProgram(program);
    setProcessingStage(`Cargando plantilla oficial de ${tmpl.name}...`);

    const subjects: ParsedSubject[] = tmpl.subjects.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      credits: s.credits,
      color: s.color || '#3b3abf',
      professor: s.professor || 'Docente Titular',
      maxAbsences: s.maxAbsences || 4,
    }));

    const scheduleBlocks: ParsedScheduleBlock[] = tmpl.scheduleBlocks.map((b, idx) => ({
      id: `sb-tmpl-${idx}`,
      subjectId: b.subjectId,
      dayOfWeek: b.dayOfWeek,
      startTime: b.startTime,
      endTime: b.endTime,
      location: b.location,
    }));

    const parsed: ParsedAcademicData = {
      student: {
        name: studentName.trim() || tmpl.profile.name || 'Estudiante',
        university,
        program: tmpl.profile.program || program,
        semesterNumber: tmpl.semesterNumber || semesterNumber,
      },
      semester: {
        name: `${tmpl.semesterNumber || semesterNumber}° Semestre · ${tmpl.profile.program || program}`,
        startDate: '2026-08-01',
        endDate: '2026-12-05',
        totalWeeks: 16,
      },
      subjects,
      scheduleBlocks,
    };

    calculateMetricsFromBlocks(scheduleBlocks);

    const syntheticResult = createSyntheticIngestResult(parsed, `Plantilla oficial ${tmpl.name}`);

    setIngestResult(syntheticResult);
    if (subjects.length > 0) {
      setSelectedUrgentSubjectId(subjects[0].id);
      setQuickAccumulatedSubjectId(subjects[0].id);
    }

    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep(3);
    }, 450);
  };

  const handleFinishAndEnter = async () => {
    if (!ingestResult) return;
    setIsFinishing(true);

    try {
      const dataToCommit = { ...ingestResult.data };

      if (selectedUrgentSubjectId) {
        const targetSubject = dataToCommit.subjects.find((s) => s.id === selectedUrgentSubjectId);
        const addDays = (d: number) => {
          const date = new Date();
          date.setDate(date.getDate() + d);
          return date.toISOString().split('T')[0];
        };

        const examDate =
          urgentExamTimeline === '2_days'
            ? `${addDays(2)}T07:00:00`
            : urgentExamTimeline === '7_days'
            ? `${addDays(7)}T09:00:00`
            : `${addDays(14)}T14:00:00`;

        const urgentExam = {
          id: `exam-urgent-${Date.now()}`,
          subjectId: selectedUrgentSubjectId,
          title: `Primer Parcial: ${targetSubject?.name || 'Evaluación Clave'}`,
          date: examDate,
          weight: 25,
          location: 'Aula Principal',
          notes: 'Configurado como prioridad máxima durante el onboarding inicial.',
        };

        dataToCommit.exams = [urgentExam];

        if (typeof window !== 'undefined') {
          localStorage.setItem('mi_semestre_priority_subject_id', selectedUrgentSubjectId);
        }
      }

      await commitAcademicDataAtomically(dataToCommit);

      // Guardar el cálculo de la calculadora rápida como "Acumulado anterior" si el usuario lo eligió
      if (saveQuickAccumulated && quickAccumulatedSubjectId) {
        await gradeRepository.save({
          id: `gr-quick-${Date.now()}`,
          subjectId: quickAccumulatedSubjectId,
          name: 'Acumulado anterior',
          value: quickWeightedGrade,
          weight: quickEvaluatedWeight,
        });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('semester-data-updated'));
        }
      }

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        onComplete();
      }, 700);
    } catch (err) {
      console.error('Error al guardar datos del onboarding:', err);
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#07091a] text-white flex flex-col justify-between selection:bg-[#5b5be8] selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          FONDO INMERSIVO: CAMPUS ICESI + AMBIENT LIGHT BLOOM
         ───────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <Image
          src="/campus_icesi.webp"
          alt="Campus Universidad Icesi"
          fill
          priority
          className="object-cover object-center opacity-15 scale-105 filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07091a]/80 via-[#07091a]/95 to-[#07091a]" />
        
        {/* Luces atmosféricas Icesi */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-gradient-to-b from-[#3b3abf]/30 via-[#5b5be8]/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-[#6366f1]/10 rounded-full blur-3xl" />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BARRA SUPERIOR OFICIAL: LOGO MI SEMESTRE | ICESI + SALVAVIDAS DEMO
         ───────────────────────────────────────────────────────────── */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-3">
        <div className="flex items-center justify-between backdrop-blur-xl bg-[#0c102a]/60 border border-[#232a58]/60 rounded-2xl px-4 py-3 shadow-xl shadow-black/40">
          {/* Logo Oficial Mi Semestre | Icesi */}
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#3b3abf] to-[#656cf5] rounded-xl blur-xs opacity-70 group-hover:opacity-100 transition duration-300" />
              <div className="relative w-10 h-10 rounded-xl bg-[#0b0e26] border border-[#2b31a8] flex items-center justify-center p-1.5 shadow-md">
                <img
                  src="/icon.png"
                  alt="MI SEMESTRE | ICESI"
                  className="w-full h-full object-contain drop-shadow"
                />
              </div>
            </div>
            <div>
              <div className="font-black text-sm tracking-wider text-white flex items-center gap-1.5">
                MI SEMESTRE
                <span className="text-[#656cf5] font-black text-base">|</span>
                <span className="text-[10px] font-mono tracking-widest text-[#a0a8ff] uppercase bg-[#181d48] px-2 py-0.5 rounded-md border border-[#2c336b] font-bold">
                  ICESI
                </span>
              </div>
              <p className="text-[11px] text-[#7a85b8] font-medium tracking-tight">
                Sistema Operativo Personal del Semestre
              </p>
            </div>
          </div>

          {/* Salvavidas de Demostración para Reclutadores o Curiosos */}
          <button
            onClick={onSelectDemo}
            className="group relative overflow-hidden rounded-xl p-[1px] cursor-pointer transition-transform active:scale-95"
            title="Explorar el proyecto con el 4to semestre de Ingeniería Industrial"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-amber-500/40 via-indigo-500/40 to-amber-500/40 rounded-xl animate-pulse" />
            <span className="relative flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-[#0d112e] text-xs font-bold text-amber-300 group-hover:text-white transition-colors border border-amber-500/30">
              <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden md:inline text-white/60 font-normal">¿Solo explorando?</span>
              <span>Entrar con Semestre Demo</span>
            </span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          CUERPO PRINCIPAL DEL ONBOARDING
         ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 w-full max-w-2xl mx-auto my-auto px-4 py-6 sm:py-8">
        {/* Timeline de Pasos Conectado y Elegante */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-7 select-none">
          {[
            { step: 1, label: '1. Calculadora & Carrera' },
            { step: 2, label: '2. Tu Horario' },
            { step: 3, label: '3. Tus Métricas' },
          ].map((item, idx) => (
            <React.Fragment key={item.step}>
              {idx > 0 && (
                <div
                  className={`h-0.5 w-6 sm:w-10 rounded-full transition-colors duration-500 ${
                    currentStep >= item.step ? 'bg-[#5b5be8]' : 'bg-white/10'
                  }`}
                />
              )}
              <div
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full text-xs font-mono transition-all duration-300 ${
                  currentStep === item.step
                    ? 'bg-[#2b31a8] text-white border border-[#5b5be8] shadow-[0_0_20px_rgba(91,91,232,0.45)] font-bold scale-105'
                    : currentStep > item.step
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                    : 'bg-white/5 text-white/30 border border-white/5'
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-black/40 font-bold">
                  {currentStep > item.step ? '✓' : item.step}
                </span>
                <span>{item.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* ═════════════════════════════════════════════════════════════
            PASO 1: CALCULADORA DE SUPERVIVENCIA & EL GANCHO DE IDENTIDAD
           ═════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
            {/* Título de Impacto con Gradiente de Texto */}
            <div className="text-center space-y-2.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase font-bold tracking-wider px-3.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-xs">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Matemática Real · Cero Promedios Falsos
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                ¿Cuánto necesitas para pasar?{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
                  Pruébalo en vivo.
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[#94a3b8] max-w-lg mx-auto leading-relaxed">
                Calcula exactamente qué nota necesitas en tus parciales restantes y organiza tus huecos de estudio sin autoengaños.
              </p>
            </div>

            {/* ═════════════════════════════════════════════════════════════
                CARD 1: CALCULADORA RÁPIDA DE SUPERVIVENCIA INTERACTIVA
               ═════════════════════════════════════════════════════════════ */}
            <div className="bg-gradient-to-br from-[#12163b]/95 via-[#0c102a]/95 to-[#171b48]/95 backdrop-blur-2xl border border-[#3b3abf]/50 rounded-3xl p-5 sm:p-7 space-y-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between gap-2 border-b border-[#232a58] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                      Calculadora Rápida: ¿Cuánto necesitas para pasar?
                    </h3>
                    <p className="text-[11px] text-[#94a3b8]">
                      Ajusta los controles para ver la nota necesaria en tiempo real
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
                  En vivo
                </span>
              </div>

              {/* Controles deslizantes interactivos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Control 1: % Evaluado */}
                <div className="space-y-1.5 bg-[#080b20]/60 p-3.5 rounded-2xl border border-[#232a58]/60">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8b95c2]">Porcentaje evaluado:</span>
                    <strong className="text-white text-sm">{quickEvaluatedWeight}%</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={quickEvaluatedWeight}
                    onChange={(e) => setQuickEvaluatedWeight(Number(e.target.value))}
                    className="w-full accent-[#5b5be8] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#626c96]">
                    <span>10% (Inicio)</span>
                    <span>50% (Mitad)</span>
                    <span>90% (Final)</span>
                  </div>
                </div>

                {/* Control 2: Promedio en lo evaluado */}
                <div className="space-y-1.5 bg-[#080b20]/60 p-3.5 rounded-2xl border border-[#232a58]/60">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8b95c2]">Tu promedio en lo evaluado:</span>
                    <strong className="text-indigo-300 text-sm">{quickWeightedGrade.toFixed(1)} / 5.0</strong>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={quickWeightedGrade}
                    onChange={(e) => setQuickWeightedGrade(Number(e.target.value))}
                    className="w-full accent-[#5b5be8] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#626c96]">
                    <span>1.0</span>
                    <span>3.0 (Aprobatoria Icesi)</span>
                    <span>5.0</span>
                  </div>
                </div>
              </div>

              {/* Resultado del cálculo */}
              <div className="p-4 rounded-2xl bg-[#080c24] border border-[#3b3abf]/40 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-mono text-[#8b95c2] uppercase font-bold">
                    Diagnóstico académico
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase self-start sm:self-auto ${
                      (quickGradeCalculation.requiredGrade || 0) > 5.0
                        ? 'bg-rose-950/40 text-rose-300 border border-rose-700/60'
                        : (quickGradeCalculation.requiredGrade || 0) > 4.0
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : (quickGradeCalculation.requiredGrade || 0) > 3.0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {quickGradeCalculation.status === 'INVIABLE_MATEMATICAMENTE'
                      ? 'Inviable (> 5.0)'
                      : quickGradeCalculation.status === 'RIESGO_CRITICO'
                      ? 'Riesgo Crítico'
                      : quickGradeCalculation.status === 'EXIGE_ESFUERZO'
                      ? 'Exige Esfuerzo'
                      : 'Trayectoria Segura'}
                  </span>
                </div>

                <div className="text-sm sm:text-base font-bold text-white leading-snug">
                  Llevas{' '}
                  <span className="text-indigo-300 font-black">
                    {quickGradeCalculation.currentWeightedGrade?.toFixed(2)}
                  </span>{' '}
                  en lo evaluado ({quickEvaluatedWeight}% de la materia)
                </div>

                <p className="text-xs text-[#cbd5e1] font-mono leading-relaxed">
                  {quickGradeCalculation.status === 'INVIABLE_MATEMATICAMENTE' ? (
                    'Requerirías una nota superior a 5.0 en lo restante. Mi Semestre identifica esto preventivamente para que evalúes opciones de cancelación a tiempo y dediques tu tiempo a las materias que sí puedes salvar.'
                  ) : (
                    <>
                      Necesitas promediar{' '}
                      <strong className="text-indigo-300 font-bold">
                        {quickGradeCalculation.requiredGrade?.toFixed(2)}
                      </strong>{' '}
                      en el {quickGradeCalculation.remainingWeight}% restante para asegurar la aprobación con 3.0.
                    </>
                  )}
                </p>
              </div>

              <div className="text-center pt-1 text-xs text-[#94a3b8]">
                <span>Mi Semestre automatiza este cálculo en tiempo real conectando tus parciales oficiales. Ingresa tus datos abajo para cargar tus materias:</span>
              </div>
            </div>

            {/* Tarjeta de Entrada de Datos Estilo Glassmorphism */}
            <div className="bg-[#0c102a]/85 backdrop-blur-2xl border border-[#232a58] rounded-3xl p-6 sm:p-7 space-y-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
              {/* Campo Nombre */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#8b95c2] uppercase tracking-wider mb-1.5">
                  ¿Cómo te llamas?
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre (ej: Isabella, David, Camilo...)"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-[#080b20]/90 border border-[#232a58] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#5b5be8] focus:ring-2 focus:ring-[#5b5be8]/20 transition-all font-medium"
                />
              </div>

              {/* Universidad + Semestre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-[#8b95c2] uppercase tracking-wider mb-1.5">
                    Universidad
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={university}
                      className="w-full bg-[#080b20]/50 border border-[#232a58]/80 rounded-xl px-4 py-2.5 text-xs text-white/80 font-semibold cursor-not-allowed"
                    />
                    <School className="w-4 h-4 text-indigo-400 absolute right-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-[#8b95c2] uppercase tracking-wider mb-1.5">
                    Semestre Activo
                  </label>
                  <select
                    value={semesterNumber}
                    onChange={(e) => setSemesterNumber(Number(e.target.value))}
                    className="w-full bg-[#080b20]/90 border border-[#232a58] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#5b5be8] focus:ring-2 focus:ring-[#5b5be8]/20 transition-all font-semibold cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num} className="bg-[#0c102a] text-white">
                        {num}° Semestre
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Carrera / Programa Académico */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono font-bold text-[#8b95c2] uppercase tracking-wider">
                    Carrera / Programa
                  </label>
                  <span className="text-[10px] text-white/40">Selecciona o pulsa abajo</span>
                </div>

                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full bg-[#080b20]/90 border border-[#232a58] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#5b5be8] focus:ring-2 focus:ring-[#5b5be8]/20 transition-all font-semibold cursor-pointer mb-2.5"
                >
                  {ICESI_PROGRAMS.map((prog) => (
                    <option key={prog} value={prog} className="bg-[#0c102a] text-white">
                      {prog}
                    </option>
                  ))}
                </select>

                {/* Chips rápidos de carreras comunes */}
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_PROGRAM_CHIPS.map((chip: string) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setProgram(chip)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        program === chip
                          ? 'bg-[#2b31a8] border-[#5b5be8] text-white font-bold shadow-xs'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón Principal Siguiente Paso */}
              <button
                onClick={() => setCurrentStep(2)}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#2828a8] via-[#3b3abf] to-[#5b5be8] hover:from-[#3232c4] hover:to-[#6f6ff5] text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-[0_10px_30px_rgba(59,58,191,0.5)] transition-all cursor-pointer group active:scale-[0.98]"
              >
                <span>Continuar a Cargar Horario</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            PASO 2: EL "MAGIC DROP" CONTEXTUAL
           ═════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-400">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Carga tu horario en{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  segundos
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[#94a3b8]">
                El motor local de Icesi cruza códigos, profesores y salones instantáneamente sin inventar datos.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isProcessing ? (
              <div className="bg-[#0c102a]/90 backdrop-blur-2xl border border-[#232a58] rounded-3xl p-10 text-center space-y-5 shadow-2xl">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#6366f1] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <Sparkles className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Analizando horario universitario...
                  </h3>
                  <p className="text-xs font-mono text-indigo-300 bg-[#161c48] py-1.5 px-3 rounded-full border border-indigo-500/30 inline-block animate-pulse">
                    {processingStage}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selector de Pestañas del Magic Drop */}
                <div className="flex bg-[#080b20] p-1 rounded-2xl border border-[#232a58]">
                  <button
                    type="button"
                    onClick={() => setMagicTab('paste')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      magicTab === 'paste'
                        ? 'bg-[#2b31a8] text-white shadow-md'
                        : 'text-[#8b95c2] hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pegar Banner (Ctrl + V)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMagicTab('file')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      magicTab === 'file'
                        ? 'bg-[#2b31a8] text-white shadow-md'
                        : 'text-[#8b95c2] hover:text-white'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Importar Calendario (.ICS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMagicTab('template')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      magicTab === 'template'
                        ? 'bg-[#2b31a8] text-white shadow-md'
                        : 'text-[#8b95c2] hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Plantilla 1 Clic</span>
                  </button>
                </div>

                {/* 1. PESTAÑA: PEGAR TEXTO (PRIORIDAD #1) */}
                {magicTab === 'paste' && (
                  <div className="bg-[#0c102a]/85 backdrop-blur-2xl border border-[#2b31a8]/80 rounded-3xl p-6 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Texto Plano de Banner o Matrícula
                      </span>
                      {detectedNRCsCount > 0 ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                          ✓ {detectedNRCsCount} NRCs Detectados
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-white/60">
                          Reconoce códigos de 5 dígitos
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#94a3b8] leading-relaxed">
                      Selecciona la tabla en Banner de Icesi o el balance de notas, cópiala con <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Ctrl + C</kbd> y pégala aquí:
                    </p>

                    <textarea
                      rows={4}
                      placeholder="Ej: 05359 Optimización Lunes y Miércoles 7:00 a 9:00 am Aula 204E... o pega el balance académico oficial..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="w-full bg-[#080b20] border border-[#232a58] rounded-2xl p-3.5 text-xs text-white font-mono placeholder-white/20 focus:outline-none focus:border-[#5b5be8] focus:ring-2 focus:ring-[#5b5be8]/20 transition-all"
                    />

                    <button
                      disabled={!pastedText.trim()}
                      onClick={() => processEvidence(pastedText)}
                      className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#2828a8] via-[#3b3abf] to-[#5b5be8] hover:from-[#3232c4] hover:to-[#6f6ff5] disabled:opacity-40 disabled:pointer-events-none font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Procesar Horario con Motor Contextual</span>
                    </button>
                  </div>
                )}

                {/* 2. PESTAÑA: IMPORTAR CALENDARIO (.ICS) */}
                {magicTab === 'file' && (
                  <div className="bg-[#0c102a]/85 backdrop-blur-2xl border border-[#232a58] rounded-3xl p-6 space-y-4 shadow-xl">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#232a58] hover:border-[#5b5be8] rounded-2xl p-8 text-center transition-all bg-[#080b20]/60 hover:bg-[#080b20] cursor-pointer group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".ics,.txt"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processEvidence(undefined, file);
                        }}
                      />
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6 text-indigo-400" />
                      </div>
                      <p className="text-xs font-bold text-white group-hover:text-indigo-200">
                        Arrastra tu archivo o haz clic para seleccionar
                      </p>
                      <p className="text-[11px] text-[#7a85b8] mt-1">
                        Soporta archivos de calendario exportados (.ICS) o reportes en texto plano (.TXT)
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. PESTAÑA: PLANTILLA OFICIAL 1 CLIC */}
                {magicTab === 'template' && (() => {
                  const currentTemplate = getTemplateForProgram(program);
                  return (
                    <div className="bg-[#0c102a]/85 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">
                                {currentTemplate.name}
                              </h4>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {currentTemplate.badge}
                              </span>
                            </div>
                            <p className="text-xs text-[#8b95c2] mt-0.5">
                              {currentTemplate.faculty}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 hidden sm:block">
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            {currentTemplate.subjects.length} materias
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#94a3b8] leading-relaxed">
                        {currentTemplate.description}
                      </p>

                      {/* Lista dinámica de materias oficiales de ESTA carrera */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-mono text-[#8b95c2] uppercase font-bold tracking-wider flex items-center justify-between">
                          <span>Materias oficiales que se cargarán:</span>
                          <span className="text-[10px] text-white/50">{currentTemplate.scheduleBlocks.length} bloques con salón Icesi</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                          {currentTemplate.subjects.map((sub) => (
                            <div
                              key={sub.id}
                              className="p-2.5 rounded-xl bg-[#080b20] border border-[#232a58] flex items-center justify-between text-left"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-xs font-bold text-white truncate">
                                  {sub.name}
                                </div>
                                <div className="text-[10px] text-[#7a85b8] font-mono truncate">
                                  {sub.code} · {sub.professor || 'Docente Titular'}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-white shrink-0">
                                {sub.credits} cr
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Selector rápido para explorar otras carreras si el usuario lo desea */}
                      <div className="pt-2 border-t border-[#1e2552] flex items-center justify-between text-xs">
                        <span className="text-[#8b95c2] text-[11px]">¿Quieres ver otra carrera?</span>
                        <select
                          value={program}
                          onChange={(e) => setProgram(e.target.value)}
                          className="bg-[#080b20] border border-[#232a58] rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#5b5be8] font-medium cursor-pointer"
                        >
                          {ICESI_PROGRAMS.map((prog) => (
                            <option key={prog} value={prog} className="bg-[#0c102a] text-white">
                              {prog}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleUseOfficialTemplate(currentTemplate)}
                        className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-98"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>Cargar Plan de {currentTemplate.name} ({currentTemplate.subjects.length} materias)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            PASO 3: LA REVELACIÓN DE VALOR ("Aha! Moment")
           ═════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && ingestResult && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {sharedAuthor
                  ? `Semestre Compartido por ${sharedAuthor}`
                  : `¡Semestre Configurado con Éxito!`}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Analizamos tu semestre en{' '}
                <span className="text-[#a0a8ff]">Universidad Icesi</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#94a3b8]">
                Cruzamos tus {ingestResult.data.subjects.length} materias con tu disponibilidad real en campus:
              </p>
            </div>

            {/* Tarjetas de Métricas de Alto Impacto Psicológico */}
            <div className="bg-[#0c102a]/85 backdrop-blur-2xl border border-[#232a58] rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#07091a]/80 p-3.5 rounded-2xl border border-emerald-500/30 shadow-xs">
                  <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono block">
                    {freeGapHours}h
                  </span>
                  <span className="text-[10px] text-white/60 font-medium">Huecos Libres / Sem.</span>
                </div>

                <div className="bg-[#07091a]/80 p-3.5 rounded-2xl border border-rose-500/30 shadow-xs">
                  <Flame className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                  <span className="text-xs sm:text-sm font-black text-white font-mono block truncate mt-1">
                    {busiestDay}
                  </span>
                  <span className="text-[10px] text-white/60 font-medium">Día Más Pesado</span>
                </div>

                <div className="bg-[#07091a]/80 p-3.5 rounded-2xl border border-indigo-500/30 shadow-xs">
                  <Coffee className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                  <span className="text-xl sm:text-2xl font-black text-indigo-300 font-mono block">
                    {longestGap.hours}h
                  </span>
                  <span className="text-[10px] text-white/60 font-medium">Bloque en {longestGap.day}</span>
                </div>
              </div>

              {/* Materias Detectadas */}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7a85b8] block mb-2">
                  Tus Materias Matriculadas
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ingestResult.data.subjects.map((s) => (
                    <span
                      key={s.id}
                      className="text-xs px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-white/90 font-medium flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* PREGUNTA CLAVE PARA ACTIVAR EL RADAR DE RIESGO */}
            <div className="bg-[#0c102a]/85 backdrop-blur-2xl border border-amber-500/40 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    ¿Cuál es el parcial o entrega que más te preocupa?
                  </h3>
                  <p className="text-xs text-[#8b95c2]">
                    Activará el Radar de Riesgo con 4h de estudio sugerido y guiará tu centro de decisiones.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <select
                  value={selectedUrgentSubjectId}
                  onChange={(e) => setSelectedUrgentSubjectId(e.target.value)}
                  className="w-full bg-[#080b20] border border-[#232a58] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer font-semibold"
                >
                  {ingestResult.data.subjects.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#0c102a] text-white">
                      {s.name} ({s.code || 'Icesi'})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '2_days', label: 'En 2-3 días (Crítico)', color: 'border-rose-500/40 text-rose-300' },
                    { id: '7_days', label: 'Próx. Semana', color: 'border-amber-500/40 text-amber-300' },
                    { id: '14_days', label: 'En 2 Semanas', color: 'border-emerald-500/40 text-emerald-300' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setUrgentExamTimeline(option.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                        urgentExamTimeline === option.id
                          ? 'bg-white/15 border-white text-white font-bold ring-1 ring-white/30'
                          : `bg-black/20 ${option.color} hover:bg-white/5`
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Opción de guardar el acumulado de la calculadora rápida */}
            <div className="bg-[#0c102a]/85 backdrop-blur-2xl border border-indigo-500/40 rounded-3xl p-5 sm:p-6 space-y-3.5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-300">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Guardar nota de la calculadora rápida
                    </h3>
                    <p className="text-xs text-[#8b95c2] mt-0.5 leading-relaxed">
                      En el paso 1 calculaste que llevas <strong className="text-white font-bold">{quickWeightedGrade.toFixed(1)}</strong> en el <strong className="text-white font-bold">{quickEvaluatedWeight}%</strong>. Puedes guardarlo directamente como el acumulado inicial de una materia.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={saveQuickAccumulated}
                    onChange={(e) => setSaveQuickAccumulated(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#181d45] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5b5be8]" />
                </label>
              </div>

              {saveQuickAccumulated && (
                <div className="pt-2 border-t border-[#232a58]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-200">
                  <span className="text-xs font-semibold text-[#8b95c2]">
                    Guardar como acumulado de:
                  </span>
                  <select
                    value={quickAccumulatedSubjectId}
                    onChange={(e) => setQuickAccumulatedSubjectId(e.target.value)}
                    className="bg-[#080b20] border border-[#232a58] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 font-semibold cursor-pointer max-w-full sm:max-w-xs"
                  >
                    {ingestResult.data.subjects.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0c102a] text-white">
                        {s.name} ({s.code || 'Icesi'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* BOTÓN FINAL DE ENTRADA AL DASHBOARD */}
            <button
              disabled={isFinishing}
              onClick={handleFinishAndEnter}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#2828a8] via-[#3b3abf] to-[#5b5be8] hover:from-[#3232c4] hover:to-[#6f6ff5] text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-[0_15px_40px_rgba(59,58,191,0.6)] transition-all cursor-pointer group active:scale-[0.98]"
            >
              <span>{isFinishing ? 'Iniciando Semestre...' : 'Entrar a mi Semestre'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          PIE DE PÁGINA OFICIAL
         ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 text-center py-4 text-xs text-[#636f9e] font-mono">
        Mi Semestre | ICESI · Diseñado para la psicología académica universitaria
      </footer>
    </div>
  );
}
