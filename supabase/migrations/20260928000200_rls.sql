-- RLS e privilégios.
-- O anon só lê o catálogo (serviços ativos, profissionais e quem faz o quê).
-- Nenhuma escrita direta: tudo passa pelas RPCs (migration seguinte).
-- Dados pessoais de cliente não são legíveis pelo anon (ONF06).

alter table servico               enable row level security;
alter table funcionario           enable row level security;
alter table recepcionista         enable row level security;
alter table profissional          enable row level security;
alter table profissional_servico  enable row level security;
alter table cliente               enable row level security;
alter table horario_funcionamento enable row level security;
alter table agendamento           enable row level security;
alter table agendamento_servico   enable row level security;

-- O Supabase concede tudo ao anon/authenticated por padrão; zera e concede só o necessário.
revoke all on all tables in schema public from anon, authenticated;

grant select on servico to anon, authenticated;
grant select (id, nome, tipo) on funcionario to anon, authenticated;
grant select on profissional to anon, authenticated;
grant select on profissional_servico to anon, authenticated;

create policy servico_ativo_leitura on servico
  for select to anon, authenticated
  using (ativo);

create policy funcionario_profissional_leitura on funcionario
  for select to anon, authenticated
  using (tipo = 'profissional');

create policy profissional_leitura on profissional
  for select to anon, authenticated
  using (true);

create policy profissional_servico_leitura on profissional_servico
  for select to anon, authenticated
  using (true);
