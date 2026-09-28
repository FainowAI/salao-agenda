# Roteiro do vídeo: SalãoAgenda, Iteração 1 (8 min)

**Antes de gravar:**

- Aplicação publicada na Vercel.
- Tag `v0.1.0` criada no GitHub.
- Kanban com os cards da iteração em Done.
- Pelo menos 2 serviços e 2 profissionais cadastrados no banco.
- Uma data sem vagas preparada para mostrar o fluxo alternativo.
- Abas abertas nesta ordem:
  1. diagrama de implantação;
  2. aplicação;
  3. repositório;
  4. Kanban;
  5. Supabase SQL Editor;
  6. uma segunda aba da aplicação, para o teste de horário ocupado.

Grave em 1080p, com o zoom do navegador em 110–125% para o texto ficar legível.

| Tempo | Tela | O que mostrar e falar |
|---|---|---|
| 00:00–00:30 | Aplicação aberta | "Sou Antônio Marberger. Este é o SalãoAgenda, sistema de agendamento para salão e barbearia. Esta é a versão v0.1.0, primeira iteração da construção, com dois casos de uso: consultar horários e confirmar agendamento." |
| 00:30–01:30 | Diagrama de implantação | Percorra os nós: o navegador baixa o front-end React da Vercel; o front chama a API REST do Supabase, que grava no PostgreSQL; cada push no GitHub publica automaticamente na Vercel. Mostre a URL real na barra de endereços. |
| 01:30–02:30 | GitHub + Kanban | No repositório, abra Tags e mostre a `v0.1.0`. No quadro, mostre os cards da iteração: planejados em Backlog/Ready e concluídos em Done, com o histórico de movimentação. |
| 02:30–04:30 | Tela de consulta (UC01) | 1) Escolha serviço, profissional e data → Ver horários → comente que só aparecem horários em que o serviço inteiro cabe. 2) Troque para a data sem vagas → mostre a mensagem. 3) Use "Qualquer profissional" → a lista cresce. |
| 04:30–06:30 | Confirmação e comprovante (UC02) | 1) Clique num horário → confira o resumo → clique em Voltar (mostre que nada foi gravado) → escolha de novo. 2) Deixe o e-mail vazio → mostre os campos destacados. 3) Preencha e confirme → mostre o comprovante com o código. 4) Na segunda aba, que ainda mostra a lista antiga, tente o mesmo horário → mostre o aviso de horário ocupado. |
| 06:30–07:30 | Supabase SQL Editor | Rode `select * from agendamento order by criado_em desc limit 5;`. Mostre que o registro recém-criado está lá, com o mesmo código do comprovante. Volte à aplicação, consulte a mesma data e mostre que o horário sumiu da lista. |
| 07:30–08:00 | Aplicação | "Os passos de uso estão no Guia do Usuário que acompanha a entrega. Na próxima iteração entram [funcionalidades da iteração 2]." Encerre. |

**Depois de gravar:**

1. Suba o vídeo no YouTube como "Não listado", ou no Google Drive com o compartilhamento "qualquer pessoa com o link".
2. Teste o link numa janela anônima.
3. Cole o link nos dois campos marcados como [inserir link do vídeo] no documento de entrega.

> Os nomes de coluna da query (`criado_em`) e os rótulos dos botões seguem o Documento v2 e o Guia do Usuário. Ajuste para o que estiver de fato no código.
