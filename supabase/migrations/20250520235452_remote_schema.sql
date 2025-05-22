create extension if not exists "pg_trgm" with schema "public" version '1.6';

alter table "public"."user_subscriptions" drop constraint "user_subscriptions_subscription_tier_check";

create table "public"."administrators" (
    "id" bigint generated always as identity not null,
    "name" text not null,
    "email" text not null,
    "created_at" timestamp with time zone default now(),
    "user_id" uuid
);


alter table "public"."administrators" enable row level security;

create table "public"."education_content" (
    "id" uuid not null default uuid_generate_v4(),
    "title" character varying(255) not null,
    "content" text not null,
    "example" text,
    "intermediate_explanation" text,
    "advanced_details" text,
    "related_terms" text[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."education_content" enable row level security;

create table "public"."education_quizzes" (
    "id" text not null,
    "title" text not null,
    "description" text,
    "questions" jsonb not null,
    "passing_score" integer default 60,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."glossary_terms" (
    "id" uuid not null default uuid_generate_v4(),
    "term" character varying(255) not null,
    "definition" text not null,
    "examples" text[],
    "technical_details" text,
    "related_terms" text[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "tags" text[] default '{}'::text[],
    "content_level" text default 'beginner'::text
);


alter table "public"."glossary_terms" enable row level security;

create table "public"."learning_paths" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text not null,
    "level" text not null,
    "modules" jsonb not null default '[]'::jsonb,
    "recommended_for" text[] default '{}'::text[],
    "estimated_time" text default '20-30 minutes'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."learning_paths" enable row level security;

create table "public"."notifications" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "title" text not null,
    "description" text not null,
    "notification_type" text,
    "is_read" boolean default false,
    "due_date" date,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."notifications" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "first_name" text,
    "last_name" text,
    "company" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."profiles" enable row level security;

create table "public"."scenario_details" (
    "id" uuid not null default uuid_generate_v4(),
    "scenario_id" uuid not null,
    "grant_id" uuid not null,
    "shares_included" integer not null,
    "gross_value" numeric(12,2) not null,
    "exercise_cost" numeric(12,2) not null,
    "tax_cost" numeric(12,2) not null,
    "net_value" numeric(12,2) not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."scenario_details" enable row level security;

create table "public"."scenarios" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "grant_id" uuid,
    "scenario_name" text not null default 'Default Scenario'::text,
    "exit_value" numeric(10,2) not null default 0,
    "shares_exercised" integer not null default 0,
    "exercise_cost" numeric(10,2) not null,
    "gross_proceeds" numeric(10,2) not null,
    "tax_liability" numeric(10,2) not null,
    "net_proceeds" numeric(10,2) not null,
    "roi_percentage" numeric(5,2) not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "name" text,
    "description" text,
    "exit_type" text,
    "exit_date" timestamp with time zone,
    "share_price" numeric(20,4),
    "shares_included" integer,
    "updated_at" timestamp with time zone default now(),
    "effective_tax_rate" numeric(5,2)
);


alter table "public"."scenarios" enable row level security;

create table "public"."tax_settings" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "federal_rate" numeric(5,2) not null default 22.0,
    "state_rate" numeric(5,2) not null default 5.0,
    "capital_gains_rate" numeric(5,2) not null default 15.0,
    "medicare_rate" numeric(5,2) not null default 1.45,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."tax_settings" enable row level security;

create table "public"."user_education_progress" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "viewed_content" jsonb default '{}'::jsonb,
    "completed_content" text[] default '{}'::text[],
    "bookmarked_content" text[] default '{}'::text[],
    "quiz_results" jsonb default '{}'::jsonb,
    "learning_paths" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."user_education_progress" enable row level security;

create table "public"."user_financial_profiles" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "income" numeric not null default 0,
    "available_cash" numeric not null default 0,
    "other_investments" numeric not null default 0,
    "debt" numeric not null default 0,
    "monthly_expenses" numeric not null default 0,
    "retirement_savings" numeric not null default 0,
    "risk_tolerance" text not null default 'medium'::text,
    "age" integer not null default 30,
    "has_other_compensation" boolean not null default false,
    "is_homeowner" boolean not null default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."vesting_events" (
    "id" uuid not null default uuid_generate_v4(),
    "grant_id" uuid not null,
    "vesting_date" date not null,
    "shares_vested" integer not null,
    "value_at_vesting" numeric(12,2),
    "is_exercised" boolean default false,
    "exercise_date" date,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."vesting_events" enable row level security;

alter table "public"."equity_grants" add column "accelerated_vesting" boolean default false;

alter table "public"."equity_grants" add column "liquidity_event_only" boolean default false;

alter table "public"."equity_grants" add column "notes" text;

alter table "public"."user_subscriptions" drop column "is_trial";

alter table "public"."user_subscriptions" drop column "trial_ends_at";

CREATE UNIQUE INDEX administrators_email_key ON public.administrators USING btree (email);

CREATE UNIQUE INDEX administrators_pkey ON public.administrators USING btree (id);

CREATE UNIQUE INDEX education_content_pkey ON public.education_content USING btree (id);

CREATE UNIQUE INDEX education_quizzes_pkey ON public.education_quizzes USING btree (id);

CREATE INDEX glossary_terms_content_level_idx ON public.glossary_terms USING btree (content_level);

CREATE UNIQUE INDEX glossary_terms_pkey ON public.glossary_terms USING btree (id);

CREATE INDEX glossary_terms_term_idx ON public.glossary_terms USING gin (term gin_trgm_ops);

CREATE INDEX idx_education_quizzes_title ON public.education_quizzes USING btree (title);

CREATE INDEX idx_user_progress_user_id ON public.user_education_progress USING btree (user_id);

CREATE UNIQUE INDEX learning_paths_pkey ON public.learning_paths USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX scenario_details_pkey ON public.scenario_details USING btree (id);

CREATE UNIQUE INDEX scenarios_pkey ON public.scenarios USING btree (id);

CREATE UNIQUE INDEX tax_settings_pkey ON public.tax_settings USING btree (id);

CREATE UNIQUE INDEX tax_settings_user_id_key ON public.tax_settings USING btree (user_id);

CREATE UNIQUE INDEX user_education_progress_pkey ON public.user_education_progress USING btree (id);

CREATE UNIQUE INDEX user_financial_profiles_pkey ON public.user_financial_profiles USING btree (id);

CREATE UNIQUE INDEX vesting_events_pkey ON public.vesting_events USING btree (id);

alter table "public"."administrators" add constraint "administrators_pkey" PRIMARY KEY using index "administrators_pkey";

alter table "public"."education_content" add constraint "education_content_pkey" PRIMARY KEY using index "education_content_pkey";

alter table "public"."education_quizzes" add constraint "education_quizzes_pkey" PRIMARY KEY using index "education_quizzes_pkey";

alter table "public"."glossary_terms" add constraint "glossary_terms_pkey" PRIMARY KEY using index "glossary_terms_pkey";

alter table "public"."learning_paths" add constraint "learning_paths_pkey" PRIMARY KEY using index "learning_paths_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."scenario_details" add constraint "scenario_details_pkey" PRIMARY KEY using index "scenario_details_pkey";

alter table "public"."scenarios" add constraint "scenarios_pkey" PRIMARY KEY using index "scenarios_pkey";

alter table "public"."tax_settings" add constraint "tax_settings_pkey" PRIMARY KEY using index "tax_settings_pkey";

alter table "public"."user_education_progress" add constraint "user_education_progress_pkey" PRIMARY KEY using index "user_education_progress_pkey";

alter table "public"."user_financial_profiles" add constraint "user_financial_profiles_pkey" PRIMARY KEY using index "user_financial_profiles_pkey";

alter table "public"."vesting_events" add constraint "vesting_events_pkey" PRIMARY KEY using index "vesting_events_pkey";

alter table "public"."administrators" add constraint "administrators_email_key" UNIQUE using index "administrators_email_key";

alter table "public"."administrators" add constraint "administrators_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."administrators" validate constraint "administrators_user_id_fkey";

alter table "public"."glossary_terms" add constraint "glossary_terms_content_level_check" CHECK ((content_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]))) not valid;

alter table "public"."glossary_terms" validate constraint "glossary_terms_content_level_check";

alter table "public"."learning_paths" add constraint "learning_paths_level_check" CHECK ((level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]))) not valid;

alter table "public"."learning_paths" validate constraint "learning_paths_level_check";

alter table "public"."notifications" add constraint "notifications_notification_type_check" CHECK ((notification_type = ANY (ARRAY['vesting'::text, 'exercise'::text, 'tax'::text, 'scenario'::text, 'system'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_notification_type_check";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."scenario_details" add constraint "scenario_details_grant_id_fkey" FOREIGN KEY (grant_id) REFERENCES equity_grants(id) ON DELETE CASCADE not valid;

alter table "public"."scenario_details" validate constraint "scenario_details_grant_id_fkey";

alter table "public"."scenario_details" add constraint "scenario_details_scenario_id_fkey" FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE not valid;

alter table "public"."scenario_details" validate constraint "scenario_details_scenario_id_fkey";

alter table "public"."scenarios" add constraint "scenarios_grant_id_fkey" FOREIGN KEY (grant_id) REFERENCES equity_grants(id) ON DELETE CASCADE not valid;

alter table "public"."scenarios" validate constraint "scenarios_grant_id_fkey";

alter table "public"."scenarios" add constraint "scenarios_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."scenarios" validate constraint "scenarios_user_id_fkey";

alter table "public"."tax_settings" add constraint "tax_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tax_settings" validate constraint "tax_settings_user_id_fkey";

alter table "public"."tax_settings" add constraint "tax_settings_user_id_key" UNIQUE using index "tax_settings_user_id_key";

alter table "public"."user_education_progress" add constraint "user_education_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_education_progress" validate constraint "user_education_progress_user_id_fkey";

alter table "public"."user_financial_profiles" add constraint "user_financial_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_financial_profiles" validate constraint "user_financial_profiles_user_id_fkey";

alter table "public"."vesting_events" add constraint "vesting_events_grant_id_fkey" FOREIGN KEY (grant_id) REFERENCES equity_grants(id) ON DELETE CASCADE not valid;

alter table "public"."vesting_events" validate constraint "vesting_events_grant_id_fkey";

alter table "public"."user_subscriptions" add constraint "user_subscriptions_subscription_tier_check" CHECK ((subscription_tier = ANY (ARRAY['free'::text, 'basic'::text, 'pro'::text, 'premium'::text]))) not valid;

alter table "public"."user_subscriptions" validate constraint "user_subscriptions_subscription_tier_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_vesting_events(grant_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    g public.equity_grants;
    vesting_start DATE;
    vesting_end DATE;
    cliff_date DATE;
    num_periods INTEGER;
    period_length INTEGER; -- in days
    curr_date DATE; -- renamed from current_date to avoid reserved word
    shares_per_period INTEGER;
    total_vested INTEGER := 0;
BEGIN
    -- Get grant information
    SELECT * INTO g FROM public.equity_grants WHERE id = grant_id;
    
    -- Clear existing vesting events for this grant
    -- This is the problematic line, fix it by using an alias
    DELETE FROM public.vesting_events ve WHERE ve.grant_id = g.id;
    
    -- Rest of the function remains the same
    vesting_start := g.vesting_start_date;
    vesting_end := g.vesting_end_date;
    cliff_date := g.vesting_cliff_date;
    
    -- Determine period length based on vesting schedule
    IF g.vesting_schedule = 'monthly' THEN
        period_length := 30; -- approximately a month
    ELSIF g.vesting_schedule = 'quarterly' THEN
        period_length := 91; -- approximately a quarter
    ELSE -- yearly
        period_length := 365; -- a year
    END IF;
    
    -- Rest of your function...
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    company
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'company'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_default_scenario_name()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.scenario_name IS NULL THEN
    NEW.scenario_name := 'Default Scenario ' || NEW.id::text;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_default_scenario_values()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.scenario_name := COALESCE(NEW.scenario_name, 'Default Scenario ' || COALESCE(NEW.id::text, 'New'));
  NEW.exit_value := COALESCE(NEW.exit_value, 0);
  NEW.shares_exercised := COALESCE(NEW.shares_exercised, 0);
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_calculate_vesting_events()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    PERFORM calculate_vesting_events(NEW.id);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

create or replace view "public"."upcoming_vesting" as  SELECT g.user_id,
    v.id AS vesting_event_id,
    g.id AS grant_id,
    g.company_name,
    g.grant_type,
    v.vesting_date,
    v.shares_vested,
    ((v.shares_vested)::numeric * g.current_fmv) AS estimated_value,
    g.current_fmv
   FROM (equity_grants g
     JOIN vesting_events v ON ((g.id = v.grant_id)))
  WHERE ((v.vesting_date > CURRENT_DATE) AND (v.vesting_date <= (CURRENT_DATE + '90 days'::interval)))
  ORDER BY v.vesting_date;


create or replace view "public"."vesting_summary" as  SELECT g.user_id,
    g.id AS grant_id,
    g.company_name,
    g.grant_type,
    g.shares,
    g.strike_price,
    g.current_fmv,
    COALESCE(sum(
        CASE
            WHEN (v.vesting_date <= CURRENT_DATE) THEN v.shares_vested
            ELSE 0
        END), (0)::bigint) AS vested_shares,
    COALESCE((((sum(
        CASE
            WHEN (v.vesting_date <= CURRENT_DATE) THEN v.shares_vested
            ELSE 0
        END))::numeric * 100.0) / (NULLIF(g.shares, 0))::numeric), (0)::numeric) AS vested_percentage,
    COALESCE(((sum(
        CASE
            WHEN (v.vesting_date <= CURRENT_DATE) THEN v.shares_vested
            ELSE 0
        END))::numeric * g.current_fmv), (0)::numeric) AS vested_value,
    COALESCE(((sum(
        CASE
            WHEN (v.vesting_date <= CURRENT_DATE) THEN v.shares_vested
            ELSE 0
        END))::numeric * g.strike_price), (0)::numeric) AS exercise_cost
   FROM (equity_grants g
     LEFT JOIN vesting_events v ON ((g.id = v.grant_id)))
  GROUP BY g.user_id, g.id, g.company_name, g.grant_type, g.shares, g.strike_price, g.current_fmv;


CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(user_uuid uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  subscription_tier TEXT;
BEGIN
  SELECT us.subscription_tier INTO subscription_tier
  FROM user_subscriptions us
  WHERE us.user_id = user_uuid
  AND us.is_active = TRUE
  AND (us.expires_at IS NULL OR us.expires_at > NOW())
  ORDER BY us.created_at DESC
  LIMIT 1;

  RETURN COALESCE(subscription_tier, 'free');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."administrators" to "anon";

grant insert on table "public"."administrators" to "anon";

grant references on table "public"."administrators" to "anon";

grant select on table "public"."administrators" to "anon";

grant trigger on table "public"."administrators" to "anon";

grant truncate on table "public"."administrators" to "anon";

grant update on table "public"."administrators" to "anon";

grant delete on table "public"."administrators" to "authenticated";

grant insert on table "public"."administrators" to "authenticated";

grant references on table "public"."administrators" to "authenticated";

grant select on table "public"."administrators" to "authenticated";

grant trigger on table "public"."administrators" to "authenticated";

grant truncate on table "public"."administrators" to "authenticated";

grant update on table "public"."administrators" to "authenticated";

grant delete on table "public"."administrators" to "service_role";

grant insert on table "public"."administrators" to "service_role";

grant references on table "public"."administrators" to "service_role";

grant select on table "public"."administrators" to "service_role";

grant trigger on table "public"."administrators" to "service_role";

grant truncate on table "public"."administrators" to "service_role";

grant update on table "public"."administrators" to "service_role";

grant delete on table "public"."education_content" to "anon";

grant insert on table "public"."education_content" to "anon";

grant references on table "public"."education_content" to "anon";

grant select on table "public"."education_content" to "anon";

grant trigger on table "public"."education_content" to "anon";

grant truncate on table "public"."education_content" to "anon";

grant update on table "public"."education_content" to "anon";

grant delete on table "public"."education_content" to "authenticated";

grant insert on table "public"."education_content" to "authenticated";

grant references on table "public"."education_content" to "authenticated";

grant select on table "public"."education_content" to "authenticated";

grant trigger on table "public"."education_content" to "authenticated";

grant truncate on table "public"."education_content" to "authenticated";

grant update on table "public"."education_content" to "authenticated";

grant delete on table "public"."education_content" to "service_role";

grant insert on table "public"."education_content" to "service_role";

grant references on table "public"."education_content" to "service_role";

grant select on table "public"."education_content" to "service_role";

grant trigger on table "public"."education_content" to "service_role";

grant truncate on table "public"."education_content" to "service_role";

grant update on table "public"."education_content" to "service_role";

grant delete on table "public"."education_quizzes" to "anon";

grant insert on table "public"."education_quizzes" to "anon";

grant references on table "public"."education_quizzes" to "anon";

grant select on table "public"."education_quizzes" to "anon";

grant trigger on table "public"."education_quizzes" to "anon";

grant truncate on table "public"."education_quizzes" to "anon";

grant update on table "public"."education_quizzes" to "anon";

grant delete on table "public"."education_quizzes" to "authenticated";

grant insert on table "public"."education_quizzes" to "authenticated";

grant references on table "public"."education_quizzes" to "authenticated";

grant select on table "public"."education_quizzes" to "authenticated";

grant trigger on table "public"."education_quizzes" to "authenticated";

grant truncate on table "public"."education_quizzes" to "authenticated";

grant update on table "public"."education_quizzes" to "authenticated";

grant delete on table "public"."education_quizzes" to "service_role";

grant insert on table "public"."education_quizzes" to "service_role";

grant references on table "public"."education_quizzes" to "service_role";

grant select on table "public"."education_quizzes" to "service_role";

grant trigger on table "public"."education_quizzes" to "service_role";

grant truncate on table "public"."education_quizzes" to "service_role";

grant update on table "public"."education_quizzes" to "service_role";

grant delete on table "public"."glossary_terms" to "anon";

grant insert on table "public"."glossary_terms" to "anon";

grant references on table "public"."glossary_terms" to "anon";

grant select on table "public"."glossary_terms" to "anon";

grant trigger on table "public"."glossary_terms" to "anon";

grant truncate on table "public"."glossary_terms" to "anon";

grant update on table "public"."glossary_terms" to "anon";

grant delete on table "public"."glossary_terms" to "authenticated";

grant insert on table "public"."glossary_terms" to "authenticated";

grant references on table "public"."glossary_terms" to "authenticated";

grant select on table "public"."glossary_terms" to "authenticated";

grant trigger on table "public"."glossary_terms" to "authenticated";

grant truncate on table "public"."glossary_terms" to "authenticated";

grant update on table "public"."glossary_terms" to "authenticated";

grant delete on table "public"."glossary_terms" to "service_role";

grant insert on table "public"."glossary_terms" to "service_role";

grant references on table "public"."glossary_terms" to "service_role";

grant select on table "public"."glossary_terms" to "service_role";

grant trigger on table "public"."glossary_terms" to "service_role";

grant truncate on table "public"."glossary_terms" to "service_role";

grant update on table "public"."glossary_terms" to "service_role";

grant delete on table "public"."learning_paths" to "anon";

grant insert on table "public"."learning_paths" to "anon";

grant references on table "public"."learning_paths" to "anon";

grant select on table "public"."learning_paths" to "anon";

grant trigger on table "public"."learning_paths" to "anon";

grant truncate on table "public"."learning_paths" to "anon";

grant update on table "public"."learning_paths" to "anon";

grant delete on table "public"."learning_paths" to "authenticated";

grant insert on table "public"."learning_paths" to "authenticated";

grant references on table "public"."learning_paths" to "authenticated";

grant select on table "public"."learning_paths" to "authenticated";

grant trigger on table "public"."learning_paths" to "authenticated";

grant truncate on table "public"."learning_paths" to "authenticated";

grant update on table "public"."learning_paths" to "authenticated";

grant delete on table "public"."learning_paths" to "service_role";

grant insert on table "public"."learning_paths" to "service_role";

grant references on table "public"."learning_paths" to "service_role";

grant select on table "public"."learning_paths" to "service_role";

grant trigger on table "public"."learning_paths" to "service_role";

grant truncate on table "public"."learning_paths" to "service_role";

grant update on table "public"."learning_paths" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."scenario_details" to "anon";

grant insert on table "public"."scenario_details" to "anon";

grant references on table "public"."scenario_details" to "anon";

grant select on table "public"."scenario_details" to "anon";

grant trigger on table "public"."scenario_details" to "anon";

grant truncate on table "public"."scenario_details" to "anon";

grant update on table "public"."scenario_details" to "anon";

grant delete on table "public"."scenario_details" to "authenticated";

grant insert on table "public"."scenario_details" to "authenticated";

grant references on table "public"."scenario_details" to "authenticated";

grant select on table "public"."scenario_details" to "authenticated";

grant trigger on table "public"."scenario_details" to "authenticated";

grant truncate on table "public"."scenario_details" to "authenticated";

grant update on table "public"."scenario_details" to "authenticated";

grant delete on table "public"."scenario_details" to "service_role";

grant insert on table "public"."scenario_details" to "service_role";

grant references on table "public"."scenario_details" to "service_role";

grant select on table "public"."scenario_details" to "service_role";

grant trigger on table "public"."scenario_details" to "service_role";

grant truncate on table "public"."scenario_details" to "service_role";

grant update on table "public"."scenario_details" to "service_role";

grant delete on table "public"."scenarios" to "anon";

grant insert on table "public"."scenarios" to "anon";

grant references on table "public"."scenarios" to "anon";

grant select on table "public"."scenarios" to "anon";

grant trigger on table "public"."scenarios" to "anon";

grant truncate on table "public"."scenarios" to "anon";

grant update on table "public"."scenarios" to "anon";

grant delete on table "public"."scenarios" to "authenticated";

grant insert on table "public"."scenarios" to "authenticated";

grant references on table "public"."scenarios" to "authenticated";

grant select on table "public"."scenarios" to "authenticated";

grant trigger on table "public"."scenarios" to "authenticated";

grant truncate on table "public"."scenarios" to "authenticated";

grant update on table "public"."scenarios" to "authenticated";

grant delete on table "public"."scenarios" to "service_role";

grant insert on table "public"."scenarios" to "service_role";

grant references on table "public"."scenarios" to "service_role";

grant select on table "public"."scenarios" to "service_role";

grant trigger on table "public"."scenarios" to "service_role";

grant truncate on table "public"."scenarios" to "service_role";

grant update on table "public"."scenarios" to "service_role";

grant delete on table "public"."tax_settings" to "anon";

grant insert on table "public"."tax_settings" to "anon";

grant references on table "public"."tax_settings" to "anon";

grant select on table "public"."tax_settings" to "anon";

grant trigger on table "public"."tax_settings" to "anon";

grant truncate on table "public"."tax_settings" to "anon";

grant update on table "public"."tax_settings" to "anon";

grant delete on table "public"."tax_settings" to "authenticated";

grant insert on table "public"."tax_settings" to "authenticated";

grant references on table "public"."tax_settings" to "authenticated";

grant select on table "public"."tax_settings" to "authenticated";

grant trigger on table "public"."tax_settings" to "authenticated";

grant truncate on table "public"."tax_settings" to "authenticated";

grant update on table "public"."tax_settings" to "authenticated";

grant delete on table "public"."tax_settings" to "service_role";

grant insert on table "public"."tax_settings" to "service_role";

grant references on table "public"."tax_settings" to "service_role";

grant select on table "public"."tax_settings" to "service_role";

grant trigger on table "public"."tax_settings" to "service_role";

grant truncate on table "public"."tax_settings" to "service_role";

grant update on table "public"."tax_settings" to "service_role";

grant delete on table "public"."user_education_progress" to "anon";

grant insert on table "public"."user_education_progress" to "anon";

grant references on table "public"."user_education_progress" to "anon";

grant select on table "public"."user_education_progress" to "anon";

grant trigger on table "public"."user_education_progress" to "anon";

grant truncate on table "public"."user_education_progress" to "anon";

grant update on table "public"."user_education_progress" to "anon";

grant delete on table "public"."user_education_progress" to "authenticated";

grant insert on table "public"."user_education_progress" to "authenticated";

grant references on table "public"."user_education_progress" to "authenticated";

grant select on table "public"."user_education_progress" to "authenticated";

grant trigger on table "public"."user_education_progress" to "authenticated";

grant truncate on table "public"."user_education_progress" to "authenticated";

grant update on table "public"."user_education_progress" to "authenticated";

grant delete on table "public"."user_education_progress" to "service_role";

grant insert on table "public"."user_education_progress" to "service_role";

grant references on table "public"."user_education_progress" to "service_role";

grant select on table "public"."user_education_progress" to "service_role";

grant trigger on table "public"."user_education_progress" to "service_role";

grant truncate on table "public"."user_education_progress" to "service_role";

grant update on table "public"."user_education_progress" to "service_role";

grant delete on table "public"."user_financial_profiles" to "anon";

grant insert on table "public"."user_financial_profiles" to "anon";

grant references on table "public"."user_financial_profiles" to "anon";

grant select on table "public"."user_financial_profiles" to "anon";

grant trigger on table "public"."user_financial_profiles" to "anon";

grant truncate on table "public"."user_financial_profiles" to "anon";

grant update on table "public"."user_financial_profiles" to "anon";

grant delete on table "public"."user_financial_profiles" to "authenticated";

grant insert on table "public"."user_financial_profiles" to "authenticated";

grant references on table "public"."user_financial_profiles" to "authenticated";

grant select on table "public"."user_financial_profiles" to "authenticated";

grant trigger on table "public"."user_financial_profiles" to "authenticated";

grant truncate on table "public"."user_financial_profiles" to "authenticated";

grant update on table "public"."user_financial_profiles" to "authenticated";

grant delete on table "public"."user_financial_profiles" to "service_role";

grant insert on table "public"."user_financial_profiles" to "service_role";

grant references on table "public"."user_financial_profiles" to "service_role";

grant select on table "public"."user_financial_profiles" to "service_role";

grant trigger on table "public"."user_financial_profiles" to "service_role";

grant truncate on table "public"."user_financial_profiles" to "service_role";

grant update on table "public"."user_financial_profiles" to "service_role";

grant delete on table "public"."vesting_events" to "anon";

grant insert on table "public"."vesting_events" to "anon";

grant references on table "public"."vesting_events" to "anon";

grant select on table "public"."vesting_events" to "anon";

grant trigger on table "public"."vesting_events" to "anon";

grant truncate on table "public"."vesting_events" to "anon";

grant update on table "public"."vesting_events" to "anon";

grant delete on table "public"."vesting_events" to "authenticated";

grant insert on table "public"."vesting_events" to "authenticated";

grant references on table "public"."vesting_events" to "authenticated";

grant select on table "public"."vesting_events" to "authenticated";

grant trigger on table "public"."vesting_events" to "authenticated";

grant truncate on table "public"."vesting_events" to "authenticated";

grant update on table "public"."vesting_events" to "authenticated";

grant delete on table "public"."vesting_events" to "service_role";

grant insert on table "public"."vesting_events" to "service_role";

grant references on table "public"."vesting_events" to "service_role";

grant select on table "public"."vesting_events" to "service_role";

grant trigger on table "public"."vesting_events" to "service_role";

grant truncate on table "public"."vesting_events" to "service_role";

grant update on table "public"."vesting_events" to "service_role";

create policy "Allow admins to modify education_content"
on "public"."education_content"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM administrators
  WHERE (administrators.user_id = auth.uid()))))
with check ((EXISTS ( SELECT 1
   FROM administrators
  WHERE (administrators.user_id = auth.uid()))));


create policy "Allow public read access to education_content"
on "public"."education_content"
as permissive
for select
to authenticated
using (true);


create policy "Anyone can view education content"
on "public"."education_content"
as permissive
for select
to public
using (true);


create policy "Users can delete their own grants"
on "public"."equity_grants"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own grants"
on "public"."equity_grants"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own grants"
on "public"."equity_grants"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own grants"
on "public"."equity_grants"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Allow admins to modify glossary_terms"
on "public"."glossary_terms"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM administrators
  WHERE (administrators.user_id = auth.uid()))))
