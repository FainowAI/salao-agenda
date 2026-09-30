# SalãoAgenda

Sistema web de agendamento para salão de beleza e barbearia. O cliente escolhe serviço, profissional e data, vê só os horários realmente livres e confirma o atendimento sem precisar de cadastro prévio.

Projeto acadêmico individual de Antônio Marberger na disciplina Prática Profissional em ADS (Mackenzie EaD), com o Prof. Tomaz Mikio Sasaki. Esta é a versão **v0.1.0**, 1ª iteração da fase de Construção do Processo Unificado.

| | |
|---|---|
| **Aplicação publicada** | https://salao-agenda-aula.vercel.app |
| **Quadro Kanban** | https://github.com/users/FainowAI/projects/1 |
| **Repositório** | https://github.com/FainowAI/salao-agenda (tag `v0.1.0`) |

## Escopo da v0.1.0

- **UC01 — Consultar horários disponíveis**, com "Qualquer profissional" (A2), data sem vagas (A1) e falha de comunicação com "Tentar novamente" (A3).
- **UC02 — Confirmar agendamento**, com horário ocupado no instante da gravação (A1), telefone já cadastrado (A2), campos inválidos destacados (A3) e "Voltar" sem gravar (A4).
- **Comprovante** com código legível (ex.: `SA-7K3Q9`) e botão "Novo agendamento".

Fora do escopo desta iteração: área administrativa, login, cancelamento/remarcação pelo cliente e notificações. Serviços e profissionais entram pelo seed.

## Arquitetura

Segue o diagrama de implantação em [`docs/diagrama-implantacao-iteracao-1.png`](docs/diagrama-implantacao-iteracao-1.png):

- **Navegador → Vercel:** a SPA (Vite + React + TypeScript + React Router) é servida pela Vercel. `vercel.json` reescreve todas as rotas para `index.html`.
- **SPA → Supabase (PostgREST):** o front usa `@supabase/supabase-js` com a anon key.
- **PostgREST → PostgreSQL:** as regras de disponibilidade e confirmação ficam em funções RPC (`security definer`, `search_path` fixo).
- **GitHub → Vercel:** cada push na `main` publica automaticamente.
- **Dev → Supabase Studio:** consultas diretas de evidência em [`docs/consultas-evidencia.sql`](docs/consultas-evidencia.sql).

O Documento v2 descreve o back-end em Spring. Aqui o papel das camadas serviço web, controle e persistência é exercido pelo PostgREST e pelas funções do banco (ver `docs/README.md`).

### Banco (`supabase/`)

| Arquivo | Conteúdo |
|---|---|
| `migrations/…_schema.sql` | Tabelas `servico`, `funcionario`, `recepcionista`, `profissional`, `profissional_servico`, `cliente`, `horario_funcionamento`, `agendamento`, `agendamento_servico`. Coluna gerada `periodo tsrange` e `EXCLUDE USING gist (profissional_id WITH =, periodo WITH &&) WHERE (status <> 'cancelado')`. |
| `migrations/…_rls.sql` | RLS ligada em todas as tabelas. O `anon` só lê serviços ativos, profissionais (nome e especialidade) e `profissional_servico`. Nenhuma escrita direta e nenhum dado de cliente legível. |
| `migrations/…_rpcs.sql` | `horarios_disponiveis`, `confirmar_agendamento`, `buscar_cliente_por_telefone`. Só essas três têm `execute` para o `anon`. |
| `seed.sql` | Horário de funcionamento, 4 serviços, 3 profissionais, a recepcionista "Atendimento Online", 5 clientes fictícios e 44 agendamentos. |
| `tests/regras.sql` | Prova as três regras no banco, dentro de uma transação desfeita no final. |

Erros de negócio saem das RPCs como exceção com mensagem-código: `HORARIO_OCUPADO`, `HORARIO_INVALIDO`, `DATA_PASSADA`, `DADOS_INVALIDOS`, `SERVICO_INVALIDO`, `PROFISSIONAL_INVALIDO`. O front traduz em `src/lib/erros.ts`.

## Decisões

