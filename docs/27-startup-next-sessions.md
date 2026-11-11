# Roteiro por etapas para as próximas sessões

Registrado a pedido do usuário em 28/10/2026 para retomar amanhã, sem iniciar novas funcionalidades nesta sessão. Este é o ponto de entrada da retomada; os guias [23](23-continuity-and-frontend-redesign.md), [25](25-questionnaire-api.md) e [26](26-startup-code-review.md) contêm os detalhes existentes.

## Onde paramos

- Cadastro, sessão/CSRF, consulta e edição próprias com múltiplos projetos e questionário persistido já estão implementados.
- Correções da revisão integradas pelo [PR #22](https://github.com/Diogo746/Da-Match/pull/22), head `ac3f0d1`, merge na main `e8c851b`.
- [Workflow #83 do PR](https://github.com/Diogo746/Da-Match/actions/runs/40798248553): concluído com sucesso, incluindo ambos os Quality Gates e DAST. Validação: 145 testes backend/Checkstyle, 378 frontend + 8 de configuração, 99,05% de linhas frontend, lint e builds DEMO/API.
- [Workflow #84 após merge](https://github.com/Diogo746/Da-Match/actions/runs/40799178596): conferido em 29/10/2026, concluído com sucesso em testes, ambos os Quality Gates, DAST e job de deploy de produção. Esse resultado não substitui homologação funcional do ambiente publicado.
- Retomada em 29/10/2026: main local atualizada por fast-forward até `e8c851b`; nova branch `chore/startup-base-homologation`. Planejamento local preservado; cópia adicional em `backend/target/retomada-20261029/` (ignorada). `AGENTS.md` é local e ignorado, não deve ser versionado.
- Retomada em 30/10/2026: [PR #23](https://github.com/Diogo746/Da-Match/pull/23) integrado à main `52055a0`. [Workflow #85](https://github.com/Diogo746/Da-Match/actions/runs/40958003237) aprovado no head `0f3cf70`, incluindo lint/testes/build, segurança e Quality Gate frontend; backend/DAST dispensados por seleção de componentes. [Workflow #86 da main](https://github.com/Diogo746/Da-Match/actions/runs/41101543709) concluído com sucesso no SHA `52055a0`, com ambos os gates aprovados. Esse resultado não substitui homologação funcional publicada. Nova branch `docs/startup-publication-contract`, baseada em `52055a0`.
- Contrato da etapa 1 introduzido no commit `f38ada6`, enviado no [PR #24](https://github.com/Diogo746/Da-Match/pull/24). Validação documental: três exemplos JSON válidos, links relativos conferidos e `git diff --check` aprovado. A entrega altera apenas documentação; o workflow do PR deve respeitar a seleção de componentes, sem alegar novos testes/gates de código quando dispensados. Integrar esse PR antes da etapa 2.
- Etapa 1 integrada pelo PR #24 na main `852db0a`; workflows #88 do PR (`41104956612`) e #89 da main (`41105568466`) concluídos com sucesso. Etapa 2 iniciada dessa main em `feature/startup-publication-api`; implementação e validação local descritas abaixo.
- Etapa 2 entregue pelo [PR #25](https://github.com/Diogo746/Da-Match/pull/25), head `51fe17e`: backend no commit `c1331c5`, Postman em `3d2b769`; workflow #91 (`41108151966`) aprovado, incluindo Quality Gate backend.
- Conferência em 31/10: PR #25 integrado à main `2a5d321`; [workflow #94 pós-merge](https://github.com/Diogo746/Da-Match/actions/runs/41113221511) concluído com sucesso. A aprovação da CI não comprova ensaio em cópia PostgreSQL nem homologação funcional publicada; evidências operacionais permanecem na etapa 10.
- O usuário adiantou a decisão de produto da etapa 6 por questionário, sem solicitar implementação antecipada: 13 respostas consolidadas no [guia 29](29-matching-rule-decisions.md), branch documental `codex/matching-rule-decision`. Pesos e casos de referência definidos; código de matching permanece pendente.
- Decisão enviada no [PR #26](https://github.com/Diogo746/Da-Match/pull/26), introduzida em `cb9571a`. Validação documental: soma 100, fatores e 14 casos conferidos com decimal exato, links novos e diff aprovados. Conferir checks do head atual; esta entrega não altera aplicação nem comprova implementação do algoritmo.
- Em 31/10, a main foi incorporada à branch do PR #26 para resolver conflitos somente no roteiro e índice. Preservados os registros da publicação, as 13 decisões e os 14 casos de matching. Verificar a CI do novo head; nenhuma mudança de aplicação adicional à main foi introduzida por essa resolução.

## Como executar o roteiro

**Prioridade solicitada pelo usuário em 05/11:** preparar a transferência do backend para Vercel, com JWT e CSRF, usando somente recursos gratuitos. PR #34 já integrado na main `5d54233`. Autenticação, contrato, ensaios e condições antes de trocar o ambiente real no [guia 36](36-vercel-backend-jwt.md). Esta decisão substitui a orientação anterior de não antecipar JWT/Vercel. Matching continua sendo a próxima etapa funcional depois desta prioridade; não repetir suas 13 decisões. O ensaio local não é backup do banco real; não integrar/publicar alterações de schema sem a verificação do destino.

Retomada da interface em 05/11: PR #33 integrado na main `5b2207e`; [CI #113](https://github.com/Diogo746/Da-Match/actions/runs/42079760834) success. Branch `codex/discovery-ui` conecta a tela principal no modo API aos perfis do banco, sem fallback fictício, preservando DEMO. Validação e limites no [guia 35](35-discovery-ui-validation.md): 606 testes + oito de configuração, lint/builds, navegador desktop/360 px e PostgreSQL local, sem alteração de schema/backend ou banco remoto. Conferir CI/gate e revisar/integrar a interface; depois etapa 6 conforme guia 29.

Retomada da API de descoberta em 05/11: contrato PR #32 integrado na main `c34edc6`; [workflow #110](https://github.com/Diogo746/Da-Match/actions/runs/42067501541) success. Backend implementado/validado localmente em `codex/discovery-api`, conforme [guia 34](34-discovery-api-validation.md): 257 testes/Checkstyle/arquitetura, 49 verificações HTTP/PostgreSQL e ensaio com 500 perfis fictícios. Sem schema novo, frontend alterado ou banco remoto acessado. Conferir CI/gate do head antes da integração; depois conectar a tela principal à API.

Retomada posterior em 05/11: PR #31 integrado à main `dc66ec7`; [workflow #108](https://github.com/Diogo746/Da-Match/actions/runs/42064283961) success, incluindo ambos os gates, ZAP e job de deploy. Etapa 4 integrada; homologação publicada continua operacional. Etapa 5 iniciada pelo contrato no [guia 33](33-discovery-contract.md), após três respostas do usuário: acesso STARTUP/MENTOR autenticado, perfis publicados/completos (mentor aceitando novas startups) e exposição limitada ao nome/resumo e campos gerais, sem textos privados/equipe/contatos/agenda. Branch documental `codex/discovery-contract`; API/interface real ainda pendentes.

Retomada em 05/11: PR #30 integrado à main `fc600c7`; [workflow #105](https://github.com/Diogo746/Da-Match/actions/runs/41937983752) concluído com sucesso. Interface de equipe e convites implementada/validada localmente em `codex/startup-team-ui`, aguardando revisão/integração. Fluxos, recuperação, testes e limitações no [guia 32](32-startup-team-ui-validation.md). Paleta preservada; sem alteração de backend ou banco remoto nesta entrega.

Retomada do backend em 04/11: PR #29 integrado em `33e8671`, [workflow #102](https://github.com/Diogo746/Da-Match/actions/runs/41928833934) aprovado. Implementação na branch `codex/startup-team-api`: 187 testes backend/Checkstyle/arquitetura, 96,70% de linhas; 57 cenários HTTP PostgreSQL e 33 verificações extras com dez disputas entre projetos aprovadas. Ensaio em cópia local PostgreSQL populada com dados fictícios legados preservou registros/vínculos. Não é inspeção ou cópia do banco remoto. Evidências e limitações no [guia 31](31-startup-team-api-validation.md); interface de convites pendente.

Retomada de 04/11: main atualizada por fast-forward até `de71fa5`. [PR #27](https://github.com/Diogo746/Da-Match/pull/27) integrado em `a847958`, com [workflow #98](https://github.com/Diogo746/Da-Match/actions/runs/41239498394) aprovado. [PR #28](https://github.com/Diogo746/Da-Match/pull/28) integrado em `de71fa5`: nova paleta nos temas claro/escuro e ajustes da navegação em `shared/theme.css` e `app.component.css`, sem mudança de backend/contratos. [Workflow #100](https://github.com/Diogo746/Da-Match/actions/runs/41697332569) concluído com sucesso, incluindo ambos os gates e job de deploy. CI não substitui homologação funcional publicada. Branch da etapa seguinte: `codex/startup-team-contract`, baseada nessa main; cores preservadas.

Etapa 4 iniciada pela definição do contrato no [guia 30](30-startup-team-invitations.md), após quatro respostas do usuário: contas STARTUP existentes, convite no sistema com aceite, papéis MEMBRO/REPRESENTANTE sem alteração de papéis existentes e validade de 7 dias. Somente documentação nesta entrega; persistência/rotas/interface de convites ainda não implementadas. JWT mantendo CSRF foi registrado como decisão futura de autenticação, sem reordenar estas etapas ou iniciar migração de hospedagem.

Retomada de 31/10: PR #26 integrado na main `0f901ef`, com [workflow #96](https://github.com/Diogo746/Da-Match/actions/runs/41234510526) concluído com sucesso. Etapa 3 iniciada dessa base na branch `codex/startup-publication-ui`; matching continua definido somente na documentação.

Trabalhar uma etapa por vez. Cada etapa pode ocupar mais de uma sessão; não há compromisso de concluir tudo amanhã. Marcar concluído somente com implementação e validação correspondentes. Ao encerrar, atualizar o quadro abaixo, registrar branch/commit/PR/checks e escrever a próxima ação exata. Não repetir entregas já integradas nem tratar decisões de produto pendentes como aprovadas.

| Etapa | Situação | Resultado esperado |
| --- | --- | --- |
| 0. Retomada e homologação da base | Concluída localmente e integrada pelo PR #23; CI pós-merge #86 aprovado | Main conferida e fluxos atuais homologados em navegador/H2 |
| 1. Contrato de publicação | Concluída em 30/10; [guia 28](28-startup-publication-contract.md) | Cadastro + questionário completo exigidos; estados, pendências, HTTP e acesso definidos |
| 2. Publicação no backend | Integrada pelo PR #25 na main `2a5d321`; CI pós-merge #94 aprovada | Estado persistido, autorização, endpoints e testes; evidências operacionais na etapa 10 |
| 3. Publicação no frontend | Integrada pelo PR #27 em `a847958`; CI pós-merge #98 aprovada | Publicar/pausar/retomar/voltar a rascunho e consultar pendências pela API |
| 4. Integrantes | Integrada pelos PRs #29/#30/#31; main `dc66ec7`, CI pós-merge #108 aprovada; evidências locais no guia 32 | Equipe, convite/aceite, recuperação e permissões |
| 5. Descoberta real | Contrato PR #32 e backend PR #33 integrados; main `5b2207e`/CI #113 success. Interface validada localmente em `codex/discovery-ui` (guia 35), aguardando CI/revisão/integração | Catálogo de perfis elegíveis pela API |
| 6. Matching definitivo | Regra definida pelo usuário em 30/10 no [guia 29](29-matching-rule-decisions.md); implementação pendente | `damatch-mentoria-v1`, após as dependências; atualizar revisão formal do SRS |
| 7. Salvos persistidos | Pendente; confirmar escopo | Favoritos por conta |
| 8. Interesses e conexões | Pendente | Interesse e reciprocidade persistidos |
| 8.1. Conversas reais | Incluída pelo usuário em 11/11; backend e integração API pendentes | Conversas e mensagens no banco, com listagem/envio paginados e autorização dos participantes; depende das conexões |
| 9. Reuniões | Pendente | Agendamento entre conexões |
| 10. Homologação operacional | Pendente; transversal | PostgreSQL, acessibilidade e operação validados |

## Etapa 0 — Primeiro trabalho de amanhã

1. Ler este roteiro e `AGENTS.md`; conferir alterações locais, PR #22, workflow #84 e eventuais mudanças posteriores da equipe.
2. Preservar o planejamento local, atualizar a main e iniciar a próxima funcionalidade em nova branch, sem reutilizar a branch já integrada.
3. Homologar no navegador o cadastro → login → consulta/edição → questionário → recarga → logout. Conferir troca de projetos, histórico voltar/avançar, permissões de membro e isolamento entre contas.
4. Conferir mentor: agenda compartilhada entre perfil/questionário e bloqueio de nova escrita após resultado sem confirmação até GET válido.
5. Registrar desktop/mobile, evidências e limitações reais. Se houver regressão, corrigi-la antes de avançar.

Conclusão: base integrada conferida, sem regressões conhecidas no fluxo validado. Ensaio PostgreSQL fica registrado na etapa 10 e deve anteceder o deploy de alterações de schema.

### Evidências de 29/10/2026

História validada: onboarding → sessão/CSRF → consulta/edição → questionário → nova consulta/novo login, pelo proxy Angular → Spring → banco H2 em arquivo isolado. Não foi acessado nem alterado banco remoto; não houve implementação de funcionalidade, merge ou deploy manual.

| Fronteira/cenário | Resultado e evidência |
| --- | --- |
| Remoto/main | PR #22 integrado; main `e8c851b`; workflow #84 aprovado, incluindo ambos os gates e job de deploy. |
| Backend | `mvn -o -pl backend test`: 145 testes, zero falhas/erros/ignorados, Checkstyle e arquitetura aprovados. Log local: `backend/target/homologation-tests.log`. |
| Frontend/rotas e falhas | 378 testes + 8 de configuração aprovados; 99,05% de linhas e 96,53% de branches. Inclui Router com voltar/avançar, descarte de respostas antigas e bloqueio/recuperação após escrita incerta. Executado com `npm.cmd run test:coverage -- --runner-config=.angular/cache/homologation-vitest.mjs`; configuração local ignorada: `{ test: { maxWorkers: 2, fileParallelism: false } }`. Log: `frontend/.angular/cache/homologation-tests-limited.log`. Não é teste em navegador real. |
| Proxy → API | 27 cenários HTTP aprovados em `http://127.0.0.1:4200`, com sessão, CSRF e JSON UTF-8 reais. Script e relatório locais ignorados: `backend/target/homologation-http.py` e `homologation-http-report.json`. Credenciais fictícias geradas em memória; não salvas no relatório. |
| Startup | Onboarding 201 sem login automático; fundador único; cadastro autenticado bloqueado; edição parcial/limites/rollback; questionário 204 inicial → PUT → GET → novo login, prioridades preservadas e rótulo sem renomear projeto. |
| Vínculos e isolamento | Três projetos da mesma conta, ordenação estável, questionários separados, representante escreve, membro só consulta, revogação imediata, conta sem vínculo bloqueada e único fundador preservado. Alternância aqui foi por chamadas HTTP; não é revisão de navegação no navegador. |
| Mentor | Agenda nula rejeitada com 400 sem criação parcial; PATCH inválido preserva dados; questionário e perfil compartilham agenda; outro titular é bloqueado; publicar → pausar → retomar e novo login preservam estado. |
| Cookies/senha | `JSESSIONID` e `XSRF-TOKEN` HttpOnly; escritas sem CSRF rejeitadas; senha Unicode de 72 bytes aceita, 74 bytes rejeitada no cadastro e sufixo acima de 72 bytes rejeitado no login novo. |
| Encerramento de sessões | Todas as cinco sessões autenticadas do ensaio final encerradas por logout; GET de conta após logout retorna 401. |
| Navegador, primeira rodada | Inicialmente indisponível: `browsers: []` e `The browser access host is unavailable`. Resolvido na retomada pelo aplicativo desktop; resultados da segunda rodada abaixo. |

O script de homologação compara a data de criação antes/depois da edição com o valor já persistido obtido por GET. O POST pode retornar nanossegundos enquanto o banco representa microssegundos; essa diferença de representação não demonstra que o PATCH alterou a data. Nenhuma mudança de código foi feita por esse diagnóstico.

Limitação do runner local: a primeira execução padrão do frontend teve seis timeouts de 5 segundos; a segunda, depois de terminar as validações pesadas, ainda teve cinco timeouts. Com arquivos em sequência e limite de dois workers, os mesmos 378 testes passaram em 21,51 segundos. Isso indica contenção na execução concorrente local. Não houve aumento de timeout, alteração de testes, exclusões, redução de cobertura nem mudança na configuração versionada/CI. Lint e builds não foram repetidos nesta entrega exclusivamente documental; o frontend API compilou para servir a homologação e os resultados do CI da base foram conferidos.

### Conferência de interface executada no desktop

Ambiente local: frontend `http://127.0.0.1:4200/`, API somente em `127.0.0.1:8080`, H2 em `backend/target/homologation-20261029.mv.db`. A configuração de execução aponta explicitamente para H2; não reutilizar a configuração padrão de banco remoto para esses testes. Os registros são exclusivamente fictícios. Não versionar o banco nem usar credenciais reais.

- [x] Startup pelo navegador: cadastro → entrar → conta → perfil → editar/cancelar/salvar → questionário completo → salvar → recarregar → sair → entrar novamente. Dados e credenciais exclusivamente fictícios.
- [x] Múltiplos projetos: três vínculos, seleção e questionários distintos; voltar/avançar confirmou projeto Beta editável como REPRESENTANTE e projeto Gama somente leitura como MEMBRO. O teste de reuso direto da mesma instância do componente continua coberto pelo RouterTestingHarness; não confundir com navegação entre páginas no navegador.
- [x] Contas diferentes e membro comum: após troca de conta, somente o projeto próprio apareceu; URL direta do questionário da conta anterior exibiu indisponibilidade sem respostas privadas. MEMBRO não recebeu controles de edição no perfil nem no questionário.
- [x] Mentor: cadastro com agenda, consulta em RASCUNHO, edição/PATCH, PUT do questionário, sincronização da agenda nos dois sentidos, publicar → pausar → retomar, recarga e novo login. Respostas iniciais completas do mentor e vínculos extras das startups foram preparados pela API local; o cadastro, as edições e as ações verificadas depois foram feitos pela interface.
- [x] Resultado sem confirmação: frontend local interrompido após carregar o formulário, API/H2 mantidos; envio falhou por conexão e bloqueou salvar/publicar/pausar. GET ainda indisponível manteve bloqueio. Ao restaurar o frontend, Vite recarregou a aplicação e o GET válido recuperou os dados confirmados; nova gravação funcionou. Falha HTTP 500 continua coberta nos testes de componente, não foi induzida nesta rodada do navegador.
- [x] Desktop e 360 px: cadastro de startup no tema claro, questionário e perfil/ações do mentor no tema escuro; sem rolagem horizontal nos estados inspecionados. Teclado: Tab entre campos, Enter para pausar mentor e enviar formulário vazio; resumo de erros recebeu foco. Tema e viewport originais restaurados. Console consultado após recuperação sem erros registrados naquele momento; erros de rede durante a interrupção foram intencionais.
- [ ] Etapa 10: ensaio de zoom real a 200%, leitor de tela, acessibilidade completa e revisão de todas as telas/estados. Os atalhos de zoom pela API de navegador não alteraram a escala, portanto não considerar zoom testado. Viewport estreito não comprova zoom real.

Na sessão desktop, a extensão Chrome e o navegador integrado passaram a aparecer no inventário e foi possível operar uma aba de homologação desta conversa. O rótulo de origem registrado no início de uma conversa não comprova seu contexto de execução após retomá-la no desktop. Não forjar configurações de autorização do host.

Achado corrigido: o rodapé de `/cadastro` ainda dizia que o questionário era demonstrativo. O texto agora orienta preencher o questionário da startup ou do mentor após login e mantém descoberta/recomendações como demonstração. Nenhuma regra de negócio ou endpoint foi alterado.

Validação após essa correção: lint, **378 testes frontend + 8 de configuração**, **99,05% de linhas / 96,53% de branches**, builds DEMO/API aprovados. Suíte usa a mesma configuração local de concorrência reduzida. Backend não foi alterado; os 145 testes aprovados da primeira rodada continuam sendo a referência da mesma base. Logs locais: `frontend/.angular/cache/homologation-desktop-{lint,tests,build-demo,build-api}.log`.

Evidências visuais locais ignoradas, em `frontend/.angular/cache/`: `homologation-questionnaire-desktop.jpg`, `homologation-questionnaire-360.jpg`, `homologation-registration-360-light.jpg`, `homologation-mentor-360.jpg`, `homologation-mentor-actions-360.jpg`, `homologation-mentor-uncertain.jpg` e `homologation-mentor-confirmed-desktop.jpg`. Capturas completas de algumas páginas excederam o limite do serviço; as evidências salvas são da viewport. Credenciais temporárias fictícias dos preparadores foram removidas; todas as sessões abertas para os ensaios foram encerradas por logout. Registros fictícios permanecem apenas no H2 local.

Homologação publicada e ensaio em cópia PostgreSQL permanecem separados na etapa 10. A base foi homologada nos fluxos locais descritos, sem regressão funcional encontrada; a correção textual foi integrada pelo PR #23, com workflows #85 do PR e #86 pós-merge aprovados.

## Etapa 1 — Definir publicação da startup

- Contrato no [guia 28](28-startup-publication-contract.md), definido em 30/10. Endpoints novos continuam indisponíveis nesta etapa documental.
- O usuário aprovou exigir os dados obrigatórios do cadastro e o questionário v3 completo e salvo para a startup selecionada.
- O usuário aprovou voltar manualmente a `RASCUNHO`, além de publicar/pausar/retomar. Estado próprio, separado de `statusValidacao`; destino PUBLICADO sempre exige aptidão, demais destinos preservam dados sem exigir quiz.
- Edição válida preserva estado; edição que retire requisito de perfil publicado é rejeitada atomicamente, sem despublicação implícita. Salvar não publica.
- GET/PATCH propostos em `/api/v1/startups/{startupId}/status`, DTO de estado/aptidão/pendências e `409` específico para publicação incompleta. Gestão por FUNDADOR/REPRESENTANTE, consulta por membro, sem exceção ADMIN.

Conclusão: contrato documentado com exemplos de estados/transições, pendências e respostas HTTP; resolver com o usuário apenas decisões de produto sem resposta no projeto.

## Etapa 2 — Backend de publicação

- Implementar estado persistido textual, default seguro `RASCUNHO` para novos e antigos registros e regras no serviço.
- Criar DTOs/endpoint de consulta e alteração de status conforme etapa 1, com sessão, CSRF e vínculo atual verificado sob bloqueio transacional.
- Testar requisitos, transições, conta sem vínculo, membro sem gestão, ADMIN sem exceção, concorrência relevante e atualização de tabela populada.
- Atualizar Postman e documentação; executar `mvn -pl backend test` e Checkstyle. Hibernate continua responsável pelo schema, sem reintroduzir Flyway.

Conclusão: API testada e contrato consumível pelo frontend; ensaio em cópia PostgreSQL antes de implantar a coluna.

### Entrega local em 30/10/2026

- `StatusPerfilStartup` textual, inicializador/default SQL `RASCUNHO`; `statusValidacao` independente. `StartupResponse` ganha somente `status`; listagem geral mantém acesso autenticado e não vira descoberta.
- GET/PATCH `/api/v1/startups/{startupId}/status`, DTO de estado/aptidão/permissão/pendências e conflito específico `409 STARTUP_INCOMPLETA`. Consulta por membro STARTUP; gestão por FUNDADOR/REPRESENTANTE com CSRF. Sem exceção ADMIN e sem ator enviado pelo cliente.
- Avaliador único reutiliza a validação v3 existente, verifica perfil inteiro e quiz da startup selecionada. Publicar sempre revalida; pausar/rascunho preservam dados sem exigir quiz; salvar não publica. Edição inconsistente de publicado retorna `400` com rollback.
- Permissão e aptidão avaliadas sob bloqueio pessimista da startup. Dois testes concorrentes confirmam reavaliação após alteração do quiz ou revogação de representante em outra transação.
- **165 testes backend**, zero falhas/erros/ignorados, Checkstyle e arquitetura aprovados. Log local ignorado: `backend/target/startup-publication-tests.log`. Inclui schema populado sem coluna, nove transições/repetições, isolamento de projetos, papéis, CSRF real, rollback e HTTP `400/401/403/404/409/415`.
- **19 cenários HTTP reais** pela API em `127.0.0.1:8081`, H2 em arquivo `backend/target/startup-publication-qa.mv.db`: cadastro, login, pendências/conflito, quiz, publicação, edição/rollback, logout/novo login, pausa/retomada/rascunho. Relatório ignorado: `backend/target/startup-publication-http-report.json`; credenciais fictícias geradas apenas em memória, sessões encerradas.
- Postman atualizado na pasta Startup com consulta e alteração de publicação e validação de `200/409`. Frontend não alterado; revisão de interface e testes dessa integração pertencem à etapa 3. Não alegar homologação publicada ou ensaio PostgreSQL a partir do H2.

## Etapa 3 — Frontend de publicação

- Mostrar estado confirmado pelo servidor, pendências e ações publicar/pausar/retomar conforme contrato e permissão.
- Preservar seleção de projeto, proteção contra respostas antigas de outra conta/projeto, CSRF e separação DEMO/API.
- Tratar carregamento, validação, falta de permissão, resultado sem confirmação e recuperação por GET antes de nova escrita.
- Validar fluxo completo, recarga, desktop/mobile e teclado; executar lint, cobertura e builds DEMO/API, depois conferir gates do commit.

Conclusão: fundador/representante consegue publicar e pausar o projeto elegível, membro consulta, e o estado persiste após novo acesso.

### Entrega e homologação local — 31/10/2026

Interface implementada em `codex/startup-publication-ui`, baseada na main `0f901ef`; integrada pelo PR #27 em `a847958`, com CI #98 aprovada, conferida em 04/11. Esta validação não comprova homologação publicada.

- Estado, aptidão, permissão e pendências vêm de GET `/status`. PATCH envia somente o destino; confirma resposta do projeto correto antes de atualizar a tela. Rascunho publica; publicado pausa/volta a rascunho; pausado retoma/volta a rascunho. Publicação exige aptidão, gestão exige vínculo e permissão confirmados. Salvar perfil/quiz não publica.
- Seleção em `/startup/perfil?projeto=ID`, validada contra `/startups/me`; voltar do questionário, recarga e histórico preservam o projeto. Respostas atrasadas de projeto, conta ou sessão anterior são descartadas, inclusive após sair/entrar na mesma conta. Requisição aguardando CSRF não é enviada se a sessão mudar; erro antigo não encerra uma nova sessão.
- `409 STARTUP_INCOMPLETA` válido atualiza pendências sem mudar estado. Falha de conexão, timeout, `5xx` ou resposta inválida bloqueia edição/publicação/seleção até GET confirmado do perfil e publicação. Sem repetição automática. Sessão expirada oferece entrada novamente; `403` exige conferir permissões. Leitura aceita textos legados incompletos para correção; cadastro continua estrito e exige confirmação RASCUNHO.
- **447 testes frontend + 8 de configuração**, **99,13% de linhas / 96,32% de branches**, lint e builds DEMO/API aprovados. Inclui seis testes com Router real, respostas fora de ordem, perda de permissão, sessão, conflito e resultado incerto. Runner local ignorado limita concorrência a dois workers/arquivos sequenciais, sem alterar CI, timeouts ou exclusões. Logs: `frontend/.angular/cache/publication-{tests,lint,build-demo,build-api}.log`.
- **18 cenários HTTP** pelo proxy Angular → Spring → H2 isolado, com sessão/CSRF: cadastro, pendências, conflito, representante, membro somente leitura e logout. Relatório local ignorado: `backend/target/publication-ui-http-report.json`. Backend e schema não foram alterados nesta etapa; referência da base: 165 testes e CI pós-merge #94, sem alegar nova execução backend.
- Navegador integrado: cadastro real de conta fictícia → login → três projetos (FUNDADOR/REPRESENTANTE/MEMBRO) → questionário de seis etapas preenchido/salvo na interface → retorno ao projeto → publicar/pausar/retomar/rascunho → recarga → edição de perfil publicado mantendo estado. Projetos adicionais e seus quizzes foram preparados pela API local; quiz do fundador foi preenchido pela interface.
- API interrompida durante ensaio: alteração sem confirmação preservou estado e bloqueou novas escritas; GET indisponível manteve bloqueio. Após restaurar API, novo login confirmou dados, questionário e publicação persistidos. Sessão da interface encerrada por logout; sessões do preparador também encerradas.
- Desktop e 360 px, temas claro/escuro e Enter para pausar conferidos; sem rolagem horizontal nos estados inspecionados. Viewport/tema restaurados. Erros de rede durante a interrupção foram intencionais. Capturas locais ignoradas em `frontend/.angular/cache/`: `publication-final-desktop.jpg`, `publication-360-{dark,light}.jpg`, `publication-pending-desktop.jpg` e `publication-uncertain.jpg`.

Ambiente explicitamente local: frontend `127.0.0.1:4201`, API `127.0.0.1:8081`, H2 `backend/target/startup-publication-ui-20261031.mv.db`. Não usar configuração padrão de banco remoto. Sem alteração remota de banco ou deploy manual. Cópia PostgreSQL, zoom real 200%, leitor de tela e homologação publicada continuam na etapa 10.

## Etapa 4 — Integrantes

- Contrato definido em 04/11 no [guia 30](30-startup-team-invitations.md), após quatro respostas do usuário: destinatário STARTUP já cadastrado, identificado por e-mail exato; convite dentro do sistema com aceite; MEMBRO/REPRESENTANTE, sem alterar papéis existentes; validade de 7 dias.
- Backend/Postman integrados pelo PR #30 em `fc600c7`, CI #105 aprovada. Inclusão HTTP direta encerrada com 410; vínculos legados preservados. Evidências e ensaio PostgreSQL fictício no guia 31; não comprovam backup/compatibilidade de produção.
- Interface integrada pelo PR #31 na main `dc66ec7`, CI #108 aprovada: consulta da equipe, convites enviados/recebidos, confirmação de ações e recuperação sem repetição automática, com seleção, sessão/CSRF e paleta preservados. Evidências locais no guia 32; validação publicada continua na etapa 10.
- Não repetir as quatro decisões já respondidas. Etapa funcional integrada; seguir para descoberta real da etapa 5.

Conclusão: gestão funcional e testada, sem ações fictícias de convite ou troca de papel.

## Etapa 5 — Descoberta real

- Contrato no [guia 33](33-discovery-contract.md), preparado após três respostas do usuário em 05/11: acesso autenticado STARTUP/MENTOR; publicação, cadastro e quiz completos; mentor aceitando novas startups. Nome/apresentação e campos gerais definidos, sem textos completos privados da startup, equipe, contatos ou agenda.
- Preservar RN12: STARTUP pesquisa MENTOR e MENTOR pesquisa STARTUP. Rotas de consulta próprias e DTO mínimo, filtros, páginas de até 20, ordem estável e elegibilidade antes da paginação. Não usar respostas/rotas de gestão como catálogo nem aplicar matching no frontend.
- Validação do mentor deve usar agenda de `disponibilidade_mentor`, não a coleção vazia do quiz persistido. Publicado sem quiz continua fora da descoberta; não mudar implicitamente o PATCH de publicação existente.
- Contrato integrado pelo PR #32, CI #110 aprovada. Backend/testes/Postman/matriz implementados em `codex/discovery-api`, com evidências no guia 34; revisar/integrar após CI/gate do head. As quatro rotas não estão na main apenas pela definição documental.
- Conectar interface à API, com estados vazio/erro/carregamento e separação explícita de DEMO.

Conclusão: catálogo real mostra somente perfis elegíveis e respeita a visibilidade definida.

## Etapa 6 — Matching definitivo

- Questionário concluído a pedido do usuário em 30/10: 13 respostas e especificação normativa no [guia 29](29-matching-rule-decisions.md); histórico das alternativas no [guia 16](16-decisao-regra-matching.md). Versão `damatch-mentoria-v1`, independente do quiz e da demonstração.

- Pesos: necessidades/setor/momento/público/agenda/formação 50/15/10/10/10/5; principal/secundária 70/30; prática 100% e conhecimento 70%. Pelo menos uma necessidade atendida. Sem agenda comum perde 10, não exclui; frequências fixas diferentes excluem salvo flexível. Modalidade/cidade precisam permitir encontro.
- Uma área em comum rende setor inteiro; mentor geral recebe 7,5; desconhecidos rendem zero sem redistribuição. Um público em comum rende 10. Formação específica adicional ao time rende 5, ignorando OTHER/STUDENT e exigindo áreas específicas nos dois lados.
- Corte inclusivo 60; selo inclusivo 95; precisão decimal exata, sem arredondar antes de comparar. Desempate: necessidades atendidas, necessidades com prática, agenda comum, UUID estável. Capacidade informativa por enquanto; controle automático fica para gestão das mentorias.
- Implementar cálculo e relatório com revisões/versão, elegibilidade atual, isolamento de conta/projeto e atualização após edições/pausa. Participante recebe ordem e selo, sem nota nem contribuição numérica em JSON; relatório completo exige autorização administrativa.
- Usar os casos de referência do guia 29 nos testes do backend, endpoints e integração frontend; preservar sessão/CSRF e separar DEMO/API. Sem indicações acima do corte: lista vazia, sem relaxar regras nem inserir dados fictícios.
- Incorporar a decisão à próxima revisão formal do SRS; US-16/18/19 devem seguir o guia 29. Definição antecipada não adianta a implementação frente a publicação/frontend/integrantes/descoberta.

Conclusão: casos de referência aprovados conferem com o cálculo e as permissões; nenhuma nota enviada pelo cliente é confiada.

## Etapas 7 a 9 — Relacionamento, conversas e reuniões

7. Confirmar salvos no escopo, persistir por conta e restaurar após novo acesso. Salvar não cria interesse/conexão.
8. Definir e implementar interesse enviado/recebido, conexão por reciprocidade, visibilidade de contato e proteção contra duplicidade/concorrência.
9. Definir e implementar proposta, confirmação/recusa e demais ações de reunião aprovadas, dentro de conexão ativa, com instante/fuso explícitos (`America/Sao_Paulo` na interface).

Conclusão de cada entrega: autorização, persistência, fluxo pela interface e documentação verificados separadamente.

### Etapa 8.1 — Backend e integração das conversas reais

Incluída a pedido do usuário em 11/11/2026, após a entrega das telas pelo frontend. Executar depois de interesses/conexões e antes de reuniões, preservando a prioridade atual da migração Vercel e a sequência do matching.

- Definir o contrato de conversa, participantes e papéis autorizados da startup a partir das conexões aceitas. Compatibilidade, perfil salvo e simples vínculo com a startup não concedem acesso automático a mensagens.
- Persistir conversas e mensagens no PostgreSQL; oferecer listagem, histórico paginado e envio. Remetente vem da autenticação, e identificadores, ordem e datas oficiais são gerados pelo backend.
- Conferir participação/autorização em cada leitura e escrita, manter CSRF e validar conteúdo/limites. Definir prevenção de envio duplicado, tratamento de resultado incerto e política para histórico/envio após encerramento da conexão.
- Conectar as telas existentes ao contrato real, com carregamento, vazio, erro e confirmação de envio. Não importar o histórico local de demonstração nem oferecer troca de persona no modo API.
- Definir a necessidade de atualização em tempo real antes de escolher tecnologia ou contratar serviço; a tarefa não autoriza recursos pagos.
- Incluir testes de isolamento entre conversas/contas, permissões, persistência após novo login e envio, além de Postman e documentação do contrato.

Referência da interface e das limitações atuais: [prévia de conversas](../frontend/CONVERSAS.md). Hoje o histórico é local e fictício apenas em DEMO; `/conversas` no modo API informa indisponibilidade. Endpoints reais de mensagens ainda não existem.

Conclusão: duas contas autorizadas trocam mensagens persistidas pela aplicação real, enquanto terceiros não conseguem ler ou enviar nessa conversa. Resolver as decisões de participantes, encerramento e entrega antes da implementação.

## Etapa 10 — Validação operacional e trabalho futuro

- Ensaiar atualizações Hibernate em cópia PostgreSQL populada, com backup e preservação de dados, antes de deploy que altere schema. Não testar alterações destrutivas em dados reais.
- Configurar rate limit antes da abertura pública e planejar sessões antes de múltiplas réplicas.
- Validar ambiente publicado, mobile a partir de 360 px, zoom de 200%, teclado, leitor de tela, temas e estados de falha por fluxo entregue.
- A reformulação completa de todas as telas fica para uma etapa própria após estabilizar os fluxos reais; usar inventário e critérios do guia 23.

## Registro para a próxima sessão

- **Próxima ação exata:** concluir a preparação JWT/Vercel em `codex/vercel-backend-jwt`, conferir CI/Quality Gates, backup/schema do destino e condições do corte no guia 36. PR34 já integrado. Preservar Render até homologação real; usar somente recursos gratuitos. Depois retomar matching da etapa 6 conforme guia29, sem repetir decisões já respondidas.
- **Entrega da publicação:** backend/Postman no PR #25, main `2a5d321`, CI #94 aprovada; interface validada em 31/10 e integrada pelo PR #27 em `a847958`, CI pós-merge #98 aprovada.
- **Entrega desta definição (30/10) e resolução (31/10):** somente documentação no PR #26, branch `codex/matching-rule-decision`; 13 respostas, fórmula e 14 casos de referência, US-16/18/19 alinhadas. Main `2a5d321` incorporada à branch para conciliar o roteiro e o índice. Nenhuma implementação de matching, alteração de aplicação além da main, mudança remota de banco ou deploy manual nesta entrega.
- **Entrega de 04/11:** contrato de integrantes no guia 30 e continuidade atualizada, branch `codex/startup-team-contract`, base `de71fa5`. Sem mudanças de aplicação, schema ou banco remoto; verificar checks do PR documental, sem alegar novos testes/gates de aplicação quando dispensados.
- **Ao encerrar a próxima sessão:** atualizar etapa, evidências, branch/head/PR/checks e este ponteiro, além de `AGENTS.md` local.

Nota operacional de 04/11: `mvn clean` removeu os H2 e artefatos antigos em backend/target; preservar os relatórios versionados como histórico e não presumir existência dos caminhos antigos. Novas evidências foram recriadas nesta etapa. Não executar clean onde haja bancos/fixtures/evidências a preservar; detalhes no guia 31.
