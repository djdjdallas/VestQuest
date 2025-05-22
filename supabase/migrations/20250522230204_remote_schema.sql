drop policy "Anyone can view learning paths" on "public"."learning_paths";

create table "public"."course_lessons" (
    "id" uuid not null default gen_random_uuid(),
    "module_id" uuid not null,
    "title" character varying(255) not null,
    "description" text,
    "component_name" character varying(255),
    "order_index" integer,
    "estimated_time" character varying(50),
    "key_terms" text[],
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


create table "public"."course_modules" (
    "id" uuid not null default gen_random_uuid(),
    "title" character varying(255) not null,
    "description" text,
    "order_index" integer,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


create table "public"."course_quiz_questions" (
    "id" uuid not null default gen_random_uuid(),
    "lesson_id" uuid not null,
    "question" text not null,
    "options" jsonb not null,
    "correct_answer" character varying(10) not null,
    "explanation" text,
    "order_index" integer,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


create table "public"."learning_modules" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "title" text not null,
    "description" text not null,
    "level" text not null,
    "estimated_duration" text not null,
    "is_active" boolean default true,
    "display_order" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."learning_modules" enable row level security;

create table "public"."lesson_quizzes" (
    "id" uuid not null default gen_random_uuid(),
    "lesson_id" uuid not null,
    "question_id" text not null,
    "question_text" text not null,
    "explanation" text not null,
    "correct_answer_id" text not null,
    "question_order" integer not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."lesson_quizzes" enable row level security;

create table "public"."lessons" (
    "id" uuid not null default gen_random_uuid(),
    "module_id" uuid not null,
    "slug" text not null,
    "title" text not null,
    "description" text not null,
    "estimated_time" text not null,
    "component_name" text not null,
    "key_terms" text[] default '{}'::text[],
    "lesson_order" integer not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."lessons" enable row level security;

create table "public"."quiz_options" (
    "id" uuid not null default gen_random_uuid(),
    "quiz_question_id" uuid not null,
    "option_id" text not null,
    "option_text" text not null,
    "option_order" integer not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."quiz_options" enable row level security;

alter table "public"."learning_paths" add column "completion_requirements" jsonb default '{"min_quiz_score": 70, "min_lessons_completed": 1}'::jsonb;

alter table "public"."learning_paths" add column "is_template" boolean default false;

alter table "public"."learning_paths" add column "last_updated_by" uuid;

alter table "public"."learning_paths" add column "restart_enabled" boolean default true;

alter table "public"."learning_paths" add column "user_id" uuid;

alter table "public"."learning_paths" add column "version" integer default 1;

alter table "public"."user_education_progress" add column "last_reset_at" timestamp with time zone;

alter table "public"."user_education_progress" add column "reset_history" jsonb default '[]'::jsonb;

CREATE UNIQUE INDEX course_lessons_pkey ON public.course_lessons USING btree (id);

CREATE UNIQUE INDEX course_modules_pkey ON public.course_modules USING btree (id);

CREATE UNIQUE INDEX course_modules_title_key ON public.course_modules USING btree (title);

CREATE UNIQUE INDEX course_quiz_questions_pkey ON public.course_quiz_questions USING btree (id);

CREATE INDEX idx_learning_paths_restart_enabled ON public.learning_paths USING btree (restart_enabled) WHERE (restart_enabled = true);

CREATE INDEX idx_learning_paths_template ON public.learning_paths USING btree (is_template);

CREATE INDEX idx_learning_paths_user_id ON public.learning_paths USING btree (user_id);

CREATE INDEX idx_user_education_progress_user_id_reset ON public.user_education_progress USING btree (user_id, last_reset_at);

CREATE UNIQUE INDEX learning_modules_pkey ON public.learning_modules USING btree (id);

CREATE UNIQUE INDEX learning_modules_slug_key ON public.learning_modules USING btree (slug);

CREATE UNIQUE INDEX lesson_quizzes_lesson_id_question_id_key ON public.lesson_quizzes USING btree (lesson_id, question_id);

CREATE UNIQUE INDEX lesson_quizzes_lesson_id_question_order_key ON public.lesson_quizzes USING btree (lesson_id, question_order);

CREATE UNIQUE INDEX lesson_quizzes_pkey ON public.lesson_quizzes USING btree (id);

CREATE UNIQUE INDEX lessons_module_id_lesson_order_key ON public.lessons USING btree (module_id, lesson_order);

CREATE UNIQUE INDEX lessons_module_id_slug_key ON public.lessons USING btree (module_id, slug);

CREATE UNIQUE INDEX lessons_pkey ON public.lessons USING btree (id);

CREATE UNIQUE INDEX quiz_options_pkey ON public.quiz_options USING btree (id);

CREATE UNIQUE INDEX quiz_options_quiz_question_id_option_id_key ON public.quiz_options USING btree (quiz_question_id, option_id);

CREATE UNIQUE INDEX quiz_options_quiz_question_id_option_order_key ON public.quiz_options USING btree (quiz_question_id, option_order);

alter table "public"."course_lessons" add constraint "course_lessons_pkey" PRIMARY KEY using index "course_lessons_pkey";

alter table "public"."course_modules" add constraint "course_modules_pkey" PRIMARY KEY using index "course_modules_pkey";

alter table "public"."course_quiz_questions" add constraint "course_quiz_questions_pkey" PRIMARY KEY using index "course_quiz_questions_pkey";

alter table "public"."learning_modules" add constraint "learning_modules_pkey" PRIMARY KEY using index "learning_modules_pkey";

alter table "public"."lesson_quizzes" add constraint "lesson_quizzes_pkey" PRIMARY KEY using index "lesson_quizzes_pkey";

alter table "public"."lessons" add constraint "lessons_pkey" PRIMARY KEY using index "lessons_pkey";

alter table "public"."quiz_options" add constraint "quiz_options_pkey" PRIMARY KEY using index "quiz_options_pkey";

alter table "public"."course_lessons" add constraint "course_lessons_module_id_fkey" FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE not valid;

alter table "public"."course_lessons" validate constraint "course_lessons_module_id_fkey";

alter table "public"."course_modules" add constraint "course_modules_title_key" UNIQUE using index "course_modules_title_key";

alter table "public"."course_quiz_questions" add constraint "course_quiz_questions_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE not valid;

alter table "public"."course_quiz_questions" validate constraint "course_quiz_questions_lesson_id_fkey";

alter table "public"."learning_modules" add constraint "learning_modules_level_check" CHECK ((level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]))) not valid;

alter table "public"."learning_modules" validate constraint "learning_modules_level_check";

alter table "public"."learning_modules" add constraint "learning_modules_slug_key" UNIQUE using index "learning_modules_slug_key";

alter table "public"."learning_paths" add constraint "learning_paths_last_updated_by_fkey" FOREIGN KEY (last_updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."learning_paths" validate constraint "learning_paths_last_updated_by_fkey";

alter table "public"."learning_paths" add constraint "learning_paths_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."learning_paths" validate constraint "learning_paths_user_id_fkey";

alter table "public"."lesson_quizzes" add constraint "lesson_quizzes_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_quizzes" validate constraint "lesson_quizzes_lesson_id_fkey";

alter table "public"."lesson_quizzes" add constraint "lesson_quizzes_lesson_id_question_id_key" UNIQUE using index "lesson_quizzes_lesson_id_question_id_key";

alter table "public"."lesson_quizzes" add constraint "lesson_quizzes_lesson_id_question_order_key" UNIQUE using index "lesson_quizzes_lesson_id_question_order_key";

alter table "public"."lessons" add constraint "lessons_module_id_fkey" FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE not valid;

alter table "public"."lessons" validate constraint "lessons_module_id_fkey";

alter table "public"."lessons" add constraint "lessons_module_id_lesson_order_key" UNIQUE using index "lessons_module_id_lesson_order_key";

alter table "public"."lessons" add constraint "lessons_module_id_slug_key" UNIQUE using index "lessons_module_id_slug_key";

alter table "public"."quiz_options" add constraint "quiz_options_quiz_question_id_fkey" FOREIGN KEY (quiz_question_id) REFERENCES lesson_quizzes(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_options" validate constraint "quiz_options_quiz_question_id_fkey";

alter table "public"."quiz_options" add constraint "quiz_options_quiz_question_id_option_id_key" UNIQUE using index "quiz_options_quiz_question_id_option_id_key";

alter table "public"."quiz_options" add constraint "quiz_options_quiz_question_id_option_order_key" UNIQUE using index "quiz_options_quiz_question_id_option_order_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.can_restart_learning_path(path_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    restart_allowed boolean;
BEGIN
    SELECT restart_enabled INTO restart_allowed
    FROM learning_paths
    WHERE id = path_uuid;
    
    RETURN COALESCE(restart_allowed, FALSE);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_learning_path(user_uuid uuid, path_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    current_progress jsonb;
    path_exists boolean;
BEGIN
    -- Check if the learning path exists and allows restarts
    SELECT restart_enabled INTO path_exists
    FROM learning_paths
    WHERE id = path_uuid;
    
    IF NOT COALESCE(path_exists, FALSE) THEN
        RETURN FALSE;
    END IF;
    
    -- Get current progress
    SELECT learning_paths INTO current_progress
    FROM user_education_progress
    WHERE user_id = user_uuid;
    
    -- If no progress record exists, create one
    IF current_progress IS NULL THEN
        INSERT INTO user_education_progress (user_id, learning_paths, last_reset_at)
        VALUES (user_uuid, 
                jsonb_build_object(path_uuid::text, 
                    jsonb_build_object(
                        'completed', false,
                        'progress', 0,
                        'current_module', 0,
                        'started_at', now(),
                        'reset_at', now()
                    )
                ),
                now()
        )
        ON CONFLICT (user_id) DO NOTHING;
        RETURN TRUE;
    END IF;
    
    -- Reset the specific learning path
    UPDATE user_education_progress
    SET learning_paths = COALESCE(learning_paths, '{}'::jsonb) || 
                        jsonb_build_object(
                            path_uuid::text, 
                            jsonb_build_object(
                                'completed', false,
                                'progress', 0,
                                'current_module', 0,
                                'started_at', COALESCE(learning_paths -> path_uuid::text ->> 'started_at', now()::text),
                                'reset_at', now(),
                                'modules_completed', '[]'::jsonb,
                                'quiz_results', '{}'::jsonb
                            )
                        ),
        reset_history = COALESCE(reset_history, '[]'::jsonb) ||
                       jsonb_build_array(
                           jsonb_build_object(
                               'path_id', path_uuid::text,
                               'reset_at', now(),
                               'previous_state', COALESCE(learning_paths -> path_uuid::text, '{}'::jsonb)
                           )
                       ),
        last_reset_at = now(),
        updated_at = now()
    WHERE user_id = user_uuid;
    
    RETURN TRUE;
END;
$function$
;

create or replace view "public"."restartable_learning_paths" as  SELECT learning_paths.id,
    learning_paths.title,
    learning_paths.description,
    learning_paths.level,
    learning_paths.modules,
    learning_paths.completion_requirements,
    learning_paths.estimated_time,
    learning_paths.created_at,
    learning_paths.updated_at
   FROM learning_paths
  WHERE (learning_paths.restart_enabled = true);


grant delete on table "public"."course_lessons" to "anon";

grant insert on table "public"."course_lessons" to "anon";

grant references on table "public"."course_lessons" to "anon";

grant select on table "public"."course_lessons" to "anon";

grant trigger on table "public"."course_lessons" to "anon";

grant truncate on table "public"."course_lessons" to "anon";

grant update on table "public"."course_lessons" to "anon";

grant delete on table "public"."course_lessons" to "authenticated";

grant insert on table "public"."course_lessons" to "authenticated";

grant references on table "public"."course_lessons" to "authenticated";

grant select on table "public"."course_lessons" to "authenticated";

grant trigger on table "public"."course_lessons" to "authenticated";

grant truncate on table "public"."course_lessons" to "authenticated";

grant update on table "public"."course_lessons" to "authenticated";

grant delete on table "public"."course_lessons" to "service_role";

grant insert on table "public"."course_lessons" to "service_role";

grant references on table "public"."course_lessons" to "service_role";

grant select on table "public"."course_lessons" to "service_role";

grant trigger on table "public"."course_lessons" to "service_role";

grant truncate on table "public"."course_lessons" to "service_role";

grant update on table "public"."course_lessons" to "service_role";

grant delete on table "public"."course_modules" to "anon";

grant insert on table "public"."course_modules" to "anon";

grant references on table "public"."course_modules" to "anon";

grant select on table "public"."course_modules" to "anon";

grant trigger on table "public"."course_modules" to "anon";

grant truncate on table "public"."course_modules" to "anon";

grant update on table "public"."course_modules" to "anon";

grant delete on table "public"."course_modules" to "authenticated";

grant insert on table "public"."course_modules" to "authenticated";

grant references on table "public"."course_modules" to "authenticated";

grant select on table "public"."course_modules" to "authenticated";

grant trigger on table "public"."course_modules" to "authenticated";

grant truncate on table "public"."course_modules" to "authenticated";

grant update on table "public"."course_modules" to "authenticated";

grant delete on table "public"."course_modules" to "service_role";

grant insert on table "public"."course_modules" to "service_role";

grant references on table "public"."course_modules" to "service_role";

grant select on table "public"."course_modules" to "service_role";

grant trigger on table "public"."course_modules" to "service_role";

grant truncate on table "public"."course_modules" to "service_role";

grant update on table "public"."course_modules" to "service_role";

grant delete on table "public"."course_quiz_questions" to "anon";

grant insert on table "public"."course_quiz_questions" to "anon";

grant references on table "public"."course_quiz_questions" to "anon";

grant select on table "public"."course_quiz_questions" to "anon";

grant trigger on table "public"."course_quiz_questions" to "anon";

grant truncate on table "public"."course_quiz_questions" to "anon";

grant update on table "public"."course_quiz_questions" to "anon";

grant delete on table "public"."course_quiz_questions" to "authenticated";

grant insert on table "public"."course_quiz_questions" to "authenticated";

grant references on table "public"."course_quiz_questions" to "authenticated";

grant select on table "public"."course_quiz_questions" to "authenticated";

grant trigger on table "public"."course_quiz_questions" to "authenticated";

grant truncate on table "public"."course_quiz_questions" to "authenticated";

grant update on table "public"."course_quiz_questions" to "authenticated";

grant delete on table "public"."course_quiz_questions" to "service_role";

grant insert on table "public"."course_quiz_questions" to "service_role";

grant references on table "public"."course_quiz_questions" to "service_role";

grant select on table "public"."course_quiz_questions" to "service_role";

grant trigger on table "public"."course_quiz_questions" to "service_role";

grant truncate on table "public"."course_quiz_questions" to "service_role";

grant update on table "public"."course_quiz_questions" to "service_role";

grant delete on table "public"."learning_modules" to "anon";

grant insert on table "public"."learning_modules" to "anon";

grant references on table "public"."learning_modules" to "anon";

grant select on table "public"."learning_modules" to "anon";

grant trigger on table "public"."learning_modules" to "anon";

grant truncate on table "public"."learning_modules" to "anon";

grant update on table "public"."learning_modules" to "anon";

grant delete on table "public"."learning_modules" to "authenticated";

grant insert on table "public"."learning_modules" to "authenticated";

grant references on table "public"."learning_modules" to "authenticated";

grant select on table "public"."learning_modules" to "authenticated";

grant trigger on table "public"."learning_modules" to "authenticated";

grant truncate on table "public"."learning_modules" to "authenticated";

grant update on table "public"."learning_modules" to "authenticated";

grant delete on table "public"."learning_modules" to "service_role";

grant insert on table "public"."learning_modules" to "service_role";

grant references on table "public"."learning_modules" to "service_role";

grant select on table "public"."learning_modules" to "service_role";

grant trigger on table "public"."learning_modules" to "service_role";

grant truncate on table "public"."learning_modules" to "service_role";

grant update on table "public"."learning_modules" to "service_role";

grant delete on table "public"."lesson_quizzes" to "anon";

grant insert on table "public"."lesson_quizzes" to "anon";

grant references on table "public"."lesson_quizzes" to "anon";

grant select on table "public"."lesson_quizzes" to "anon";

grant trigger on table "public"."lesson_quizzes" to "anon";

grant truncate on table "public"."lesson_quizzes" to "anon";

grant update on table "public"."lesson_quizzes" to "anon";

grant delete on table "public"."lesson_quizzes" to "authenticated";

grant insert on table "public"."lesson_quizzes" to "authenticated";

grant references on table "public"."lesson_quizzes" to "authenticated";

grant select on table "public"."lesson_quizzes" to "authenticated";

grant trigger on table "public"."lesson_quizzes" to "authenticated";

grant truncate on table "public"."lesson_quizzes" to "authenticated";

grant update on table "public"."lesson_quizzes" to "authenticated";

grant delete on table "public"."lesson_quizzes" to "service_role";

grant insert on table "public"."lesson_quizzes" to "service_role";

grant references on table "public"."lesson_quizzes" to "service_role";

grant select on table "public"."lesson_quizzes" to "service_role";

grant trigger on table "public"."lesson_quizzes" to "service_role";

grant truncate on table "public"."lesson_quizzes" to "service_role";

grant update on table "public"."lesson_quizzes" to "service_role";

grant delete on table "public"."lessons" to "anon";

grant insert on table "public"."lessons" to "anon";

grant references on table "public"."lessons" to "anon";

grant select on table "public"."lessons" to "anon";

grant trigger on table "public"."lessons" to "anon";

grant truncate on table "public"."lessons" to "anon";

grant update on table "public"."lessons" to "anon";

grant delete on table "public"."lessons" to "authenticated";

grant insert on table "public"."lessons" to "authenticated";

grant references on table "public"."lessons" to "authenticated";

grant select on table "public"."lessons" to "authenticated";

grant trigger on table "public"."lessons" to "authenticated";

grant truncate on table "public"."lessons" to "authenticated";

grant update on table "public"."lessons" to "authenticated";

grant delete on table "public"."lessons" to "service_role";

grant insert on table "public"."lessons" to "service_role";

grant references on table "public"."lessons" to "service_role";

grant select on table "public"."lessons" to "service_role";

grant trigger on table "public"."lessons" to "service_role";

grant truncate on table "public"."lessons" to "service_role";

grant update on table "public"."lessons" to "service_role";

grant delete on table "public"."quiz_options" to "anon";

grant insert on table "public"."quiz_options" to "anon";

grant references on table "public"."quiz_options" to "anon";

grant select on table "public"."quiz_options" to "anon";

grant trigger on table "public"."quiz_options" to "anon";

grant truncate on table "public"."quiz_options" to "anon";

grant update on table "public"."quiz_options" to "anon";

grant delete on table "public"."quiz_options" to "authenticated";

grant insert on table "public"."quiz_options" to "authenticated";

grant references on table "public"."quiz_options" to "authenticated";

grant select on table "public"."quiz_options" to "authenticated";

grant trigger on table "public"."quiz_options" to "authenticated";

grant truncate on table "public"."quiz_options" to "authenticated";

grant update on table "public"."quiz_options" to "authenticated";

grant delete on table "public"."quiz_options" to "service_role";

grant insert on table "public"."quiz_options" to "service_role";

grant references on table "public"."quiz_options" to "service_role";

grant select on table "public"."quiz_options" to "service_role";

grant trigger on table "public"."quiz_options" to "service_role";

grant truncate on table "public"."quiz_options" to "service_role";

grant update on table "public"."quiz_options" to "service_role";

create policy "Admins can manage learning modules"
on "public"."learning_modules"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM administrators
  WHERE (administrators.user_id = auth.uid()))));


create policy "Anyone can view learning modules"
on "public"."learning_modules"
as permissive
for select
to public
using ((is_active = true));


create policy "Admins can manage template learning paths"
on "public"."learning_paths"
as permissive
for all
to authenticated
using (((is_template = true) AND (EXISTS ( SELECT 1
   FROM administrators
  WHERE (administrators.user_id = auth.uid())))))
with check (((is_template = true) AND (EXISTS ( SELECT 1
   FROM administrators
  WHERE (administrators.user_id = auth.uid())))));


create policy "Anyone can view template learning paths"
on "public"."learning_paths"
as permissive
for select
to authenticated
using ((is_template = true));


create policy "Users can create own learning paths"
on "public"."learning_paths"
as permissive
for insert
to authenticated
with check (((auth.uid() = user_id) AND ((is_template = false) OR (is_template IS NULL))));


create policy "Users can delete own learning paths"
on "public"."learning_paths"
as permissive
for delete
to authenticated
using (((auth.uid() = user_id) AND ((is_template = false) OR (is_template IS NULL))));


create policy "Users can update own learning paths"
on "public"."learning_paths"
as permissive
for update
to authenticated
using (((auth.uid() = user_id) AND ((is_template = false) OR (is_template IS NULL))))
with check (((auth.uid() = user_id) AND ((is_template = false) OR (is_template IS NULL))));


create policy "Users can view own learning paths"
on "public"."learning_paths"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Admins can manage lesson quizzes"
on "public"."lesson_quizzes"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM administrators
  WHERE (administrators.user_id = auth.uid()))));


create policy "Anyone can view lesson quizzes"
on "public"."lesson_quizzes"
as permissive
for select
to public
using (true);


create policy "Admins can manage lessons"
on "public"."lessons"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM administrators
  WHERE (administrators.user_id = auth.uid()))));


create policy "Anyone can view lessons"
on "public"."lessons"
as permissive
for select
to public
using ((is_active = true));


create policy "Admins can manage quiz options"
on "public"."quiz_options"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM administrators
  WHERE (administrators.user_id = auth.uid()))));


create policy "Anyone can view quiz options"
on "public"."quiz_options"
as permissive
for select
to public
using (true);


CREATE TRIGGER update_learning_modules_updated_at BEFORE UPDATE ON public.learning_modules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_lesson_quizzes_updated_at BEFORE UPDATE ON public.lesson_quizzes FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


