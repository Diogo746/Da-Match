# Descoberta real — backend e evidências

Implementação local em 05/11/2026, branch `codex/discovery-api`, base main `c34edc6`. Contrato do [guia 33](33-discovery-contract.md) integrado pelo [PR #32](https://github.com/Diogo746/Da-Match/pull/32); [workflow #110 pós-merge](https://github.com/Diogo746/Da-Match/actions/runs/42067501541) concluído com sucesso. **Backend implementado e validado localmente, aguardando CI/revisão/integração; interface real ainda pendente.**

## API entregue na branch

Quatro GETs em `/api/v1/descoberta`: lista/detalhe de mentores para STARTUP; lista/detalhe de startups para MENTOR. Sem exceção ADMIN. O serviço também confere o principal antes de validar filtros/consultar dados. O leitor não precisa de projeto, quiz ou publicação próprios.

- DTO de oito campos: `id`, `tipo`, `nome`, `apresentacao`, `setores`, `topicos`, `formato`, `cidadeId`. IDs são do mentor/startup. Não retornar DTO de gestão, integrantes, conta, e-mail, links, agenda, demais textos da startup, quiz completo ou dados de matching.
- Só PUBLICADO com cadastro/quiz v3 válido; mentor também exige conta MENTOR e `accepting=true`. Capacidade não limita resultados. Setor/público desconhecidos continuam respostas válidas. Nenhum filtro automático de compatibilidade do par.
- Mentor é validado em uma cópia do quiz com a agenda real de `disponibilidade_mentor`. GET não preenche a coleção vazia persistida do quiz nem altera entidades. Agenda inválida legada fica fora, sem acesso fora dos limites de dia/período. O PATCH antigo de agenda continua refletido nessa leitura.
- Filtros de setor/tema/formato/cidade usam Criteria e valores tipados; busca literal em nome/apresentação e ordem normalizada sem acentos/caixa são aplicadas em Java. Caracteres SQL não viram operadores. Formato AMBOS segue o contrato. Totais e páginas consideram elegibilidade/filtros antes do recorte, sem duplicação pelos joins.
- Página inicial zero, tamanho 1–20/padrão 20. Parâmetros repetidos/desconhecidos, códigos/UUID inválidos e setores incompatíveis retornam 400. Offset calculado como `long`, inclusive página muito distante do fim.
- Detalhe inexistente/inelegível retorna 404 genérico. Falha do banco não vira lista vazia. `Cache-Control: private, no-store` também nas falhas 400/401/403/404. Rotas de gestão mantêm permissões, sessão/CSRF e bloqueios anteriores.
- Transação de leitura `REPEATABLE_READ` cobre a seleção e a carga das coleções. A próxima consulta reflete pausa/recebimento/requisitos atuais; não há cache de elegibilidade nem promessa de apagar dados já vistos sem uma nova leitura.

Não foram criadas tabelas, colunas, índices ou extensões. A única alteração no domínio existente expõe a verificação de cidade do catálogo já utilizado pelo quiz; não muda seus códigos ou validações. Hibernate continua gerenciando schema; nenhum Flyway foi introduzido.

## Testes e PostgreSQL

| Verificação | Evidência |
| --- | --- |
| Suíte backend | **257 testes**, zero falhas/erros/ignorados; Checkstyle e cinco regras de arquitetura aprovados. **97,21% de linhas (1291/1328)**; linhas do domínio novo cobertas integralmente na execução local. Log final em `backend/database/discovery-20261105/tests-final.log`. |
| Novos testes | 47 cenários de integração HTTP/H2, 19 casos de validade legada e quatro testes diretos do serviço. Papéis, ausência de pré-requisitos do leitor, projeção exata, fontes de ID, filtros/acentos/literais, estados, agenda compartilhada, falhas, contagens e limite de SQL por lote. |
| HTTP real → PostgreSQL 18 | **49 verificações** com onboarding/login, cookies e CSRF reais, GETs públicos para participantes e escritas próprias para preparar perfis. Campos privados ausentes, perfil publicado sem quiz escondido, publicação/pausa, recebimento de novas startups, alteração de agenda, expiração da sessão e logouts. `http-report.json`. |
| Fonte legada | Nova cópia local `discovery_qa_20261105` derivada de `team_ui_20261105`, com dados fictícios existentes. API iniciou com **`ddl-auto=validate`**, sem alteração de schema. Snapshot conferiu colunas e preservou os usuários, startups, mentores e vínculos anteriores após os testes. Não é cópia/inspeção de produção. |
| Volume local | **500 mentores fictícios**, 25 páginas de 20; primeira/última/página fora do fim e novo login preservaram ordem/contagem. Quatro GETs medidos entre **0,147 e 0,335 s**, **29 statements SQL por leitura**, sem consulta por perfil. `volume-report.json`; não é benchmark de produção. |
| Postman | Pasta **Descoberta — Catálogo real**, quatro requests e IDs separados dos IDs de gestão. Variáveis de busca/página/filtros e validação de projeção/cache. JSONs e sintaxe de **31 scripts** conferidos; pastas anteriores preservadas. Não executar as duas direções sob a mesma conta. |

Fixtures têm nomes/e-mails inventados e senhas geradas somente em memória; relatórios não guardam cookies, senhas ou tokens. Scripts/evidências e dump fictício ficam no diretório ignorado `backend/database/discovery-20261105/`, fora de `target`. API exclusiva em `127.0.0.1:8082` e contêiner PostgreSQL exclusivo em `127.0.0.1:55432` encerrados após logouts, preservação final dos registros/schema e backup. Não usar datasource padrão remoto nem presumir serviços ativos ao retomar.

Ocorrências do ensaio: a regra de arquitetura também enxerga a classe sintética de um switch de enum em serviço. O switch foi substituído por verificações simples, sem alterar a regra; somente o `.class` obsoleto específico foi copiado fora de `target` e removido, sem `clean`. O primeiro snapshot foi lido em codificação Windows pelo preparador; corrigida a leitura UTF-8, o original foi preservado e a igualdade dos registros confirmada, sem alterar dados. A coleta inicial de métricas não estava habilitada pela variável de ambiente com underscores; configuração explícita na API local permitiu concluir o ensaio com os mesmos 500 fixtures, sem duplicá-los. Nenhuma dessas ocorrências motivou alteração funcional, exclusão de testes ou redução de gate.

O primeiro Quality Gate remoto do PR #33 (workflow #111, head `5350ca4`) encontrou dois blocos `default` vazios nos testes parametrizados de inelegibilidade. Ambos passaram a conferir explicitamente que o cenário restante é `AUSENTE`, detectando também novos parâmetros sem tratamento. Correção somente de teste, sem supressão, mudança funcional ou redução do gate; conferir a nova execução no head da correção antes de integrar.

## Limite de volume e próximos passos

Consultas estruturadas restringem os candidatos publicados no banco; sete coleções são carregadas separadamente em lotes de até 128 IDs, evitando N+1 e produto cartesiano de múltiplas listas. Depois disso, elegibilidade completa, busca sem acentos, ordenação e paginação ocorrem em memória. **Memória e CPU crescem com o conjunto de candidatos**; não é paginação integral no banco nem uma garantia de desempenho para grandes catálogos. O ensaio de 500 é evidência local limitada. Medir volume/conexões/memória no ambiente alvo e evoluir a estratégia, se necessário, sem cortar candidatos silenciosamente ou tornar os totais incorretos.

Revisar CI/Quality Gate do SHA enviado e integrar o backend antes da interface. Frontend não foi alterado; não foram repetidos testes/builds nem alegada homologação visual deste catálogo. A próxima entrega conecta a tela principal no modo API, substituindo os perfis fictícios por essas consultas, com restauração de sessão, filtros/URL, detalhes, privacidade e descarte de respostas antigas. DEMO permanece explícito; matching, salvos e conexões vêm depois.

Sem merge/deploy manual nem alteração de banco remoto pelo agente. Teste no ambiente publicado, leitor de tela, zoom real 200%, rate limit e conferência de backup/compatibilidade de produção continuam no [roteiro operacional](27-startup-next-sessions.md).