- **Recepcionista "Atendimento Online".** O OF09 exige um responsável pelo registro de cada agendamento. Como o cliente marca sozinho pelo site, o seed cria a recepcionista "Atendimento Online" (número funcional `REC-ONLINE`, turno `integral`), e `confirmar_agendamento` grava todo agendamento do site em nome dela (`agendamento.recepcionista_id`).
- **Data lotada do seed: 2026-10-16 (sexta-feira), profissional Rafael Souza.** Ele tem 20 atendimentos de 30 min, das 09:00 às 19:00. Serve para demonstrar o A1 do UC01: escolha "Corte masculino" ou "Barba", "Rafael Souza" e 16/10/2026. Com "Qualquer profissional" em "Corte masculino", a mesma data mostra só os horários de Juliana Lima. Para mudar a data, troque `2026-10-16` no bloco "Dia lotado" de `supabase/seed.sql`.
- **Horário de funcionamento:** terça a sábado, 09:00–19:00 (domingo e segunda fechados), grade de 30 em 30 minutos, no fuso `America/Sao_Paulo`. Um horário só aparece se `[início, início + duração)` cabe inteiro no funcionamento e está livre na agenda do profissional. Datas passadas são recusadas e horários de hoje que já passaram não aparecem.
- **Garantia contra reserva dupla no banco.** `confirmar_agendamento` confere a disponibilidade, mas quem garante é a exclusion constraint: se dois clientes confirmam ao mesmo tempo, o segundo recebe `HORARIO_OCUPADO` e volta à consulta com a lista atualizada.
- **Telefone já cadastrado.** O cliente é identificado pelo telefone (só dígitos, `unique`). Ao confirmar com um telefone existente, o cadastro é reaproveitado e nome/e-mail são atualizados com o que foi conferido na tela. `buscar_cliente_por_telefone` devolve só nome e e-mail.
- **Código do agendamento:** `SA-` + 5 caracteres de um alfabeto sem 0/O/1/I. Os agendamentos do seed usam `SA-S0001`… para se distinguirem dos criados pelo site.

## Como rodar localmente

Pré-requisitos: Node.js 20+ e um projeto Supabase.

```bash
npm install
cp .env.example .env.local   # preencha com a URL e a anon key do projeto
npm run dev                  # http://localhost:5173
```

Para preparar um banco novo, rode no SQL Editor do Supabase, nesta ordem, os arquivos de `supabase/migrations/` e depois `supabase/seed.sql`. Com a Supabase CLI: `supabase db push` e `supabase db reset` (local).

### Variáveis de ambiente

| Variável | Onde achar |
|---|---|
| `VITE_SUPABASE_URL` | Supabase › Project Settings › API › Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase › Project Settings › API › anon public key |

A anon key é pública por natureza (vai no bundle do navegador); a proteção dos dados é a RLS. Nenhuma chave secreta (`service_role`) é usada pelo front nem fica no repositório. Na Vercel, as duas variáveis ficam em Settings › Environment Variables.

## Testes

```bash
npm test         # Vitest + Testing Library
npm run build    # checagem de tipos + build de produção
```

- `src/lib/validacao.test.ts`: nome obrigatório, telefone com 10–11 dígitos, e-mail válido.
- `src/lib/formato.test.ts`: data, hora, fuso e máscara de telefone.
- `src/lib/erros.test.ts`: `HORARIO_OCUPADO` → "Este horário acabou de ser reservado por outra pessoa."; falha de rede → indisponibilidade temporária.
- `src/components/ListaHorarios.test.tsx`: estados vazio (A1), erro com "Tentar novamente" (A3), carregando e "Qualquer profissional".

Regras do banco (cole no SQL Editor ou use `psql`):

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/regras.sql
```

Resultado esperado: três avisos `OK 1`, `OK 2` e `OK 3` e nenhum erro. A transação é desfeita, então nada fica gravado.

## Evidência de persistência

[`docs/consultas-evidencia.sql`](docs/consultas-evidencia.sql) tem as consultas do vídeo: últimos agendamentos com cliente, serviço e profissional (por `criado_em desc`), contagem por status, agenda de um profissional numa data e a própria `horarios_disponiveis` para mostrar que o horário confirmado sumiu.
