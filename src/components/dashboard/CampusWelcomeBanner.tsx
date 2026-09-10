'use client';

import Image from 'next/image';
import { useSemesterData } from '@/hooks/useSemesterData';

interface CampusWelcomeBannerProps {
  studentName?: string;
}

export function CampusWelcomeBanner({ studentName }: CampusWelcomeBannerProps) {
  const { profile } = useSemesterData();

  const displayName =
    studentName ||
    profile?.name?.split(' ')[0] ||
    'Diego';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0b102b] text-white border border-[#1c224b] shadow-sm min-h-[110px] flex items-center">
      {/* Texto de bienvenida en el lado izquierdo */}
      <div className="relative z-10 p-6 max-w-xl">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          ¡Buenas tardes, {displayName}!
        </h1>
        <p className="text-xs sm:text-sm text-[#cbd5e1] mt-1.5 leading-relaxed font-normal">
          Tu centro de control académico. Consulta tu horario en tiempo real, detecta tus huecos
          disponibles y toma decisiones claras sobre qué estudiar hoy.
        </p>
      </div>

      {/* Foto del campus universitario en el lado derecho con máscara suave */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-[48%] pointer-events-none select-none overflow-hidden">
        {/* Degradado para fundir la imagen suavemente con el fondo oscuro */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0b102b] via-[#0b102b]/60 to-transparent" />
        <img
          src="/campus_icesi.webp"
          alt="Campus Universitario Icesi"
          className="w-full h-full object-cover object-center opacity-85"
        />
      </div>
    </div>
  );
}
