'use client';

import Image from 'next/image';
import { useSemesterData } from '@/hooks/useSemesterData';

interface CampusWelcomeBannerProps {
  studentName?: string;
}

export function CampusWelcomeBanner({ studentName }: CampusWelcomeBannerProps) {
  const { profile } = useSemesterData();

  // Tomar solo el primer nombre para evitar desbordes visuales
  const rawName = studentName || profile?.name || 'Luis';
  const firstName = rawName.trim().split(' ')[0] || 'Luis';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0b102b] text-white border border-[#1c224b] shadow-xs min-h-[96px] flex items-center">
      {/* Texto de bienvenida en el lado izquierdo */}
      <div className="relative z-10 p-5 sm:p-6 max-w-sm sm:max-w-md lg:max-w-lg">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
          ¡Buenas tardes, {firstName}!
        </h1>
        <p className="text-xs sm:text-[13px] text-[#cbd5e1] mt-1 leading-relaxed font-normal">
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
