create table "public"."blog_categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "description" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."blog_categories" enable row level security;

create table "public"."blog_post_categories" (
    "blog_post_id" uuid not null,
    "category_id" uuid not null
);


alter table "public"."blog_post_categories" enable row level security;

create table "public"."blog_posts" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "title" text not null,
    "content" text not null,
    "excerpt" text,
    "featured_image" text,
    "author_id" uuid,
    "status" text not null default 'draft'::text,
    "published_at" timestamp with time zone,
    "tags" text[] default '{}'::text[],
    "meta_description" text,
    "meta_keywords" text[],
    "views" integer default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."blog_posts" enable row level security;

CREATE UNIQUE INDEX blog_categories_name_key ON public.blog_categories USING btree (name);

CREATE UNIQUE INDEX blog_categories_pkey ON public.blog_categories USING btree (id);

CREATE UNIQUE INDEX blog_categories_slug_key ON public.blog_categories USING btree (slug);

CREATE UNIQUE INDEX blog_post_categories_pkey ON public.blog_post_categories USING btree (blog_post_id, category_id);

CREATE UNIQUE INDEX blog_posts_pkey ON public.blog_posts USING btree (id);

CREATE UNIQUE INDEX blog_posts_slug_key ON public.blog_posts USING btree (slug);

CREATE INDEX idx_blog_categories_slug ON public.blog_categories USING btree (slug);

CREATE INDEX idx_blog_posts_author_id ON public.blog_posts USING btree (author_id);

CREATE INDEX idx_blog_posts_published_at ON public.blog_posts USING btree (published_at DESC);

CREATE INDEX idx_blog_posts_slug ON public.blog_posts USING btree (slug);

CREATE INDEX idx_blog_posts_status ON public.blog_posts USING btree (status);

CREATE INDEX idx_blog_posts_tags ON public.blog_posts USING gin (tags);

alter table "public"."blog_categories" add constraint "blog_categories_pkey" PRIMARY KEY using index "blog_categories_pkey";

alter table "public"."blog_post_categories" add constraint "blog_post_categories_pkey" PRIMARY KEY using index "blog_post_categories_pkey";

alter table "public"."blog_posts" add constraint "blog_posts_pkey" PRIMARY KEY using index "blog_posts_pkey";

alter table "public"."blog_categories" add constraint "blog_categories_name_key" UNIQUE using index "blog_categories_name_key";

alter table "public"."blog_categories" add constraint "blog_categories_slug_key" UNIQUE using index "blog_categories_slug_key";

alter table "public"."blog_post_categories" add constraint "blog_post_categories_blog_post_id_fkey" FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE not valid;

alter table "public"."blog_post_categories" validate constraint "blog_post_categories_blog_post_id_fkey";

alter table "public"."blog_post_categories" add constraint "blog_post_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE CASCADE not valid;

alter table "public"."blog_post_categories" validate constraint "blog_post_categories_category_id_fkey";

alter table "public"."blog_posts" add constraint "blog_posts_author_id_fkey" FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."blog_posts" validate constraint "blog_posts_author_id_fkey";

alter table "public"."blog_posts" add constraint "blog_posts_slug_key" UNIQUE using index "blog_posts_slug_key";

alter table "public"."blog_posts" add constraint "blog_posts_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text]))) not valid;

alter table "public"."blog_posts" validate constraint "blog_posts_status_check";

set check_function_bodies = off;

create or replace view "public"."blog_authors" as  SELECT u.id,
    COALESCE(((p.first_name || ' '::text) || p.last_name), (u.email)::text) AS name,
    p.email,
    u.created_at
   FROM (auth.users u
     LEFT JOIN profiles p ON ((p.id = u.id)));


