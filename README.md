# Mi Semestre — Sistema Operativo Personal del Semestre

> **Tesis de producto:** No es otro horario universitario. Es el centro de decisión en tiempo real que ayuda al estudiante a responder: **«¿Qué hago ahora con el tiempo disponible que tengo?»**.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Dexie.js](https://img.shields.io/badge/Storage-Local--First_(Dexie/IndexedDB)-00A86B?style=flat-square)](https://dexie.org/)
[![Design System](https://img.shields.io/badge/Design_System-CAMBAS+_Icesi-1e1e8a?style=flat-square)](https://www.icesi.edu.co/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 1. El Problema Real del Estudiante Universitario

Un estudiante común tiene la información de su semestre dispersa en múltiples plataformas:
* **Horario de clases:** Sistema de registro universitario (Banner / Portal).
* **Entregas y tareas:** Moodle, Canvas, Teams, Google Classroom.
* **Fechas de exámenes:** Sílabos en PDF, correos o grupos de WhatsApp.
* **Notas y progreso:** Sistema académico oficial.
* **Tiempo libre real:** **Nadie lo calcula.**

El problema diario no es *«¿A qué hora tengo clase?»*, sino:

```text
«Tengo 5 materias, parciales en 4 días, 3 talleres pendientes y 1h 40m de hueco en el campus.
¿Me alcanza el tiempo? ¿Qué debería priorizar ahora mismo para no colapsar?»
```

**Mi Semestre** conecta el horario con la carga académica, calcula la disponibilidad neta y genera recomendaciones determinísticas y explicables.

---

## 2. Flujo Completo de Decisión (Loop Central)

El ciclo de uso está diseñado para validar hábitos de organización reales antes de introducir capas complejas de inteligencia artificial:

```text
    ┌───────────────────────────┐
    │     Importar Horario      │ (Manual o parser Icesi)
    └─────────────┬─────────────┘
                  ▼
    ┌───────────────────────────┐
    │    Configurar Semestre    │ (16 semanas, fechas de corte)
    └─────────────┬─────────────┘
                  ▼
    ┌───────────────────────────┐
    │  Agregar Tareas/Parciales │ (Ponderación %, tiempo estimado)
    └─────────────┬─────────────┘
                  ▼
    ┌───────────────────────────┐
    │ Motor Académico Calcula:  │
    │  • Disponibilidad neta    │
    │  • Presión de entregas    │
    │  • Radar de riesgo        │
    └─────────────┬─────────────┘
                  ▼
    ┌───────────────────────────┐
    │     ¿QUÉ HAGO AHORA?      │ (Recomendación contextual en vivo)
    └─────────────┬─────────────┘
                  ▼
    ┌───────────────────────────┐
    │     Comenzar Enfoque      │ (Temporizador de estudio / Pomodoro)
    └─────────────┬─────────────┘
                  ▼
    ┌───────────────────────────┐
    │    Registrar Resultado    │ (Completada 100% | Parcial | Estudio libre)
    └───────────────────────────┘
```

---

## 3. Modelo de Disponibilidad Real (3 Niveles de Fricción)

Un hueco de **1h 40m** entre dos clases no representa **1h 40m** de estudio efectivo. El motor calcula tres capas de disponibilidad para evitar recomendaciones irreales:

```text
[1] TIEMPO LIBRE BRUTO
    └── Espacio entre el fin de una clase y el inicio de la siguiente (ej. 1h 40m = 100 min).

[2] TIEMPO UTILIZABLE (Fricción descontada)
    ├── Desplazamiento entre edificios/salones: -15 min
    ├── Preparación, setup mental y materiales: -10 min
    └── Tiempo útil real: 1h 15m (75 min).

[3] BLOQUE RECOMENDADO DE ENFOQUE
    └── Sesión de estudio sugerida: 45 a 50 min (técnica Pomodoro adaptativa).
        Deja un margen de descanso de 10 min para llegar puntual a la siguiente clase.
```

---

## 4. Radar de Riesgo Explicable

A diferencia de sistemas opacos que muestran alertas sin fundamento, el Radar de Mi Semestre presenta **señales cuantitativas y causalidad directa**:

### Ejemplo de tarjeta de riesgo:
```text
┌─────────────────────────────────────────────────────────────┐
│  [CRÍTICO]                        Presión: 85/100           │
│  Matemáticas Aplicadas III                                  │
├─────────────────────────────────────────────────────────────┤
│  Parcial: 4 días        │  Pendientes: 3 tareas             │
│  Carga: 4h 30m          │  Disponible: 2h 00m               │
│  Asistencia: 90%        │  Margen: 1 falta permitida        │
├─────────────────────────────────────────────────────────────┤
│  ¿Por qué este cálculo?                                     │
│  • La carga estimada (4h 30m) supera el tiempo útil         │
│    disponible proyectado (2h 00m) antes del próximo examen. │
│  • Te queda solo 1 falta disponible antes de perder la      │
│    materia por inasistencia.                                │
└─────────────────────────────────────────────────────────────┘
```

> **Regla de IA posterior:** La IA no inventará decisiones académicas; se convertirá en una capa de lenguaje natural que traduzca el estado del motor a explicaciones humanas claras.

---

## 5. Arquitectura del Sistema

El proyecto sigue una arquitectura desacoplada y orientada a **Local-First**:

```text
src/
├── app/                        # Next.js App Router (Páginas y layouts)
│   ├── balance/page.tsx        # Balance Académico Oficial Icesi (GPA 4.3, 28 aprobadas)
│   ├── dashboard/page.tsx      # Centro de Decisión "¿Qué hago ahora?"
│   ├── schedule/page.tsx       # Horario inteligente con detección de huecos
│   ├── radar/page.tsx          # Radar de riesgo explicable por materia
│   ├── timeline/page.tsx       # Línea de 16 semanas y cortes semestrales
│   └── layout.tsx              # Shell institucional con modales globales y SEO
├── components/                 # Componentes de UI
│   ├── common/ThemeToggle.tsx  # Conmutador de tema (Claro / Oscuro / Sistema)
│   ├── dashboard/              # Tarjeta "Ahora", FocusCompletionModal
│   ├── layout/                 # TopHeader, Sidebar institucional, MobileNav
│   ├── profile/ProfileModal.tsx# Gestión multi-perfil y autenticación local
│   ├── radar/RiskCard.tsx      # Tarjeta explicable de señales de riesgo
│   └── schedule/               # Horario interactivo semanal
├── lib/
│   ├── academic-engine/        # MOTOR ACADÉMICO PURO (TypeScript determinístico)
│   │   ├── schedule/           # calculateFreeSlots, getCurrentBlock, detectConflicts
│   │   ├── risk/               # calculateRisk con señales y justificación
│   │   └── semester/           # semesterProgress (semana 1 a 16)
│   ├── storage/                # CAPA LOCAL-FIRST
│   │   ├── database.ts         # Esquema Dexie.js (IndexedDB)
│   │   └── repositories/       # Profile, Subject, Assignment, Exam, StudySession
│   └── mockData.ts             # Datos reales semestrales precargados
├── stores/
│   └── uiStore.ts              # Estado UI global con Zustand (Focus Session)
└── tests/
    └── academic-engine/        # Suite de pruebas unitarias del motor
```

### Principios clave:
1. **Motor Académico Aislado:** Funciones puras sin dependencias de React, Next.js ni Supabase. 100% testeable en aislamiento.
2. **Local-First & Multi-Perfil:** Toda la información vive en el navegador del estudiante vía IndexedDB (Dexie). Permite conmutar perfiles de distintos estudiantes de forma instantánea.
3. **Cero Emojis:** Identidad visual sobria e institucional (`CRÍTICO`, `ATENCIÓN`, `ESTABLE`, `EN CLASE`, `TIEMPO DISPONIBLE`) con iconografía técnica de Lucide.
4. **CAMBAS+ Design System:** Paleta inspirada en la plataforma académica de la Universidad Icesi, con soporte completo para **Modo Claro** y **Modo Oscuro (Obsidian/Navy)**.

---

## 6. Instalación y Puesta en Marcha

### Prerrequisitos
* Node.js 20 o superior
* npm o pnpm

### Pasos

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/luisrodriguez-rgb/Mi-Semestre.git
   cd Mi-Semestre
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) (o el puerto configurado) en tu navegador.

4. Ejecutar la suite de pruebas del motor académico:
   ```bash
   npm test
   ```

5. Construir la versión de producción:
   ```bash
   npm run build
   ```

---

## 7. Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el entorno de desarrollo local con Webpack. |
| `npm test` | Ejecuta la suite de pruebas unitarias del Motor Académico. |
| `npm run build` | Compila y optimiza la aplicación para producción. |
| `npm run start` | Inicia el servidor optimizado de producción. |
| `npm run lint` | Valida buenas prácticas y consistencia en el código. |

---

## 8. Hoja de Ruta (Roadmap)

- [x] Motor Académico determinístico puro (Free slots, conflictos, bloque actual, riesgo causal).
- [x] Tarjeta en tiempo real «¿Qué hago ahora?» con simulador de horas para validación.
- [x] Persistencia Local-First con Dexie.js (IndexedDB) y soporte multi-perfil.
- [x] Flujo cerrado de enfoque: `Comenzar enfoque` → `Temporizador` → `Registrar resultado`.
- [x] Integración de Balance Académico real con notas, GPA 4.3 y malla de Ingeniería Industrial.
- [x] Modo Oscuro institucional CAMBAS+ con persistencia en `localStorage` y cero parpadeo (FOUC).
- [x] Navegación móvil optimizada (Mobile bottom bar, responsive schedule tabs).
- [ ] Validación cualitativa semanal con estudiantes activos.
- [ ] Capa de IA generativa para explicaciones en lenguaje natural sobre las decisiones del motor.
- [ ] Sincronización en la nube opcional con Supabase PostgreSQL y Row Level Security (RLS).

---

## Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
