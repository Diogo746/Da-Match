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

Trabalhar uma etapa por vez. Cada etapa pode ocupar mais de uma sessão; não há compromisso de concluir tudo amanhã. Marcar concluído somente com implementação e validação correspondentes. Ao encerrar, atualizar o quadro abaixo, registrar branch/commit/PR/checks e escrever a próxima ação exata. Não repetir entregas já integradas nem tratar decisões de produto pendentes como aprovadas.

| Etapa | Situação | Resultado esperado |
| --- | --- | --- |
| 0. Retomada e homologação da base | Concluída localmente e integrada pelo PR #23; CI pós-merge #86 aprovado | Main conferida e fluxos atuais homologados em navegador/H2 |
| 1. Contrato de publicação | Concluída em 30/10; [guia 28](28-startup-publication-contract.md) | Cadastro + questionário completo exigidos; estados, pendências, HTTP e acesso definidos |
| 2. Publicação no backend | Integrada pelo PR #25 na main `2a5d321`; CI pós-merge #94 aprovada | Estado persistido, autorização, endpoints e testes; evidências operacionais na etapa 10 |
| 3. Publicação no frontend | Pendente; depende da 2 | Publicar/pausar e consultar pendências pela API |
| 4. Integrantes | Pendente | Regras de contas e interface de gestão |
| 5. Descoberta real | Pendente | Catálogo de perfis elegíveis pela API |
| 6. Matching definitivo | Regra definida pelo usuário em 30/10 no [guia 29](29-matching-rule-decisions.md); implementação pendente | `damatch-mentoria-v1`, após as dependências; atualizar revisão formal do SRS |
| 7. Salvos persistidos | Pendente; confirmar escopo | Favoritos por conta |
| 8. Interesses e conexões | Pendente | Interesse e reciprocidade persistidos |
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

## Etapa 4 — Integrantes

- O backend já lista, adiciona e remove integrantes; começar pelos contratos existentes.
- Definir como localizar/convidar conta existente, quais tipos de conta podem integrar startups e se alteração de papel fará parte da entrega. Hoje a associação admite MENTOR/ADMIN, mas `/startups/me` e questionário exigem STARTUP; resolver essa diferença antes da interface.
- Implementar interface e eventuais ajustes autorizados, preservando ausência de duplicidade, fundador obrigatório e autorização de gestão.

Conclusão: gestão funcional e testada, sem ações fictícias de convite ou troca de papel.

## Etapa 5 — Descoberta real

- Definir API/DTO próprio de catálogo e detalhe, filtros, paginação e elegibilidade por publicação para cada tipo de perfil.
- Definir dados visíveis e dados privados de gestão/contato. A listagem geral atual de startups retorna integrantes e não filtra publicação; não usá-la diretamente como catálogo.
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

## Etapas 7 a 9 — Relacionamento e reuniões

7. Confirmar salvos no escopo, persistir por conta e restaurar após novo acesso. Salvar não cria interesse/conexão.
8. Definir e implementar interesse enviado/recebido, conexão por reciprocidade, visibilidade de contato e proteção contra duplicidade/concorrência.
9. Definir e implementar proposta, confirmação/recusa e demais ações de reunião aprovadas, dentro de conexão ativa, com instante/fuso explícitos (`America/Sao_Paulo` na interface).

Conclusão de cada entrega: autorização, persistência, fluxo pela interface e documentação verificados separadamente.

## Etapa 10 — Validação operacional e trabalho futuro

- Ensaiar atualizações Hibernate em cópia PostgreSQL populada, com backup e preservação de dados, antes de deploy que altere schema. Não testar alterações destrutivas em dados reais.
- Configurar rate limit antes da abertura pública e planejar sessões antes de múltiplas réplicas.
- Validar ambiente publicado, mobile a partir de 360 px, zoom de 200%, teclado, leitor de tela, temas e estados de falha por fluxo entregue.
- A reformulação completa de todas as telas fica para uma etapa própria após estabilizar os fluxos reais; usar inventário e critérios do guia 23.

## Registro para a próxima sessão

- **Próxima ação exata:** conferir checks e revisar/integrar o [PR #26](https://github.com/Diogo746/Da-Match/pull/26). No trabalho funcional, conferir evidências do ensaio PostgreSQL e homologação publicada da etapa 10; próxima funcionalidade é a etapa 3 (interface de publicação). Ela deve consultar estado/pendências da API, preservar múltiplos projetos/permissões e bloquear novas escritas após resultado incerto até GET confirmado. Não alterar dados remotos sem autorização. Na etapa 6, implementar o guia 29 sem repetir a decisão de pesos/filtros.
- **Entrega da publicação (30/10):** backend, Postman e documentação no PR #25, integrado em `2a5d321`; validações locais acima e CI pós-merge #94 aprovada. A interface permanece pendente.
- **Entrega desta definição (30/10) e resolução (31/10):** somente documentação no PR #26, branch `codex/matching-rule-decision`; 13 respostas, fórmula e 14 casos de referência, US-16/18/19 alinhadas. Main `2a5d321` incorporada à branch para conciliar o roteiro e o índice. Nenhuma implementação de matching, alteração de aplicação além da main, mudança remota de banco ou deploy manual nesta entrega.
- **Ao encerrar a próxima sessão:** atualizar etapa, evidências, branch/head/PR/checks e este ponteiro, além de `AGENTS.md` local.
