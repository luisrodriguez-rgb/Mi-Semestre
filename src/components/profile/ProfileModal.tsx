'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { profileRepository } from '@/lib/storage';
import { Profile } from '@/types';
import { defaultProfile } from '@/lib/mockData';
import { syncService } from '@/lib/supabase/syncService';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  X,
  User,
  ShieldCheck,
  Building,
  Mail,
  UserPlus,
  Users,
  Check,
  Cloud,
  CloudUpload,
  CloudDownload,
  Key,
  LogIn,
  LogOut,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface ProfileModalProps {
  onProfileUpdated?: () => void;
}

export function ProfileModal({ onProfileUpdated }: ProfileModalProps) {
  const { isProfileOpen, closeProfile } = useUIStore();
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [program, setProgram] = useState('');
  const [semesterNumber, setSemesterNumber] = useState(4);
  const [email, setEmail] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Supabase states
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);
  const [cloudUser, setCloudUser] = useState<SupabaseUser | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSyncLoading, setIsSyncLoading] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);

  const loadProfileData = useCallback(async () => {
    const current = (await profileRepository.getActiveProfile()) || defaultProfile;
    const list = await profileRepository.getAll();
    setProfile(current);
    setAllProfiles(list);
    setName(current.name);
    setStudentCode(current.studentCode);
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

  const handleSwitchProfile = async (id: string) => {
    await profileRepository.setActiveProfile(id);
    await loadProfileData();
    onProfileUpdated?.();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Profile = {
      id: isNewUser ? `profile-${Date.now()}` : profile.id,
      name,
      studentCode,
      university: 'Universidad Icesi',
      program,
      semesterNumber: Number(semesterNumber),
      email: email || `${studentCode.toLowerCase()}@u.icesi.edu.co`,
    };

    await profileRepository.save(updated);
    await profileRepository.setActiveProfile(updated.id);

    setProfile(updated);
    setIsNewUser(false);
    setIsEditing(false);
    onProfileUpdated?.();
    window.dispatchEvent(new CustomEvent('semester-data-updated'));
  };

  const handlePushCloud = async () => {
    setIsSyncLoading(true);
    setSyncStatusMsg(null);
    const res = await syncService.pushLocalToCloud();
    setSyncStatusMsg({
      text: res.message,
      isError: !res.success,
    });
    setIsSyncLoading(false);
    setTimeout(() => {
      setSyncStatusMsg(null);
    }, 4000);
  };

  const handlePullCloud = async () => {
    setIsSyncLoading(true);
    setSyncStatusMsg(null);
    const res = await syncService.pullCloudToLocal();
    setSyncStatusMsg({
      text: res.message,
      isError: !res.success,
    });
    setIsSyncLoading(false);
    if (res.success) {
      await loadProfileData();
      onProfileUpdated?.();
    }
    setTimeout(() => {
      setSyncStatusMsg(null);
    }, 4000);
  };

  // Supabase Auth
  const handleCloudSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;
    setIsAuthLoading(true);
    setSyncStatusMsg(null);
    try {
      await syncService.signIn(authEmail, authPassword);
      await checkCloudState();
      setShowAuthForm(false);
      setSyncStatusMsg({ text: '¡Sesión iniciada en Supabase!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión.';
      setSyncStatusMsg({ text: msg, isError: true });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCloudSignUp = async () => {
    if (!authEmail || !authPassword) return;
    setIsAuthLoading(true);
    setSyncStatusMsg(null);
    try {
      await syncService.signUp(authEmail, authPassword, profile.name);
      await checkCloudState();
      setSyncStatusMsg({ text: '¡Cuenta creada! Revisa tu correo si se requiere confirmación.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrarse.';
      setSyncStatusMsg({ text: msg, isError: true });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCloudSignOut = async () => {
    await syncService.signOut();
    setCloudUser(null);
    setSyncStatusMsg({ text: 'Sesión cerrada.' });
  };

  // Supabase Sync
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
    }
  };

  if (!isProfileOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative overflow-hidden transition-colors max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3b3abf] text-white flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--ink)]">
                Perfil y Autenticación del Estudiante
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Gestión local e integración en la nube con Supabase
              </p>
            </div>
          </div>
          <button
            onClick={closeProfile}
            className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estado activo de sesión local */}
        <div className="mt-4 p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#1e1e8a] text-white font-black text-sm flex items-center justify-center shadow-md">
              {profile.name
                .split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <div className="text-sm font-black text-[var(--ink)]">{profile.name}</div>
              <div className="text-xs font-mono text-[#3b3abf] dark:text-[#a0a0ff] font-bold">
                Código: {profile.studentCode}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f0fdf4] dark:bg-[#072714] text-[#16a34a] dark:text-[#4ade80] border border-[#dcfce7] dark:border-[#14532d] text-[10px] font-mono font-bold tracking-wider uppercase">
              <ShieldCheck className="w-3 h-3 text-[#16a34a]" />
              ACTIVO
            </span>
            <span className="text-[10px] text-[var(--muted)] font-mono">
              Semestre {profile.semesterNumber}
            </span>
          </div>
        </div>

        {/* SECCIÓN NUBE SUPABASE */}
        <div className="mt-4 p-4 rounded-xl bg-[var(--paper)] border border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#3b3abf] dark:text-[#a0a0ff]" />
              <span className="text-xs font-bold text-[var(--ink)]">
                Nube Supabase PostgreSQL
              </span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isCloudConfigured
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              }`}
            >
              {isCloudConfigured ? 'Conectado' : 'Faltan variables .env'}
            </span>
          </div>

          {syncStatusMsg && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                syncStatusMsg.isError
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {syncStatusMsg.isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
              <span>{syncStatusMsg.text}</span>
            </div>
          )}

          {isCloudConfigured ? (
            <div>
              {cloudUser ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--muted)] truncate">
                      Usuario: <strong className="text-[var(--ink)]">{cloudUser.email}</strong>
                    </span>
                    <button
                      onClick={handleCloudSignOut}
                      className="text-xs text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Salir</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handlePushToCloud}
                      disabled={isSyncLoading}
                      className="flex-1 py-2 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSyncLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CloudUpload className="w-3.5 h-3.5" />
                      )}
                      <span>Respaldar en la Nube</span>
                    </button>

                    <button
                      onClick={handlePullFromCloud}
                      disabled={isSyncLoading}
                      className="flex-1 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--paper)] text-[var(--ink)] text-xs font-bold border border-[var(--border)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CloudDownload className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
                      <span>Descargar a este equipo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--muted)]">
                    Inicia sesión en Supabase para habilitar las políticas de seguridad (RLS) y sincronizar entre dispositivos:
                  </p>
                  {!showAuthForm ? (
                    <button
                      onClick={() => setShowAuthForm(true)}
                      className="w-full py-2 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Iniciar Sesión en Supabase</span>
                    </button>
                  ) : (
                    <form onSubmit={handleCloudSignIn} className="space-y-2 pt-1">
                      <input
                        type="email"
                        required
                        placeholder="tu.correo@u.icesi.edu.co"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
                      />
                      <input
                        type="password"
                        required
                        placeholder="Contraseña"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
                      />
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isAuthLoading}
                          className="flex-1 py-1.5 rounded-lg bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          {isAuthLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCloudSignUp}
                          disabled={isAuthLoading}
                          className="flex-1 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--paper)] text-[var(--ink)] text-xs font-bold border border-[var(--border)] cursor-pointer"
                        >
                          Registrarse
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAuthForm(false)}
                          className="px-2 text-xs text-[var(--muted)] hover:text-[var(--ink)]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-[var(--muted)] space-y-1">
              <p>
                Para activar la nube en Vercel, agrega estas variables en <strong>Settings &gt; Environment Variables</strong>:
              </p>
              <code className="text-[10px] block p-2 rounded bg-[var(--surface)] border border-[var(--border)] font-mono text-[#3b3abf] dark:text-[#a0a0ff]">
                NEXT_PUBLIC_SUPABASE_URL<br />
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>
            </div>
          )}
        </div>

        {/* Modo Vista Normal o Edición */}
        {!isEditing && !isNewUser ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold block">
                  Universidad
                </span>
                <span className="font-bold text-[var(--ink)] mt-0.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
                  {profile.university}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold block">
                  Programa Académico
                </span>
                <span className="font-bold text-[var(--ink)] mt-0.5 truncate block" title={profile.program}>
                  {profile.program}
                </span>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold block">
                  Correo Institucional
                </span>
                <span className="font-mono text-xs text-[#3b3abf] dark:text-[#a0a0ff] font-semibold mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {profile.email || `${profile.studentCode.toLowerCase()}@u.icesi.edu.co`}
                </span>
              </div>
            </div>

            {/* Selector de perfiles si existen más de uno */}
            {allProfiles.length > 1 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-[var(--ink)] block mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
                  Cambiar de Perfil Almacenado
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {allProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSwitchProfile(p.id)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-all cursor-pointer ${
                        p.id === profile.id
                          ? 'bg-[#f0f0ff] dark:bg-[#181a38] border-[#3b3abf] font-bold text-[#1e1e8a] dark:text-[#a0a0ff]'
                          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <div>
                        <span>{p.name}</span>
                        <span className="text-[10px] font-mono ml-2 opacity-75">({p.studentCode})</span>
                      </div>
                      {p.id === profile.id && <Check className="w-4 h-4 text-[#3b3abf] dark:text-[#a0a0ff]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2 rounded-xl bg-[#f0f0ff] dark:bg-[#1c1e38] hover:bg-[#e8e8ff] dark:hover:bg-[#25284a] text-[#3b3abf] dark:text-[#a0a0ff] text-xs font-bold border border-[#c5c5ff] dark:border-[#333760] transition-all cursor-pointer"
              >
                Editar Información
              </button>
              <button
                onClick={() => {
                  setIsNewUser(true);
                  setName('');
                  setStudentCode('');
                  setProgram('Facultad de Ingeniería y Ciencias Aplicadas');
                  setEmail('');
                }}
                className="flex-1 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--paper)] text-[var(--ink)] text-xs font-bold border border-[var(--border)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#3b3abf] dark:text-[#a0a0ff]" />
                <span>Nuevo Estudiante</span>
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de Registro / Edición */
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Luis Felipe Rodríguez"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  Código de Estudiante
                </label>
                <input
                  type="text"
                  required
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="Ej: A00414805"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  Semestre Actual
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={semesterNumber}
                  onChange={(e) => setSemesterNumber(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                Programa / Carrera
              </label>
              <input
                type="text"
                required
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                placeholder="Ej: IND - Ingeniería Industrial"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                Correo Institucional Icesi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej: luis.rodriguez@u.icesi.edu.co"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[#3b3abf]"
              />
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setIsNewUser(false);
                }}
                className="flex-1 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--paper)] text-[var(--muted)] text-xs font-bold border border-[var(--border)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-[#3b3abf] hover:bg-[#2828a8] text-white text-xs font-bold shadow-md shadow-[#3b3abf]/20 cursor-pointer"
              >
                {savedSuccess ? '¡Guardado!' : isNewUser ? 'Crear Perfil' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