with check ((EXISTS ( SELECT 1
   FROM administrators
  WHERE (administrators.user_id = auth.uid()))));


create policy "Allow public read access to glossary_terms"
on "public"."glossary_terms"
as permissive
for select
to authenticated
using (true);


create policy "Anyone can view glossary terms"
on "public"."glossary_terms"
as permissive
for select
to public
using (true);


create policy "Anyone can view learning paths"
on "public"."learning_paths"
as permissive
for select
to public
using (true);


create policy "Users can delete their own notifications"
on "public"."notifications"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own notifications"
on "public"."notifications"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own notifications"
on "public"."notifications"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own notifications"
on "public"."notifications"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own profile"
on "public"."profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view their own profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Users can delete their own scenario details"
on "public"."scenario_details"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM scenarios s
  WHERE ((s.id = scenario_details.scenario_id) AND (s.user_id = auth.uid())))));


create policy "Users can insert their own scenario details"
on "public"."scenario_details"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM scenarios s
  WHERE ((s.id = scenario_details.scenario_id) AND (s.user_id = auth.uid())))));


create policy "Users can update their own scenario details"
on "public"."scenario_details"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM scenarios s
  WHERE ((s.id = scenario_details.scenario_id) AND (s.user_id = auth.uid())))));


create policy "Users can view their own scenario details"
on "public"."scenario_details"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM scenarios s
  WHERE ((s.id = scenario_details.scenario_id) AND (s.user_id = auth.uid())))));


