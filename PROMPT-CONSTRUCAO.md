# Prompt: construir o SalãoAgenda v0.1.0 (Iteração 1)

> Cole este arquivo inteiro no Claude Code, aberto na pasta `salao-agenda`.

---

Você vai construir, publicar e versionar o **SalãoAgenda v0.1.0**. É um sistema web de agendamento para salão de beleza e barbearia. O trabalho é acadêmico: disciplina Prática Profissional em ADS, Mackenzie EaD, Prof. Tomaz Mikio Sasaki, trabalho individual de Antônio Marberger. Esta é a **1ª iteração da fase de construção** do Processo Unificado. A entrega precisa ser software **integrado, testado e implantado**, com dados persistidos em banco.

Leia `CLAUDE.md` e `docs/` antes de começar. A fonte da verdade funcional é o Documento de Análise e Projeto v2, resumido abaixo. Não invente funcionalidade fora do escopo.

## 1. Escopo: só dois casos de uso

### UC01 — Consultar horários disponíveis

**Ator:** Cliente. O cliente não precisa de cadastro prévio.

**Fluxo principal:**

1. O cliente abre a tela de agendamento.
2. O sistema lista os serviços.
3. O cliente escolhe serviço, profissional e data.
4. O cliente clica em **"Ver horários"**.
5. O sistema lista os horários livres.

**Fluxos alternativos:**

- **A1 — Sem horário na data:** mensagem "Não há horários livres nesta data. Escolha outra data ou outro profissional."
- **A2 — "Qualquer profissional":** o sistema considera todos os profissionais habilitados para o serviço. Cada horário mostra o nome do profissional.
- **A3 — Falha de comunicação:** mensagem de indisponibilidade temporária com botão **"Tentar novamente"**.

**Regra de negócio:** um horário só aparece se o intervalo `[início, início + duração do serviço)` estiver inteiro livre na agenda do profissional e dentro do horário de funcionamento. Datas passadas não são aceitas. Horários de hoje que já passaram não aparecem.

### UC02 — Confirmar agendamento

**Fluxo principal:**

1. O cliente clica num horário.
2. A tela de confirmação mostra o resumo: serviço, profissional, data e horário.
3. O cliente informa nome, telefone e e-mail.
4. O cliente clica em **"Confirmar agendamento"**.
5. O sistema grava e abre o comprovante.

**Fluxos alternativos:**

- **A1 — Horário ocupado no instante da gravação** (outro cliente confirmou antes): aviso "Este horário acabou de ser reservado por outra pessoa." e volta para a consulta com a lista atualizada.
- **A2 — Telefone já cadastrado:** o sistema reaproveita o cliente e preenche nome e e-mail para conferência. A busca é por telefone, com uma RPC de busca que devolve só nome e e-mail, e roda ao sair do campo telefone.
- **A3 — Campos vazios ou inválidos:** os campos ficam destacados e o cliente continua na tela.
- **A4 — "Voltar":** retorna à consulta sem gravar nada.

**Regras de negócio:**

- A confirmação só é aceita se o intervalo continuar livre no momento da gravação. A garantia fica no banco.
- `criado_em` é gravado automaticamente.
- `status` começa como `confirmado`.

### Comprovante

Mostra:

- o **código do agendamento**, legível, por exemplo `SA-7K3Q9`;
- serviço, profissional, data e horário (início–fim);
- o nome do cliente;
- o botão **"Novo agendamento"**.

**Fora de escopo nesta iteração:** área administrativa, login, cancelamento ou remarcação pelo cliente, notificações. Cadastros de serviço e profissional entram por seed no banco.

## 2. Stack e arquitetura (fixas)

- **Front-end:** Vite + React + TypeScript + React Router. Estilo simples com CSS Modules ou Tailwind. Neutro, limpo, responsivo, legível no celular (ONF03).
- **Back-end:** **Supabase**.
  - PostgreSQL com o schema abaixo.
  - A API é o PostgREST do Supabase.
  - A lógica de disponibilidade e de confirmação fica em **funções RPC no Postgres**, com `security definer` e `search_path` fixo.
  - O front usa `@supabase/supabase-js` com a anon key.
- **Hospedagem:** Vercel, com deploy automático a partir do GitHub.
  - Variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
  - Adicione `vercel.json` com rewrite de SPA.
- **Repositório:** `https://github.com/FainowAI/salao-agenda` (remote `origin` já configurado, branch `main`).

