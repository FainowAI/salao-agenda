-- Testes das regras de negócio no banco. Roda dentro de uma transação
-- desfeita no final: não deixa dados para trás.
-- Uso: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/regras.sql
--      (ou cole no SQL Editor do Supabase). Qualquer falha aborta com erro.

begin;

-- Terça-feira pelo menos 7 dias à frente: dia de funcionamento, sem risco de "hoje".
create temporary table t_ctx on commit drop as
select (current_date + ((2 - extract(dow from current_date)::int + 7) % 7) + 7)::date as dia,
       '11111111-0000-0000-0000-000000000001'::uuid as corte,
       '11111111-0000-0000-0000-000000000003'::uuid as corte_fem,
       '22222222-0000-0000-0000-000000000001'::uuid as rafael,
       '22222222-0000-0000-0000-000000000002'::uuid as juliana;

-- 1. Um horário sobreposto é rejeitado.
do $$
declare
  c t_ctx%rowtype;
  v_codigo text;
begin
  select * into c from t_ctx;

  select codigo into v_codigo
  from confirmar_agendamento(c.corte_fem, c.juliana, c.dia, '10:00',
                             'Teste Um', '(11) 90000-0001', 'teste1@example.com');
  assert v_codigo ~ '^SA-[A-Z2-9]{5}$', 'código fora do formato: ' || v_codigo;

  -- Pela RPC: 10:30 cai dentro de 10:00–11:00.
  begin
    perform * from confirmar_agendamento(c.corte, c.juliana, c.dia, '10:30',
                                         'Teste Dois', '11900000002', 'teste2@example.com');
    raise exception 'FALHOU: RPC aceitou horário sobreposto';
  exception when others then
    assert sqlerrm = 'HORARIO_OCUPADO', 'erro inesperado da RPC: ' || sqlerrm;
  end;

  -- Direto na tabela: a exclusion constraint barra mesmo sem passar pela RPC.
  begin
    insert into agendamento (codigo, data, hora_inicio, hora_fim, cliente_id, profissional_id, recepcionista_id)
    select 'SA-TESTE', c.dia, '10:15', '10:45', cl.id, c.juliana, '22222222-0000-0000-0000-000000000009'
    from cliente cl where cl.telefone = '11900000001';
    raise exception 'FALHOU: tabela aceitou horário sobreposto';
  exception when exclusion_violation then
    null;
  end;

  raise notice 'OK 1: horário sobreposto é rejeitado (RPC e constraint)';
end $$;

-- 2. A função não devolve horário fora do funcionamento.
do $$
declare
  c t_ctx%rowtype;
  v_fora int;
  v_total int;
  v_segunda int;
begin
  select * into c from t_ctx;

  select count(*) filter (where h.hora_inicio < hf.abre or h.hora_fim > hf.fecha), count(*)
    into v_fora, v_total
  from horarios_disponiveis(c.corte_fem, null, c.dia) h
  cross join horario_funcionamento hf
  where hf.dia_semana = extract(dow from c.dia);

  assert v_total > 0, 'nenhum horário devolvido num dia de funcionamento';
  assert v_fora = 0, v_fora || ' horário(s) fora do funcionamento';

  -- O último início possível de um serviço de 60 min é 18:00.
  assert (select max(hora_inicio) from horarios_disponiveis(c.corte_fem, null, c.dia)) = '18:00',
         'último horário de 60 min deveria ser 18:00';

  -- Segunda-feira: salão fechado.
  select count(*) into v_segunda from horarios_disponiveis(c.corte, null, c.dia - 1);
  assert v_segunda = 0, 'segunda-feira devolveu horários';

  raise notice 'OK 2: nenhum horário fora do funcionamento (% horários conferidos)', v_total;
end $$;

-- 3. Um horário recém-confirmado some de horarios_disponiveis.
do $$
declare
  c t_ctx%rowtype;
begin
  select * into c from t_ctx;

  assert exists (select 1 from horarios_disponiveis(c.corte, c.rafael, c.dia) where hora_inicio = '15:00'),
         '15:00 deveria estar livre antes da confirmação';

  perform * from confirmar_agendamento(c.corte, c.rafael, c.dia, '15:00',
                                       'Teste Três', '11900000003', 'teste3@example.com');

  assert not exists (select 1 from horarios_disponiveis(c.corte, c.rafael, c.dia) where hora_inicio = '15:00'),
         '15:00 continua disponível depois da confirmação';

  raise notice 'OK 3: horário confirmado some da consulta';
end $$;

rollback;
