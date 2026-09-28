-- RPCs do UC01 e do UC02. Toda escrita do site passa por aqui.
-- Erros de negócio saem como exceção cuja mensagem é um código que o front reconhece:
--   DATA_PASSADA, SERVICO_INVALIDO, PROFISSIONAL_INVALIDO, DADOS_INVALIDOS,
--   HORARIO_INVALIDO, HORARIO_OCUPADO.

-- Horário local do salão (o banco roda em UTC).
create or replace function agora_local()
returns timestamp
language sql
stable
set search_path = public, pg_temp
as $$
  select (now() at time zone 'America/Sao_Paulo')
$$;

-- UC01: horários livres. p_profissional_id null = qualquer profissional habilitado (A2).
-- Um horário só aparece se [início, início + duração) cabe no funcionamento e está
-- livre na agenda do profissional. Grade de 30 em 30 minutos.
create or replace function horarios_disponiveis(
  p_servico_id       uuid,
  p_profissional_id  uuid,
  p_data             date
)
returns table (
  profissional_id    uuid,
  profissional_nome  text,
  hora_inicio        time,
  hora_fim           time
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_duracao  int;
  v_agora    timestamp := agora_local();
begin
  if p_data is null or p_data < v_agora::date then
    raise exception 'DATA_PASSADA';
  end if;

  select s.duracao_min into v_duracao
  from servico s
  where s.id = p_servico_id and s.ativo;

  if v_duracao is null then
    raise exception 'SERVICO_INVALIDO';
  end if;

  return query
  select p.funcionario_id,
         f.nome,
         g.inicio::time,
         (g.inicio + make_interval(mins => v_duracao))::time
  from horario_funcionamento hf
  cross join lateral generate_series(
    p_data + hf.abre,
    p_data + hf.fecha - make_interval(mins => v_duracao),
    interval '30 minutes'
  ) as g(inicio)
  join profissional_servico ps on ps.servico_id = p_servico_id
  join profissional p on p.funcionario_id = ps.profissional_id
  join funcionario f on f.id = p.funcionario_id
  where hf.dia_semana = extract(dow from p_data)
    and (p_profissional_id is null or p.funcionario_id = p_profissional_id)
    and g.inicio > v_agora
    and not exists (
      select 1
      from agendamento a
      where a.profissional_id = p.funcionario_id
        and a.status <> 'cancelado'
        and a.periodo && tsrange(g.inicio, g.inicio + make_interval(mins => v_duracao), '[)')
    )
  order by g.inicio, f.nome;
end
$$;

-- UC02 A2: reaproveita o cliente pelo telefone. Devolve só nome e e-mail.
create or replace function buscar_cliente_por_telefone(p_telefone text)
returns table (nome text, email text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select c.nome, c.email
  from cliente c
  where c.telefone = regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g')
$$;

-- UC02: confirma o agendamento e devolve o comprovante.
-- A garantia de não sobreposição é a exclusion constraint agendamento_sem_sobreposicao;
-- a violação dela vira HORARIO_OCUPADO (A1).
create or replace function confirmar_agendamento(
  p_servico_id       uuid,
  p_profissional_id  uuid,
  p_data             date,
  p_hora_inicio      time,
  p_nome             text,
  p_telefone         text,
  p_email            text
)
returns table (
  codigo             text,
  servico_nome       text,
  profissional_nome  text,
  data               date,
  hora_inicio        time,
  hora_fim           time,
  cliente_nome       text
)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_nome           text := btrim(coalesce(p_nome, ''));
  v_telefone       text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_email          text := lower(btrim(coalesce(p_email, '')));
  v_servico        servico%rowtype;
  v_prof_nome      text;
  v_hora_fim       time;
  v_recepcionista  uuid;
  v_cliente        uuid;
  v_agendamento    uuid;
  v_codigo         text;
begin
  if v_nome = ''
     or length(v_telefone) not between 10 and 11
     or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'DADOS_INVALIDOS';
  end if;

  select * into v_servico from servico s where s.id = p_servico_id and s.ativo;
  if not found then
    raise exception 'SERVICO_INVALIDO';
  end if;

  select f.nome into v_prof_nome
  from profissional_servico ps
  join funcionario f on f.id = ps.profissional_id
  where ps.profissional_id = p_profissional_id and ps.servico_id = p_servico_id;
  if not found then
    raise exception 'PROFISSIONAL_INVALIDO';
  end if;

  if p_hora_inicio is null then
    raise exception 'HORARIO_INVALIDO';
  end if;
  v_hora_fim := p_hora_inicio + make_interval(mins => v_servico.duracao_min);

  -- O horário precisa ser um dos que a consulta ofereceria agora
  -- (grade, funcionamento, data futura e livre).
  if not exists (
    select 1
    from horarios_disponiveis(p_servico_id, p_profissional_id, p_data) h
    where h.hora_inicio = p_hora_inicio
  ) then
    if exists (
      select 1
      from agendamento a
      where a.profissional_id = p_profissional_id
        and a.status <> 'cancelado'
        and a.periodo && tsrange(p_data + p_hora_inicio, p_data + v_hora_fim, '[)')
    ) then
      raise exception 'HORARIO_OCUPADO';
    end if;
    raise exception 'HORARIO_INVALIDO';
  end if;

  -- OF09: as marcações do site ficam em nome da recepcionista "Atendimento Online".
  select r.funcionario_id into v_recepcionista
  from recepcionista r
  join funcionario f on f.id = r.funcionario_id
  where f.numero_funcional = 'REC-ONLINE';
  if v_recepcionista is null then
    raise exception 'RECEPCIONISTA_ONLINE_AUSENTE';
  end if;

  insert into cliente as c (nome, telefone, email)
  values (v_nome, v_telefone, v_email)
  on conflict (telefone) do update
    set nome = excluded.nome, email = excluded.email
  returning c.id into v_cliente;

  loop
    v_codigo := 'SA-' || (
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
      from generate_series(1, 5)
    );
    begin
      insert into agendamento (codigo, data, hora_inicio, hora_fim,
                               cliente_id, profissional_id, recepcionista_id)
      values (v_codigo, p_data, p_hora_inicio, v_hora_fim,
              v_cliente, p_profissional_id, v_recepcionista)
      returning id into v_agendamento;
      exit;
    exception
      when unique_violation then
        null; -- código repetido: sorteia outro
      when exclusion_violation then
        raise exception 'HORARIO_OCUPADO';
    end;
  end loop;

  insert into agendamento_servico (agendamento_id, servico_id)
  values (v_agendamento, p_servico_id);

  return query
  select v_codigo, v_servico.nome, v_prof_nome, p_data, p_hora_inicio, v_hora_fim, v_nome;
end
$$;

-- Só as três RPCs ficam expostas ao anon.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function horarios_disponiveis(uuid, uuid, date) to anon, authenticated;
grant execute on function buscar_cliente_por_telefone(text) to anon, authenticated;
grant execute on function confirmar_agendamento(uuid, uuid, date, time, text, text, text) to anon, authenticated;