A arquitetura precisa bater com o diagrama de implantação em `docs/diagrama-implantacao-iteracao-1.png`. Os nós são:

- navegador → Vercel (SPA);
- SPA → Supabase API Gateway/PostgREST;
- PostgREST → PostgreSQL;
- GitHub → Vercel (webhook);
- dev → Supabase Studio (consultas diretas).

## 3. Banco de dados (migrations versionadas em `supabase/migrations/`)

O modelo de domínio é o do Documento v2: Cliente, Agendamento, Serviço e Funcionário (abstrato), com as especializações Recepcionista e Profissional.

### Tabelas

- `servico`: `id`, `nome`, `duracao_min int check (>0)`, `preco numeric null`, `ativo bool`.
- `funcionario`: `id`, `nome`, `numero_funcional unique`, `tipo text check in ('recepcionista','profissional')`.
- `recepcionista`: `funcionario_id pk/fk`, `turno`.
- `profissional`: `funcionario_id pk/fk`, `especialidade`.
- `profissional_servico`: `profissional_id`, `servico_id`, pk composta.
  - Define quem faz o quê.
- `cliente`: `id`, `nome`, `telefone unique` (só dígitos), `email`, `criado_em`.
- `agendamento`:
  - `id`;
  - `codigo unique`;
  - `data date`, `hora_inicio time`, `hora_fim time`;
  - `status text check in ('solicitado','confirmado','realizado','cancelado') default 'confirmado'`;
  - `cliente_id`, `profissional_id`, `recepcionista_id`;
  - `criado_em timestamptz default now()`.
- `agendamento_servico`: `agendamento_id`, `servico_id`.

### Regras no banco

- **Não sobreposição (OF08/ONF05):**
  - extensão `btree_gist`;
  - coluna gerada `periodo tsrange` a partir de data + horas;
  - `EXCLUDE USING gist (profissional_id WITH =, periodo WITH &&) WHERE (status <> 'cancelado')`.
- **Horário de funcionamento:**
  - tabela `horario_funcionamento (dia_semana 0-6, abre time, fecha time)`;
  - seed de terça a sábado, 09:00–19:00;
  - passo de grade de 30 min.
- **Recepcionista das marcações online:** OF09 exige um responsável pelo registro. Crie no seed a recepcionista "Atendimento Online" (turno `integral`) e associe a ela todo agendamento feito pelo site. Registre essa decisão no README.

### RPCs

- `horarios_disponiveis(p_servico_id, p_profissional_id uuid null, p_data date)`
  - Retorna `(profissional_id, profissional_nome, hora_inicio, hora_fim)`.
  - `null` em `p_profissional_id` significa qualquer profissional habilitado.
- `confirmar_agendamento(p_servico_id, p_profissional_id, p_data, p_hora_inicio, p_nome, p_telefone, p_email)`
  - Valida os dados.
  - Faz upsert do cliente por telefone.
  - Recalcula `hora_fim` pela duração do serviço.
  - Insere o agendamento e o `agendamento_servico`.
  - Gera o código.
  - Retorna o comprovante.
  - Converte a violação da exclusion constraint num erro com código próprio (ex.: `HORARIO_OCUPADO`), que o front reconhece.
- `buscar_cliente_por_telefone(p_telefone)`
  - Retorna só nome e e-mail.

### RLS

- Ligada em todas as tabelas.
- `anon` pode fazer SELECT só em `servico` (ativos), `profissional`/`funcionario` (nome e especialidade) e `profissional_servico`.
- Nenhum INSERT, UPDATE ou DELETE direto pelo `anon`: tudo passa pelas RPCs, com `grant execute to anon`.
- Dados pessoais de `cliente` não ficam legíveis pelo `anon` (ONF06).

### Seed

- 4 serviços. Exemplo:
  - Corte masculino, 30 min;
  - Barba, 30 min;
  - Corte feminino, 60 min;
  - Manicure, 45 min.
- 3 profissionais com especialidades diferentes.
- A recepcionista "Atendimento Online".
- Alguns agendamentos já existentes nos próximos dias, para a grade mostrar buracos.
- **Uma data próxima totalmente lotada** para um profissional. Ela serve para demonstrar o A1 do UC01 no vídeo. Documente qual data é no README.

### Projeto Supabase

Crie um projeto novo chamado `salao-agenda`, na região `sa-east-1`. Use o MCP do Supabase se estiver disponível, senão a CLI. Se precisar de credenciais ou de decisão de plano ou organização, **pare e me pergunte**.

