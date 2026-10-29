# Continuidade da startup e futura reformulação do frontend

Atualizado em 28/10/2026. Este é o ponto de retomada solicitado pelo usuário: primeiro concluir funcionalidades reais; posteriormente reformular **todas as telas do frontend**, com organização consistente. A reformulação visual completa ainda não foi iniciada. A ordem abaixo é recomendada; decisões de produto pendentes não devem ser presumidas como aprovadas. A [revisão da base atual](26-startup-code-review.md) registra os ajustes encontrados antes de continuar startup.

## Como retomar em uma próxima sessão

1. Ler `AGENTS.md`, este documento e os contratos dos guias [20](20-mentor-integration.md), [21](21-startup-integration.md) e [22](22-startup-profile.md).
2. Conferir branch, alterações locais e estado remoto de PR/CI antes de implementar. Preservar trabalho existente; documentos antigos e referências a branches podem estar desatualizados.
3. Se o pedido for “continuar startup”, partir do primeiro item pendente abaixo e confirmar os contratos necessários no código. Se for “refazer o front”, usar o inventário e os critérios de design deste documento.
4. Atualizar esta lista conforme cada entrega for implementada e validada. Registrar diferenças entre implementação local, integração à main e homologação publicada.

## Estado funcional confirmado no código

- [x] Cadastro real de startup e conta da pessoa fundadora, vinculada como `FUNDADOR` na mesma transação.
- [x] Confirmação sem login automático; login, restauração da sessão e logout com CSRF.
- [x] Consulta das startups da conta via `GET /api/v1/startups/me`, com múltiplos vínculos e lista vazia tratados.
- [x] Tela `/startup/perfil`, acessível pela conta, com consulta, seleção de projeto e edição por fundador/representante.
- [x] `PATCH /api/v1/startups/{startupId}`, validação, autorização no serviço e preservação de conta/integrantes/data.
- [x] Cancelamento da edição e proteção contra repetição de escrita após resultado sem confirmação.
- [x] Mentor: cadastro com agenda, consulta própria, edição e publicação/pausa integrados.
- [x] Perfil da startup integrado à main pelo PR #18 (`85e770b`).
- [x] Questionário v3 e integração autenticada integrados pelo PR #20; [contrato e validação](25-questionnaire-api.md). PR #21 também integrado; main `709bdab` com workflow aprovado, incluindo Sonar backend/frontend e deploy. Homologação funcional/visual e PostgreSQL permanece separada desses checks.

## Pendências em ordem de dependência

| Etapa | Entrega e critério de conclusão |
| --- | --- |
| 0. Integrar/homologar ajustes da revisão | Correções implementadas na branch `fix/startup-review-findings`: contexto por projeto, limite UTF-8 da senha com login legado compatível, agenda sem itens nulos, bloqueio de escrita incerta do mentor e mensagens atuais. Validação e estado de integração no [guia 26](26-startup-code-review.md). |
| 1. Homologar questionário v3 | Já integrado à main com gates aprovados. Homologar navegador/mobile e schema PostgreSQL, incluindo prioridade dos assuntos, agenda compartilhada do mentor e troca de projeto. |
| 2. Publicação da startup | Criar estado próprio `RASCUNHO/PUBLICADO/PAUSADO`, sem reutilizar `statusValidacao`. Definir mínimos de publicação, mostrar pendências, permitir salvar rascunho e publicar/pausar com autorização de gestão. Ensaiar qualquer adição obrigatória de coluna em schema populado antes do deploy. |
| 3. Gestão de integrantes | Interface para listar, adicionar e remover usando as rotas existentes. Definir localização/convite de contas existentes e alteração de papéis antes de criar esses fluxos. Preservar fundador obrigatório, ausência de duplicidade, autorização de gestão e tratamento de vínculos legados. |
| 4. Descoberta real | API de catálogo e detalhes com filtros/paginação, somente perfis elegíveis. Definir DTO de descoberta e quais dados de gestão/contato ficam privados. Trocar dados fictícios por API sem mistura silenciosa de modos. |
| 5. Matching real | Alinhar regra definitiva com equipe/PO e SRS: [decisão pendente](16-decisao-regra-matching.md). O protótipo usa `damatch-rules-v2`; isso não comprova aprovação. Calcular no backend, versionar e ordenar com desempate. Participante recebe apenas ordem/selo `superDamatch` (≥95), sem porcentagem ou detalhes numéricos; dados completos ficam em área administrativa autorizada. Nunca confiar na nota enviada pelo cliente. |
| 6. Salvos persistidos | Se mantidos no produto, salvar por conta e restaurar após novo acesso. Favorito não equivale a demonstrar interesse. Hoje existe apenas estado em memória para perfis fictícios. |
| 7. Interesses e conexões | Implementar interesse enviado/recebido e conexão por reciprocidade, com autorização e prevenção de duplicidade/concorrência. Definir disponibilidade de contato após conexão. |
| 8. Reuniões | Propor e confirmar/recusar reunião dentro de conexão ativa, com data, duração, formato, local/link e fuso explícito. Depois tratar remarcação, cancelamento e histórico conforme escopo aprovado. |
| 9. Homologação e operação | Quality Gate remoto por commit, teste no ambiente publicado, mobile, teclado e leitor de tela. Antes da exposição pública, rate limit e ensaio de schema em cópia PostgreSQL. Sessões em memória exigem planejamento antes de múltiplas réplicas. |

