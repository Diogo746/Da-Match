# Roteiro por etapas para as próximas sessões

Registrado a pedido do usuário em 28/10/2026 para retomar amanhã, sem iniciar novas funcionalidades nesta sessão. Este é o ponto de entrada da retomada; os guias [23](23-continuity-and-frontend-redesign.md), [25](25-questionnaire-api.md) e [26](26-startup-code-review.md) contêm os detalhes existentes.

## Onde paramos

- Cadastro, sessão/CSRF, consulta e edição próprias com múltiplos projetos e questionário persistido já estão implementados.
- Correções da revisão integradas pelo [PR #22](https://github.com/Diogo746/Da-Match/pull/22), head `ac3f0d1`, merge na main `e8c851b`.
- [Workflow #83 do PR](https://github.com/Diogo746/Da-Match/actions/runs/40798248553): concluído com sucesso, incluindo ambos os Quality Gates e DAST. Validação: 145 testes backend/Checkstyle, 378 frontend + 8 de configuração, 99,05% de linhas frontend, lint e builds DEMO/API.
- [Workflow #84 após merge](https://github.com/Diogo746/Da-Match/actions/runs/40799178596): conferido em 29/10/2026, concluído com sucesso em testes, ambos os Quality Gates, DAST e job de deploy de produção. Esse resultado não substitui homologação funcional do ambiente publicado.
- Retomada em 29/10/2026: main local atualizada por fast-forward até `e8c851b`; nova branch `chore/startup-base-homologation`. Planejamento local preservado; cópia adicional em `backend/target/retomada-20261029/` (ignorada). `AGENTS.md` é local e ignorado, não deve ser versionado.

## Como executar o roteiro

Trabalhar uma etapa por vez. Cada etapa pode ocupar mais de uma sessão; não há compromisso de concluir tudo amanhã. Marcar concluído somente com implementação e validação correspondentes. Ao encerrar, atualizar o quadro abaixo, registrar branch/commit/PR/checks e escrever a próxima ação exata. Não repetir entregas já integradas nem tratar decisões de produto pendentes como aprovadas.

| Etapa | Situação | Resultado esperado |
| --- | --- | --- |
| 0. Retomada e homologação da base | Em andamento: remoto, backend e HTTP aprovados; navegador pendente | Main conferida e fluxo atual homologado |
| 1. Contrato de publicação | Pendente | Regras de estados, requisitos e pendências definidas |
| 2. Publicação no backend | Pendente; depende da 1 | Estado persistido, autorização, endpoint e testes |
| 3. Publicação no frontend | Pendente; depende da 2 | Publicar/pausar e consultar pendências pela API |
| 4. Integrantes | Pendente | Regras de contas e interface de gestão |
| 5. Descoberta real | Pendente | Catálogo de perfis elegíveis pela API |
| 6. Matching definitivo | Aguarda decisão da equipe/PO | Regra aprovada e cálculo no backend |
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
| Navegador | Não executado: inventário retornou `browsers: []` e `The browser access host is unavailable`. Não alegar revisão visual, mobile, teclado, console ou tráfego de navegador. |

O script de homologação compara a data de criação antes/depois da edição com o valor já persistido obtido por GET. O POST pode retornar nanossegundos enquanto o banco representa microssegundos; essa diferença de representação não demonstra que o PATCH alterou a data. Nenhuma mudança de código foi feita por esse diagnóstico.

Limitação do runner local: a primeira execução padrão do frontend teve seis timeouts de 5 segundos; a segunda, depois de terminar as validações pesadas, ainda teve cinco timeouts. Com arquivos em sequência e limite de dois workers, os mesmos 378 testes passaram em 21,51 segundos. Isso indica contenção na execução concorrente local. Não houve aumento de timeout, alteração de testes, exclusões, redução de cobertura nem mudança na configuração versionada/CI. Lint e builds não foram repetidos nesta entrega exclusivamente documental; o frontend API compilou para servir a homologação e os resultados do CI da base foram conferidos.

### Conferência de interface ainda necessária

Ambiente local: frontend `http://127.0.0.1:4200/`, API somente em `127.0.0.1:8080`, H2 em `backend/target/homologation-20261029.mv.db`. A configuração de execução aponta explicitamente para H2; não reutilizar a configuração padrão de banco remoto para esses testes. Os registros são exclusivamente fictícios. Não versionar o banco nem usar credenciais reais.

- [ ] Startup pelo navegador: cadastro → entrar → conta → perfil → editar/cancelar/salvar → questionário → salvar → recarregar → sair → entrar novamente. Usar e-mail fictício único e senha inventada.
- [ ] Conta com múltiplos projetos: alternar projeto, questionário e histórico voltar/avançar; confirmar nome/URL, respostas e permissão do contexto atual. Preparar vínculos locais pela API, se necessário.
- [ ] Contas diferentes e membro comum: não exibir dados privados da sessão anterior, nem permitir edição por membro.
- [ ] Mentor: agenda no perfil/questionário, edição, publicar/pausar e recarga. Induzir resposta perdida/500 em ambiente local e confirmar bloqueio de escrita até GET válido; os testes de componente simulam essas falhas, mas não equivalem ao navegador.
- [ ] Desktop, 360 px e zoom de 200%: conferir campos, mensagens e ações sem cortes; navegar por teclado, verificar foco e console. Não marcar essas verificações apenas por aprovação de JSDOM.

Homologação publicada e ensaio em cópia PostgreSQL permanecem separados. A etapa 0 continua em andamento até concluir a conferência de interface; não iniciar backend/frontend de publicação antes do contrato da etapa 1.

## Etapa 1 — Definir publicação da startup

- Criar contrato de estado próprio `RASCUNHO`, `PUBLICADO` e `PAUSADO`, separado de `statusValidacao` e dos momentos do questionário.
- Definir os campos/requisitos mínimos para publicar, se questionário completo será obrigatório e quais pendências a API informa. Esses mínimos ainda não foram aprovados.
- Definir transições permitidas e o que acontece se uma edição tornar um projeto publicado incompleto. Salvar perfil/questionário não deve publicar implicitamente.
- Preservar gestão por FUNDADOR/REPRESENTANTE, consulta por membro e ausência de exceção automática para ADMIN.

Conclusão: contrato documentado com exemplos de estados/transições, pendências e respostas HTTP; resolver com o usuário apenas decisões de produto sem resposta no projeto.

## Etapa 2 — Backend de publicação

- Implementar estado persistido textual, default seguro `RASCUNHO` para novos e antigos registros e regras no serviço.
- Criar DTOs/endpoint de consulta e alteração de status conforme etapa 1, com sessão, CSRF e vínculo atual verificado sob bloqueio transacional.
- Testar requisitos, transições, conta sem vínculo, membro sem gestão, ADMIN sem exceção, concorrência relevante e atualização de tabela populada.
- Atualizar Postman e documentação; executar `mvn -pl backend test` e Checkstyle. Hibernate continua responsável pelo schema, sem reintroduzir Flyway.

Conclusão: API testada e contrato consumível pelo frontend; ensaio em cópia PostgreSQL antes de implantar a coluna.

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

- Primeiro resolver a decisão do [guia 16](16-decisao-regra-matching.md) com equipe/PO. O algoritmo demonstrativo não representa aprovação.
- Implementar cálculo, versão, ordenação e desempate no backend após o contrato aprovado.
- Participante recebe ordem e selo `superDamatch` (>=95), sem porcentagens ou detalhes numéricos; relatório completo exige autorização administrativa.

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

- **Próxima ação exata:** terminar a conferência de interface da etapa 0 no ambiente local acima, quando houver acesso ao navegador (ou em execução manual acompanhada); registrar desktop/mobile/teclado e limitações. Depois fechar o contrato de publicação da etapa 1 com os mínimos ainda pendentes de decisão.
- **Implementação nova nesta sessão:** nenhuma. Homologação HTTP/backend e preparação do ambiente isolado; evidências acima. Planejamento anterior preservado na branch `chore/startup-base-homologation`, baseada em `e8c851b`.
- **Ao encerrar a próxima sessão:** atualizar etapa, evidências, branch/head/PR/checks e este ponteiro, além de `AGENTS.md` local.
