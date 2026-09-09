'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { profileRepository, semesterRepository } from '@/lib/storage';
import { Profile } from '@/types';
import { defaultProfile } from '@/lib/mockData';
import {
  X,
  User,
  ShieldCheck,
  GraduationCap,
  Building,
  Mail,
  UserPlus,
  Users,
  Check,
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

  useEffect(() => {
    if (isProfileOpen) {
      loadProfileData();
    }
  }, [isProfileOpen]);

  const loadProfileData = async () => {
    const current = (await profileRepository.getActiveProfile()) || defaultProfile;
    const list = await profileRepository.getAll();
    setProfile(current);
    setAllProfiles(list);
    setName(current.name);
    setStudentCode(current.studentCode);
    setProgram(current.program);
    setSemesterNumber(current.semesterNumber);
    setEmail(current.email || '');
  };

  const handleSwitchProfile = async (id: string) => {
    await profileRepository.setActiveProfile(id);
    await loadProfileData();
    onProfileUpdated?.();
    window.location.reload();
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

    setSavedSuccess(true);
    setIsEditing(false);
    setIsNewUser(false);
    await loadProfileData();
    onProfileUpdated?.();

    setTimeout(() => {
      setSavedSuccess(false);
    }, 1500);
  };

  if (!isProfileOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative overflow-hidden transition-colors">
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
                Base de datos local y sincronización por usuario
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

        {/* Estado activo de sesión */}
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
              ESTUDIANTE ACTIVO
            </span>
            <span className="text-[10px] text-[var(--muted)] font-mono">
              Semestre {profile.semesterNumber}
            </span>
          </div>
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