Investidores, administração completa e desativação de perfis pertencem à evolução descrita no backlog; não antecipar interfaces com ações aparentando funcionar sem contrato. A priorização do [backlog de beta/v1](15-backlog-mvp.md) é histórica e deve ser conciliada com as decisões atuais.

## Inventário para redesenhar todas as telas

| Tela/área atual | Funcionamento que o novo design deve preservar |
| --- | --- |
| Layout global | Sidebar/topbar, navegação ativa, conta/entrada conforme sessão, acesso móvel, temas claro/escuro, movimento reduzido, saída e avisos claros de DEMO/API. Melhorar a hierarquia entre conta da pessoa, projeto, descoberta e relacionamentos. |
| Descobrir `/` | Hoje é catálogo fictício com filtros e compatibilidade local. Diferenciar catálogo geral de recomendações e explicar ausência de resultados; prever carregamento, erro e paginação quando integrar. |
| Salvos `/salvos` | Hoje temporário. Projetar lista vazia, salvar/remover e persistência futura sem sugerir que “salvo” já criou conexão. |
| Cadastro `/cadastro` | Escolha MENTOR/STARTUP; conta separada do perfil. Startup cria conta + projeto + fundador; mentor exige agenda. Campos ocultos não podem impedir envio do outro perfil. Sessão ativa bloqueia onboarding. |
| Confirmação de cadastro | Mostrar somente dados confirmados, orientar entrada, limpar senha e distinguir falha de validação de resultado sem confirmação. Não fingir sucesso, fazer retry automático ou autenticar automaticamente. |
| Entrada `/entrar` | E-mail e senha, envio pendente, mensagem genérica para credencial inválida, indisponibilidade e sessão expirada. Recuperação de senha ainda não possui fluxo implementado; não adicionar ação fictícia. |
| Conta `/conta` | Dados da pessoa, acesso ao perfil correto e logout. Não confundir editar projeto com alterar nome/e-mail/senha da conta, que não possuem edição nesta entrega. |
| Mentor `/mentor/perfil` | Perfil próprio, biografia, links, pares de disponibilidade, editar/salvar, publicar/pausar e dados confirmados pelo servidor. Preservar autorização por titularidade. |
| Startup `/startup/perfil` | Projetos da conta, seleção quando múltiplos, consulta e edição apenas por fundador/representante; membro consulta. Cancelar preserva dados; recarregar descarta edição explicitamente. Tratar ausência de vínculo sem oferecer onboarding autenticado. |
| Meu perfil DEMO `/meu-perfil` | Perfil temporário e edição do questionário, com cancelamento. No modo API essa rota redireciona para conta; não presumir que já representa dados persistidos. |
| Questionário/revisão | Seis etapas em três fases: momento, setor, objetivos, público/formação/capacidade, encontro e agenda. Contrato v3 no guia 25. Preservar prioridades, pares de agenda, revisão e cancelamento; conta da pessoa separada de cada projeto. API: `/mentor/questionario` e `/startup/perfil/{startupId}/questionario`; DEMO permanece separado. |
| Cards e detalhes | Conteúdo legível, rótulos além de cor, salvos e selo Super DaMatch; sem porcentagem ou detalhes numéricos por decisão do PO. Separar informação pública de gestão e contato. Dialog acessível com foco inicial, Escape e retorno ao acionador. |
| Como funciona `/como-funciona` | Explicar o fluxo realmente disponível, uso da pontuação e limites da demonstração; atualizar quando interesses, conexões e reuniões existirem. |
| Telas futuras | Integrantes, pendências de publicação, interesses, conexões e reuniões só devem exibir ações operacionais quando APIs correspondentes existirem. |

