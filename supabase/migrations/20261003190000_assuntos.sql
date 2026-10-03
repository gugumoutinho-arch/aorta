-- F1 · P1.0 — Assuntos dentro da matéria (C-19), ligação material ↔ assunto (D11) e rascunhos da colagem (C-20a).
-- Só acrescenta: nenhuma tabela, coluna ou regra existente é alterada ou apagada.
-- Acesso igual ao das tabelas atuais: só quem passa em private.is_librarian() lê e grava; anon não tem acesso.
-- Desfazer: ver 20261003190000_assuntos.desfazer.sql (apaga só o que esta migração criou).

-- 1) Cópia de segurança dentro do banco, num schema que a API não expõe.
create schema if not exists backup;
revoke all on schema backup from public, anon, authenticated;
create table backup.areas_20261003 as table public.areas;
create table backup.collections_20261003 as table public.collections;
create table backup.materials_20261003 as table public.materials;
alter table backup.areas_20261003 enable row level security;
alter table backup.collections_20261003 enable row level security;
alter table backup.materials_20261003 enable row level security;

-- 2) Normalização e slug, as mesmas regras de src/domain (testadas no node --test).
create or replace function private.topic_norm(value text) returns text
  language sql immutable parallel safe set search_path = ''
as $$
  select btrim(regexp_replace(
    translate(lower(coalesce(value, '')), 'áàâãäéèêëíìîïóòôõöúùûüçñªº', 'aaaaaeeeeiiiiooooouuuucnao'),
    '\s+', ' ', 'g'))
$$;

create or replace function private.topic_slug(value text) returns text
  language sql immutable parallel safe set search_path = ''
as $$
  select btrim(regexp_replace(private.topic_norm(value), '[^a-z0-9]+', '-', 'g'), '-')
$$;

-- 3) Assuntos de uma matéria (ex.: Anatomia › Membro superior).
create table public.topics (
  id text primary key default gen_random_uuid()::text,
  area_id text not null references public.areas (id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 80),
  normalized_name text generated always as (private.topic_norm(name)) stored,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug not in ('casos', 'todos', 'tipos')),
  slug_aliases text[] not null default '{}',
  sort_order integer not null default 0 check (sort_order >= 0),
  body_region text check (body_region is null or body_region ~ '^[a-z]+(-[a-z]+)*$'),
  created_at timestamptz not null default now(),
  unique (area_id, normalized_name),
  unique (area_id, slug)
);
create index topics_area_order_idx on public.topics (area_id, sort_order);

-- 4) Material ↔ assunto, muitos-para-muitos (um caso clínico pode servir a Anatomia e a Embriologia).
create table public.material_topics (
  material_id text not null references public.materials (id) on delete cascade,
  topic_id text not null references public.topics (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (material_id, topic_id)
);
create index material_topics_topic_idx on public.material_topics (topic_id, material_id);

-- 5) Rascunhos da importação por colagem: nada vira material sem ação explícita do editor.
create table public.material_drafts (
  id text primary key default gen_random_uuid()::text,
  url text not null check (url ~* '^https://' and length(url) <= 2000),
  path text not null default '' check (length(path) <= 300),
  type text not null default '' check (length(type) <= 40),
  title text not null default '' check (length(title) <= 200),
  source text not null default '' check (length(source) <= 120),
  year text not null default '' check (year = '' or year ~ '^\d{4}$'),
  rights text not null default 'pendente' check (rights in ('proprio', 'autorizado', 'licenca-aberta', 'publico', 'pendente')),
  area_id text not null default '',
  topic_ids text[] not null default '{}',
  drive_file_id text not null default '',
  status text not null default 'rascunho' check (status in ('rascunho', 'ignorado', 'publicado')),
  material_id text,
  problems text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index material_drafts_drive_file_idx on public.material_drafts (drive_file_id)
  where drive_file_id <> '' and status <> 'ignorado';

-- 6) Acesso: o mesmo das tabelas existentes.
alter table public.topics enable row level security;
alter table public.material_topics enable row level security;
alter table public.material_drafts enable row level security;
revoke all on public.topics, public.material_topics, public.material_drafts from anon;
create policy "bibliotecaria le e grava assuntos" on public.topics for all to authenticated
  using ((select private.is_librarian())) with check ((select private.is_librarian()));
create policy "bibliotecaria le e grava ligacoes de assunto" on public.material_topics for all to authenticated
  using ((select private.is_librarian())) with check ((select private.is_librarian()));
create policy "bibliotecaria le e grava rascunhos" on public.material_drafts for all to authenticated
  using ((select private.is_librarian())) with check ((select private.is_librarian()));

-- 7) Preenche a partir do campo de texto atual (materials.subject continua existindo e não muda).
insert into public.topics (area_id, name, slug, sort_order)
select m.area_id, min(btrim(m.subject)), private.topic_slug(min(btrim(m.subject))),
       (row_number() over (partition by m.area_id order by min(m.created_at)) - 1)::int
from public.materials m
where btrim(m.subject) <> '' and exists (select 1 from public.areas a where a.id = m.area_id)
group by m.area_id, private.topic_norm(m.subject)
on conflict do nothing;

insert into public.material_topics (material_id, topic_id)
select m.id, t.id
from public.materials m
join public.topics t on t.area_id = m.area_id and t.normalized_name = private.topic_norm(m.subject)
where btrim(m.subject) <> ''
on conflict do nothing;
