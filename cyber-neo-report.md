# Cyber Neo Security & Technical Architecture Report

**Project:** Mi Semestre (Horario)  
**Path:** `/Users/leonfeliperodriguez/Desktop/Trabajos/Horario`  
**Date:** 2026-09-09  
**Tech Stack:** Next.js 16.3.4 (App Router), React 19.2.8, TypeScript 5, TailwindCSS v4, Dexie.js 4.4.5 (IndexedDB), Supabase JS 2.116.0 (PostgreSQL + RLS), Zustand 5.0.15  
**Scan Coverage:** 98.9% — 85 eligible source, configuration, and schema files scanned. (Skipped: binary icons, `.next/`, `node_modules/`, `.git/`).

---

## Executive Summary

**Cyber Neo Risk Score:** **9/100**  
**Overall Assessment:** **Low Risk**

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 0     |
| Medium   | 2     |
| Low      | 3     |
| Info     | 1     |

**Top 3 Priority Actions:**
1. **Configurar cabeceras de seguridad HTTP y `poweredByHeader: false` en `next.config.ts`** para mitigar clickjacking, MIME sniffing e inyección de recursos no autorizados.
2. **Ampliar el esquema Supabase y sus políticas RLS para `routines`, `grades` y `study_sessions`**, además de crear índices en `semesters(user_id)` para prevenir degradación de rendimiento en las consultas RLS.
3. **Optimizar la sincronización y la carga de datos**: corregir la asimetría de sincronización en `syncService.ts` (asistencia y rutinas) y sustituir el waterfall de 9 consultas en `useSemesterData.ts` por suscripciones reactivas (`useLiveQuery` o estado global Zustand).

---

## Findings

### Medium Findings