## Dados e regras que afetam o design

### Pessoa, projeto e permissão

`Usuario` é a pessoa autenticada. `Startup` é o projeto. `MembroStartup` associa ambos e informa `FUNDADOR`, `REPRESENTANTE` ou `MEMBRO`. Uma pessoa pode ter múltiplos vínculos. O novo layout deve deixar claro qual projeto está selecionado e quem pode alterar cada área. O ID informado pela tela não concede autorização; o servidor decide pela sessão e pelo vínculo atual. ADMIN não possui exceção automática nos perfis.

### Formulário da startup

| Dado | Regra atual |
| --- | --- |
| Nome provisório, resumo/pitch, público-alvo, modelo de negócio | Obrigatórios no cadastro; até 255 caracteres cada. |
| Problema central e solução proposta | Obrigatórios no cadastro; até 5.000 caracteres cada; aceitar parágrafos e acentos. |
| `statusValidacao` | `APENAS_IDEIA` / `PESQUISA_MERCADO`; representa o momento declarado da ideia. |
| Dados da pessoa fundadora | Nome, e-mail e senha somente no onboarding. Não reapresentar senha nem editar conta pelo formulário do projeto. |
| Integrantes/data/IDs | Confirmados pelo servidor; fora do formulário de edição do projeto. |

Ainda é necessário alinhar as duas opções de `statusValidacao` com os quatro momentos do questionário demonstrativo. Não converter automaticamente entre esses conceitos. No protótipo o nome da ideia é opcional e limitado a 60; no cadastro real ele é obrigatório e limitado a 255. Resolver essa diferença no contrato antes de unificar as telas.

### Mentor e questionário

Biografia do mentor: obrigatória, até 1.000 caracteres. Links sociais/site: opcionais, até 255. Disponibilidade real: `diaSemana` de 1 a 7 e período `MANHA/TARDE/NOITE`; pelo menos um par. Questionário DEMO usa outros códigos, frequência, setores, momentos e experiência declarada; mapear explicitamente antes de persistir. Não transformar pares em produto cartesiano de dias e períodos.

A lista inicial de cidades permanece reduzida às oito opções do protótipo, com códigos compartilhados no contrato v3. Sua ampliação e futura fonte territorial precisam de contrato próprio. A interface informa `America/Sao_Paulo`, alinhada à aplicação; não depender do fuso do dispositivo. Reuniões futuras deverão persistir instantes e explicitar o fuso.

### Matriz de estados obrigatórios

