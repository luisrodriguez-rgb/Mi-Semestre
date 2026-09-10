'use client';

import { useMemo } from 'react';
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

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '¡Buenos días';
    if (hour >= 12 && hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0b102b] text-white border border-[#1c224b] shadow-xs min-h-[104px] flex items-center">
      {/* Texto de bienvenida en el lado izquierdo con ancho seguro */}
      <div className="relative z-20 p-5 sm:p-6 max-w-[70%] sm:max-w-[65%] md:max-w-xl">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
          {greeting}, {firstName}!
        </h1>
        <p className="text-xs sm:text-[13px] text-[#cbd5e1] mt-1.5 leading-relaxed font-normal">
          Tu centro de control académico. Consulta tu horario en tiempo real, detecta tus huecos
          disponibles y toma decisiones claras sobre qué estudiar hoy.
        </p>
      </div>

      {/* Foto del campus universitario en el lado derecho con máscara suave y profunda */}
      <div className="absolute right-0 top-0 bottom-0 w-[40%] md:w-[45%] pointer-events-none select-none overflow-hidden">
        {/* Degradado profundo para fundir suavemente la foto con el fondo oscuro y proteger la lectura */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0b102b] via-[#0b102b]/80 to-[#0b102b]/10" />
        <div className="absolute inset-0 z-10 bg-radial from-transparent to-[#0b102b]/40" />
        <Image
          src="/campus_icesi.webp"
          alt="Campus Universitario Icesi"
          fill
          priority
          className="object-cover object-center opacity-70"
          sizes="(max-width: 768px) 40vw, 45vw"
        />
      </div>
    </div>
  );
}
