-- Cria as matérias Embriologia e Histologia no CIS 1 e move para elas os materiais (e seus assuntos)
-- que estavam em Práticas Médicas (cis1-pm), pela etiqueta "Embriologia" ou "Histologia". Pedido do dono, 03/10.
-- Pode rodar de novo sem efeito. Desfazer: 20261003200000_cis1_embrio_histo.desfazer.sql.

insert into public.areas (id, name, parent_id, sort_order, stain, short) values
  ('cis1-embrio', 'Embriologia', 'cis1', 3, 'masson', 'EMBRIO'),
  ('cis1-histo', 'Histologia', 'cis1', 4, 'pas', 'HISTO')
on conflict (id) do nothing;

-- Assuntos acompanham os materiais (cada assunto de cis1-pm pertence a uma só das duas matérias).
update public.topics t set area_id = 'cis1-embrio'
where t.area_id = 'cis1-pm' and exists (
  select 1 from public.material_topics mt join public.materials m on m.id = mt.material_id
  where mt.topic_id = t.id and 'Embriologia' = any(m.tags));

update public.topics t set area_id = 'cis1-histo'
where t.area_id = 'cis1-pm' and exists (
  select 1 from public.material_topics mt join public.materials m on m.id = mt.material_id
  where mt.topic_id = t.id and 'Histologia' = any(m.tags));

update public.materials set area_id = 'cis1-embrio' where area_id = 'cis1-pm' and 'Embriologia' = any(tags);
update public.materials set area_id = 'cis1-histo' where area_id = 'cis1-pm' and 'Histologia' = any(tags);