#### [CN-001] Missing HTTP Security Headers and Framework Fingerprinting
- **Severity:** Medium (CVSS 5.3)
- **CWE:** CWE-693 (Protection Mechanism Failure), CWE-200 (Exposure of Sensitive Information)
- **OWASP:** A02:2025 (Security Misconfiguration)
- **Location:** `next.config.ts:1-8`
- **Description:** La configuración de Next.js está vacía por defecto. No se configuran cabeceras esenciales como `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, ni `Referrer-Policy`. Adicionalmente, Next.js expone por defecto la cabecera `X-Powered-By: Next.js`, facilitando el fingerprinting del stack tecnológico.
- **Evidence:**
  ```typescript
  // next.config.ts
  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {
    /* config options here */
  };

  export default nextConfig;
  ```
- **Remediation:**
  ```typescript
  import type { NextConfig } from "next";

  const securityHeaders = [
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ];

  const nextConfig: NextConfig = {
    poweredByHeader: false,
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: securityHeaders,
        },
      ];
    },
  };

  export default nextConfig;
  ```
- **References:** [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/), [CWE-693](https://cwe.mitre.org/data/definitions/693.html)

---

#### [CN-002] Incomplete Cloud Schema & Missing RLS Protection for Routines and Study Sessions
- **Severity:** Medium (CVSS 6.5)
- **CWE:** CWE-284 (Improper Access Control), CWE-862 (Missing Authorization)
- **OWASP:** A01:2025 (Broken Access Control)
- **Location:** `supabase/schema.sql:1-165`
- **Description:** El esquema relacional en PostgreSQL (`supabase/schema.sql`) define tablas y RLS para `profiles`, `semesters`, `subjects`, `schedule_blocks`, `assignments`, `exams` y `attendance`. Sin embargo, la base de datos local (Dexie) maneja tablas para `routines`, `grades` y `study_sessions` que no existen en Supabase. Si estas tablas se crean ad-hoc en producción sin RLS explícito, los datos privados de rutinas y sesiones de estudio de los estudiantes quedarán desprotegidos.
- **Evidence:**
  ```sql
  -- supabase/schema.sql solo cubre 7 tablas:
  -- profiles, semesters, subjects, schedule_blocks, assignments, exams, attendance.
  -- Faltan tablas para routines, grades, study_sessions.
  ```
- **Remediation:**
  ```sql
  -- Agregar tabla y política RLS para rutinas fijas
  CREATE TABLE IF NOT EXISTS public.routines (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT DEFAULT '#64748b',
      created_at TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can CRUD own routines"
      ON public.routines FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  ```
- **References:** [Supabase RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security), [CWE-284](https://cwe.mitre.org/data/definitions/284.html)

---

### Low & Informational Findings

#### [CN-003] RLS Sequential Scan Degradation & Missing Foreign Key Indexes
- **Severity:** Low (CVSS 3.7)
- **CWE:** CWE-400 (Uncontrolled Resource Consumption)
- **OWASP:** A02:2025 (Security Misconfiguration)
- **Location:** `supabase/schema.sql:26-160`
- **Description:** Todas las políticas RLS de tablas secundarias (`subjects`, `schedule_blocks`, `assignments`, `exams`, `attendance`) ejecutan subconsultas que filtran por `semesters.user_id = auth.uid()`. La columna `public.semesters(user_id)` no tiene un índice, lo que obliga al motor PostgreSQL a realizar escaneos secuenciales en cada consulta evaluada por RLS a medida que crece el número de usuarios. Además, las llaves foráneas `subject_id` en las tablas secundarias carecen de índices.
- **Evidence:**
  ```sql
  -- Índices actuales en schema.sql:
  CREATE INDEX IF NOT EXISTS idx_subjects_semester ON public.subjects(semester_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_day ON public.schedule_blocks(day_of_week);
  CREATE INDEX IF NOT EXISTS idx_assignments_due ON public.assignments(due_date);
  CREATE INDEX IF NOT EXISTS idx_exams_date ON public.exams(date);
  -- FALTA: semesters(user_id) y subject_id en tablas dependientes.
  ```
- **Remediation:**
  ```sql
  CREATE INDEX IF NOT EXISTS idx_semesters_user ON public.semesters(user_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_subject ON public.schedule_blocks(subject_id);
  CREATE INDEX IF NOT EXISTS idx_assignments_subject ON public.assignments(subject_id);
  CREATE INDEX IF NOT EXISTS idx_exams_subject ON public.exams(subject_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_subject ON public.attendance(subject_id);
  ```

---

#### [CN-004] Over-Permissive Cloud Fetching & Synchronization Asymmetry
- **Severity:** Low (CVSS 3.5)
- **CWE:** CWE-200 (Exposure of Sensitive Information Through Data Queries), CWE-668 (Exposure of Resource to Wrong Sphere)
- **OWASP:** A01:2025 (Broken Access Control)
- **Location:** `src/lib/supabase/syncService.ts:267-315`
- **Description:** En la función `pullCloudToLocal()`, las consultas a `schedule_blocks`, `assignments` y `exams` se ejecutan mediante `.select('*')` sin filtrar por el `semester_id` activo. Si un usuario registra más de un semestre en la nube a lo largo del tiempo, la restauración local mezclará y sobrescribirá bloques de diferentes periodos. Adicionalmente, el servicio sincroniza `attendance` hacia la nube (`pushLocalToCloud`), pero no la descarga durante la restauración (`pullCloudToLocal`), causando pérdida silenciosa de registros de asistencia.
- **Remediation:**
  1. Filtrar las consultas de descarga explícitamente por los IDs de materias pertenecientes al semestre activo (`.in('subject_id', subjectIds)`).
  2. Implementar la restauración completa de la tabla `attendance` en `pullCloudToLocal`.
  3. Agregar soporte para respaldar y restaurar la tabla `routines`.

---

#### [CN-005] Unused Schema Validation Library (Zod) & Unvalidated Import Pipelines
- **Severity:** Low (CVSS 3.1)
- **CWE:** CWE-20 (Improper Input Validation)
- **OWASP:** A05:2025 (Injection) / A08:2025 (Data Integrity Failures)
- **Location:** `src/lib/importer/smartAcademicIngester.ts:1-484`
- **Description:** El paquete `zod` está instalado en `package.json` (`zod: ^4.5.4`), pero no se utiliza en ningún archivo del código fuente. La ingestión de texto no estructurado (Reportes Jasper de Icesi y texto libre) se realiza mediante expresiones regulares sin un validador de esquema de tipos estricto para las entidades que ingresan a IndexedDB y Supabase.
- **Remediation:** Definir esquemas Zod para la validación de `SubjectSchema`, `ScheduleBlockSchema` y `AcademicImportSchema` antes de persistir datos en Dexie o transmitirlos a Supabase.

---

#### [CN-006] Absence of Environment Variable Example Template (`.env.example`)
- **Severity:** Info (CVSS 0.0)
- **CWE:** CWE-1059 (Incomplete Documentation)
- **Location:** `.env.example`
- **Description:** El archivo `.env` se encuentra correctamente ignorado por Git y nunca ha sido commiteado al historial. No obstante, el repositorio carece de un archivo plantilla `.env.example`, lo que dificulta el despliegue ordenado y la verificación de dependencias de configuración en nuevos entornos de desarrollo o CI/CD.
- **Remediation:** Crear `.env.example` con variables documentadas:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
  ```

---

## Dependency Vulnerabilities (SCA)

| Package | Current | CVE | Severity | Fix Version |
|---------|---------|-----|----------|-------------|
| *None*  | -       | -   | 0 CVEs   | All 484 dependencies clean |

*Ejecutado `npm audit`: 0 vulnerabilidades (0 critical, 0 high, 0 moderate, 0 low).*

---

## Supply Chain & Lockfile Assessment
- **Lock file status:** `package-lock.json` presente, consistente con `package.json` (0 discrepancias detectadas por `check_lockfiles.py`).
- **Dependency pinning:** Dependencias de desarrollo y producción usan rangos semver (`^`), recomendándose fijar versiones clave en entornos de producción institucional.
- **CI/CD security:** No se detectó flujo de GitHub Actions (`.github/workflows/ci.yml`), por lo que las pruebas y el linter no se ejecutan automáticamente en pull requests.

---

## Scan Metadata
- **Scanner:** Cyber Neo Engine v0.1.0 + Native Static Analyzer
- **Duration:** 18s
- **External tools used:** `npm audit`, `scan_secrets.py`, `check_lockfiles.py`
- **Files scanned:** 85 archivos de código y configuración
- **Files skipped:** 8 archivos (binarios `.png`, `.webp`, `.ico`)
