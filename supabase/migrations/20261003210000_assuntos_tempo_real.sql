-- Assuntos e ligações também avisam o site quando mudam, como areas, collections e materials.
-- O tempo real respeita a RLS: só quem passa em private.is_librarian() recebe os avisos.
-- Desfazer: alter publication supabase_realtime drop table public.topics, public.material_topics;
alter publication supabase_realtime add table public.topics, public.material_topics;
