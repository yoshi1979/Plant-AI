create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  whatsapp_number text unique not null,
  display_name text,
  locale text default 'en',
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  nickname text,
  species_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  whatsapp_thread_key text unique not null,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  provider_message_id text unique not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists uploaded_images (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  storage_path text unique not null,
  mime_type text,
  width integer,
  height integer,
  sha256 text,
  created_at timestamptz not null default now()
);

create table if not exists diagnoses (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  plant_id uuid references plants(id) on delete set null,
  detected_plant_name text,
  health_status text not null,
  observed_symptoms jsonb not null default '[]'::jsonb,
  primary_issue text,
  alternative_issues jsonb not null default '[]'::jsonb,
  confidence_score_1_to_10 integer not null check (confidence_score_1_to_10 between 1 and 10),
  validation_strength text not null,
  expert_source_types_used jsonb not null default '[]'::jsonb,
  expert_validation_summary text,
  recommended_actions jsonb not null default '[]'::jsonb,
  prevention_tips jsonb not null default '[]'::jsonb,
  escalation_advice text,
  raw_model_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists expert_validations (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null references diagnoses(id) on delete cascade,
  source_type text not null,
  source_title text not null,
  source_url text not null,
  source_snippet text,
  created_at timestamptz not null default now()
);

create table if not exists treatment_recommendations (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null references diagnoses(id) on delete cascade,
  priority integer not null,
  action text not null,
  why text,
  created_at timestamptz not null default now()
);

create table if not exists follow_up_questions (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null references diagnoses(id) on delete cascade,
  question text not null,
  answered boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists care_history (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid references plants(id) on delete cascade,
  diagnosis_id uuid references diagnoses(id) on delete set null,
  note text,
  event_type text not null default 'diagnosis',
  created_at timestamptz not null default now()
);

create index if not exists idx_users_whatsapp_number on users(whatsapp_number);
create index if not exists idx_conversations_thread_key on conversations(whatsapp_thread_key);
create index if not exists idx_messages_provider_message_id on messages(provider_message_id);
create index if not exists idx_diagnoses_confidence on diagnoses(confidence_score_1_to_10);
create index if not exists idx_diagnoses_created_at on diagnoses(created_at desc);
