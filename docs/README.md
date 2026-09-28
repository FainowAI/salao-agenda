# docs/: material de direcionamento do SalãoAgenda

Leia nesta ordem antes de escrever código:

| # | Arquivo | Para quê |
|---|---|---|
| 1 | `requisitos-aula-3.md` | O que a disciplina exige nesta iteração (entregas e critérios) |
| 2 | `SalaoAgenda_v2_analise_e_projeto.pdf` | **Fonte da verdade funcional:** objetivos OF01–OF10 e ONF01–ONF08, UC01/UC02 detalhados, protótipos de tela, mapa de navegação, modelo de domínio, classes e sequências |
| 3 | `../PROMPT-CONSTRUCAO.md` | Especificação técnica da v0.1.0: stack, schema, RPCs, RLS, telas, testes, deploy, Kanban e tag |
| 4 | `diagrama-implantacao-iteracao-1.png` / `.puml` | A arquitetura implantada precisa bater com este diagrama |
| 5 | `entrega/SalaoAgenda_Entrega_Iteracao1.pdf` | Guia do Usuário já escrito. **Os rótulos de botão e as mensagens da UI devem seguir o guia** |
| 6 | `roteiro-video-iteracao-1.md` | O que será demonstrado no vídeo de 8 min. O app e o seed precisam permitir cada cena |
| 7 | `aula3-slides-ponto-de-partida.pdf`, `aula3-texto-de-apoio.pdf` | Material original da aula |

## Divergência conhecida

O Documento v2 descreve o back-end em Spring (`RestController` + `CrudRepository`). A implementação usa **Supabase**: PostgREST mais funções RPC no Postgres. O papel das camadas serviço web, controle e persistência passa para a API do Supabase e para as funções do banco. Essa justificativa já está no documento de entrega, seção 3.
