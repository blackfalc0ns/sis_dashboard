-- PostgreSQL starter schema for SIS Dashboard
-- Target: PostgreSQL 15+
--
-- Notes:
-- 1. Enum values use lower_snake_case.
-- 2. The schema is normalized; nested frontend response objects should be assembled in the API layer.
-- 3. `updated_at` columns are included, but update triggers are intentionally omitted for simplicity.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- =========================================================
-- Enum Types
-- =========================================================

CREATE TYPE user_admin_status AS ENUM ('active', 'invited', 'inactive');
CREATE TYPE audit_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'in_app');
CREATE TYPE integration_connection_status AS ENUM ('connected', 'disconnected', 'needs_attention');
CREATE TYPE backup_job_type AS ENUM ('backup', 'export', 'import', 'migration');
CREATE TYPE backup_job_status AS ENUM ('completed', 'running', 'failed');

CREATE TYPE lead_channel AS ENUM ('in_app', 'referral', 'walk_in', 'other');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'converted', 'closed');
CREATE TYPE admission_activity_type AS ENUM ('call', 'message', 'meeting', 'note', 'status_change');
CREATE TYPE application_source AS ENUM ('in_app', 'referral', 'walk_in', 'other');
CREATE TYPE application_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'test_scheduled',
    'interview_scheduled',
    'waitlisted',
    'accepted',
    'rejected'
);
CREATE TYPE decision_type AS ENUM ('accept', 'waitlist', 'reject');
CREATE TYPE application_test_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE application_interview_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE document_status AS ENUM ('complete', 'missing');

CREATE TYPE student_status AS ENUM ('active', 'suspended', 'withdrawn', 'graduated');
CREATE TYPE note_category AS ENUM ('academic', 'behavioral', 'medical', 'general');
CREATE TYPE note_visibility AS ENUM ('visible_to_guardian', 'internal');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'withdrawn');
CREATE TYPE enrollment_movement_action AS ENUM (
    'enrolled',
    'transferred_internal',
    'transferred_external',
    'withdrawn',
    'promoted',
    'reassigned_bulk'
);

CREATE TYPE entity_scope_type AS ENUM ('school', 'stage', 'grade', 'section', 'classroom');
CREATE TYPE room_type AS ENUM ('classroom', 'lab', 'other');
CREATE TYPE academic_event_type AS ENUM ('holiday', 'exam', 'activity', 'other');
CREATE TYPE timetable_config_scope AS ENUM ('term', 'grade', 'section', 'classroom');
CREATE TYPE timetable_slot_type AS ENUM ('class', 'break');
CREATE TYPE timetable_entry_status AS ENUM ('draft', 'published');
CREATE TYPE lesson_status AS ENUM ('planned', 'done');
CREATE TYPE attachment_type AS ENUM ('file', 'link');
CREATE TYPE video_type AS ENUM ('upload', 'link');
CREATE TYPE lesson_plan_item_status AS ENUM ('planned', 'in_progress', 'done', 'skipped');

CREATE TYPE attendance_mode AS ENUM ('daily', 'period');
CREATE TYPE daily_computation_strategy AS ENUM ('manual', 'derived_from_periods');
CREATE TYPE attendance_session_status AS ENUM ('draft', 'submitted');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused', 'early_leave', 'unmarked');
CREATE TYPE excuse_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE excuse_type AS ENUM ('absence', 'late', 'early_leave');

CREATE TYPE assessment_type AS ENUM (
    'quiz',
    'month_exam',
    'midterm',
    'term_exam',
    'assignment',
    'final',
    'practical'
);
CREATE TYPE assessment_delivery_mode AS ENUM ('score_only', 'question_based');
CREATE TYPE assessment_approval_status AS ENUM ('draft', 'published', 'approved');
CREATE TYPE grade_item_status AS ENUM ('entered', 'missing', 'absent');
CREATE TYPE assessment_question_type AS ENUM (
    'mcq_single',
    'mcq_multi',
    'true_false',
    'short_answer',
    'essay'
);
CREATE TYPE assessment_submission_status AS ENUM ('not_started', 'submitted', 'in_progress', 'corrected');
CREATE TYPE assessment_correction_status AS ENUM ('pending', 'corrected');
CREATE TYPE grade_rule_scope AS ENUM ('school', 'grade');

