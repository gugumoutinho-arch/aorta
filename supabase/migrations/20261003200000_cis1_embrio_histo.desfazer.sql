-- Desfaz 20261003200000_cis1_embrio_histo.sql: devolve materiais e assuntos para Práticas Médicas e remove as duas matérias.
update public.materials set area_id = 'cis1-pm' where area_id in ('cis1-embrio', 'cis1-histo');
update public.topics set area_id = 'cis1-pm' where area_id in ('cis1-embrio', 'cis1-histo');
delete from public.areas where id in ('cis1-embrio', 'cis1-histo')
  and not exists (select 1 from public.materials m where m.area_id in ('cis1-embrio', 'cis1-histo'));