create policy "Users can delete own scenarios"
on "public"."scenarios"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can delete their own scenarios"
on "public"."scenarios"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own scenarios"
on "public"."scenarios"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can insert their own scenarios"
on "public"."scenarios"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own scenarios"
on "public"."scenarios"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own scenarios"
on "public"."scenarios"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can view their own scenarios"
on "public"."scenarios"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete their own tax settings"
on "public"."tax_settings"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own tax settings"
on "public"."tax_settings"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own tax settings"
on "public"."tax_settings"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own tax settings"
on "public"."tax_settings"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert own education progress"
on "public"."user_education_progress"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own education progress"
on "public"."user_education_progress"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own education progress"
on "public"."user_education_progress"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can only access their own financial profiles"
on "public"."user_financial_profiles"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Users can delete their own vesting events"
on "public"."vesting_events"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM equity_grants g
  WHERE ((g.id = vesting_events.grant_id) AND (g.user_id = auth.uid())))));


create policy "Users can insert their own vesting events"
on "public"."vesting_events"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM equity_grants g
  WHERE ((g.id = vesting_events.grant_id) AND (g.user_id = auth.uid())))));


create policy "Users can update their own vesting events"
on "public"."vesting_events"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM equity_grants g
  WHERE ((g.id = vesting_events.grant_id) AND (g.user_id = auth.uid())))));