CREATE TYPE reinforcement_source AS ENUM ('teacher', 'parent', 'system');
CREATE TYPE reinforcement_status AS ENUM (
    'draft',
    'active',
    'in_progress',
    'under_review',
    'completed',
    'rejected',
    'archived'
);
CREATE TYPE reinforcement_proof_type AS ENUM ('image', 'video', 'document', 'none');
CREATE TYPE reinforcement_reward_type AS ENUM ('moral', 'financial', 'xp', 'badge');

-- =========================================================
-- Core / Settings
-- =========================================================

CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    school_name TEXT NOT NULL,
    short_name TEXT,
    timezone TEXT NOT NULL DEFAULT 'Africa/Cairo',
    address_line TEXT,
    formatted_address TEXT,
    city TEXT,
    country TEXT,
    footer_signature TEXT,
    logo_url TEXT,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    map_place_label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email CITEXT NOT NULL,
    password_hash TEXT,
    status user_admin_status NOT NULL DEFAULT 'invited',
    last_active_at TIMESTAMPTZ,
    invited_at TIMESTAMPTZ,
    last_invite_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, email)
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, name)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_key TEXT NOT NULL UNIQUE,
    module_key TEXT NOT NULL,
    action_key TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    uploaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    storage_provider TEXT NOT NULL,
    storage_bucket TEXT,
    storage_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT,
    checksum_sha256 TEXT,
    public_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name TEXT,
    action_label TEXT NOT NULL,
    module_key TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    severity audit_severity NOT NULL DEFAULT 'info',
    ip_address INET,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE school_policy_settings (
    school_id UUID PRIMARY KEY REFERENCES schools(id) ON DELETE CASCADE,
    attendance_mode attendance_mode NOT NULL DEFAULT 'daily',
    attendance_requires_reason BOOLEAN NOT NULL DEFAULT TRUE,
    late_threshold_minutes INTEGER NOT NULL DEFAULT 5,
    early_leave_threshold_minutes INTEGER NOT NULL DEFAULT 5,
    grade_pass_mark NUMERIC(5, 2) NOT NULL DEFAULT 50,
    allow_teacher_grade_override BOOLEAN NOT NULL DEFAULT FALSE,
    behavior_points_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    template_key TEXT NOT NULL,
    template_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'draft')),
    variables TEXT[] NOT NULL DEFAULT '{}',
    template_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    channel_states JSONB NOT NULL DEFAULT '{}'::JSONB,
    last_test_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, template_key)
);

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_key TEXT NOT NULL,
    channel notification_channel NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, event_key, channel)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
    channel notification_channel NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE integration_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_key TEXT NOT NULL UNIQUE,
    provider_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    field_schema JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE integration_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES integration_providers(id) ON DELETE CASCADE,
    status integration_connection_status NOT NULL DEFAULT 'disconnected',
    configuration_values JSONB NOT NULL DEFAULT '{}'::JSONB,
    health_note TEXT,
    last_checked_at TIMESTAMPTZ,
    last_test_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, provider_id)
);

