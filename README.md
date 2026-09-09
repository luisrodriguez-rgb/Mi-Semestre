# Mi Semestre — Sistema Operativo Personal del Semestre

> **Tesis de producto:** No es otro horario universitario. Es el centro de decisión académica en tiempo real que ayuda al estudiante a responder en todo momento: **«¿Qué hago ahora con el tiempo disponible que tengo?»**.

[![Next.js 16](https://img.shields.io/badge/Next.js-16_(App_Router)-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Dexie.js](https://img.shields.io/badge/Storage-Local--First_(Dexie/IndexedDB)-00A86B?style=flat-square)](https://dexie.org/)
[![Design System](https://img.shields.io/badge/Design_System-CAMBAS+_Icesi-1e1e8a?style=flat-square)](https://www.icesi.edu.co/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 1. El Problema Real del Estudiante Universitario

Un estudiante común tiene la información de su semestre dispersa en múltiples plataformas desconectadas:
* **Horario de clases:** Sistema de registro universitario (Banner / Portal Estudiantes).
* **Entregas y tareas:** Moodle, Canvas, Teams, Google Classroom.
* **Fechas de exámenes:** Sílabos en PDF, correos o grupos de WhatsApp.
* **Notas y progreso:** Sistema académico oficial (Jasper / SIAG).
* **Tiempo libre real:** **Nadie lo calcula.**

El dilema cotidiano de un universitario no es *«¿A qué hora tengo clase?»*, sino:

```text
«Tengo 5 materias, parciales en 4 días, 3 talleres pendientes y un hueco de 1h 40m en el campus.
¿Me alcanza el tiempo? ¿Qué debería priorizar ahora mismo para no colapsar el fin de semana?»
```

**Mi Semestre** conecta el horario con la carga académica, descuenta tiempos de traslado y preparación física, y genera recomendaciones de acción determinísticas y explicables.

---

## 2. Flujo Completo de Decisión (Loop Central)

El ciclo de uso está diseñado para validar hábitos de organización reales y resolver la fricción inicial desde el primer segundo:

```text
               ┌─────────────────────────────────────────┐
               │    CONFIGURAR SEMESTRE (ONBOARDING)     │
               ├─────────────────────────────────────────┤
               │ • Asistente IA (Imagen de horario /     │
               │   Balance oficial Jasper de Icesi)      │
               │ • Plantillas oficiales (1 clic)         │
               │ • Crear desde cero (Wizard guiado)      │
               └────────────────────┬────────────────────┘
                                    ▼
               ┌─────────────────────────────────────────┐
               │   HORARIO INTERACTIVO & RUTINAS FIJAS   │
               ├─────────────────────────────────────────┤
               │ • Edición completa de materias y aulas  │
               │ • Rutinas de almuerzo, gimnasio y viaje │
               │ • Control de asistencias e inasistencias│
               └────────────────────┬────────────────────┘
                                    ▼
               ┌─────────────────────────────────────────┐
               │         MOTOR ACADÉMICO EN VIVO         │
               ├─────────────────────────────────────────┤
               │ • Disponibilidad neta (3 niveles)       │
               │ • Presión de entregas y exámenes        │
               │ • Radar de riesgo causal y explicable   │
               └────────────────────┬────────────────────┘
                                    ▼
               ┌─────────────────────────────────────────┐
               │            ¿QUÉ HAGO AHORA?             │
               ├─────────────────────────────────────────┤
               │ • Recomendación prioritaria inteligente │
               │ • Próximo parcial crítico               │
               │ • Estado de tiempo en vivo              │
               └────────────────────┬────────────────────┘
                                    ▼
               ┌─────────────────────────────────────────┐
               │     SESIÓN DE ENFOQUE (POMODORO)        │
               ├─────────────────────────────────────────┤
               │ • Temporizador adaptable a la franja    │
               │ • Registro de avance (100% | Parcial)   │
               └─────────────────────────────────────────┘
```

---

## 3. Funcionalidades Destacadas

### 3.1. Asistente de Configuración Inicial (Onboarding Inteligente)
Reduce la fricción de entrada a cero a través de tres vías:
1. **Asistente IA (Imagen o Balance Oficial):**
   * **Balance Jasper / Banner de Icesi:** Detecta automáticamente estudiante (`Luis Ernesto Rodríguez Gurrute`), código (`A00414805`), promedio (`4.3`), programa (`Ingeniería Industrial`), cohorte (`202510`) y materias activas (`CFT 11373`, `CFT 11370`, `IND 05359`, `CFT 11356`, `IND 05358`) generando la malla horaria y aulas.
   * **Capturas de Horario (Imágenes):** Admite arrastrar fotos o capturas de pantalla (`.png`, `.jpg`, `.webp`) procesadas en canvas local.
   * **Texto libre de Horarios:** Parsea tablas o mensajes pegados de Canvas, Teams o WhatsApp.
   * **Previsualización interactiva:** Pantalla de revisión y edición antes de guardar en IndexedDB.
2. **Catálogo de Plantillas Oficiales de Universidad Icesi:**
   * **Ingeniería Industrial · Semestre 4:** Con datos oficiales, promedio 4.3, 5 materias, parciales calibrados y rutinas fijas.
   * **Ingeniería de Sistemas · Semestre 5:** Cálculo Multivariado, Física Mecánica, Estructuras de Datos, Álgebra Lineal e Inglés Técnico.
   * **Administración de Empresas · Semestre 3:** Contabilidad Financiera, Microeconomía, Mercadeo y Estrategia.
   * **Medicina · Semestre 2:** Anatomía Humana, Bioquímica Médica e Histología con laboratorios.
3. **Creación Desde Cero:**
   * Flujo guiado en 3 pasos: perfil del estudiante, alta de materias y asignación de horarios semanales.

### 3.2. Edición Completa del Horario y Bloques Semanales
* Modificación instantánea de nombre, código, profesor, color distintivo (paleta Cambas+), límite de inasistencias permitidas, día de la semana, rango de horas y salón físico.
* Cada bloque horario en la rejilla semanal es interactivo, permitiendo editarlo con un solo toque o eliminarlo.

### 3.3. Control de Asistencias e Inasistencias
* Monitoreo en tiempo real de faltas registradas, porcentaje de asistencia acumulado y margen restante antes de perder la materia.
* Acciones de 1 clic: `+ Asistí`, `+ Falta` (con impacto inmediato en el Radar de Riesgo) y opción de corrección (`Deshacer`).

### 3.4. Rutinas y Tiempos Fijos (Fricción Real)
* Registro de compromisos fijos no académicos (almuerzo en campus, gimnasio, traslados en transporte, trabajo o descanso).
* Descuenta automáticamente estos tiempos para evitar recomendaciones en franjas ocupadas.

### 3.5. Modelo de Disponibilidad Real (3 Niveles de Fricción)
Un hueco de **1h 40m** entre dos clases no representa **1h 40m** de estudio efectivo:

```text
[1] TIEMPO LIBRE BRUTO
    └── Espacio total entre clases (ej. 1h 40m = 100 min).

[2] TIEMPO UTILIZABLE (Fricción descontada)
    ├── Desplazamiento entre edificios/salones: -15 min
    ├── Preparación, setup mental y materiales: -10 min
    └── Tiempo útil real: 1h 15m (75 min).

[3] BLOQUE RECOMENDADO DE ENFOQUE
    └── Sesión de estudio sugerida: 45 a 50 min (técnica Pomodoro adaptativa).
        Deja un margen de descanso de 10 min para llegar puntual a la siguiente clase.
```

### 3.6. Radar de Riesgo Explicable (Causalidad Directa)
No inventa decisiones académicas ni muestra alertas opacas:

```text
┌─────────────────────────────────────────────────────────────┐
│  [CRÍTICO]                        Presión: 85/100           │
│  Matemáticas Aplicadas III                                  │
├─────────────────────────────────────────────────────────────┤
│  Parcial: 4 días        │  Pendientes: 3 tareas             │
│  Carga: 4h 30m          │  Disponible: 2h 00m               │
│  Asistencia: 78%        │  Margen: 1 falta permitida        │
├─────────────────────────────────────────────────────────────┤
│  ¿Por qué este cálculo?                                     │
│  • La carga estimada (4h 30m) supera el tiempo útil         │
│    disponible proyectado (2h 00m) antes del próximo examen. │
│  • Te queda solo 1 inasistencia disponible antes de         │
│    perder la materia por fallas.                            │
└─────────────────────────────────────────────────────────────┘
```

### 3.7. Modo Oscuro Institucional de Alto Contraste
* Sistema de diseño CAMBAS+ con tokens optimizados bajo estándar WCAG AAA:
  * `--ink: #ffffff` (blanco puro para títulos y métricas).
  * `--muted: #94a3b8` (legibilidad garantizada sobre fondos `#0a0c16` y `#131627`).
* Cero parpadeo (FOUC) mediante script síncrono en `<head>`.
* Sidebar persistente (`h-screen sticky top-0 overflow-y-auto`) con datos de perfil en vivo.

---

## 4. Arquitectura del Proyecto

El sistema está construido bajo una arquitectura modular y desacoplada **Local-First**:

```text
src/
├── app/                                 # Next.js App Router
│   ├── balance/page.tsx                 # Balance Académico Oficial Icesi (GPA, materias aprobadas/pendientes)
│   ├── dashboard/page.tsx               # Centro de Decisión "¿Qué hago ahora?"
│   ├── schedule/page.tsx                # Horario inteligente y detección de huecos
│   ├── radar/page.tsx                   # Radar de riesgo explicable por materia
│   ├── timeline/page.tsx                # Línea de 16 semanas y cortes semestrales
│   ├── globals.css                      # Design Tokens CAMBAS+ (Modo Claro & Oscuro)
│   └── layout.tsx                       # Shell institucional con modales globales y SEO
│
├── components/                          # Componentes React
│   ├── common/ThemeToggle.tsx           # Conmutador de tema institucional
│   ├── dashboard/                       # NowActionCard, FocusCompletionModal
│   ├── layout/                          # TopHeader, Sidebar (perfil fijo), MobileNav
│   ├── modals/                          # Modales de acción global
│   │   ├── SmartOnboardingModal.tsx     # Wizard con IA (Imagen/Balance), Plantillas y Desde Cero
│   │   ├── EditClassModal.tsx           # Edición exhaustiva de clases y bloques
│   │   ├── AttendanceModal.tsx          # Control de asistencias y faltas
│   │   ├── AddRoutineModal.tsx          # Gestión de rutinas y compromisos fijos
│   │   ├── AddTaskModal.tsx             # Nueva entrega con tiempo estimado
│   │   └── AddExamModal.tsx             # Nuevo examen con ponderación %
│   ├── profile/ProfileModal.tsx         # Gestión multi-perfil y exportación local
│   ├── radar/RiskCard.tsx               # Tarjeta explicable de señales de riesgo
│   └── schedule/SmartTimetable.tsx      # Rejilla semanal interactiva clicable
│
├── lib/
│   ├── academic-engine/                 # MOTOR ACADÉMICO PURO (TypeScript determinístico)
│   │   ├── schedule/                    # calculateFreeSlots, getCurrentBlock, detectConflicts
│   │   ├── risk/                        # calculateRisk con señales cuantitativas
│   │   └── semester/                    # semesterProgress (semanas 1 a 16)
│   │
│   ├── importer/                        # INGESTA INTELIGENTE & TEMPLATES
│   │   ├── smartAcademicIngester.ts     # Extractor IA de balances Jasper Icesi y horarios (imagen/texto)
│   │   └── templateLoader.ts            # Carga de plantillas oficiales y creación desde cero
│   │
│   ├── templates/
│   │   └── academicTemplates.ts         # Catálogo oficial (Industrial 4, Sistemas 5, Admon 3, Medicina 2)
│   │
│   ├── storage/                         # CAPA LOCAL-FIRST (Dexie.js / IndexedDB)
│   │   ├── database.ts                  # Esquema de tablas tipadas
│   │   └── repositories/                # Profile, Semester, Subject, Schedule, Routine, Attendance...
│   └── mockData.ts                      # Datos reales semestrales precargados
│
├── stores/
│   └── uiStore.ts                       # Estado UI global con Zustand (Focus Session, Onboarding, Modales)
│
└── tests/
    ├── academic-engine/engine.test.ts   # Pruebas unitarias del Motor Académico
    └── importer/smartIngester.test.ts   # Pruebas de extracción de balance y texto libre
```

---

## 5. Principios de Ingeniería

1. **Motor Académico Puro e Independiente:** Toda la lógica de negocio (`calculateFreeSlots`, `calculateRisk`, `detectConflicts`) son funciones puras sin dependencias de React, Next.js ni bases de datos. Son ejecutables en cualquier runtime (Node.js, edge workers, mobile).
2. **Local-First Absoluto:** Todo reside de manera privada y local en el navegador del estudiante en IndexedDB a través de Dexie.js. La aplicación funciona sin conexión y responde en $<16\text{ms}$.
3. **Cero Emojis:** Identidad visual sobria, profesional y universitaria (`CRÍTICO`, `ATENCIÓN`, `ESTABLE`, `EN CLASE`, `TIEMPO DISPONIBLE`) con iconografía vectorial técnica de Lucide.
4. **CAMBAS+ Design System:** Paleta HSL institucional inspirada en el portal de la Universidad Icesi, optimizada para entornos diurnos y de estudio nocturno prolongado.

---

## 6. Instalación y Puesta en Marcha

### Prerrequisitos
* **Node.js 20** o superior
* **npm** o **pnpm**

### Pasos de Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/luisrodriguez-rgb/Mi-Semestre.git
   cd Mi-Semestre
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el entorno de desarrollo local:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) (o el puerto asignado) en tu navegador.

4. Ejecutar la suite de pruebas del motor y del extractor inteligente:
   ```bash
   npm test
   npx tsx src/tests/importer/smartIngester.test.ts
   ```

5. Compilar la aplicación para producción:
   ```bash
   npm run build
   ```

---

## 7. Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el entorno de desarrollo local con Webpack. |
| `npm test` | Ejecuta la suite de pruebas unitarias del Motor Académico. |
| `npx tsx src/tests/importer/smartIngester.test.ts` | Valida el extractor inteligente de balances y horarios. |
| `npm run build` | Compila y optimiza la aplicación para producción (TypeScript & Static Routes). |
| `npm run start` | Inicia el servidor optimizado de producción. |
| `npm run lint` | Valida buenas prácticas y reglas del proyecto. |

---

## 8. Hoja de Ruta (Roadmap)

- [x] Motor Académico determinístico puro (Free slots, conflictos, bloque actual, riesgo causal).
- [x] Tarjeta en tiempo real «¿Qué hago ahora?» con cálculo de fricción real en 3 capas.
- [x] Persistencia Local-First con Dexie.js (IndexedDB) y soporte multi-perfil.
- [x] Flujo de enfoque Pomodoro adaptativo (`Comenzar enfoque` → `Temporizador` → `Registrar resultado`).
- [x] Balance Académico oficial con notas, GPA 4.3 y malla de materias cursadas/pendientes.
- [x] Modo Oscuro institucional CAMBAS+ con contraste optimizado WCAG AAA y cero FOUC.
- [x] Navegación móvil nativa (Mobile bottom bar, responsive schedule).
- [x] Edición completa de materias, profesores, colores, horarios y aulas en el horario semanal.
- [x] Control de asistencias e inasistencias con impacto directo en el Radar de Riesgo.
- [x] Gestión de rutinas fijas y compromisos diarios (almuerzo, gimnasio, traslados).
- [x] Asistente de Configuración Inicial (Onboarding) con soporte para:
  - [x] Parseo de Balance Académico oficial Jasper / Banner de Icesi.
  - [x] Subida y análisis de capturas de imagen de horarios.
  - [x] Catálogo de plantillas oficiales de programas académicos.
  - [x] Wizard guiado para crear el semestre desde cero.
- [ ] Sincronización en la nube opcional con Supabase PostgreSQL y Row Level Security (RLS).
- [ ] Exportación de horarios a formato iCalendar (`.ics`) para sincronizar con Google Calendar y Apple Calendar.

---

## Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
