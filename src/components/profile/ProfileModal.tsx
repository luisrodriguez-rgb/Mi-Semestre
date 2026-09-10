'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { profileRepository } from '@/lib/storage';
import { Profile } from '@/types';
import { defaultProfile, resetDatabaseToDemo, resetDatabaseToCleanSlate } from '@/lib/mockData';
import { syncService } from '@/lib/supabase/syncService';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  X,
  User,
  ShieldCheck,
  Mail,
  Check,
  Cloud,
  CloudUpload,
  CloudDownload,
  LogIn,
  LogOut,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  Save,
  KeyRound,
  GraduationCap,
} from 'lucide-react';

interface ProfileModalProps {
  onProfileUpdated?: () => void;
}

export function ProfileModal({ onProfileUpdated }: ProfileModalProps) {
  const { isProfileOpen, closeProfile } = useUIStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'cloud'>('profile');

  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [name, setName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [university, setUniversity] = useState('Universidad Icesi');
  const [program, setProgram] = useState('');
  const [semesterNumber, setSemesterNumber] = useState(1);
  const [email, setEmail] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Supabase Cloud states
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);
  const [cloudUser, setCloudUser] = useState<SupabaseUser | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSyncLoading, setIsSyncLoading] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const loadProfileData = useCallback(async () => {
    const current = (await profileRepository.getActiveProfile()) || defaultProfile;
    setProfile(current);
    setName(current.name);
    setStudentCode(current.studentCode);
    setUniversity(current.university || 'Universidad Icesi');
    setProgram(current.program);
    setSemesterNumber(current.semesterNumber);
    setEmail(current.email || '');
  }, []);

  const checkCloudState = useCallback(async () => {
    const configured = syncService.isConfigured();
    setIsCloudConfigured(configured);
    if (configured) {
      try {
        const user = await syncService.getCurrentUser();
        setCloudUser(user);
      } catch {
        setCloudUser(null);
      }
    }
  }, []);

  useEffect(() => {
    if (isProfileOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadProfileData();
      checkCloudState();
    }
  }, [isProfileOpen, loadProfileData, checkCloudState]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Profile = {
      ...profile,
      name: name.trim() || 'Estudiante',
      studentCode: studentCode.trim() || 'A00123456',
      university: university.trim() || 'Universidad Icesi',
      program: program.trim() || 'Pregrado Universitario',
      semesterNumber: Number(semesterNumber) || 1,
      email: email.trim(),
    };

    await profileRepository.save(updated);
    await profileRepository.setActiveProfile(updated.id);
    setProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    onProfileUpdated?.();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
  };

  const handleLoadDemo = async () => {
    if (confirm('¿Cargar la plantilla demostrativa oficial con materias y horarios de Icesi?')) {
      await resetDatabaseToDemo();
      await loadProfileData();
      onProfileUpdated?.();
      window.dispatchEvent(new CustomEvent('semester-data-updated'));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleCleanSlate = async () => {
    if (confirm('¿Deseas reiniciar tu semestre y empezar con un espacio limpio?')) {
      await resetDatabaseToCleanSlate();
      await loadProfileData();
      onProfileUpdated?.();
      window.dispatchEvent(new CustomEvent('semester-data-updated'));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Supabase Auth
  const handleCloudSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setSyncStatusMsg({ text: 'Ingresa correo y contraseña.', isError: true });
      return;
    }
    setIsAuthLoading(true);
    setSyncStatusMsg(null);
    try {
      await syncService.signIn(authEmail.trim(), authPassword.trim());
      await checkCloudState();
      setSyncStatusMsg({ text: '¡Sesión iniciada con éxito en Supabase!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión.';
      setSyncStatusMsg({ text: msg, isError: true });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCloudSignUp = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      setSyncStatusMsg({ text: 'Ingresa correo y contraseña.', isError: true });
      return;
    }
    if (authPassword.length < 6) {
      setSyncStatusMsg({ text: 'La contraseña debe tener al menos 6 caracteres.', isError: true });
      return;
    }
    setIsAuthLoading(true);
    setSyncStatusMsg(null);
    try {
      const data = await syncService.signUp(authEmail.trim(), authPassword.trim(), name || profile.name);
      await checkCloudState();
      if (data.session) {
        setSyncStatusMsg({ text: '¡Cuenta creada y sesión iniciada en Supabase!' });
      } else {
        setSyncStatusMsg({
          text: '¡Cuenta registrada! Si tu proyecto requiere confirmación, verifica tu bandeja de correo.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar la cuenta.';
      setSyncStatusMsg({ text: msg, isError: true });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCloudSignOut = async () => {
    await syncService.signOut();
    setCloudUser(null);
    setSyncStatusMsg({ text: 'Sesión cerrada en Supabase.' });
  };

  const handlePushToCloud = async () => {
    setIsSyncLoading(true);
    setSyncStatusMsg(null);
    const res = await syncService.pushLocalToCloud();
    setSyncStatusMsg({ text: res.message, isError: !res.success });
    setIsSyncLoading(false);
  };

  const handlePullFromCloud = async () => {
    setIsSyncLoading(true);
    setSyncStatusMsg(null);
    const res = await syncService.pullCloudToLocal();
    setSyncStatusMsg({ text: res.message, isError: !res.success });
    setIsSyncLoading(false);
    if (res.success) {
      await loadProfileData();
      onProfileUpdated?.();
      window.dispatchEvent(new CustomEvent('semester-data-updated'));
    }
  };

  if (!isProfileOpen) return null;

  const initials = (name || profile.name || 'ES')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden relative transition-colors max-h-[92vh] flex flex-col">
        {/* Cabecera del Modal */}
        <div className="p-6 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3b3abf] text-white flex items-center justify-center font-bold shadow-md shadow-[#3b3abf]/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[var(--ink)] tracking-tight">
                Perfil del Estudiante y Cuenta
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Personaliza tus datos académicos o sincroniza tu semestre en la nube
              </p>
            </div>
          </div>

          <button
            onClick={closeProfile}
            className="p-1.5 rounded-xl text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Pestañas: Mi Perfil vs Nube */}
        <div className="flex border-b border-[var(--border)] bg-[var(--paper)] px-6 pt-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-[#3b3abf] text-[#3b3abf] dark:text-[#a0a0ff]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Mi Información Académica</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'cloud'
                ? 'border-[#3b3abf] text-[#3b3abf] dark:text-[#a0a0ff]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Sincronización en la Nube</span>
            {isCloudConfigured && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Contenido Scrolleable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: INFORMACIÓN DEL ESTUDIANTE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Tarjeta de Identidad en Vivo */}
              <div className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--border)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1e1e8a] to-[#3b3abf] text-white font-black text-sm flex items-center justify-center shadow-sm">
                    {initials}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--ink)]">
                      {name || 'Nombre del Estudiante'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-mono mt-0.5">
                      <span className="text-[#3b3abf] dark:text-[#a0a0ff] font-bold">
                        {studentCode || 'A00000000'}
                      </span>
                      <span>·</span>
                      <span>Semestre {semesterNumber}</span>
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Activo
                </span>
              </div>

              {savedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>¡Datos guardados correctamente en tu dispositivo!</span>
                </div>
              )}

              {/* Formulario de Datos Editables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-[var(--ink)]">Nombre y Apellidos</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-[var(--paper)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--ink)]">Código Estudiantil</label>
                  <input
                    type="text"
                    required
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="Ej. A00123456"
                    className="w-full bg-[var(--paper)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink)] font-mono focus:outline-none focus:border-[#3b3abf] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--ink)]">Semestre en Curso</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={semesterNumber}
                    onChange={(e) => setSemesterNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[var(--paper)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink)] font-mono focus:outline-none focus:border-[#3b3abf] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--ink)]">Universidad / Institución</label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="Ej. Universidad Icesi"
                    className="w-full bg-[var(--paper)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--ink)]">Programa / Carrera</label>
                  <input
                    type="text"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder="Ej. Ingeniería de Sistemas"
                    className="w-full bg-[var(--paper)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] transition-colors"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-[var(--ink)]">Correo Institucional (Opcional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@u.icesi.edu.co"
                    className="w-full bg-[var(--paper)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--ink)] font-mono focus:outline-none focus:border-[#3b3abf] transition-colors"
                  />
                </div>
              </div>

              {/* Botón Guardar Cambios */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all shadow-md shadow-[#3b3abf]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Mi Información</span>
              </button>

              {/* Acciones de Plantilla y Reset */}
              <div className="pt-4 border-t border-[var(--border)] space-y-2">
                <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
                  Acciones Rápidas de Espacio de Trabajo
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={handleLoadDemo}
                    className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] hover:bg-[var(--surface-raised)] text-[var(--ink)] font-semibold transition-all flex items-center justify-between cursor-pointer group text-left"
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
                        <span>Cargar Plantilla Demo Icesi</span>
                      </div>
                      <div className="text-[10px] text-[var(--muted)] mt-0.5">
                        Materias y horario demostrativo completo
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleCleanSlate}
                    className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--border)] hover:bg-rose-500/10 hover:border-rose-500/30 text-[var(--ink)] font-semibold transition-all flex items-center justify-between cursor-pointer group text-left"
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Empezar de Cero (Limpio)</span>
                      </div>
                      <div className="text-[10px] text-[var(--muted)] mt-0.5">
                        Vaciar materias para ingresar las mías
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: NUBE Y AUTENTICACIÓN SUPABASE */}
          {activeTab === 'cloud' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cloud className="w-5 h-5 text-[#3b3abf] dark:text-[#a0a0ff]" />
                  <div>
                    <h3 className="text-sm font-black text-[var(--ink)]">
                      Nube Supabase PostgreSQL
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      {isCloudConfigured
                        ? 'Servidor conectado y listo para sincronizar'
                        : 'Variables de entorno no configuradas'}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                    isCloudConfigured
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  }`}
                >
                  {isCloudConfigured ? 'Conectado' : 'Sin conexión'}
                </span>
              </div>

              {syncStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    syncStatusMsg.isError
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {syncStatusMsg.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 shrink-0" />
                  )}
                  <span>{syncStatusMsg.text}</span>
                </div>
              )}

              {isCloudConfigured ? (
                <div>
                  {cloudUser ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold block">
                            Sesión Activa en la Nube
                          </span>
                          <span className="font-mono text-xs font-bold text-[var(--ink)] mt-0.5 block">
                            {cloudUser.email}
                          </span>
                        </div>

                        <button
                          onClick={handleCloudSignOut}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={handlePushToCloud}
                          disabled={isSyncLoading}
                          className="py-3 px-4 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all shadow-md shadow-[#3b3abf]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                        >
                          {isSyncLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CloudUpload className="w-4 h-4" />
                          )}
                          <span>Respaldar en la Nube</span>
                        </button>

                        <button
                          onClick={handlePullFromCloud}
                          disabled={isSyncLoading}
                          className="py-3 px-4 rounded-xl bg-[var(--paper)] hover:bg-[var(--surface-raised)] text-[var(--ink)] border border-[var(--border)] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                        >
                          <CloudDownload className="w-4 h-4 text-[#3b3abf] dark:text-[#a0a0ff]" />
                          <span>Descargar a este Equipo</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        Inicia sesión o crea una cuenta para respaldar de forma segura tus horarios, asistencias, tareas y evaluaciones entre cualquier navegador o dispositivo:
                      </p>

                      <form onSubmit={handleCloudSignIn} className="space-y-3">
                        <div className="space-y-1.5 text-xs">
                          <label className="font-bold text-[var(--ink)]">Correo Electrónico</label>
                          <div className="relative">
                            <Mail className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-3" />
                            <input
                              type="email"
                              required
                              placeholder="tu.correo@u.icesi.edu.co"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              className="w-full bg-[var(--paper)] border border-[var(--border)] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] transition-colors"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-[var(--ink)]">Contraseña</label>
                            <span className="text-[10px] text-[var(--muted)] font-mono">
                              Mínimo 6 caracteres
                            </span>
                          </div>
                          <div className="relative">
                            <KeyRound className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-3" />
                            <input
                              type="password"
                              required
                              minLength={6}
                              placeholder="••••••••"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              className="w-full bg-[var(--paper)] border border-[var(--border)] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf] transition-colors"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={isAuthLoading}
                            className="flex-1 py-3 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all shadow-md shadow-[#3b3abf]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                          >
                            {isAuthLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <LogIn className="w-4 h-4" />
                            )}
                            <span>Iniciar Sesión</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleCloudSignUp}
                            disabled={isAuthLoading}
                            className="flex-1 py-3 rounded-xl bg-[var(--paper)] hover:bg-[var(--surface-raised)] text-[var(--ink)] border border-[var(--border)] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                          >
                            <span>Crear Cuenta</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)] text-xs text-[var(--muted)] space-y-2">
                  <p className="font-bold text-[var(--ink)]">
                    Configuración de Supabase requerida
                  </p>
                  <p>
                    Para habilitar la sincronización en la nube, añade estas variables en tu archivo <code className="text-[#3b3abf] dark:text-[#a0a0ff] font-mono">.env.local</code> o en Vercel:
                  </p>
                  <pre className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-mono text-[11px] text-[#3b3abf] dark:text-[#a0a0ff] overflow-x-auto">
                    NEXT_PUBLIC_SUPABASE_URL=tu-proyecto.supabase.co{'\n'}
                    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