## 4. Telas (seguir o mapa de navegação do Documento v2)

- `/`: **Consulta de horários**.
  - Selects de serviço e profissional, com a opção "Qualquer profissional". O select de profissional é filtrado pelo serviço.
  - Campo de data, com mínimo = hoje.
  - Botão "Ver horários".
  - Grade de horários em botões.
  - Estados de carregando, vazio (A1) e erro (A3).
- `/confirmar`: **Confirmação**.
  - Resumo no topo, depois o formulário: nome, telefone com máscara (xx) xxxxx-xxxx, e-mail.
  - Botões "Confirmar agendamento" (primário) e "Voltar" (secundário), separados visualmente.
  - O estado vem da navegação. Se a página abrir sem estado, redireciona para `/`.
- `/comprovante`: **Comprovante** com o código em destaque e o botão "Novo agendamento".

Os textos de botão acima estão no Guia do Usuário já escrito. **Use exatamente esses rótulos.**

## 5. Qualidade e testes

- **Unitários (Vitest + Testing Library):**
  - validação do formulário: nome obrigatório, telefone com 10–11 dígitos, e-mail válido;
  - formatação de data e hora;
  - mapeamento do erro `HORARIO_OCUPADO` para a mensagem certa;
  - renderização dos estados vazio e erro da consulta.
- **Banco:** um script `supabase/tests/regras.sql` (ou pgTAP, se simples) que prove três coisas:
  1. um horário sobreposto é rejeitado;
  2. a função não devolve horário fora do funcionamento;
  3. um horário recém-confirmado some de `horarios_disponiveis`.
- `npm run build` e `npm test` passando antes de cada push.
- Nada de chave secreta no repositório. Crie o `.env.example`.

## 6. Entregáveis de repositório e acompanhamento

1. Commits pequenos e descritivos, em português, ao longo do trabalho. **Não** faça um commit único no final.
2. `README.md` com:
   - descrição;
   - URL publicada;
   - como rodar localmente;
   - variáveis de ambiente;
   - decisões (Atendimento Online, data lotada do seed, horário de funcionamento);
   - link do quadro.
3. `docs/consultas-evidencia.sql` com as consultas diretas que serão mostradas no vídeo, no mínimo:
   - últimos agendamentos com join de cliente, serviço e profissional, ordenados por `criado_em desc`;
   - contagem por status;
   - agenda de um profissional numa data.
4. **Kanban** no GitHub Projects `https://github.com/users/FainowAI/projects/1` (colunas Backlog, Ready, In progress, In review, Done). Use `gh project item-create` / `item-edit`.
   - Crie um card por tarefa da iteração: schema, RLS, RPCs, seed, tela de consulta, tela de confirmação, comprovante, testes, deploy, README, tag.
   - **Mova os cards conforme executa**, para que o histórico mostre planejamento e execução.
   - Se o `gh` não tiver o escopo `project`, peça para eu rodar `gh auth refresh -s project`.
5. Deploy na Vercel ligado ao repositório. Confirme que a URL de produção abre e que os dois fluxos funcionam **em produção**.
6. Ao final, crie a tag anotada `v0.1.0` ("Iteração 1 da construção — UC01 e UC02") e dê push da tag.

## 7. Critérios de pronto (verifique um a um e me reporte)

- [ ] A URL pública na Vercel abre no desktop e no celular.
- [ ] UC01 funciona, incluindo "Qualquer profissional", data lotada (A1) e erro de rede (A3).
- [ ] UC02 funciona, incluindo Voltar sem gravar, validação de campos, telefone já cadastrado e horário ocupado em duas abas.
- [ ] O agendamento criado aparece nas consultas de `docs/consultas-evidencia.sql`, e o horário some da consulta.
- [ ] `npm test`, `npm run build` e o script de regras do banco passam.
- [ ] Os cards do quadro percorreram as colunas até Done.
- [ ] A tag `v0.1.0` está publicada no GitHub.
- [ ] O README está completo.

Ao terminar, me devolva em uma mensagem curta:

- a URL de produção;
- a data lotada do seed;
- os rótulos finais dos botões, se algum mudou;
- o nome real das colunas usadas nas consultas de evidência;
- qualquer desvio do Documento v2.

Uso essas informações para atualizar o Guia do Usuário e gravar o vídeo.
