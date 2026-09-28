'use client';

import { useState, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSemesterData } from '@/hooks/useSemesterData';
import {
  ingestAcademicEvidence,
  commitAcademicDataAtomically,
  IngestResult,
  RawEvidence,
  CommitResult,
} from '@/lib/importer/universal';
import {
  applyAcademicTemplate,
  startFreshEmptySemester,
} from '@/lib/importer/templateLoader';
import { ACADEMIC_TEMPLATES } from '@/lib/templates/academicTemplates';
import { autofillDataFromTemplate } from '@/lib/importer/templateMatcher';
import {
  Sparkles,
  Check,
  X,
  Layers,
  Plus,
  Trash2,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  FileText,
  Calendar,
  AlertTriangle,
  Info,
  ShieldCheck,
  Upload,
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

  const [activeTab, setActiveTab] = useState<'universal' | 'templates' | 'zero'>('universal');

  // Estado del Motor Universal de Ingesta ("Configurar mi semestre")
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [isAutofilled, setIsAutofilled] = useState(false);
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

  // Manejador de subida múltiple de archivos
  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setStagedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Procesar con Universal Academic Ingest
  const handleProcessUniversal = async () => {
    if (stagedFiles.length === 0 && !pastedText.trim()) return;
    setIsProcessing(true);
    setProcessingStage('Detectando contenedores y firmas académicas...');

    try {
      const evidenceList: RawEvidence[] = [];

      for (const file of stagedFiles) {
        evidenceList.push({ file });
      }

      if (pastedText.trim()) {
        evidenceList.push({ text: pastedText.trim() });
      }

      setProcessingStage('Resolviendo asignaturas y consolidando evidencias...');
      const result = await ingestAcademicEvidence(evidenceList);
      setIngestResult(result);
    } catch (err) {
      console.error('Error al procesar evidencia con Universal Academic Ingest:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  // Confirmar y aplicar con Commit Atómico Dexie
  const handleConfirmCommit = async () => {
    if (!ingestResult) return;
    setIsProcessing(true);
    setProcessingStage('Ejecutando commit atómico local...');

    try {
      const result = await commitAcademicDataAtomically(ingestResult.data);
      setCommitResult(result);
      await refreshData();
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        setIngestResult(null);
        setStagedFiles([]);
        setPastedText('');
        closeOnboarding();
      }, 1500);
    } catch (err) {
      console.error('Error en commit atómico:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  // Autocompletar con plantilla oficial detectada
  const handleApplyAutofillFromTemplate = () => {
    if (!ingestResult?.matchedTemplate) return;
    const template = ACADEMIC_TEMPLATES.find((t) => t.id === ingestResult.matchedTemplate?.id);
    if (!template) return;

    const enrichedData = autofillDataFromTemplate(ingestResult.data, template);
    const updatedSummary = {
      ...ingestResult.summary,
      scheduleBlocksCount: enrichedData.scheduleBlocks.length,
      examsCount: enrichedData.exams?.length ?? null,
      assignmentsCount: enrichedData.assignments?.length ?? null,
      missingRoomsCount: enrichedData.scheduleBlocks.filter((b) => !b.location).length,
    };

    setIngestResult({
      ...ingestResult,
      data: enrichedData,
      summary: updatedSummary,
    });
    setIsAutofilled(true);
  };

  // Cargar una plantilla oficial
  const handleLoadTemplate = async (templateId: string) => {
    setLoadingTemplateId(templateId);
    try {
      await applyAcademicTemplate(templateId);
      await refreshData();
      setLoadingTemplateId(null);
      setLoadedTemplateId(templateId);

      setTimeout(() => {
        setLoadedTemplateId(null);
        closeOnboarding();
      }, 900);
    } catch (err) {
      console.error('Error al cargar plantilla:', err);
      setLoadingTemplateId(null);
    }
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
                Configurar mi semestre
              </h2>
              <p className="text-xs text-[#c5c5ff] mt-0.5 font-medium">
                Sube o pega tu evidencia académica. Mi Semestre detectará y unificará todo sin inventar datos.
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
                setActiveTab('universal');
                setIngestResult(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'universal'
                  ? 'bg-[#3b3abf] text-white shadow-md shadow-[#3b3abf]/30'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Universal (PDF / ICS / Texto / Foto)</span>
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
              PASO 1: ENTRADA UNIVERSAL (DROPZONE + TEXTO)
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 'universal' && !ingestResult && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 text-[#3b3abf] dark:text-[#a0a0ff] mt-0.5" />
                <div>
                  <strong className="block font-bold">Sin decisiones técnicas ni datos inventados:</strong>
                  Sube cualquier combinación de archivos (PDF de Balance Jasper, calendario .ICS, captura de horario o notas) o pega el texto directamente. El motor resolverá tus asignaturas de forma transparente.
                </div>
              </div>

              {/* Zona de Arrastre / Selección Múltiple */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2 font-mono">
                  Archivos Académicos (.PDF, .ICS, Imagen o Texto)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--border)] hover:border-[#3b3abf] rounded-2xl p-6 text-center cursor-pointer transition-all bg-[var(--paper)] hover:bg-[var(--surface)] group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFilesAdded}
                    multiple
                    accept=".pdf,.ics,.txt,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-2xl bg-[var(--surface)] text-[#3b3abf] dark:text-[#a0a0ff] shadow-sm group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-[var(--ink)]">
                      Arrastra tus archivos aquí o haz clic para explorar
                    </span>
                    <span className="text-[11px] text-[var(--muted)] font-mono">
                      Soporta PDF de Balance, archivos .ics de calendario, capturas y syllabus
                    </span>
                  </div>
                </div>

                {/* Lista de Archivos Cargados */}
                {stagedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-[11px] font-mono font-bold text-[var(--muted)] uppercase">
                      Archivos listos para procesar ({stagedFiles.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stagedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-mono text-[var(--ink)]"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
                          <span className="max-w-[200px] truncate">{file.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStagedFile(idx);
                            }}
                            className="text-[var(--muted)] hover:text-red-500 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pegar Texto */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] font-mono">
                    O Pega el Texto Directamente
                  </label>
                  <button
                    onClick={() => {
                      setPastedText(`UNIVERSIDAD ICESI\nSISTEMA DE REGISTRO ACADÉMICO - RRBANBALACA\nBalance académico del estudiante\nEstudiante: A00414805 - RODRIGUEZ GURRUTE LUIS ERNESTO\nPrograma: ING - Ingeniería Industrial\nSemestre: 4\nCohorte: 202510\nPromedio: 4.35\nMaterias matriculadas:\n11373 Estadística Aplicada II 04\n05359 Optimización 04\n11239 Electricidad y Laboratorio 04`);
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
                  placeholder="Pega aquí el contenido de tu Balance Académico, tabla de horario de Banner o notas de clase..."
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-3 text-xs text-[var(--ink)] font-mono placeholder:text-[var(--muted)] focus:outline-none focus:border-[#3b3abf] focus:ring-1 focus:ring-[#3b3abf]"
                />
              </div>

              {/* Botón de Procesamiento */}
              <button
                onClick={handleProcessUniversal}
                disabled={(stagedFiles.length === 0 && !pastedText.trim()) || isProcessing}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#3b3abf] hover:bg-[#2828a8] disabled:opacity-50 text-white text-sm font-black shadow-lg shadow-[#3b3abf]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{processingStage || 'Procesando evidencia académica...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Procesar mi evidencia</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              PASO 2: PANTALLA DE REVISIÓN ("RESUMEN + EXCEPCIONES")
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 'universal' && ingestResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Evidencia Consolidada · Confianza {ingestResult.confidence.toUpperCase()}
                  </span>
                  <h3 className="text-xl font-black text-[var(--ink)] mt-1">
                    Tu semestre
                  </h3>
                </div>
                <button
                  onClick={() => setIngestResult(null)}
                  className="text-xs font-mono text-[var(--muted)] hover:text-[var(--ink)] underline cursor-pointer"
                >
                  Modificar evidencias
                </button>
              </div>

              {/* Tarjetas de Resumen Principal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--border)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                    ✓
                  </div>
                  <div>
                    <div className="text-base font-black text-[var(--ink)]">
                      {ingestResult.summary.subjectsCount} materias
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">Consolidadas y listas</div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3 transition-colors ${
                    ingestResult.summary.scheduleBlocksCount > 0
                      ? 'bg-[var(--paper)] border-[var(--border)]'
                      : 'bg-amber-500/10 border-amber-500/25'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                      ingestResult.summary.scheduleBlocksCount > 0
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {ingestResult.summary.scheduleBlocksCount > 0 ? '✓' : '!'}
                  </div>
                  <div>
                    <div
                      className={`text-base font-black ${
                        ingestResult.summary.scheduleBlocksCount > 0
                          ? 'text-[var(--ink)]'
                          : 'text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {ingestResult.summary.scheduleBlocksCount} clases
                    </div>
                    <div
                      className={`text-[11px] ${
                        ingestResult.summary.scheduleBlocksCount > 0
                          ? 'text-[var(--muted)]'
                          : 'text-amber-600 dark:text-amber-400 font-medium'
                      }`}
                    >
                      {ingestResult.summary.scheduleBlocksCount > 0
                        ? 'Franjas de horario'
                        : 'Horario pendiente'}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--border)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                    ✓
                  </div>
                  <div>
                    <div className="text-base font-black text-[var(--ink)] truncate max-w-[140px]">
                      {ingestResult.data.student?.name || 'Estudiante'}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] font-mono">
                      {ingestResult.data.student?.studentCode || 'Perfil detectado'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner de Enriquecimiento Inteligente (Plantilla Oficial Detectada) */}
              {ingestResult.matchedTemplate && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#3b3abf]/15 via-purple-500/10 to-indigo-500/15 border border-[#3b3abf]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#3b3abf] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#3b3abf] text-white">
                          Plantilla Oficial Calibrada
                        </span>
                        <span className="text-xs font-mono font-bold text-[#3b3abf] dark:text-[#a0a0ff]">
                          {ingestResult.matchedTemplate.name}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] mt-1">
                        {ingestResult.summary.scheduleBlocksCount > 0
                          ? 'Tus clases y materias ya están vinculadas. Puedes además enriquecer tus parciales y rutinas de estudio en 1 clic.'
                          : 'Tu balance tiene las materias pero no las horas de clase de Banner. Puedes autocompletar horarios, salones y parciales al instante.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyAutofillFromTemplate}
                    disabled={isAutofilled}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                      isAutofilled
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-[#3b3abf] hover:bg-[#2828a8] text-white shadow-md shadow-[#3b3abf]/20'
                    }`}
                  >
                    {isAutofilled ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Datos Enriquecidos!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Autocompletar en 1 Clic</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Excepciones y Diagnóstico Transparente */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold uppercase text-[var(--muted)]">
                  Diagnóstico y Excepciones Detectadas:
                </div>

                {/* Salones Pendientes */}
                {ingestResult.summary.missingRoomsCount > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block">
                        ⚠ {ingestResult.summary.missingRoomsCount} salón(es) pendiente(s)
                      </strong>
                      <span className="text-[11px] text-amber-700 dark:text-amber-300">
                        Algunas clases no tienen salón asignado en la evidencia cargada. Podrás editar el aula en cualquier momento desde tu horario.
                      </span>
                    </div>
                  </div>
                )}

                {/* Evaluaciones Ausentes vs Vacías */}
                {ingestResult.summary.examsCount === null && (
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3 text-xs text-blue-800 dark:text-blue-200">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block">
                        ℹ Evaluaciones: No encontradas en la evidencia cargada
                      </strong>
                      <span className="text-[11px] text-blue-700 dark:text-blue-300">
                        Mi Semestre no inventa parciales ficticios. Podrás registrar tus entregas y exámenes más adelante o cargar el syllabus de cada materia.
                      </span>
                    </div>
                  </div>
                )}

                {/* Otras Advertencias Transparentes */}
                {ingestResult.warnings
                  .filter((w) => w.code !== 'MISSING_ROOMS' && w.code !== 'EXAMS_NOT_EVIDENCED')
                  .map((w, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] text-xs text-[var(--ink)] flex items-center gap-2"
                    >
                      <span className="text-amber-500">⚠</span>
                      <span>{w.message}</span>
                    </div>
                  ))}
              </div>

              {/* Acordeón de Detalles de Asignaturas */}
              <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--paper)]">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full p-4 flex items-center justify-between text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#3b3abf]" />
                    <span>Ver detalle completo de asignaturas ({ingestResult.data.subjects.length})</span>
                  </span>
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4 text-[var(--muted)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
                  )}
                </button>

                {showDetails && (
                  <div className="p-4 pt-0 border-t border-[var(--border)] space-y-2 max-h-60 overflow-y-auto">
                    {ingestResult.data.subjects.map((sub) => {
                      const blocks = ingestResult.data.scheduleBlocks.filter(
                        (b) => b.subjectId === sub.id
                      );
                      return (
                        <div
                          key={sub.id}
                          className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-[var(--ink)]">{sub.name}</div>
                            <div className="text-[11px] font-mono text-[var(--muted)]">
                              {sub.code || 'Sin código'} · {sub.credits || 3} créditos · {sub.professor || 'Docente titular'}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {blocks.length > 0 ? (
                              blocks.map((b, bIdx) => (
                                <span
                                  key={bIdx}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--paper)] border border-[var(--border)] text-[var(--ink)]"
                                >
                                  {DAYS.find((d) => d.id === b.dayOfWeek)?.name.slice(0, 3)} {b.startTime}-{b.endTime}
                                  {b.location ? ` (${b.location})` : ''}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] font-mono text-amber-600">Sin horario</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botón de Confirmación Definitiva (Dexie Atomic Commit) */}
              <button
                onClick={handleConfirmCommit}
                disabled={isProcessing || isSuccess}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>
                      ¡Semestre guardado! ({commitResult?.created.subjects || ingestResult.summary.subjectsCount} materias, {commitResult?.created.scheduleBlocks || ingestResult.summary.scheduleBlocksCount} clases)
                    </span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Empezar mi semestre</span>
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
                      disabled={loadingTemplateId !== null}
                      className={`mt-4 w-full py-2 px-4 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        loadedTemplateId === tmpl.id
                          ? 'bg-emerald-600 shadow-md shadow-emerald-600/30'
                          : 'bg-[#3b3abf] hover:bg-[#2828a8] shadow-md shadow-[#3b3abf]/20'
                      }`}
                    >
                      {loadedTemplateId === tmpl.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>¡Plantilla Cargada!</span>
                        </>
                      ) : loadingTemplateId === tmpl.id ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                          <span>Cargando datos...</span>
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-4 h-4" />
                          <span>Cargar esta Plantilla</span>
                        </>
                      )}
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
