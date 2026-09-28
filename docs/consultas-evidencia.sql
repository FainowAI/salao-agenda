-- Consultas diretas para o vídeo (Supabase > SQL Editor).
-- Provam que os dados gravados pela aplicação estão no PostgreSQL.

-- 0. A consulta citada no roteiro do vídeo.
select * from agendamento order by criado_em desc limit 5;

-- 1. Últimos agendamentos com cliente, serviço e profissional.
--    O primeiro da lista deve ter o mesmo código do comprovante.
select a.codigo,
       a.criado_em,
       a.data,
       a.hora_inicio,
       a.hora_fim,
       a.status,
       c.nome      as cliente,
       c.telefone,
       s.nome      as servico,
       fp.nome     as profissional,
       fr.nome     as registrado_por
from agendamento a
join cliente c              on c.id = a.cliente_id
join agendamento_servico ag on ag.agendamento_id = a.id
join servico s              on s.id = ag.servico_id
join funcionario fp         on fp.id = a.profissional_id
join funcionario fr         on fr.id = a.recepcionista_id
order by a.criado_em desc
limit 10;

-- 2. Contagem por status.
select status, count(*) as quantidade
from agendamento
group by status
order by status;

-- 3. Agenda de um profissional numa data (troque o nome e a data).
--    Rafael Souza em 2026-10-16 é o dia lotado do seed.
select a.hora_inicio, a.hora_fim, s.nome as servico, c.nome as cliente, a.status, a.codigo
from agendamento a
join funcionario f          on f.id = a.profissional_id
join agendamento_servico ag on ag.agendamento_id = a.id
join servico s              on s.id = ag.servico_id
join cliente c              on c.id = a.cliente_id
where f.nome = 'Rafael Souza'
  and a.data = date '2026-10-16'
order by a.hora_inicio;

-- 4. O horário confirmado sumiu da consulta: a mesma função que o site chama.
--    (troque o serviço, o profissional e a data pelos do agendamento recém-criado)
select *
from horarios_disponiveis(
  (select id from servico where nome = 'Corte masculino'),
  (select id from funcionario where nome = 'Rafael Souza'),
  date '2026-10-20'
);
