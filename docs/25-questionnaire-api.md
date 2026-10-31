# Questionário v3 conectado à API

## Alteração da equipe e escopo

O [PR #19](https://github.com/Diogo746/Da-Match/pull/19), head `e2238ff`, introduziu as seis etapas em três fases do [guia 24](24-questionario-v3.md): 23 setores, 14 assuntos, públicos, áreas de formação/do time e capacidade do mentor. O PR não altera o backend; as respostas eram demonstrativas e temporárias. A entrega anterior de consulta/edição da startup foi integrada pelo PR #18 em `85e770b`.

A branch `feature/questionnaire-api` parte da branch da equipe para preservar integralmente o formulário v3. Implementa persistência, consulta, substituição das respostas e acesso pela área autenticada. O onboarding mantém seus contratos e continua sem login automático: cadastrar → entrar → abrir perfil/projeto → abrir questionário.

## Contratos implementados

| Rota | Leitura | Escrita |
| --- | --- | --- |
| `/api/v1/startups/{startupId}/perfil-match` | GET: STARTUP com vínculo atual de qualquer papel | PUT: STARTUP com vínculo atual de FUNDADOR/REPRESENTANTE |
| `/api/v1/mentores/{mentorId}/perfil-match` | GET: MENTOR titular | PUT: MENTOR titular |

GET retorna `200` com respostas ou `204` para um perfil existente e autorizado ainda sem questionário. `404` significa que o perfil não existe; `401` exige login e `403` representa ausência de permissão ou CSRF. ADMIN não recebe exceção. PUT retorna `200` para criação ou substituição completa, exige CSRF e rejeita respostas inválidas com `400`. Nenhuma escrita usa ator informado pelo cliente.

Payload: os campos do guia 24, com `questionnaireVersion: "damatch-profile-v3"` e `kind` coerente com o perfil selecionado. Resposta contém apenas esses campos e `updatedAt` UTC, sem dados da conta, entidades, credenciais ou nota. `updatedAt` usa precisão de microssegundos compatível com o banco. Campos adicionais não são mapeados nem persistidos.

- Startup: momentos 1, setores 1–2, necessidades 1–2 **em ordem de prioridade**, públicos 1–2, áreas do time 1–3. `DISCOVERING` e `UNKNOWN` são exclusivos, sem combinar com outras opções. `GENERAL` não é aceito.
- Mentor: momentos 1–4, setores 1–5, especialidades 1–6, públicos 1–4, formação 1–2. `GENERAL` é exclusivo; `DISCOVERING`, público `UNKNOWN` e formação `STUDENT` não são aceitos. `capacity` é obrigatória (`ONE/FEW/MANY`); `experience` deve conter exatamente os tópicos escolhidos com `PRACTICAL/KNOWLEDGE`.
- Não aceitar códigos desconhecidos, nulos nas listas ou opções/pares duplicados. Aceitar todos os códigos de setores e tópicos definidos no frontend v3.
- `format`, `cadence` e pelo menos um par de agenda são obrigatórios. Até 21 pares distintos `MON…SUN` + `MORNING/AFTERNOON/EVENING`. Nunca gerar produto cartesiano de dias e períodos.
- `PRESENCIAL` exige cidade do catálogo atual; `AMBOS` aceita cidade vazia ou conhecida; `ONLINE` exige cidade vazia. Catálogo inicial limitado às oito cidades do protótipo, sem atribuir códigos IBGE fictícios. Ampliação exige contrato conjunto.
- `projectName` é um rótulo opcional do questionário da startup, até 60 caracteres; não altera `nomeProvisorio` nem seus limites de cadastro. Mentor usa string vazia. Os quatro momentos não são convertidos em `statusValidacao`.
- `experience` omitida vira `{}`; `projectName` e `cityId` omitidos viram `""`; `accepting` omitido/nulo vira `true`. Startup usa `capacity: null`, `experience: {}` e `accepting: true`. Campos exclusivos de mentor com conteúdo na startup são rejeitados.
- `accepting` declara se o mentor recebe novas mentorias e é independente de `StatusPerfilMentor`. A capacidade é declarada: reservas, limites de conexões e ocupação efetiva ainda dependem de casos de uso futuros.

## Persistência e agenda

Domínio `perfilmatch` nas camadas api/application/domain/infrastructure. A tabela `perfil_match` referencia exatamente uma startup ou um mentor, com unicidade por perfil e constraint de coerência com `kind`. Listas de respostas usam coleções ordenadas; códigos/enums são persistidos como texto, inclusive as chaves de experiência. As respostas pertencem ao projeto, permitindo múltiplos projetos da mesma conta sem compartilhar questionários.

Leituras/escritas verificam vínculo/titularidade no serviço. Escritas bloqueiam o perfil pai transacionalmente; o mentor agora usa bloqueio também nas edições antigas por ID. Isso serializa questionário, alteração da agenda e gestão de integrantes pertinente. Não há publicação implícita, alteração de conta ou criação de integrantes.

Agenda do mentor tem uma única fonte: `disponibilidade_mentor`. PUT converte cada par e atualiza essa coleção na mesma transação. GET converte a agenda atual, inclusive alterações feitas pelo PATCH antigo; `perfil_match_agenda` guarda somente a agenda das startups. Conversões: MON=1…SUN=7; MORNING=MANHA, AFTERNOON=TARDE, EVENING=NOITE. As janelas da interface informam `America/Sao_Paulo`.

Hibernate continua gerenciando o schema com `update`, sem migrations. São adicionadas tabelas/FKs; perfis legados continuam sem questionário e não recebem respostas inventadas. O teste H2 de schema legado confirma preservação dos registros e tabela nova vazia. Antes de produção, ensaiar em cópia PostgreSQL, com backup; nenhum banco remoto foi alterado nesta entrega.

## Interface e estados

`/mentor/perfil` → `/mentor/questionario`. `/startup/perfil` → questionário do projeto selecionado em `/startup/perfil/{startupId}/questionario`. A tela obtém os perfis pela sessão, confere vínculo e impede renderização de resposta tardia de outra conta. Mentor inicia com a agenda real pré-preenchida; integrante comum da startup tem leitura. Perfil sem respostas, carregamento, consulta indisponível e falta de permissão são estados distintos.

O formulário v3 é reutilizado com validação completa, revisão e edição/cancelamento. Gravação usa somente os campos permitidos, sessão/CSRF centralizados e não repete PUT automaticamente. Resultado sem confirmação bloqueia nova edição até GET bem-sucedido. A tela não usa a store DEMO, nem mostra indicação fictícia como resultado do salvamento real. DEMO permanece com suas fases, reações e selo.

## O que continua pendente

A regra de mentoria foi definida pelo usuário em 30/10 no [guia 29](29-matching-rule-decisions.md), com histórico no [guia 16](16-decisao-regra-matching.md). Sua implementação no backend e o relatório administrativo permanecem pendentes. A decisão de visibilidade está preservada: participante recebe ordem/`superDamatch` (≥95), sem porcentagem ou detalhamento numérico; dados administrativos precisam de autorização própria. Esta definição documental não altera o protótipo nem implementa descoberta, conexões ou reuniões. Publicação de startup é uma entrega separada do roteiro.

O [guia de continuidade](23-continuity-and-frontend-redesign.md) passa a indicar publicação/pausa da startup como próxima funcionalidade, depois da integração/homologação deste questionário. A reformulação visual completa permanece futura.

## Validação

- `mvn -pl backend test`: **135 testes**, Checkstyle e arquitetura aprovados. Casos HTTP sem transação de teste confirmam commits e recarga de coleções; cobrem listas ordenadas/substituição, coerência do horário de atualização, agenda compartilhada, vínculo revogado, outros titulares/papéis, CSRF real, limites/códigos e rollback de entrada inválida. Cobertura total JaCoCo: 97,15% das linhas (785/808).
- Frontend: **360 testes + 8 de configuração**, 98,98% de linhas e 96,43% de branches; lint e builds DEMO/API aprovados. Fluxo de rotas autenticadas exercita componente real, edição do questionário, PUT com CSRF e troca para projeto de outra conta sem reaproveitar dados do mentor ou store DEMO.
- Fluxo HTTP pelo proxy Angular → Spring → H2 em arquivo isolado aprovado: onboarding, login, CSRF, respostas/prioridades persistidas, recarga, logout/novo login, agenda comum ao PATCH, isolamento de titulares/papéis e rejeição de entrada inválida preservando respostas anteriores. Todas as sessões de teste foram encerradas.
- Não há navegador conectado nesta sessão (`cua` sem browsers; IAB indisponível), portanto **não houve revisão visual/mobile**. Docker indisponível; atualização em cópia PostgreSQL permanece para homologação. Não houve deploy nem alteração remota de banco.
- PR #20 integrado em `c2c018d` (26/10/2026). Os dois gates passaram no head `047b18e` (workflow #79). O workflow #80 da main falhou por conexão com o SonarQube; a prevenção do [guia 15](15-sonar-and-coverage.md#indisponibilidade-do-sonarqube-após-o-merge-do-pr-20) entrou pelo PR #21. Main `709bdab` com [workflow aprovado](https://github.com/Diogo746/Da-Match/actions/runs/40794552881), incluindo os dois Sonar, DAST e job de deploy. Homologação funcional/visual/PostgreSQL e ajustes da [revisão atual](26-startup-code-review.md) continuam necessários.
