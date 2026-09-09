'use client';

import { useState, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import {
  smartIngest,
  ParsedAcademicData,
  titleCase,
} from '@/lib/importer/smartAcademicIngester';
import {
  applyAcademicTemplate,
  applyParsedAcademicData,
  startFreshEmptySemester,
} from '@/lib/importer/templateLoader';
import { ACADEMIC_TEMPLATES, AcademicTemplate } from '@/lib/templates/academicTemplates';
import {
  Sparkles,
  Upload,
  FileText,
  Check,
  X,
  Layers,
  GraduationCap,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  ChevronRight,
  ImageIcon,
} from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
];

export function SmartOnboardingModal() {
  const { isOnboardingOpen, closeOnboarding } = useUIStore();
  const { refreshData } = useSemesterData();

  const [activeTab, setActiveTab] = useState<'ia' | 'templates' | 'zero'>('ia');

  // Estado pestaña IA
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedAcademicData | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado pestaña Desde Cero (Wizard)
  const [zeroStep, setZeroStep] = useState<1 | 2 | 3>(1);
  const [zeroProfile, setZeroProfile] = useState({
    name: '',
    studentCode: '',
    university: 'Universidad Icesi',
    program: 'Ingeniería',
    semesterNumber: 1,
  });

  const [zeroSubjects, setZeroSubjects] = useState<
    Array<{
      id: string;
      name: string;
      code: string;
      professor: string;
      location: string;
      color: string;
      blocks: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        location: string;
      }>;
    }>
  >([
    {
      id: 'sub-0',
      name: '',
      code: '',
      professor: '',
      location: '',
      color: '#3b3abf',
      blocks: [{ dayOfWeek: 1, startTime: '07:00', endTime: '09:00', location: '' }],
    },
  ]);

  if (!isOnboardingOpen) return null;

  // Manejador de subida de imagen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    }
  };

  // Procesar con IA (texto o imagen)
  const handleProcessSmart = async () => {
    if (!pastedText.trim() && !selectedFile) return;
    setIsProcessing(true);

    try {
      const result = await smartIngest({
        text: pastedText,
        imageFile: selectedFile || undefined,
      });
      setParsedResult(result);
    } catch (err) {
      console.error('Error al procesar con IA:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirmar y aplicar datos extraídos por IA
  const handleConfirmParsed = async () => {
    if (!parsedResult) return;
    setIsProcessing(true);
    await applyParsedAcademicData(parsedResult);
    await refreshData();
    setIsSuccess(true);
    setIsProcessing(false);

    setTimeout(() => {
      setIsSuccess(false);
      setParsedResult(null);
      setPastedText('');
      setSelectedFile(null);
      setFilePreview(null);
      closeOnboarding();
    }, 1200);
  };

  // Cargar una plantilla oficial
  const handleLoadTemplate = async (templateId: string) => {
    setIsProcessing(true);
    await applyAcademicTemplate(templateId);
    await refreshData();
    setIsSuccess(true);
    setIsProcessing(false);

    setTimeout(() => {
      setIsSuccess(false);
      closeOnboarding();
    }, 1000);
  };

  // Finalizar creación desde cero
  const handleFinishZero = async () => {
    setIsProcessing(true);
    await startFreshEmptySemester({
      name: zeroProfile.name || 'Estudiante',
      studentCode: zeroProfile.studentCode || 'A00400100',
      university: zeroProfile.university,
      program: zeroProfile.program,
      semesterNumber: zeroProfile.semesterNumber,
      initialSubjects: zeroSubjects.filter((s) => s.name.trim().length > 0),
    });
    await refreshData();
    setIsSuccess(true);
    setIsProcessing(false);

    setTimeout(() => {
      setIsSuccess(false);
      closeOnboarding();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[var(--ink)]">
        {/* Header Principal */}
        <div className="p-6 border-b border-[var(--border)] bg-gradient-to-r from-[#1a1a5e] to-[#2828a8] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#c5c5ff]">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                Asistente de Configuración Inicial
              </h2>
              <p className="text-xs text-[#c5c5ff] mt-0.5 font-medium">
                Inicializa tu semestre con IA, selecciona plantillas oficiales o empieza desde cero
              </p>
            </div>
          </div>
          <button
            onClick={closeOnboarding}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher Superior */}
        <div className="px-6 pt-4 pb-2 border-b border-[var(--border)] bg-[var(--paper)]">
          <div className="flex gap-2 p-1 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
            <button
              onClick={() => {
                setActiveTab('ia');
                setParsedResult(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'ia'
                  ? 'bg-[#3b3abf] text-white shadow-md shadow-[#3b3abf]/30'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Asistente IA (Imagen / Balance)</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-[#3b3abf] text-white shadow-md shadow-[#3b3abf]/30'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Plantillas Oficiales Icesi</span>
            </button>
            <button
              onClick={() => setActiveTab('zero')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'zero'
                  ? 'bg-[#3b3abf] text-white shadow-md shadow-[#3b3abf]/30'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Crear Desde Cero</span>
            </button>
          </div>
        </div>

        {/* Contenido Scrolleable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ══════════════════════════════════════════════════════════
              PESTAÑA 1: ASISTENTE IA (IMAGEN O BALANCE TEXTUAL)
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 'ia' && !parsedResult && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-3">
                <Sparkles className="w-5 h-5 shrink-0 text-[#3b3abf] dark:text-[#a0a0ff] mt-0.5" />
                <div>
                  <strong className="block font-bold">Algoritmo Inteligente de Extracción:</strong>
                  Sube una foto o captura de tu horario, o pega el texto del Balance Académico Jasper / Banner de Icesi. Nuestro motor estructurará tu perfil, materias, códigos y franjas horarias al instante.
                </div>
              </div>

              {/* Subida de Imagen (Drag & Drop) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 font-mono">
                  Opción A: Subir Captura de Imagen (Horario o Balance)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--border)] hover:border-[#3b3abf] rounded-2xl p-6 text-center cursor-pointer transition-all bg-[var(--paper)] hover:bg-[var(--surface)] group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                  />
                  {filePreview ? (
                    <div className="flex flex-col items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="max-h-40 rounded-xl object-contain border border-[var(--border)] shadow-md"
                      />
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Imagen lista: {selectedFile?.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 rounded-2xl bg-[var(--surface)] text-[#3b3abf] dark:text-[#a0a0ff] shadow-sm group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-[var(--ink)]">
                        Haz clic o arrastra aquí tu horario o balance
                      </span>
                      <span className="text-[11px] text-[var(--muted)] font-mono">
                        PNG, JPG o WEBP hasta 10MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pegar Texto */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] font-mono">
                    Opción B: Pegar Texto de Banner, Jasper o Canvas
                  </label>
                  <button
                    onClick={() => {
                      setPastedText(`SISTEMA DE REGISTRO ACADÉMICO\nBalance académico\n1110295145\nEstudiante: A00414805 - RODRIGUEZ GURRUTE LUIS ERNESTO\nSemestre: 4\nCohorte: 202510\nPromedio: 4.3\nPrograma: IND - Ingeniería Industrial\nMaterias por aprobar\n5 CFT 11373 Estadística aplicada II 04\n6 CFT 11370 Física II 04\n7 IND 05359 Optimización 04\n8 CFT 11356 Matemáticas aplicadas III 04\n4 IND 05358 Optativa profesional 04`);
                    }}
                    className="text-[11px] font-mono text-[#3b3abf] dark:text-[#a0a0ff] hover:underline cursor-pointer"
                  >
                    Pegar ejemplo real Icesi
                  </button>
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={4}
                  placeholder="Pega aquí el contenido de tu Balance Académico oficial o las materias de tu horario..."
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-3 text-xs text-[var(--ink)] font-mono placeholder:text-[var(--muted)] focus:outline-none focus:border-[#3b3abf] focus:ring-1 focus:ring-[#3b3abf]"
                />
              </div>

              {/* Botón de Procesamiento */}
              <button
                onClick={handleProcessSmart}
                disabled={(!pastedText.trim() && !selectedFile) || isProcessing}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#3b3abf] hover:bg-[#2828a8] disabled:opacity-50 text-white text-sm font-black shadow-lg shadow-[#3b3abf]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analizando con Motor Inteligente...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Analizar y Extraer Semestre</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* VISTA PREVIA EDITABLE TRAS EL ANÁLISIS IA */}
          {activeTab === 'ia' && parsedResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Extracción Exitosa ({parsedResult.sourceType})
                  </span>
                  <h3 className="text-lg font-black text-[var(--ink)] mt-1">
                    Revisa y Confirma tu Semestre
                  </h3>
                </div>
                <button
                  onClick={() => setParsedResult(null)}
                  className="text-xs font-mono text-[var(--muted)] hover:text-[var(--ink)] underline cursor-pointer"
                >
                  Volver a cargar
                </button>
              </div>

              {/* Tarjeta Perfil Detectado */}
              <div className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--border)] space-y-3">
                <div className="text-xs font-mono font-bold uppercase text-[#3b3abf] dark:text-[#a0a0ff]">
                  Datos de Estudiante Detectados
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-[var(--muted)] block">Estudiante</label>
                    <input
                      type="text"
                      value={parsedResult.profile.name || ''}
                      onChange={(e) =>
                        setParsedResult({
                          ...parsedResult,
                          profile: { ...parsedResult.profile, name: e.target.value },
                        })
                      }
                      className="w-full font-bold bg-[var(--surface)] p-2 rounded-xl border border-[var(--border)] mt-0.5 text-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--muted)] block">Código Banner</label>
                    <input
                      type="text"
                      value={parsedResult.profile.studentCode || ''}
                      onChange={(e) =>
                        setParsedResult({
                          ...parsedResult,
                          profile: { ...parsedResult.profile, studentCode: e.target.value },
                        })
                      }
                      className="w-full font-mono bg-[var(--surface)] p-2 rounded-xl border border-[var(--border)] mt-0.5 text-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--muted)] block">Programa</label>
                    <input
                      type="text"
                      value={parsedResult.profile.program || ''}
                      onChange={(e) =>
                        setParsedResult({
                          ...parsedResult,
                          profile: { ...parsedResult.profile, program: e.target.value },
                        })
                      }
                      className="w-full font-bold bg-[var(--surface)] p-2 rounded-xl border border-[var(--border)] mt-0.5 text-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--muted)] block">Promedio GPA</label>
                    <input
                      type="number"
                      step="0.1"
                      value={parsedResult.profile.gpa || 4.0}
                      onChange={(e) =>
                        setParsedResult({
                          ...parsedResult,
                          profile: { ...parsedResult.profile, gpa: parseFloat(e.target.value) },
                        })
                      }
                      className="w-full font-mono font-bold text-amber-600 dark:text-amber-400 bg-[var(--surface)] p-2 rounded-xl border border-[var(--border)] mt-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Materias y Horarios Detectados */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold uppercase text-[var(--muted)] flex items-center justify-between">
                  <span>Materias y Bloques Horarios ({parsedResult.subjects.length})</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {parsedResult.scheduleBlocks.length} franjas semanales
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {parsedResult.subjects.map((sub, idx) => {
                    const blocks = parsedResult.scheduleBlocks.filter(
                      (b) => b.subjectId === sub.id
                    );

                    return (
                      <div
                        key={sub.id}
                        className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: sub.color }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[var(--ink)] truncate">
                              {sub.name}
                            </div>
                            <div className="text-[10px] font-mono text-[var(--muted)]">
                              {sub.code} · {sub.credits} créditos
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {blocks.map((b, bIdx) => (
                            <span
                              key={bIdx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)]"
                            >
                              {DAYS.find((d) => d.id === b.dayOfWeek)?.name.slice(0, 3)} {b.startTime}-{b.endTime} ({b.location})
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botón de Confirmación Definitiva */}
              <button
                onClick={handleConfirmParsed}
                disabled={isProcessing || isSuccess}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>¡Semestre Configurado con Éxito!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Confirmar y Configurar Mi Semestre</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              PESTAÑA 2: CATÁLOGO DE PLANTILLAS OFICIALES
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 'templates' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="text-xs text-[var(--muted)]">
                Selecciona tu programa académico para cargar al instante tus materias, horarios, laboratorios y parciales calibrados:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ACADEMIC_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--border)] hover:border-[#3b3abf] transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#3b3abf]/15 text-[#3b3abf] dark:text-[#a0a0ff] border border-[#3b3abf]/20">
                          {tmpl.badge}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          GPA: {tmpl.profile.gpa}
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold text-[var(--ink)] mt-2 group-hover:text-[#3b3abf] dark:group-hover:text-[#a0a0ff] transition-colors">
                        {tmpl.name}
                      </h4>
                      <p className="text-[11px] text-[var(--muted)] mt-1 line-clamp-2">
                        {tmpl.description}
                      </p>

                      <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2 text-[10px] font-mono text-[var(--muted)]">
                        <span>{tmpl.subjects.length} materias</span>
                        <span>·</span>
                        <span>{tmpl.scheduleBlocks.length} bloques</span>
                        <span>·</span>
                        <span>{tmpl.profile.name}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLoadTemplate(tmpl.id)}
                      disabled={isProcessing}
                      className="mt-4 w-full py-2 px-4 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSuccess ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span>{isSuccess ? '¡Cargado!' : 'Cargar esta Plantilla'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              PESTAÑA 3: CREAR DESDE CERO (PASO A PASO)
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 'zero' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stepper */}
              <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-[var(--paper)] border border-[var(--border)]">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      zeroStep === 1 ? 'bg-[#3b3abf] text-white' : 'bg-[var(--surface)] text-[var(--muted)]'
                    }`}
                  >
                    1
                  </span>
                  <span className={zeroStep === 1 ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}>
                    Perfil Estudiante
                  </span>
                </div>
                <div className="w-8 h-[1px] bg-[var(--border)]" />
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      zeroStep === 2 ? 'bg-[#3b3abf] text-white' : 'bg-[var(--surface)] text-[var(--muted)]'
                    }`}
                  >
                    2
                  </span>
                  <span className={zeroStep === 2 ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}>
                    Tus Materias
                  </span>
                </div>
                <div className="w-8 h-[1px] bg-[var(--border)]" />
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      zeroStep === 3 ? 'bg-[#3b3abf] text-white' : 'bg-[var(--surface)] text-[var(--muted)]'
                    }`}
                  >
                    3
                  </span>
                  <span className={zeroStep === 3 ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}>
                    Horario Semanal
                  </span>
                </div>
              </div>

              {/* PASO 1: PERFIL */}
              {zeroStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-[var(--ink)] block mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        placeholder="Ej. Luis Felipe Rodríguez"
                        value={zeroProfile.name}
                        onChange={(e) => setZeroProfile({ ...zeroProfile, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--paper)] text-[var(--ink)] font-bold focus:outline-none focus:border-[#3b3abf]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[var(--ink)] block mb-1">Código Estudiantil *</label>
                      <input
                        type="text"
                        placeholder="Ej. A00414805"
                        value={zeroProfile.studentCode}
                        onChange={(e) => setZeroProfile({ ...zeroProfile, studentCode: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--paper)] text-[var(--ink)] font-mono focus:outline-none focus:border-[#3b3abf]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[var(--ink)] block mb-1">Universidad</label>
                      <input
                        type="text"
                        value={zeroProfile.university}
                        onChange={(e) => setZeroProfile({ ...zeroProfile, university: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--paper)] text-[var(--ink)] font-medium focus:outline-none focus:border-[#3b3abf]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[var(--ink)] block mb-1">Carrera / Programa</label>
                      <input
                        type="text"
                        placeholder="Ej. Ingeniería de Sistemas"
                        value={zeroProfile.program}
                        onChange={(e) => setZeroProfile({ ...zeroProfile, program: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--paper)] text-[var(--ink)] font-medium focus:outline-none focus:border-[#3b3abf]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setZeroStep(2)}
                    disabled={!zeroProfile.name.trim()}
                    className="mt-4 w-full py-3 px-4 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Siguiente: Configurar Materias</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* PASO 2: MATERIAS */}
              {zeroStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--ink)]">
                      Añade las materias que matriculaste este semestre:
                    </span>
                    <button
                      onClick={() =>
                        setZeroSubjects([
                          ...zeroSubjects,
                          {
                            id: `sub-${zeroSubjects.length}`,
                            name: '',
                            code: '',
                            professor: '',
                            location: '',
                            color: '#3b3abf',
                            blocks: [{ dayOfWeek: 1, startTime: '07:00', endTime: '09:00', location: '' }],
                          },
                        ])
                      }
                      className="text-xs font-mono text-[#3b3abf] dark:text-[#a0a0ff] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Añadir Materia
                    </button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {zeroSubjects.map((sub, idx) => (
                      <div
                        key={sub.id}
                        className="p-3.5 rounded-2xl bg-[var(--paper)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center gap-3"
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <input
                            type="text"
                            placeholder="Nombre de Materia *"
                            value={sub.name}
                            onChange={(e) => {
                              const copy = [...zeroSubjects];
                              copy[idx].name = e.target.value;
                              setZeroSubjects(copy);
                            }}
                            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] font-bold"
                          />
                          <input
                            type="text"
                            placeholder="Código (ej. CFT 11370)"
                            value={sub.code}
                            onChange={(e) => {
                              const copy = [...zeroSubjects];
                              copy[idx].code = e.target.value;
                              setZeroSubjects(copy);
                            }}
                            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] font-mono"
                          />
                          <input
                            type="text"
                            placeholder="Salón (ej. Salón 204E)"
                            value={sub.location}
                            onChange={(e) => {
                              const copy = [...zeroSubjects];
                              copy[idx].location = e.target.value;
                              setZeroSubjects(copy);
                            }}
                            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                          />
                        </div>
                        {zeroSubjects.length > 1 && (
                          <button
                            onClick={() => setZeroSubjects(zeroSubjects.filter((_, i) => i !== idx))}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setZeroStep(1)}
                      className="py-2.5 px-4 rounded-xl border border-[var(--border)] text-xs font-bold cursor-pointer"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={() => setZeroStep(3)}
                      disabled={zeroSubjects.every((s) => !s.name.trim())}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Siguiente: Asignar Horarios</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3: HORARIOS */}
              {zeroStep === 3 && (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-[var(--ink)]">
                    Indica los días y horas de clase para cada materia:
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {zeroSubjects.map((sub, idx) => (
                      <div
                        key={sub.id}
                        className="p-3.5 rounded-2xl bg-[var(--paper)] border border-[var(--border)] space-y-2.5"
                      >
                        <div className="text-xs font-bold text-[var(--ink)] flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                          <span>{sub.name || `Materia ${idx + 1}`}</span>
                        </div>

                        {sub.blocks.map((block, bIdx) => (
                          <div key={bIdx} className="grid grid-cols-3 gap-2 text-xs">
                            <select
                              value={block.dayOfWeek}
                              onChange={(e) => {
                                const copy = [...zeroSubjects];
                                copy[idx].blocks[bIdx].dayOfWeek = parseInt(e.target.value, 10);
                                setZeroSubjects(copy);
                              }}
                              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] font-bold"
                            >
                              {DAYS.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="time"
                              value={block.startTime}
                              onChange={(e) => {
                                const copy = [...zeroSubjects];
                                copy[idx].blocks[bIdx].startTime = e.target.value;
                                setZeroSubjects(copy);
                              }}
                              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] font-mono"
                            />
                            <input
                              type="time"
                              value={block.endTime}
                              onChange={(e) => {
                                const copy = [...zeroSubjects];
                                copy[idx].blocks[bIdx].endTime = e.target.value;
                                setZeroSubjects(copy);
                              }}
                              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setZeroStep(2)}
                      className="py-2.5 px-4 rounded-xl border border-[var(--border)] text-xs font-bold cursor-pointer"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleFinishZero}
                      disabled={isProcessing || isSuccess}
                      className="flex-1 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>¡Semestre Creado!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Guardar y Comenzar Mi Semestre</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