CREATE TABLE security_settings (
    school_id UUID PRIMARY KEY REFERENCES schools(id) ON DELETE CASCADE,
    enforce_two_factor BOOLEAN NOT NULL DEFAULT FALSE,
    ip_allowlist_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ip_allowlist TEXT[] NOT NULL DEFAULT '{}',
    session_timeout_minutes INTEGER NOT NULL DEFAULT 60,
    suspicious_login_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    password_min_length INTEGER NOT NULL DEFAULT 8,
    password_rotation_days INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE backup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    job_type backup_job_type NOT NULL,
    status backup_job_status NOT NULL DEFAULT 'running',
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    file_name TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Admissions
-- =========================================================

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    lead_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email CITEXT,
    channel lead_channel NOT NULL DEFAULT 'other',
    status lead_status NOT NULL DEFAULT 'new',
    grade_interest TEXT,
    source_label TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type admission_activity_type NOT NULL,
    message TEXT NOT NULL,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lead_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by_name TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    application_code TEXT NOT NULL UNIQUE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    source application_source NOT NULL DEFAULT 'other',
    status application_status NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    full_name_ar TEXT NOT NULL,
    full_name_en TEXT,
    gender TEXT,
    date_of_birth DATE,
    nationality TEXT,
    address_line TEXT,
    city TEXT,
    district TEXT,
    student_phone TEXT,
    student_email CITEXT,
    grade_requested_label TEXT,
    stage_label TEXT,
    previous_school TEXT,
    join_date DATE,
    medical_conditions TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE application_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    relation_to_student TEXT NOT NULL,
    phone TEXT,
    alternate_phone TEXT,
    email CITEXT,
    national_id TEXT,
    job_title TEXT,
    workplace TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_emergency_contact BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    status document_status NOT NULL DEFAULT 'missing',
    uploaded_date DATE,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    file_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE application_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL,
    subject_label TEXT,
    scheduled_date DATE,
    scheduled_time TIME,
    duration_minutes INTEGER,
    location TEXT,
    proctor_name TEXT,
    proctor_phone TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    status application_test_status NOT NULL DEFAULT 'scheduled',
    score NUMERIC(6, 2),
    max_score NUMERIC(6, 2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE application_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    scheduled_date DATE,
    scheduled_time TIME,
    duration_minutes INTEGER,
    interviewer_name TEXT,
    interviewer_phone TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    location TEXT,
    status application_interview_status NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    rating NUMERIC(4, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE application_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
    decision decision_type NOT NULL,
    reason TEXT,
    decision_date DATE NOT NULL,
    decided_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    decided_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Academic Structure
-- =========================================================

CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date),
    UNIQUE (school_id, name)
);

CREATE TABLE terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date),
    UNIQUE (academic_year_id, name)
);

CREATE TABLE stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    name_ar TEXT,
    name_en TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (term_id, name_en)
);

CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    name_ar TEXT,
    name_en TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (term_id, stage_id, name_en)
);

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    name_ar TEXT,
    name_en TEXT NOT NULL,
    capacity INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (term_id, grade_id, name_en)
);

CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    name_ar TEXT,
    name_en TEXT NOT NULL,
    capacity INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (term_id, section_id, name_en)
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    name_ar TEXT,
    name_en TEXT NOT NULL,
    code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (term_id, name_en)
);

CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    email CITEXT,
    max_weekly_load INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE teacher_subjects (
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, subject_id)
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    room_kind room_type NOT NULL DEFAULT 'classroom',
    capacity INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Students / Guardians / Enrollment
-- =========================================================

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    application_id UUID UNIQUE REFERENCES applications(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    student_number TEXT NOT NULL,
    full_name_ar TEXT NOT NULL,
    full_name_en TEXT,
    gender TEXT,
    date_of_birth DATE,
    nationality TEXT,
    stage_label TEXT,
    grade_label TEXT,
    status student_status NOT NULL DEFAULT 'active',
    source application_source NOT NULL DEFAULT 'other',
    submitted_at TIMESTAMPTZ,
    student_phone TEXT,
    student_email CITEXT,
    address_line TEXT,
    city TEXT,
    district TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, student_number)
);

CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    alternate_phone TEXT,
    email CITEXT,
    national_id TEXT,
    job_title TEXT,
    workplace TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_guardians (
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
    relation_to_student TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_emergency_contact BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (student_id, guardian_id)
);

CREATE TABLE student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    status document_status NOT NULL DEFAULT 'missing',
    uploaded_date DATE,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_medical_profiles (
    student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    blood_type TEXT,
    allergies TEXT,
    notes TEXT,
    emergency_plan TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    note_date DATE NOT NULL,
    category note_category NOT NULL DEFAULT 'general',
    note_text TEXT NOT NULL,
    visibility note_visibility NOT NULL DEFAULT 'internal',
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    title TEXT NOT NULL,
    meta JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    grade_id UUID REFERENCES grades(id) ON DELETE SET NULL,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    enrollment_date DATE NOT NULL,
    status enrollment_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, academic_year_id)
);