| Estado | Comportamento esperado |
| --- | --- |
| Carregamento/salvamento | Feedback visível e acessível; impedir duplo envio; manter contexto da ação. |
| Sucesso | Exibir dados devolvidos pela API, confirmar salvamento e diferenciar salvar de publicar. |
| Erro de campo / `400` | Identificar campo, regra/limite e forma de corrigir; preservar edição válida. |
| Sem sessão / `401` | Remover dados privados e orientar nova entrada. |
| Sem permissão ou CSRF / `403` | Explicar limitação de acesso/proteção, permitir conferir sessão e recarregar; sem replay de escrita. |
| Recurso indisponível / `404` | Remover dados antigos e permitir nova consulta dos vínculos. |
| Resultado sem confirmação | Não anunciar falha definitiva nem sucesso. Bloquear repetição de escrita e oferecer consulta para confirmar. |
| Lista vazia | Diferenciar sem vínculo, sem resultados, sem recomendações e sem itens salvos. |
| Edição não salva | Salvar/cancelar explícitos; prever aviso ao sair/trocar contexto na reformulação. |
| Perfil incompleto/pausado | Explicar por que não aparece na descoberta e qual ação está disponível, quando publicação estiver implementada. |

## Direção visual e critérios de qualidade

- Reorganizar navegação e jornadas antes de redesenhar cada componente. Produzir mapa de telas e wireframes mobile/desktop com cenários reais e vazios; validar com o usuário antes de implementar a reformulação completa.
- Reaproveitar inicialmente tokens, temas e assets em `frontend/src/app/shared/theme.css`, `profile-tones.css` e o [guia de identidade/Lumen](19-visual-identity.md). Azul de mentor e verde de startup devem vir acompanhados de rótulos; cores e mascote são diretrizes existentes a reavaliar no redesenho, não funcionalidades.
- Definir componentes comuns para campos, mensagens, botões, seleção de projeto, cards, filtros, agenda, modal e confirmações. Manter contraste, espaçamento, tamanhos e estados consistentes; evitar copiar formulários completos entre telas.
- Dar espaço a textos reais de até 5.000 caracteres, nomes longos e acentos. Mostrar resumo no catálogo e leitura completa no detalhe. Testar quebra de palavras, rolagem e ausência de corte de ações.
- Conferir telas a partir de 360 px, notebook, zoom de 200%, temas claro/escuro, teclado e leitor de tela. Usar labels associados, foco visível/gerenciado, feedback semântico (`output` para status e `role="alert"` quando necessário) e erro ligado ao campo.
- Preservar `prefers-reduced-motion` e pausa manual; movimento nunca deve impedir preenchimento ou leitura. Não depender da pose do Lumen para comunicar estado.
- Preparar conteúdo e navegação para múltiplos projetos e permissões diferentes. Não desenhar apenas o cenário de um fundador com uma startup.
- A reformulação deve manter testes de contrato, segurança e fluxo. Substituir testes presos à apresentação quando necessário, sem reduzir cobertura ou o Quality Gate para acomodar o novo layout.

## Contratos técnicos a preservar no redesenho

- Sessão server-side com `JSESSIONID` HttpOnly, sem JWT. CSRF obtido pelo JSON de `/csrf`, cookie HttpOnly e header `X-XSRF-TOKEN`; renovar após login/logout.
- Cliente de sessão e interceptor existentes centralizam credenciais e CSRF. Não reimplementar autenticação em cada tela nem guardar senhas/tokens no LocalStorage/SessionStorage.
- DEMO e API devem continuar explícitos e separados. Falha da API não pode virar sucesso fictício ou usar dados demonstrativos sem aviso.
- Rotas relativas `/api/v1/**` e `/csrf`; proxy local/Vercel. Não colocar origem de produção, credenciais ou configuração do banco em componentes.
- Contratos HTTP usam DTOs, nunca entidades JPA. Mudanças de payload devem ser alinhadas e testadas nos dois lados.
- Gerenciamento de schema continua com Hibernate; sem Flyway por decisão do usuário. Nenhuma reformulação visual autoriza mudança de dados remotos ou deploy por conta própria.

## Checklist de encerramento de cada entrega

Backend alterado: `mvn -pl backend test` e Checkstyle. Frontend alterado: lint, cobertura e builds DEMO/API; contratos Postman/documentação atualizados. Validar fluxo pela interface e recarga, permissões e falhas. Registrar o que foi efetivamente testado em navegador/mobile e o que depende de CI/homologação. Atualizar este roteiro e `AGENTS.md` local.
