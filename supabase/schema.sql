-- ═════════════════════════════════════════════════════════════
-- MI SEMESTRE: Esquema Relacional PostgreSQL + RLS (Supabase)
-- ═════════════════════════════════════════════════════════════

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    university TEXT DEFAULT 'Universidad Icesi',
    program TEXT,
    semester_number INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id);

-- 3. SEMESTRES
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    total_weeks INTEGER DEFAULT 16,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own semesters"
    ON public.semesters FOR ALL
    USING (auth.uid() = user_id);

-- 4. MATERIAS (SUBJECTS)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    professor TEXT,
    credits INTEGER DEFAULT 3,
    color TEXT DEFAULT '#3b3abf',
    max_absences INTEGER DEFAULT 4,
    passing_grade NUMERIC(3, 1) DEFAULT 3.0,
    current_grade NUMERIC(3, 1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own subjects"
    ON public.subjects FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.semesters
            WHERE public.semesters.id = public.subjects.semester_id
            AND public.semesters.user_id = auth.uid()
        )
    );

-- 5. BLOQUES DE HORARIO SEMANAL (SCHEDULE BLOCKS)
CREATE TABLE IF NOT EXISTS public.schedule_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = Lun, 7 = Dom
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own schedule blocks"
    ON public.schedule_blocks FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.subjects
            JOIN public.semesters ON public.semesters.id = public.subjects.semester_id
            WHERE public.subjects.id = public.schedule_blocks.subject_id
            AND public.semesters.user_id = auth.uid()
        )
    );

-- 6. TAREAS Y ENTREGAS (ASSIGNMENTS)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    estimated_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own assignments"
    ON public.assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.subjects
            JOIN public.semesters ON public.semesters.id = public.subjects.semester_id
            WHERE public.subjects.id = public.assignments.subject_id
            AND public.semesters.user_id = auth.uid()
        )
    );

-- 7. EXÁMENES Y PARCIALES (EXAMS)
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    weight NUMERIC(4, 1) DEFAULT 25.0,
    topics TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own exams"
    ON public.exams FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.subjects
            JOIN public.semesters ON public.semesters.id = public.subjects.semester_id
            WHERE public.subjects.id = public.exams.subject_id
            AND public.semesters.user_id = auth.uid()
        )
    );

-- 8. ASISTENCIA (ATTENDANCE)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'excused')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own attendance"
    ON public.attendance FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.subjects
            JOIN public.semesters ON public.semesters.id = public.subjects.semester_id
            WHERE public.subjects.id = public.attendance.subject_id
            AND public.semesters.user_id = auth.uid()
        )
    );

-- 9. RUTINAS FIJAS (ROUTINES)
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own routines"
    ON public.routines FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 10. ÍNDICES DE RENDIMIENTO Y OPTIMIZACIÓN RLS
CREATE INDEX IF NOT EXISTS idx_semesters_user ON public.semesters(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON public.subjects(semester_id);
CREATE INDEX IF NOT EXISTS idx_schedule_subject ON public.schedule_blocks(subject_id);
CREATE INDEX IF NOT EXISTS idx_schedule_day ON public.schedule_blocks(day_of_week);
CREATE INDEX IF NOT EXISTS idx_assignments_subject ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due ON public.assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON public.exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_date ON public.exams(date);
CREATE INDEX IF NOT EXISTS idx_attendance_subject ON public.attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_routines_user ON public.routines(user_id);