CREATE OR REPLACE FUNCTION public.increment_blog_post_views(post_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.blog_posts 
  SET views = views + 1 
  WHERE id = post_id;
END;
$function$
;

grant delete on table "public"."blog_categories" to "anon";

grant insert on table "public"."blog_categories" to "anon";

grant references on table "public"."blog_categories" to "anon";

grant select on table "public"."blog_categories" to "anon";

grant trigger on table "public"."blog_categories" to "anon";

grant truncate on table "public"."blog_categories" to "anon";

grant update on table "public"."blog_categories" to "anon";

grant delete on table "public"."blog_categories" to "authenticated";

grant insert on table "public"."blog_categories" to "authenticated";

grant references on table "public"."blog_categories" to "authenticated";

grant select on table "public"."blog_categories" to "authenticated";

grant trigger on table "public"."blog_categories" to "authenticated";

grant truncate on table "public"."blog_categories" to "authenticated";

grant update on table "public"."blog_categories" to "authenticated";

grant delete on table "public"."blog_categories" to "service_role";

grant insert on table "public"."blog_categories" to "service_role";

grant references on table "public"."blog_categories" to "service_role";

grant select on table "public"."blog_categories" to "service_role";

grant trigger on table "public"."blog_categories" to "service_role";

grant truncate on table "public"."blog_categories" to "service_role";

grant update on table "public"."blog_categories" to "service_role";

grant delete on table "public"."blog_post_categories" to "anon";

grant insert on table "public"."blog_post_categories" to "anon";

grant references on table "public"."blog_post_categories" to "anon";

grant select on table "public"."blog_post_categories" to "anon";

grant trigger on table "public"."blog_post_categories" to "anon";

grant truncate on table "public"."blog_post_categories" to "anon";

grant update on table "public"."blog_post_categories" to "anon";

grant delete on table "public"."blog_post_categories" to "authenticated";

grant insert on table "public"."blog_post_categories" to "authenticated";

grant references on table "public"."blog_post_categories" to "authenticated";

grant select on table "public"."blog_post_categories" to "authenticated";

grant trigger on table "public"."blog_post_categories" to "authenticated";

grant truncate on table "public"."blog_post_categories" to "authenticated";

grant update on table "public"."blog_post_categories" to "authenticated";

grant delete on table "public"."blog_post_categories" to "service_role";

grant insert on table "public"."blog_post_categories" to "service_role";

grant references on table "public"."blog_post_categories" to "service_role";

grant select on table "public"."blog_post_categories" to "service_role";

grant trigger on table "public"."blog_post_categories" to "service_role";

grant truncate on table "public"."blog_post_categories" to "service_role";

grant update on table "public"."blog_post_categories" to "service_role";

grant delete on table "public"."blog_posts" to "anon";

grant insert on table "public"."blog_posts" to "anon";

grant references on table "public"."blog_posts" to "anon";

grant select on table "public"."blog_posts" to "anon";

grant trigger on table "public"."blog_posts" to "anon";

grant truncate on table "public"."blog_posts" to "anon";

grant update on table "public"."blog_posts" to "anon";

grant delete on table "public"."blog_posts" to "authenticated";

grant insert on table "public"."blog_posts" to "authenticated";

grant references on table "public"."blog_posts" to "authenticated";

grant select on table "public"."blog_posts" to "authenticated";

grant trigger on table "public"."blog_posts" to "authenticated";

grant truncate on table "public"."blog_posts" to "authenticated";

grant update on table "public"."blog_posts" to "authenticated";

grant delete on table "public"."blog_posts" to "service_role";

grant insert on table "public"."blog_posts" to "service_role";

grant references on table "public"."blog_posts" to "service_role";

grant select on table "public"."blog_posts" to "service_role";

grant trigger on table "public"."blog_posts" to "service_role";

grant truncate on table "public"."blog_posts" to "service_role";

grant update on table "public"."blog_posts" to "service_role";

create policy "Admins can manage blog categories"
on "public"."blog_categories"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM administrators
  WHERE (administrators.user_id = auth.uid()))));


create policy "Anyone can view blog categories"
on "public"."blog_categories"
as permissive
for select
to public
using (true);


create policy "Anyone can view blog post categories"
on "public"."blog_post_categories"
as permissive
for select
to public
using (true);


create policy "Authors can manage their post categories"
on "public"."blog_post_categories"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM blog_posts
  WHERE ((blog_posts.id = blog_post_categories.blog_post_id) AND (blog_posts.author_id = auth.uid())))));


create policy "Admins can manage all blog posts"
on "public"."blog_posts"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM administrators
  WHERE (administrators.user_id = auth.uid()))));


create policy "Anyone can view published blog posts"
on "public"."blog_posts"
as permissive
for select
to public
using (((status = 'published'::text) AND (published_at <= now())));


create policy "Authors can create blog posts"
on "public"."blog_posts"
as permissive
for insert
to public
with check ((auth.uid() = author_id));


create policy "Authors can delete own blog posts"
on "public"."blog_posts"
as permissive
for delete
to public
using ((auth.uid() = author_id));


create policy "Authors can update own blog posts"
on "public"."blog_posts"
as permissive
for update
to public
using ((auth.uid() = author_id));


create policy "Authors can view own blog posts"
on "public"."blog_posts"
as permissive
for select
to public
using ((auth.uid() = author_id));


CREATE TRIGGER handle_blog_categories_updated_at BEFORE UPDATE ON public.blog_categories FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