CREATE TABLE enrollment_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    attendance_percentage NUMERIC(5, 2),
    grade_average NUMERIC(6, 2),
    risk_flags JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (enrollment_id, term_id)
);

CREATE TABLE enrollment_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES student_enrollments(id) ON DELETE SET NULL,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
    action enrollment_movement_action NOT NULL,
    from_grade_id UUID REFERENCES grades(id) ON DELETE SET NULL,
    to_grade_id UUID REFERENCES grades(id) ON DELETE SET NULL,
    from_section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    to_section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    from_classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    to_classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    effective_date DATE NOT NULL,
    reason TEXT,
    notes TEXT,
    source_request_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Academic Operations
-- =========================================================

CREATE TABLE subject_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    weekly_hours INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (term_id, grade_id, subject_id)
);

CREATE TABLE teacher_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE room_default_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    scope_type entity_scope_type NOT NULL,
    stage_id UUID REFERENCES stages(id) ON DELETE CASCADE,
    grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE academic_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    event_type academic_event_type NOT NULL DEFAULT 'other',
    all_day BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    scope_type entity_scope_type NOT NULL DEFAULT 'school',
    stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
    grade_id UUID REFERENCES grades(id) ON DELETE SET NULL,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    notes TEXT,
    notify BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

CREATE TABLE timetable_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    scope_type timetable_config_scope NOT NULL,
    grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE timetable_config_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_config_id UUID NOT NULL REFERENCES timetable_configs(id) ON DELETE CASCADE,
    day_key TEXT NOT NULL,
    display_index INTEGER NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (timetable_config_id, day_key)
);

CREATE TABLE timetable_config_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_config_id UUID NOT NULL REFERENCES timetable_configs(id) ON DELETE CASCADE,
    period_code TEXT NOT NULL,
    display_index INTEGER NOT NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE (timetable_config_id, period_code)
);

CREATE TABLE timetable_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    day_key TEXT NOT NULL,
    period_index INTEGER NOT NULL,
    slot_type timetable_slot_type NOT NULL DEFAULT 'class',
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    break_label_ar TEXT,
    break_label_en TEXT,
    status timetable_entry_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Curriculum / Lesson Plans
-- =========================================================

CREATE TABLE curricula (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    curriculum_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (term_id, grade_id, subject_id)
);

