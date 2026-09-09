import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { MobileNav } from '@/components/layout/MobileNav';
import { QuickScheduleImporterModal } from '@/components/importer/QuickScheduleImporterModal';
import { AddTaskModal } from '@/components/modals/AddTaskModal';
import { AddExamModal } from '@/components/modals/AddExamModal';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { FocusCompletionModal } from '@/components/dashboard/FocusCompletionModal';
import { EditClassModal } from '@/components/modals/EditClassModal';
import { AttendanceModal } from '@/components/modals/AttendanceModal';
import { AddRoutineModal } from '@/components/modals/AddRoutineModal';

export const viewport: Viewport = {
  themeColor: '#16164f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Mi Semestre | Sistema Operativo Personal del Semestre',
  description:
    'Tu centro de control académico inteligente: horario visual interactivo, disponibilidad real en huecos libres, radar de riesgo académico y auto-organización.',
  applicationName: 'Mi Semestre',
  authors: [{ name: 'Luis Felipe Rodríguez' }],
  generator: 'Next.js',
  keywords: [
    'horario universitario',
    'organizador semestral',
    'estudio universitario',
    'radar de riesgo académico',
    'icesi',
    'disponibilidad de tiempo',
    'pomodoro',
  ],
  creator: 'Luis Felipe Rodríguez',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Mi Semestre — Sistema Operativo Personal del Semestre',
    description:
      'No es solo un horario. Es el mapa inteligente de tu tiempo, entregas, parciales y progreso académico en tiempo real.',
    siteName: 'Mi Semestre',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mi Semestre — Sistema Operativo Personal del Semestre',
    description:
      'Horario interactivo, cálculo de disponibilidad real en huecos y radar de salud académica.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('misemestre-theme');
                  var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex bg-[var(--paper)] text-[var(--ink)] antialiased selection:bg-[#c5c5ff] selection:text-[#1a1a5e]">
        {/* Sidebar institucional para pantallas medianas y grandes */}
        <Sidebar />

        {/* Área de contenido principal */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <TopHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Barra de navegación inferior móvil */}
        <MobileNav />

        {/* Modales globales de la aplicación */}
        <QuickScheduleImporterModal />
        <AddTaskModal />
        <AddExamModal />
        <ProfileModal />
        <FocusCompletionModal />
        <EditClassModal />
        <AttendanceModal />
        <AddRoutineModal />
      </body>
    </html>
  );
}
