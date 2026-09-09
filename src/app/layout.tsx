import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { QuickScheduleImporterModal } from '@/components/importer/QuickScheduleImporterModal';
import { AddTaskModal } from '@/components/modals/AddTaskModal';
import { AddExamModal } from '@/components/modals/AddExamModal';

export const metadata: Metadata = {
  title: 'Mi Semestre | Sistema Operativo Personal del Semestre',
  description:
    'Tu centro de control académico inteligente: horario visual, disponibilidad real, radar de riesgo y auto-organización.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex bg-[#f5f5ff] text-[#0d0d14] antialiased selection:bg-[#c5c5ff] selection:text-[#1a1a5e]">
        {/* Sidebar institucional estilo CAMBAS+ */}
        <Sidebar />

        {/* Área de contenido principal */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <TopHeader />
          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Modales globales */}
        <QuickScheduleImporterModal />
        <AddTaskModal />
        <AddExamModal />
      </body>
    </html>
  );
}