CREATE TABLE curriculum_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
    display_title TEXT NOT NULL,
    title_ar TEXT,
    title_en TEXT,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE curriculum_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES curriculum_units(id) ON DELETE CASCADE,
    display_title TEXT NOT NULL,
    title_ar TEXT,
    title_en TEXT,
    objectives TEXT,
    resources TEXT,
    duration_minutes INTEGER,
    planned_week INTEGER,
    status lesson_status NOT NULL DEFAULT 'planned',
    done_at TIMESTAMPTZ,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lesson_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES curriculum_lessons(id) ON DELETE CASCADE,
    attachment_kind attachment_type NOT NULL DEFAULT 'file',
    title TEXT NOT NULL,
    url TEXT,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    file_name TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lesson_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL UNIQUE REFERENCES curriculum_lessons(id) ON DELETE CASCADE,
    title_ar TEXT,
    title_en TEXT,
    video_kind video_type NOT NULL DEFAULT 'link',
    url TEXT,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    file_name TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lesson_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES curriculum_lessons(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    due_date DATE,
    max_score NUMERIC(6, 2),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assignment_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES lesson_assignments(id) ON DELETE CASCADE,
    attachment_kind attachment_type NOT NULL DEFAULT 'file',
    title TEXT NOT NULL,
    url TEXT,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    file_name TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assignment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES lesson_assignments(id) ON DELETE CASCADE,
    question_text_ar TEXT NOT NULL,
    question_text_en TEXT,
    question_type assessment_question_type NOT NULL,
    points NUMERIC(6, 2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    correct_answer_boolean BOOLEAN,
    sample_answer_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assignment_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES assignment_questions(id) ON DELETE CASCADE,
    option_text_ar TEXT NOT NULL,
    option_text_en TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE lesson_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    week_index INTEGER NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lesson_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    lesson_plan_id UUID NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES curriculum_lessons(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES curriculum_units(id) ON DELETE SET NULL,
    status lesson_plan_item_status NOT NULL DEFAULT 'planned',
    sort_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (lesson_plan_id, lesson_id)
);

CREATE TABLE lesson_plan_item_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_plan_item_id UUID NOT NULL REFERENCES lesson_plan_items(id) ON DELETE CASCADE,
    resource_kind attachment_type NOT NULL DEFAULT 'link',
    url TEXT,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    title TEXT
);

CREATE TABLE lesson_plan_item_assignments (
    lesson_plan_item_id UUID NOT NULL REFERENCES lesson_plan_items(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES lesson_assignments(id) ON DELETE CASCADE,
    PRIMARY KEY (lesson_plan_item_id, assignment_id)
);

-- =========================================================
-- Attendance
-- =========================================================

CREATE TABLE attendance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    policy_name TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    scope_type entity_scope_type NOT NULL DEFAULT 'school',
    stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
    grade_id UUID REFERENCES grades(id) ON DELETE SET NULL,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    mode attendance_mode NOT NULL DEFAULT 'daily',
    daily_strategy daily_computation_strategy NOT NULL DEFAULT 'manual',
    selected_period_codes TEXT[] NOT NULL DEFAULT '{}',
    late_threshold_minutes INTEGER NOT NULL DEFAULT 5,
    early_leave_threshold_minutes INTEGER NOT NULL DEFAULT 5,
    excuse_required_for_absence BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from DATE,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
);

CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    scope_type entity_scope_type NOT NULL DEFAULT 'school',
    stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
    grade_id UUID REFERENCES grades(id) ON DELETE SET NULL,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    mode attendance_mode NOT NULL DEFAULT 'daily',
    period_code TEXT,
    period_index INTEGER,
    period_name_ar TEXT,
    period_name_en TEXT,
    status attendance_session_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE attendance_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status attendance_status NOT NULL DEFAULT 'unmarked',
    minutes_late INTEGER,
    minutes_early_leave INTEGER,
    excuse_reason TEXT,
    note TEXT,
    has_attachment BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, student_id)
);

CREATE TABLE attendance_entry_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES attendance_entries(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    file_name TEXT,
    size_bytes BIGINT,
    mime_type TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE excuse_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    scope_type entity_scope_type NOT NULL DEFAULT 'school',
    stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
    grade_id UUID REFERENCES grades(id) ON DELETE SET NULL,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    excuse_kind excuse_type NOT NULL,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    selected_period_codes TEXT[] NOT NULL DEFAULT '{}',
    period_indexes INTEGER[] NOT NULL DEFAULT '{}',
    minutes_late INTEGER,
    minutes_early_leave INTEGER,
    reason_ar TEXT NOT NULL,
    reason_en TEXT,
    status excuse_status NOT NULL DEFAULT 'pending',
    decision_note TEXT,
    decided_at TIMESTAMPTZ,
    decided_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    decided_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (date_to >= date_from)
);

CREATE TABLE excuse_request_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    excuse_request_id UUID NOT NULL REFERENCES excuse_requests(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    file_name TEXT,
    size_bytes BIGINT,
    mime_type TEXT,
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE excuse_request_sessions (
    excuse_request_id UUID NOT NULL REFERENCES excuse_requests(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    PRIMARY KEY (excuse_request_id, session_id)
);

-- =========================================================
-- Grades
-- =========================================================

CREATE TABLE grade_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    scope_type grade_rule_scope NOT NULL DEFAULT 'school',
    grade_id UUID REFERENCES grades(id) ON DELETE SET NULL,
    grading_scale JSONB NOT NULL DEFAULT '{}'::JSONB,
    pass_mark NUMERIC(5, 2) NOT NULL DEFAULT 50,
    rounding_mode TEXT NOT NULL DEFAULT 'nearest_half_up',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    scope_type entity_scope_type NOT NULL DEFAULT 'section',
    grade_id UUID REFERENCES grades(id) ON DELETE SET NULL,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    title_ar TEXT,
    assessment_kind assessment_type NOT NULL,
    delivery_mode assessment_delivery_mode NOT NULL DEFAULT 'score_only',
    assessment_date DATE NOT NULL,
    weight NUMERIC(5, 2) NOT NULL DEFAULT 0,
    max_score NUMERIC(6, 2) NOT NULL DEFAULT 100,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    approval_status assessment_approval_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE grade_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    score NUMERIC(6, 2),
    comment TEXT,
    status grade_item_status NOT NULL DEFAULT 'entered',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assessment_id, student_id)
);

