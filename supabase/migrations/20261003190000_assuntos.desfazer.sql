-- Desfaz 20261003190000_assuntos.sql. Apaga SÓ o que ela criou; catálogo, áreas e coleções não são tocados.
-- A cópia de segurança (schema backup) é mantida de propósito.
drop table if exists public.material_topics;
drop table if exists public.material_drafts;
drop table if exists public.topics;
drop function if exists private.topic_slug(text);
drop function if exists private.topic_norm(text);
