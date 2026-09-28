-- SalãoAgenda v0.1.0: schema do domínio (Documento de Análise e Projeto v2)
-- Cliente, Agendamento, Serviço e Funcionário (abstrato) com as
-- especializações Recepcionista e Profissional.

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

create table servico (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  duracao_min  int not null check (duracao_min > 0),
  preco        numeric(10,2) null,
  ativo        boolean not null default true
);

create table funcionario (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  numero_funcional  text not null unique,
  tipo              text not null check (tipo in ('recepcionista', 'profissional'))
);

create table recepcionista (
  funcionario_id  uuid primary key references funcionario (id),
  turno           text not null
);

create table profissional (
  funcionario_id  uuid primary key references funcionario (id),
  especialidade   text not null
);

-- Quem faz o quê.
create table profissional_servico (
  profissional_id  uuid not null references profissional (funcionario_id),
  servico_id       uuid not null references servico (id),
  primary key (profissional_id, servico_id)
);

create table cliente (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  telefone   text not null unique check (telefone ~ '^[0-9]{10,11}$'),
  email      text not null,
  criado_em  timestamptz not null default now()
);

-- 0 = domingo ... 6 = sábado (mesma convenção de extract(dow)).
create table horario_funcionamento (
  dia_semana  smallint primary key check (dia_semana between 0 and 6),
  abre        time not null,
  fecha       time not null,
  check (fecha > abre)
);

create table agendamento (
  id                uuid primary key default gen_random_uuid(),
  codigo            text not null unique,
  data              date not null,
  hora_inicio       time not null,
  hora_fim          time not null,
  status            text not null default 'confirmado'
                    check (status in ('solicitado', 'confirmado', 'realizado', 'cancelado')),
  cliente_id        uuid not null references cliente (id),
  profissional_id   uuid not null references profissional (funcionario_id),
  recepcionista_id  uuid not null references recepcionista (funcionario_id),
  criado_em         timestamptz not null default now(),
  periodo           tsrange generated always as
                    (tsrange(data + hora_inicio, data + hora_fim, '[)')) stored,
  check (hora_fim > hora_inicio),
  -- OF08/ONF05: um profissional não atende dois agendamentos ao mesmo tempo.
  constraint agendamento_sem_sobreposicao
    exclude using gist (profissional_id with =, periodo with &&)
    where (status <> 'cancelado')
);

create index agendamento_data_idx on agendamento (data);
create index agendamento_cliente_idx on agendamento (cliente_id);

create table agendamento_servico (
  agendamento_id  uuid not null references agendamento (id) on delete cascade,
  servico_id      uuid not null references servico (id),
  primary key (agendamento_id, servico_id)
);

create index agendamento_servico_servico_idx on agendamento_servico (servico_id);
create index profissional_servico_servico_idx on profissional_servico (servico_id);