CREATE TABLE rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL UNIQUE REFERENCES assessments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rubric_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    points NUMERIC(6, 2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    assignment_id UUID,
    question_text_ar TEXT NOT NULL,
    question_text_en TEXT,
    question_type assessment_question_type NOT NULL,
    points NUMERIC(6, 2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    correct_answer_boolean BOOLEAN,
    sample_answer_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assessment_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    option_text_ar TEXT NOT NULL,
    option_text_en TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE assessment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status assessment_submission_status NOT NULL DEFAULT 'not_started',
    submitted_at TIMESTAMPTZ,
    total_score NUMERIC(6, 2),
    max_score NUMERIC(6, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (assessment_id, student_id)
);

CREATE TABLE assessment_question_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES assessment_submissions(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    selected_option_ids UUID[] NOT NULL DEFAULT '{}',
    boolean_answer BOOLEAN,
    answer_text TEXT,
    awarded_points NUMERIC(6, 2),
    correction_status assessment_correction_status NOT NULL DEFAULT 'pending',
    teacher_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Reinforcement
-- =========================================================

CREATE TABLE reinforcement_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    reward_type reinforcement_reward_type NOT NULL,
    reward_value NUMERIC(8, 2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reinforcement_template_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES reinforcement_templates(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    proof_type reinforcement_proof_type NOT NULL DEFAULT 'none',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reinforcement_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    reward_type reinforcement_reward_type NOT NULL,
    default_value NUMERIC(8, 2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reinforcement_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    template_id UUID REFERENCES reinforcement_templates(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    class_name_snapshot TEXT,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    source reinforcement_source NOT NULL DEFAULT 'teacher',
    status reinforcement_status NOT NULL DEFAULT 'draft',
    reward_type reinforcement_reward_type,
    reward_value NUMERIC(8, 2),
    due_date DATE,
    assigned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reinforcement_task_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES reinforcement_tasks(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    proof_type reinforcement_proof_type NOT NULL DEFAULT 'none',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN,
    submitted_at TIMESTAMPTZ,
    proof_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    proof_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Indexes / Query Performance
-- =========================================================

CREATE INDEX idx_users_school_status ON users (school_id, status);
CREATE INDEX idx_audit_logs_school_created_at ON audit_logs (school_id, created_at DESC);
CREATE INDEX idx_notifications_user_created_at ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notification_preferences_user_event ON notification_preferences (user_id, event_key);

CREATE INDEX idx_leads_school_status ON leads (school_id, status);
CREATE INDEX idx_applications_school_status_submitted_at ON applications (school_id, status, submitted_at DESC);
CREATE INDEX idx_application_tests_application_id ON application_tests (application_id);
CREATE INDEX idx_application_interviews_application_id ON application_interviews (application_id);

CREATE INDEX idx_terms_academic_year_id ON terms (academic_year_id);
CREATE INDEX idx_grades_term_stage ON grades (term_id, stage_id, sort_order);
CREATE INDEX idx_sections_term_grade ON sections (term_id, grade_id, sort_order);
CREATE INDEX idx_classrooms_term_section ON classrooms (term_id, section_id, sort_order);
CREATE INDEX idx_subjects_term_stage ON subjects (term_id, stage_id);

CREATE INDEX idx_students_school_status ON students (school_id, status);
CREATE INDEX idx_student_enrollments_student_id ON student_enrollments (student_id);
CREATE INDEX idx_student_enrollments_year_status ON student_enrollments (academic_year_id, status);
CREATE INDEX idx_enrollment_movements_student_id ON enrollment_movements (student_id, effective_date DESC);

CREATE INDEX idx_subject_allocations_term_grade ON subject_allocations (term_id, grade_id);
CREATE INDEX idx_teacher_allocations_term_section_subject ON teacher_allocations (term_id, section_id, subject_id);
CREATE INDEX idx_academic_events_term_dates ON academic_events (term_id, start_date, end_date);

CREATE INDEX idx_curricula_term_grade_subject ON curricula (term_id, grade_id, subject_id);
CREATE INDEX idx_curriculum_units_curriculum_id ON curriculum_units (curriculum_id, sort_order);
CREATE INDEX idx_curriculum_lessons_unit_id ON curriculum_lessons (unit_id, sort_order);
CREATE INDEX idx_lesson_assignments_lesson_id ON lesson_assignments (lesson_id);
CREATE INDEX idx_assignment_questions_assignment_id ON assignment_questions (assignment_id, sort_order);

CREATE INDEX idx_attendance_sessions_term_date ON attendance_sessions (term_id, attendance_date);
CREATE INDEX idx_attendance_entries_session_student ON attendance_entries (session_id, student_id);
CREATE INDEX idx_excuse_requests_term_status ON excuse_requests (term_id, status, date_from DESC);

CREATE INDEX idx_assessments_term_subject_date ON assessments (term_id, subject_id, assessment_date DESC);
CREATE INDEX idx_grade_items_assessment_student ON grade_items (assessment_id, student_id);
CREATE INDEX idx_assessment_questions_assessment_id ON assessment_questions (assessment_id, sort_order);
CREATE INDEX idx_assessment_submissions_assessment_student ON assessment_submissions (assessment_id, student_id);

CREATE INDEX idx_reinforcement_tasks_student_status ON reinforcement_tasks (student_id, status);
CREATE INDEX idx_reinforcement_tasks_due_date ON reinforcement_tasks (due_date);

CREATE UNIQUE INDEX uq_teacher_allocations_section_subject_no_classroom
    ON teacher_allocations (term_id, section_id, subject_id)
    WHERE classroom_id IS NULL;

CREATE UNIQUE INDEX uq_teacher_allocations_section_classroom_subject
    ON teacher_allocations (term_id, section_id, classroom_id, subject_id)
    WHERE classroom_id IS NOT NULL;

CREATE UNIQUE INDEX uq_timetable_configs_term_scope_term
    ON timetable_configs (term_id, scope_type)
    WHERE scope_type = 'term';

CREATE UNIQUE INDEX uq_timetable_configs_term_scope_grade
    ON timetable_configs (term_id, grade_id)
    WHERE scope_type = 'grade' AND grade_id IS NOT NULL;

CREATE UNIQUE INDEX uq_timetable_configs_term_scope_section
    ON timetable_configs (term_id, section_id)
    WHERE scope_type = 'section' AND section_id IS NOT NULL;

CREATE UNIQUE INDEX uq_timetable_configs_term_scope_classroom
    ON timetable_configs (term_id, classroom_id)
    WHERE scope_type = 'classroom' AND classroom_id IS NOT NULL;

CREATE UNIQUE INDEX uq_timetable_entries_section_slot_no_classroom
    ON timetable_entries (term_id, section_id, day_key, period_index)
    WHERE classroom_id IS NULL;

CREATE UNIQUE INDEX uq_timetable_entries_section_classroom_slot
    ON timetable_entries (term_id, section_id, classroom_id, day_key, period_index)
    WHERE classroom_id IS NOT NULL;

CREATE UNIQUE INDEX uq_lesson_plans_section_subject_week_no_classroom
    ON lesson_plans (term_id, section_id, subject_id, week_index)
    WHERE classroom_id IS NULL;

CREATE UNIQUE INDEX uq_lesson_plans_section_subject_classroom_week
    ON lesson_plans (term_id, section_id, subject_id, classroom_id, week_index)
    WHERE classroom_id IS NOT NULL;
