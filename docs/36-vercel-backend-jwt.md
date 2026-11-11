# Preparação do backend para Vercel — JWT com CSRF

## Estado e limite aprovado

Em 05/11/2026, o usuário autorizou ajustar o backend e criar seu projeto Vercel, usando **somente recursos gratuitos**. Não ativar Pro, trial pago, complementos ou integrações pagas. O projeto separado usa Container Runtime (beta) e Java 21/Spring Boot; o Angular continua em seu projeto próprio. O PR #35 foi integrado pelo usuário em `2f4a942`, depois da atualização de frontend do PR #37. A continuação operacional e documental está em `codex/vercel-backend-cutover`.

A prova de conceito com H2 descartável respondeu ao health-check. Em 06/11, um candidato protegido passou a usar o PostgreSQL real, após backup e ensaio da atualização. O estado operacional de 11/11 está na seção seguinte; os registros de 05–06/11 abaixo são históricos. H2 não pode ser promovido a backend real.

## Retomada em 11/11 — atualização, proteção e corte

- Main atualizada para `2f4a94244126ac791e270d401a6c4f215a42a9ec`, com PRs #37 e #35 integrados pelo responsável. O código de produção do backend permanece igual ao candidato validado em `cdfc208`. A atualização visual, o Lumen local e as conversas DEMO do frontend foram preservados.
- Ambiente GitHub `production` confirmado com revisor obrigatório e uma única política de branch: `main`. Em repositório pessoal, o dono administra esse ambiente; colaboradores autorizados podem administrar Repository Variables/Secrets. Não é necessário transferir o repositório para organização.
- CI [#131 pós-merge](https://github.com/Diogo746/Da-Match/actions/runs/43099000755) aprovada, com ambos os Quality Gates conferidos no SCM exato. Validação local da árvore integrada: 642 testes frontend + oito de configuração, 98,99% de linhas, lint, builds DEMO/API e oito testes das salvaguardas de deploy aprovados. Backend validado também pela CI.
- Backup atual consistente de 54.023 bytes, SHA-256 `372c2c091025590882b1166f1c6657d9596e0ef758065892001f743ed0a976cb`, restaurado em banco local novo: 19 tabelas/102 registros, incluindo tabelas JWT. Abrange somente aplicação/reparo legado. RLS e permissões das duas tabelas de autenticação foram conferidas novamente.
- Candidato backend do commit integrado construído e validado: 17 checagens HTTP de JWT, CSRF, edição persistida, catálogo, refresh, reuso/revogação e logout. Promovido ao domínio estável do backend; health e cookies públicos conferidos. O frontend também foi construído sem atribuição de domínio e passou nas mesmas 17 checagens pelo proxy, enviando a origem final de produção. Essas checagens de proxy por HTTP não substituem a validação visual publicada.
- Proteção efetiva de abuso publicada em ambos os projetos: POST em login/refresh/cadastros, janela fixa de 150 pedidos por IP/60 segundos, resposta 429. Antes da configuração final, uma condição temporária de User-Agent isolou o ensaio: cinco respostas 403 seguidas de sete 429, mesmo variando `X-Forwarded-For`, tanto na borda do frontend quanto no backend. A condição temporária foi removida. Uma regra incluída no Hobby por projeto; sem recurso pago. IPs compartilhados por NAT compartilham o limite; isso não é limite por conta.
- O primeiro ensaio encontrou erro de invocação no antigo PoC H2, antes de o domínio receber o backend real. A regra foi restaurada para LOG durante esse diagnóstico. O ensaio final foi aprovado sobre o backend real; nunca usar aquele PoC como rollback.
- `BACKEND_ORIGIN` foi alterado na Vercel frontend Production e em Repository Variables; `BACKEND_PROVIDER=vercel` foi habilitado depois da homologação do candidato/proxy e da proteção efetiva. A [CI #132](https://github.com/Diogo746/Da-Match/actions/runs/43102478720), no mesmo SHA integrado, recebeu aprovação humana de `production`, mas interrompeu antes da promoção: o JSON de `deploy --json` reteve `INITIALIZING`, apesar de o candidato já estar `READY` na API. O frontend foi corretamente bloqueado e continua com o deployment anterior/Render. Render e o deployment/origem anteriores foram preservados privadamente para retorno.
- Correção do pipeline em `64c417a`: executar `inspect --wait --timeout 9m` e depois consultar a API do identificador exato; exigir READY, produção, projeto, URL e `migrationCommit` esperados antes de health/promoção. São 15 testes Node aprovados, incluindo a resposta inicial obsoleta, espera falha, estados não prontos e procedência divergente, além de sete testes Python dos scripts. Nenhuma proteção/gate foi reduzido. Integrar a correção por revisão/merge do usuário antes de repetir a publicação protegida e validar a tela principal.

Os jobs de segurança concluídos não significam ausência total de avisos. Nesta execução, Gitleaks apontou a senha explicitamente fictícia de `SecurityIntegrationTest.java` no histórico, conferida no commit indicado. ZAP informou zero falhas e três tipos de aviso (cache de conteúdo não armazenável, CORP e Sec-Fetch-Dest); a publicação automática de issue falhou por permissão da integração. Esses avisos não foram suprimidos nem tiveram permissões ampliadas durante a migração.

Evidências, dumps, cookies de ensaio e configurações reais ficam somente em `backend/database/vercel-real-20261106/continuation-20261111`, ignorado e com ACL restrita. Não publicar esses artefatos.

## Contrato JWT

- `SESSION` continua padrão, preservando o ambiente atual. `APP_SECURITY_AUTH_MODE=JWT` ativa o novo contrato. O perfil `vercel` inclui `prod`, exige JWT e cookies Secure, reduz o pool JDBC e habilita encerramento gracioso.
- Spring Security mantém a autorização e CSRF. Assinatura/parsing usam a biblioteca gratuita java-jwt 4.6.2, com API Instant nativa, sem contratar o serviço Auth0. JJWT 0.13.0 fica somente nos testes como assinador independente de tokens adversariais. Somente RS256, RSA de pelo menos 2048 bits e `kid` presente no mapa externo. Não buscar chaves em URL indicada pelo token. Configuração ausente, fraca ou incompatível impede iniciar JWT.
- Exigir assinatura, `typ=at+jwt`, emissor, audiência exata, `sub`/`sid`/`jti` UUIDs canônicos, `iat`, `nbf`, `exp` e duração permitida. Limitar tamanho; rejeitar token sem assinatura, algoritmo diferente, chave desconhecida, adulteração e expiração. JWT não carrega nome, e-mail, papel, senha ou hash.
- Access: 15 minutos. Refresh: 256 bits aleatórios, uso único, 30 minutos sem renovar. Família: máximo oito horas. Configuração pode reduzir esses prazos, nunca superar os tetos. Não há opção "lembrar de mim"; os cookies não persistem por Max-Age no navegador.
- `DAMATCH-ACCESS`: HttpOnly, Path=/; `DAMATCH-REFRESH`: HttpOnly, Path=/api/v1/auth. Sem Domain. Secure obrigatório em produção, SameSite configurável com a validação existente. Preferir proxy na mesma origem e Lax. CSRF permanece obrigatório com cookies.
- JWT não lê HttpSession nem aceita Bearer como fonte alternativa. Cada pedido confere família vigente, conta atual e impressão da senha/papel no banco. Nome/e-mail vêm da conta atual; vínculos continuam conferidos pelos serviços.

JWT elimina a dependência de sessão **na memória da instância**, mas esta implementação mantém estado mínimo no PostgreSQL existente para renovação e logout imediato. Não é arquitetura sem armazenamento. Hibernate adiciona `auth_session` (conta, datas, revogação, impressão interna da credencial/papel) e `auth_refresh_token` (somente SHA-256 de cada refresh, nunca o token bruto). Famílias vencidas e seus hashes são removidos ao criar novos logins.

Troca de senha/papel invalida a família na próxima consulta. Logout revoga pelo refresh reconhecido ou access validado e remove cookies. Login substituindo cookies revoga a família anterior. Rotação bloqueia a família no banco e funciona entre instâncias. Reusar um refresh consumido revoga a família inteira, inclusive tokens posteriores. Pedidos já autorizados e em andamento não são cancelados retroativamente.

Não há rota de alteração de senha/papel nesta entrega. Ao implementar essa gestão, revogar as famílias na mesma transação da alteração; o comparador atual confere os valores vigentes, não constitui histórico de mudanças/restaurações feitas diretamente no banco. Operações administrativas por SQL também devem revogar as famílias afetadas.

Renovações simultâneas da mesma família em abas/clientes diferentes podem exigir nova entrada por reuso; o Angular compartilha uma renovação por vez dentro da mesma instância. Não há tolerância que reaproveite refresh antigo.

## HTTP, CSRF e frontend

Login e `/api/v1/auth/me` preservam o JSON `id`, `nome`, `email`, `tipoUsuario`, sem tokens. Headers `X-Auth-Mode` e `X-Auth-Expires-At` informam modo/expiração, sem conceder autorização; CORS os expõe às origens exatas permitidas.

`POST /api/v1/auth/refresh` exige CSRF e refresh reconhecido; retorna 204, substitui cookies e preserva CSRF. Em SESSION retorna 401. Logout JWT aceita access vencido para revogar pelo refresh, sempre com CSRF; SESSION preserva o requisito anterior de autenticação.

`GET /csrf` continua fora de `/api/v1`; `XSRF-TOKEN` continua HttpOnly. Obter token pelo JSON e enviar `X-XSRF-TOKEN`. Login/logout invalidam CSRF; renovar JWT não o invalida. O filtro JWT restaura identidade depois da estratégia legada de sessão, evitando tratar cada pedido como novo login e apagar CSRF.

O Angular mantém tokens fora de JavaScript/storage e usa metadados de expiração somente em memória. Renova antes de uma operação autenticada quando falta até um minuto. Um GET negado por expiração pode renovar e repetir a leitura uma vez. **Escritas já enviadas nunca são repetidas automaticamente.** Revisão de conta impede aplicar respostas ou enviar operações antigas após logout/troca.

Renovação com resultado incerto não é repetida: `/auth/me` pode confirmar o access; sem confirmação, entrar novamente. Rede/serviço indisponível não vira automaticamente credencial inválida. Postman preserva cookie jar; refresh opcional é pulado em SESSION. Não copiar tokens para variáveis/scripts.

## Configuração externa

Vincular a raiz do monorepo ao projeto backend com preset Container. Manter o vínculo frontend em `frontend/.vercel`. As listas de arquivos permitidos no envio/build incluem POMs, Checkstyle, Dockerfile e fontes de produção; excluem banco, `.env`, `.vercel`, chaves locais, evidências e frontend.

| Variável | Uso |
| --- | --- |
| `PORT=8080` | A Vercel usa 80 por padrão; Java não privilegiado escuta 8080 |
| `SPRING_PROFILES_ACTIVE=vercel` | Carrega também prod e exige JWT/Secure |
| `SUPABASE_DB_URL` | JDBC com TLS, Secret somente no backend |
| `APP_SECURITY_CORS_ALLOWED_ORIGINS` | Origem HTTPS exata do frontend |
| `APP_SECURITY_JWT_ISSUER` / `APP_SECURITY_JWT_AUDIENCE` | Identificadores estáveis próprios do ambiente |
| `APP_SECURITY_JWT_ACTIVE_KEY_ID` | Identificador da chave que assina |
| `APP_SECURITY_JWT_PRIVATE_KEY` | RSA privada PKCS#8 DER em Base64, Secret |
| `SPRING_APPLICATION_JSON` | Mapa público SPKI DER em Base64, preservando cada kid |
| `APP_DB_MAX_POOL_SIZE` | Quatro por instância por padrão; dimensionar soma das réplicas |
| `JAVA_TOOL_OPTIONS` | No candidato medido, `-XX:TieredStopAtLevel=1`; reduz compilação de partida, com possível perda de desempenho sustentado |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | update por decisão do usuário; ensaio e backup antes de mudança remota |

Formato do mapa público, sem valores reais:

```json
{"app":{"security":{"jwt":{"public-keys":{"chave-atual":"BASE64_DA_PUBLICA"}}}}}
```

Não gerar chaves automaticamente ao iniciar instâncias. Produção/Preview usam pares e bancos separados. Para rotação: distribuir nova pública, trocar privada/kid em todas as instâncias e conservar pública anterior pelo prazo máximo do access após a última emissão antiga; depois removê-la. Nunca registrar privada, tokens, cookies, hashes ou JDBC em logs/flags/Git.

Docker usa JRE 21, usuário sem privilégios e limite proporcional de heap. O perfil Vercel dá 20s ao encerramento, dentro dos 30s do runtime. Não persistir em disco/memória locais. Headers encaminhados continuam desativados até validação da infraestrutura.

## Banco, franquia e condições do corte

Hibernate continua sem Flyway. As duas entidades novas podem criar tabelas **mesmo em SESSION** ao implantar com update. Antes de integrar/publicar uma versão que acesse o banco real: backup verificável e comparação do schema-alvo com o ensaio. Não usar create/create-drop em produção nem apresentar a cópia fictícia como backup real.

O ensaio usa PostgreSQL direto. Manter/alterar Session pooler versus Transaction pooler do Supabase depende de testar conexões, latência e bloqueios no destino. Transaction pooler exige conferir prepared statements (`prepareThreshold=0`) no JDBC; não trocar porta cegamente. Quatro conexões por instância não limitam a soma das réplicas.

Conta conferida Hobby ativa, sem trial. Na consulta de 05/11, a tabela pública incluía 10GB de imagens, 4 CPU-h, 360 GB-h de memória e 1M de invocações na franquia Hobby, compartilhada pela conta. Isso não garante capacidade Java nem economia frente ao Render. Se faltar cota, informar e manter alternativa gratuita. Hobby limita uso pessoal/não comercial; reavaliar antes de operação comercial.

Antes do corte: CI/Quality Gates no head; backup/schema do destino; credenciais/chaves próprias; JDBC/pool; proteção contra abuso em login/cadastro/refresh; cookies/CSRF pela origem real; medir cold start frente ao timeout frontend de 45s; pipeline com commit fixo, health antes da promoção e rollback. Depois atualizar BACKEND_ORIGIN na Vercel frontend e na Repository Variable usada pelo prebuilt. Preservar Render até confirmar o fluxo real.

O pipeline mantém Render como padrão. `BACKEND_PROVIDER=vercel` habilita o job protegido de backend apenas na main; não habilitar essa variável antes das configurações e validações abaixo. Matching (etapa 6) aguarda esta prioridade solicitada pelo usuário.

## Continuação em 06/11 — banco real e candidato protegido

O usuário autorizou explicitamente exportar a configuração do Render para a pasta privada e ignorada da migração. Credenciais, chaves e dumps não fazem parte do Git, dos envios Docker/Vercel ou dos artefatos de CI. A pasta local tem ACL restrita à conta atual do Windows. A exportação foi movida de Downloads, sem manter uma segunda cópia ali.

- PostgreSQL real 17.11, Session pooler 5432 na região de São Paulo, conexão do cliente com TLS confirmado. Consultas e dump usaram modo somente leitura. A observação `pg_stat_ssl` no servidor descreve o trecho pooler→PostgreSQL, não o TLS cliente→pooler; a confirmação deste veio de `psql` com `sslmode=require`.
- Backup lógico consistente da aplicação e do schema de reparo legado: 49.592 bytes, SHA-256 `d31e44de910e93ad9cf650ebea1a64aa48053f060554abe4e207d03001664e74`. Arquivo custom do pg_dump teve catálogo conferido e foi restaurado com sucesso num banco local novo. São 14 tabelas da aplicação e três do reparo, 94 registros. Não inclui schemas gerenciados do Supabase, objetos do Storage nem senhas de papéis; não é backup integral da plataforma.
- O JAR aprovado foi executado com perfil vercel/prod somente nessa restauração. Preservou hashes/contagens das 17 tabelas e o DDL legado; criou apenas `auth_session` e `auth_refresh_token`. Após iniciar o candidato remoto, os mesmos hashes e contagens foram conferidos novamente antes de adicionar dados fictícios.
- Produção do projeto backend separado recebeu 14 variáveis próprias. JDBC e privada RSA 3072 são Secrets; chave própria de produção, separada das chaves de Preview/QA. Pool Hikari configurado com máximo de duas conexões por instância, região `gru1`, TLS no JDBC. Isso não limita o total de réplicas nem garante capacidade do pooler sob carga.
- Candidato construído dos 125 arquivos de produção do commit aprovado, sem H2, em imagem de 131,08MB, usando `--prod --skip-domain`. O banco real recebeu somente as duas tabelas previstas. Antes do primeiro login, ambas receberam RLS e revogação de todas as permissões de PUBLIC/anon/authenticated/service_role, preservando o proprietário usado pelo backend. Essa configuração de acesso não substitui o gerenciamento do schema pelo Hibernate. Conferir essa proteção em qualquer novo banco Supabase; não presumir defaults seguros.
- HTTP no candidato protegido: 23 verificações em 21 pedidos confirmaram cadastro fictício em RASCUNHO, login, cookies Secure/HttpOnly sem JSESSIONID, CSRF, consulta própria, PATCH persistido, renovação, revogação por reuso, novo login e logout. A conta fictícia permanece sem publicação; as sessões do ensaio foram encerradas. Não foram usados dados ou senhas de participantes.
- Partidas iniciais do Java levaram cerca de 20–23s. C1 reduziu os tempos registrados para aproximadamente 12–14s. Após 428s sem chamadas, um health-check levou 15,904s no curl, com processo recém-iniciado. Uma medição não constitui SLA. O frontend passa a usar limite compartilhado de 45s para chamadas API, mantendo cancelamento, estado incerto e ausência de repetição de escritas. Há regressão para CSRF que chega após 23s e para POST que vence sem confirmação.
- Uma regra WAF no backend está publicada **somente em log**, 150 POSTs/IP/60s, nos caminhos de login/refresh/cadastros. Ainda não bloqueia abuso. Hobby inclui uma regra de rate limit e franquia de requisições; não ativar plano/add-on pago. Antes do corte, conferir IP percebido pelo proxy e validar a regra de bloqueio, inclusive no frontend que recebe o IP original.

Evidências privadas em `backend/database/vercel-real-20261106/`; a restauração local contém dados reais e deve ser tratada como o backup, sem servir frontend público ou criar artefatos compartilhados. Os ensaios HTTP remotos usam apenas uma conta fictícia nova. Render e proxy publicado continuam preservados.

## Pipeline preparado e ativação do corte

O novo job `deploy-backend-vercel` é opt-in e depende do DAST existente. Usa o ambiente GitHub `production`, checkout e setup-node fixados por SHA e CLI 59.23.1. O script confere commit, main, plano Hobby ativo sem trial, projeto Container separado e domínio de produção pertencente ao projeto; implanta sem domínios, exige health da aplicação e promove exatamente o candidato verificado. Falha nessa sequência impede o deploy do frontend. Os oito testes do script cobrem ordem e recusas de promoção. Não extrair ou imprimir segredos de CI; o token existente continua em ambiente, sem flag `--token`.

Antes de habilitar Vercel no pipeline:

1. Um administrador do GitHub deve configurar o ambiente `production` com revisores obrigatórios e restrição à branch main. A conta conectada tem push, sem admin; o ambiente não pôde ser consultado como existente. O agente não alterou permissões nem criou credencial de CI.
2. Revisar e integrar o PR pelo responsável. Não há merge automático pelo agente. Conferir CI e Quality Gates no SHA final, incluindo os novos testes do pipeline e do timeout.
3. Configurar Repository Variables `VERCEL_BACKEND_PROJECT_ID`, `VERCEL_SCOPE`, `VERCEL_BACKEND_REGION` (uma região), e a origem HTTPS estável do backend em `BACKEND_ORIGIN`. Manter a mesma origem também na configuração Production da Vercel frontend. IDs/origens reais ficam fora dos arquivos versionados. `VERCEL_ORG_ID` e `VERCEL_TOKEN` continuam Secrets existentes; verificar que o token de CI tem acesso ao projeto backend sem recuperar seu valor.
4. Validar domínio/health público do backend, cookies/CSRF pelo proxy e fluxo completo do frontend com o cliente de 45s, proteção contra abuso e limites. Somente então habilitar `BACKEND_PROVIDER=vercel` e executar o pipeline na main revisada. O código mantém Render para variável ausente ou `render`; valores desconhecidos falham. Tags não publicam backend Vercel nesta primeira configuração.
5. Conferir novamente login/edição/renovação/logout na origem publicada e persistência no PostgreSQL. Guardar deployment anterior e o valor anterior de BACKEND_ORIGIN de forma privada. Preservar Render durante essa confirmação.

Rollback do corte: restaurar BACKEND_ORIGIN anterior na Vercel frontend e na Repository Variable, voltar `BACKEND_PROVIDER=render` e publicar o frontend compatível; manter cookies CSRF HttpOnly e suporte aos hashes `{bcrypt-utf8}`. Para uma regressão apenas do backend Vercel, promover o último deployment real compatível, nunca o PoC H2. Não restaurar dump por cima do banco ativo automaticamente: isso pode eliminar gravações posteriores ao backup. As tabelas JWT adicionais podem permanecer ao voltar a SESSION; não removê-las como parte do rollback de tráfego.

## Validação desta preparação

- 305 testes backend, Checkstyle e arquitetura aprovados. Incluem assinatura/claims/chaves, expiração, datas extremas, confusão de algoritmo, renovação/reuso, concorrência, troca de senha/papel, compatibilidade SESSION e HTTP real com o perfil vercel/prod. Renovar/restaurar JWT preserva CSRF; login/logout o invalidam.
- 621 testes frontend + 8 de configuração, lint e builds DEMO/API aprovados. Cobertura de linhas: 99,11% (2679/2703), sem reduzir limites/exclusões. Pacote backend de envio conferido pela CLI: 125 arquivos, cerca de 219kB, sem dados/chaves locais. Imagem definitiva construída localmente com sucesso.
- Ensaio em cópia **fictícia** PG18: backup prévio de 39.987 bytes; dados das 14 tabelas anteriores preservados antes/depois do update; somente auth_session/auth_refresh_token adicionadas. Segunda instância iniciou com validate. Isso não comprova backup/schema de produção.
- 14 cenários HTTP por Angular/proxy → Spring → PG18: cadastro, login, catálogo de 21 mentores, outra instância, reinício, renovação, logout e concorrência/reuso. JWT continuou válido após reinício; revogação foi respeitada por ambas.
- Chrome local: login, recarga, catálogo, renovação induzida por política curta **só no QA**, consulta/edição de startup com CSRF, persistência após recarga e logout. Imagem em frontend/.angular/cache/vercel-jwt-profile-saved.png; logs/scripts/dumps ignorados em backend/database/vercel-poc-20261105.
- Ocorrências corrigidas: rotação indevida de CSRF pela estratégia de sessão foi reproduzida por cliente real que respeita Set-Cookie, corrigida na ordem do filtro e coberta por regressão. Uma asserção de headers encontrou configuração ausente no recurso de teste; a política none ficou explícita em prod. Empacotamento Windows encontrou o JAR aberto pelas APIs de QA; parar somente essas APIs liberou repackage, sem clean nem perda de evidências. A primeira lista de envio omitia backend por barras nas negações de diretório; dry-run confirmou a correção antes de envio.
- CI117 reprovou o backend por chamada interna a método transacional e dependência da API Date. A chamada passou a helper privado sob as transações públicas existentes; a biblioteca de produção passou a java-jwt com Instant, mantendo RS256 e validação por Clock. JJWT permaneceu apenas como assinador independente em testes. Frontend/gate e demais jobs aplicáveis da CI117 aprovados; repetir a análise do head corrigido, sem reduzir gate ou suprimir regras.

## Fontes oficiais

- [Container Runtime](https://vercel.com/docs/functions/runtimes/container), [migração Render](https://vercel.com/kb/guide/migrate-render-to-vercel).
- [Preços/franquias](https://vercel.com/pricing), [Hobby](https://vercel.com/docs/plans/hobby).
- [java-jwt](https://github.com/auth0/java-jwt), [releases](https://github.com/auth0/java-jwt/releases); [JJWT para testes independentes](https://github.com/jwtk/jjwt).
- [CSRF Spring Security](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html).
- [Conexões Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).
