# Backend de integrantes e convites — validação da etapa 4

Implementado em 04/11/2026 na branch `codex/startup-team-api`, baseada na main `33e8671` (PR #29 integrado, workflow pós-merge #102 aprovado). Contrato e quatro decisões do usuário no [guia 30](30-startup-team-invitations.md). Esta entrega implementa somente backend/Postman; interface de equipe/convites continua pendente.

## Comportamento entregue

- Emissão por FUNDADOR/REPRESENTANTE atual, e-mail exato de conta STARTUP existente e papel MEMBRO/REPRESENTANTE. UUID de solicitação é obrigatório, associado ao emissor autenticado e conteúdo normalizado. Não concede vínculo antes do aceite e não envia e-mail.
- Histórico paginado do projeto para gestor, convites recebidos da própria conta, consulta por convite e recuperação por solicitação. DTO explícito com nove campos, sem e-mail, contas completas, credenciais ou questionário. Não há exceção ADMIN nem busca geral de usuários.
- Aceite/recusa pelo destinatário, cancelamento por gestor atual; estados textuais PENDENTE/ACEITO/RECUSADO/CANCELADO e EXPIRADO efetivo na leitura. Prazo de sete dias de 24 horas, com `Clock`; no instante do vencimento a ação retorna `410 CONVITE_EXPIRADO`. Criação/vencimento truncados em microssegundos para estabilidade entre criação/releitura PostgreSQL.
- Aceite revalida destinatário, tipo de conta, vínculo, prazo e permissão atual do emissor, criando associação e estado na mesma transação. Repetição de ação já confirmada é idempotente; um convite aceito nunca recria associação removida depois.
- Escritas serializadas pelo bloqueio pessimista da startup; convite é carregado depois do bloqueio usando consulta escalar prévia do projeto. Unicidade global `(emissor_id, solicitacao_id)` protege corridas entre projetos diferentes, sem bloquear linhas de usuários referenciadas por chaves estrangeiras. O conteúdo da solicitação é comparado por SHA-256; e-mail não é duplicado como identidade na tabela.
- Inclusão HTTP direta por `POST /{startupId}/membros` encerrada com `410 CONVITE_OBRIGATORIO` para chamada válida STARTUP/CSRF. Onboarding continua criando FUNDADOR na transação original. Não foi criada alteração de papel ou concessão de FUNDADOR por convite.
- Consulta de equipe e perfil completo exige STARTUP com vínculo atual. A listagem legada `GET /api/v1/startups` passa a devolver somente os projetos da própria conta, assim como `/me`: manter a listagem irrestrita permitiria contornar o isolamento anterior ao aceite. Isso não implementa descoberta; catálogo futuro terá DTO e política próprios na etapa 5.

## Evidências locais

| Verificação | Resultado |
| --- | --- |
| Suíte Maven | 187 testes, zero falhas/erros/ignorados, Checkstyle e arquitetura aprovados; `mvn -o -pl backend test` com configuração de teste H2 explícita. Log local: `backend/target/team-full-tests.log`. Os três testes da inclusão direta removida foram substituídos por verificações HTTP de encerramento/aceite; não representam redução do contrato novo. |
| Cobertura | 96,70% de linhas (1.113/1.151) na conferência local final; conferir também a análise do SHA enviado na CI. Nenhuma exclusão, supressão ou redução de gate foi introduzida. |
| HTTP real | 57 cenários pela API em `127.0.0.1:8082` → PostgreSQL 18 em `127.0.0.1:55432`, com contas fictícias, login, cookies e CSRF real. Relatório: `backend/target/team-http-report.json`. |
| Concorrência PostgreSQL | Dez disputas por mesma solicitação em projetos diferentes, cada uma com uma criação e `409 SOLICITACAO_DIVERGENTE`; 33 verificações incluindo preparação/cancelamentos/logout. Relatório: `backend/target/team-pg-race-report.json`. |
| Concorrência H2 | Aceite duplo cria um único vínculo; emissões simultâneas geram um único convite pendente; cancelamento e remoção de gestor sob bloqueio impedem aceite que aguardava a transação. Requests e commits independentes, sem transação de teste englobando todo o fluxo. |
| Postman | Oito requests de convite, encerramento explícito da inclusão direta, variáveis locais sem credenciais e scripts de confirmação. JSON e sintaxe de 25 scripts conferidos; pastas não relacionadas preservadas. Não executar ações alternativas de aceite/recusa/cancelamento automaticamente em sequência. |
| Frontend | Não alterado. Não foram repetidos testes/builds ou revisão de interface de convites que ainda não existe. Paleta do PR #28 preservada. |

HTTP inclui cadastro/login, ausência de vínculo antes do aceite, acesso privado negado por ID/listagem/quiz/equipe, recuperação e repetição de solicitação, conflito de conteúdo, CSRF, corpo de ação com papel arbitrário rejeitado, `415`, aceite/repetição, papel de representante, revogação, recusa/cancelamento, reenvio, vencimento induzido em registro fictício, aceite concorrente, membro sem gestão, único fundador, novo login e logout de todas as sessões do preparador. O vencimento exato de sete dias é verificado com Clock nos testes automatizados; não se aguardaram sete dias no ensaio HTTP.

## Ensaio de schema PostgreSQL

Contêiner exclusivo `damatch-team-pg-20261104`, publicado somente em loopback. Um banco local `team_legacy` foi populado com os fixtures legados versionados de usuário/mentor/startup, com as colunas de publicação já existentes na main e vínculos FUNDADOR e MEMBRO legado MENTOR. Foi criada cópia por `CREATE DATABASE ... TEMPLATE team_legacy`; Hibernate `update` foi executado na cópia antes das chamadas HTTP.

Comparação antes/depois preservou os dois usuários, mentor, startup, dois vínculos e seus papéis, textos, `statusValidacao` textual e RASCUNHO. A nova tabela `convite_startup` iniciou vazia, sem converter pessoas em convites nem atribuir acesso. O fluxo posterior gravou/consultou convites e vínculos reais nessa cópia PostgreSQL. A constraint da associação foi preservada.

Essa é **uma cópia local com dados fictícios representativos do legado**, não um dump nem inspeção do banco remoto. Não comprova todas as condições do ambiente de produção. Antes de integração/deploy automático, conferir backup, compatibilidade e procedimento do ambiente alvo; nenhuma alteração remota foi autorizada ou executada. Hibernate continua gerenciando schema; Flyway não foi reintroduzido. Não usar `create`/`create-drop` em produção.

Artefatos locais do ensaio ficam em `backend/target`: `team-pg-before.json`, `team-pg-snapshot.sql`, `team-pg-api.log`, `team-http-report.json` e `team-pg-race-report.json`. Não versionar credenciais ou os bancos.

## Limitações e retomada

- A interface da etapa 4 continua pendente: equipe por projeto, convites recebidos, confirmações e recuperação de resposta incerta conforme guia 30. Não antecipar descoberta/matching nem JWT/Vercel.
- Em 04/11, uma execução inadvertida de `mvn clean` removeu artefatos anteriores em `backend/target`, incluindo os H2 fictícios das homologações de outubro e os scripts/capturas ali guardados. O fato foi informado ao usuário; relatórios versionados continuam como registro histórico, mas os caminhos antigos de target não comprovam mais a presença dos arquivos. Os ensaios desta etapa foram recriados no PostgreSQL local. **Não executar clean sobre target que contenha fixtures/bancos/evidências a preservar; guardar essas evidências fora de target antes de limpar.** Banco remoto e arquivos versionados não foram afetados. Capturas antigas em `frontend/.angular/cache` não foram apagadas por esse comando.
- Conferir CI/Quality Gate backend pelo SHA exato do PR, não pelo painel sobrescrito pela main. Sucesso de job DAST com `continue-on-error` não comprova ausência de achados nem substitui homologação funcional publicada.
- PostgreSQL local populado foi ensaiado; zoom real 200%, leitor de tela, rate limit e ambiente publicado continuam na etapa 10. Sessão/CSRF atual preservados.