create policy "Users can view their own vesting events"
on "public"."vesting_events"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM equity_grants g
  WHERE ((g.id = vesting_events.grant_id) AND (g.user_id = auth.uid())))));


CREATE TRIGGER handle_education_content_updated_at BEFORE UPDATE ON public.education_content FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_timestamp_equity_grants BEFORE UPDATE ON public.equity_grants FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER trigger_vesting_events_on_grant_insert AFTER INSERT ON public.equity_grants FOR EACH ROW EXECUTE FUNCTION trigger_calculate_vesting_events();

CREATE TRIGGER trigger_vesting_events_on_grant_update AFTER UPDATE ON public.equity_grants FOR EACH ROW WHEN (((old.shares <> new.shares) OR (old.vesting_start_date <> new.vesting_start_date) OR (old.vesting_cliff_date <> new.vesting_cliff_date) OR (old.vesting_end_date <> new.vesting_end_date) OR (old.vesting_schedule <> new.vesting_schedule))) EXECUTE FUNCTION trigger_calculate_vesting_events();

CREATE TRIGGER handle_glossary_terms_updated_at BEFORE UPDATE ON public.glossary_terms FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_learning_paths_updated_at BEFORE UPDATE ON public.learning_paths FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_timestamp_notifications BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_scenario_details BEFORE UPDATE ON public.scenario_details FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER ensure_scenario_name_trigger BEFORE INSERT OR UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION set_default_scenario_name();

CREATE TRIGGER ensure_scenario_values_trigger BEFORE INSERT OR UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION set_default_scenario_values();

CREATE TRIGGER set_scenarios_updated_at BEFORE UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_timestamp_scenarios BEFORE UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_tax_settings BEFORE UPDATE ON public.tax_settings FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER handle_user_education_progress_updated_at BEFORE UPDATE ON public.user_education_progress FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_timestamp_vesting_events BEFORE UPDATE ON public.vesting_events FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


