# Integração do cadastro de startup

Entrega em `feature/startup-integration`, a partir de `main` em `2d38716`. O fluxo conectado é cadastro da startup e da pessoa fundadora → confirmação → login → conta autenticada → logout. O modo DEMO mantém seu cadastro temporário e seu questionário separados.

## Contrato e interface

Em `/cadastro`, selecione **Startup em ideação**. Os dados de nome, e-mail e senha pertencem à pessoa fundadora. A startup possui seus próprios campos:

| Campo | Obrigatoriedade e limite |
| --- | --- |
| `nomeProvisorio`, `pitchCurto`, `publicoAlvo`, `modeloDeNegocio` | Obrigatórios; até 255 caracteres cada |
| `problemaCentral`, `solucaoProposta` | Obrigatórios; até 5.000 caracteres cada |
| `statusValidacao` | `APENAS_IDEIA` ou `PESQUISA_MERCADO` |

O frontend consulta `GET /csrf` e envia `POST /api/v1/startups` com a conta aninhada em `fundador` e os campos da startup na raiz. O cliente seleciona explicitamente os campos aceitos: não envia papel, ID de usuário, lista de integrantes ou dados do perfil de mentor. Nome e e-mail da conta são normalizados como no cadastro de mentor; a senha não é alterada.

O backend existente cria a conta com `TipoUsuario.STARTUP` e o vínculo `FUNDADOR` na mesma transação. A resposta é `StartupResponse`, com DTOs de integrantes, sem senha, hash ou entidade de usuário. A tela só confirma HTTP `201` com os campos esperados e um único vínculo de fundador. Senhas e propriedades inesperadas da resposta não são copiadas para o recibo.

O cadastro não autentica automaticamente. Depois da confirmação, a pessoa fundadora usa `/entrar` e acessa `/conta`. A entrega inicial não adicionou edição da startup, gestão de integrantes ou questionário persistido à interface. Consulta/edição próprias foram acrescentadas no [guia 22](22-startup-profile.md), e o questionário persistido no [guia 25](25-questionnaire-api.md). A interface de integrantes continua pendente; os endpoints existentes de consulta e gestão mantêm suas regras.

## Segurança e falhas

- A aplicação mantém sessão server-side, cookies HttpOnly e CSRF obtido pelo JSON de `/csrf`. Escritas exigem cookie e header; login e logout renovam CSRF. Não há JWT nem persistência de senha ou token em armazenamento do navegador.
- O onboarding continua exclusivo para visitantes. A API rejeita sessões autenticadas, inclusive ADMIN. Quando o frontend já conhece a sessão, orienta a acessar a conta em vez de apresentar o formulário. O backend é a autoridade de autorização também após recarga direta.
- `HttpRegistrationGateway` atende mentor e startup com o mesmo fluxo de CSRF, limite de espera e tratamento de falhas. `400` indica preenchimento inválido; `403`, sessão não elegível ou proteção CSRF; `409`, conflito de cadastro. Erros técnicos do servidor não aparecem na interface.
- Timeout, perda de conexão, erro do servidor ou resposta inesperada após o POST deixam o resultado **sem confirmação**: a conta pode ter sido criada. O cliente limpa a senha e bloqueia reenvio. Não há retry automático de escrita.
- Campos ocultos de mentor são desativados ao selecionar startup. Isso evita que validadores do template removido, como a biografia obrigatória, bloqueiem o envio do outro perfil. Validadores e limites próprios da startup só impedem o envio quando ela está selecionada.
- Os limites de texto foram acrescentados a `CriarStartupRequest`, alinhando os campos VARCHAR ao banco e limitando os campos TEXT a 5.000 caracteres. A validação devolve `400` antes de criar conta ou persistir campos longos.

## Deploy e dados existentes

Não são necessárias novas variáveis nem alterações de schema nesta entrega. A configuração de proxy Vercel/Render e as variáveis continuam as do [guia 20](20-mentor-integration.md). `BACKEND_ORIGIN` precisa existir tanto na Vercel Production quanto nas Repository Variables do GitHub, como já exigido pelo deploy prebuilt.

O reparo anterior do enum legado e de `mentor.status` permanece válido. O cadastro novo não associa automaticamente contas a startups antigas que estejam sem integrantes; esse vínculo exige análise própria, sem deduzir a pessoa fundadora nem alterar dados antigos silenciosamente. Hibernate continua responsável pelo schema, sem Flyway.

## Validação

- Backend: 90 testes aprovados e Checkstyle sem violações. Cobertura funcional de cadastro com CSRF real, ausência de autenticação automática, conta STARTUP atribuída pelo servidor apesar de tentativa de enviar ADMIN, vínculo único de fundador, BCrypt, e-mail duplicado, sessão, consulta autenticada e logout. Campos acima dos limites e enum inválido são rejeitados sem criar conta.
- Frontend: 268 testes e 8 testes de configuração aprovados, com 98,87% de cobertura de linhas. Incluem contratos HTTP para ambos os perfis, formulário, limites, resposta sanitizada, erros 400/403/409/500, bloqueio de reenvio, confirmação acessível e fluxo de sessão com renovação de CSRF. DEMO e o fluxo de mentor continuam cobertos. Lint e builds DEMO/API aprovados, sem avisos de orçamento.
- Verificação local no navegador com Angular/proxy/API/H2 isolado: cadastro de startup com acentos, confirmação do projeto e fundador, login, recarga da conta, bloqueio de novo onboarding com sessão ativa e logout com retorno para a tela de entrada. Nenhum erro de console no fluxo observado. Revisão visual desktop; não houve ensaio mobile nesta entrega.

Validação realizada em 22/10/2026, sem deploy remoto ou alteração no Supabase. Aprovação local não comprova o Quality Gate remoto do SonarQube.
