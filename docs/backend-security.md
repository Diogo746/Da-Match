# Segurança da API

Implementação na branch `feature/security-configuration`. Autenticação por sessão no servidor, sem JWT, HTTP Basic ou formulário HTML do Spring. O banco mantém hashes BCrypt compatíveis com as contas existentes.

## Matriz de acesso

| Método e rota | Acesso |
| --- | --- |
| `GET /csrf` | Público; retorna `headerName` e `token` |
| `GET /api/v1/health` | Público, monitoramento |
| `POST /api/v1/auth/login` | Público, com CSRF |
| `POST /api/v1/mentores` e `POST /api/v1/startups` | Visitante sem sessão autenticada, com CSRF |
| `GET /api/v1/auth/me` | Autenticado |
| `POST /api/v1/auth/logout` | Autenticado, com CSRF; retorna 204 |
| `GET /api/v1/startups`, `/{startupId}`, `/{startupId}/membros` | Autenticado |
| `PATCH /api/v1/mentores/{mentorId}` e `/{mentorId}/status` | MENTOR titular do recurso, com CSRF |
| `POST /api/v1/startups/{startupId}/membros` e `DELETE .../membros/{usuarioId}` | STARTUP com vínculo de FUNDADOR ou REPRESENTANTE nessa startup, com CSRF |
| `GET /actuator/health` e subrotas de health | ADMIN |
| `GET /api/v1/hello` | Público fora de `prod`; bloqueado em `prod` |
| Preflight `OPTIONS` | Sem autenticação; CORS valida origem, método e headers |
| Demais rotas, inclusive `info` e `metrics` | Negadas |

ADMIN não contorna a propriedade dos recursos. Não existem operações administrativas de edição autorizadas nesta entrega. Listagem de startups é acessível a qualquer conta autenticada; as respostas não incluem senhas nem e-mails de integrantes.

Os cadastros continuam sendo onboarding público: o corpo cria uma nova conta com papel definido pelo serviço. Um usuário já autenticado recebe 403 nesses endpoints; não existe criação de outra startup por conta existente. Um futuro caso de uso desse tipo deverá obter o fundador do contexto de segurança.

A autorização por recurso é verificada dentro dos serviços, usando `UsuarioPrincipal` do contexto de segurança. O UUID da URL apenas seleciona o recurso. O `usuarioId` da inclusão/remoção identifica o integrante alvo, nunca o ator. Membros duplicados são impedidos também pela constraint `uk_startup_usuario`; a leitura transacional de uma startup por ID usa bloqueio pessimista para serializar alterações de membros e preservar o último fundador.

## Fluxo de sessão e CSRF

1. Consultar `GET /csrf`, preservando o cookie `XSRF-TOKEN`.
2. Enviar `POST /api/v1/auth/login` em JSON UTF-8 com `email` e `senha`, incluindo o header informado por `/csrf` (`X-XSRF-TOKEN`).
3. Preservar o cookie `JSESSIONID`. A resposta contém somente `id`, `nome`, `email` e `tipoUsuario`. O ID de sessão existente é renovado contra fixation e o hash é apagado do principal antes de persistir o contexto na sessão.
4. Consultar `/csrf` novamente após login, pois o cookie CSRF anterior foi removido.
5. Enviar cookies e header CSRF em toda escrita. `GET /api/v1/auth/me` restaura os dados da conta no frontend após recarga.
6. Enviar `POST /api/v1/auth/logout` com sessão e CSRF. O servidor invalida a sessão, limpa o contexto e remove os dois cookies. Consultar `/csrf` antes de novas escritas.

Sessão: `HttpOnly=true`, `Path=/`, apenas transporte por cookie, sem reescrita de sessão na URL. `XSRF-TOKEN` é o único cookie acessível a JavaScript. Nunca copiar credenciais ou identificadores de sessão para LocalStorage/SessionStorage, DTOs ou logs.

`/csrf` retorna o valor bruto compatível com Angular e Postman. Compressão HTTP está desligada; preserve isso para respostas com CSRF também no proxy/CDN para evitar exposição por compressão. O token de cookie não substitui autenticação. Um header sem cookie, token incorreto ou ausência de token resulta em 403.

Falha de credenciais retorna o mesmo 401 para conta inexistente ou senha incorreta. A consulta de e-mail mantém a semântica exata do banco existente. Cadastro duplicado retorna 409 com mensagem genérica de conflito; o status ainda permite inferir a existência da conta. Essa é uma limitação assumida do cadastro imediato existente. Verificação de e-mail e resposta indistinguível de cadastro exigem outro fluxo de produto.

## Ambiente e topologia

Os arquivos de CI apontam para frontend no Vercel e backend no Render; o domínio final e a configuração dos proxies não estão confirmados no repositório. Nenhuma infraestrutura remota foi alterada.

| Configuração | Desenvolvimento | Produção |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | Perfil padrão | `prod` (também definido no Dockerfile) |
| `SUPABASE_DB_URL` | Banco de desenvolvimento fornecido no ambiente | Secret manager/ambiente; nunca versionar |
| `APP_SECURITY_CORS_ALLOWED_ORIGINS` | Padrão `http://localhost:4200` | Obrigatória; origens exatas separadas por vírgula |
| `APP_SECURITY_COOKIES_SECURE` | `false` para HTTP local | `true`; inicialização rejeita `false` |
| `APP_SECURITY_COOKIES_SAME_SITE` | `Lax` | `Lax` para mesmo site; `None` para sites distintos |
| `APP_SECURITY_SESSION_TIMEOUT` | `30m` | `30m` por padrão; ajustar no ambiente |

Origens devem conter somente esquema HTTP(S), host e porta opcional, sem caminho, barra final, credenciais, query, fragmento ou curinga. Lista ausente em produção ou inválida impede inicialização. `SameSite=None` sem `Secure` também impede inicialização. CORS permite apenas GET, POST, PATCH, DELETE, OPTIONS e headers Content-Type, Accept, X-XSRF-TOKEN, com credenciais e preflight de 600 segundos. Chamadas sem Origin continuam sujeitas às mesmas regras de acesso.

Preferir uma mesma origem com reverse proxy para `/api/v1/**` e `/csrf`. O Angular já usa esse desenho localmente por `npm.cmd run start:api`, mantendo `environment.apiBaseUrl` vazio. Para origens distintas, injetar a origem exata da API no build pelo valor `apiBaseUrl` de `environment.api.ts` (sem versionar endereços de produção). O interceptor transforma somente caminhos relativos da API e envia `withCredentials: true`; a obtenção de CSRF usa a mesma origem configurada. Não são enviados cookies ou headers CSRF a URLs absolutas de terceiros.

Vercel e Render em domínios de sites distintos exigem `SameSite=None; Secure`. Navegadores que bloqueiam cookies de terceiros ainda podem impedir o login: CORS não resolve essa limitação. Usar domínio/site compartilhado ou proxy é a solução preferencial. Apenas portas diferentes de localhost não tornam o tráfego cross-site.

O backend mantém `forward-headers-strategy: none`: não confia automaticamente em `Forwarded` ou `X-Forwarded-*` enviados por clientes. HSTS só é emitido no perfil `prod` quando a requisição é HTTPS reconhecida pelo servidor. Se TLS termina no proxy, este deve emitir HSTS e garantir HTTPS. Só habilitar encaminhamento no servidor após confirmar que a infraestrutura remove headers externos e impede acesso direto que contorne o proxy. Não basta definir `FRAMEWORK` sem essa garantia.

Outros headers incluem `nosniff`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer` e controle de cache padrão do Spring Security. Actuator expõe somente health sem detalhes e exige ADMIN.

## Migrações e baseline

Produção habilita Flyway e usa `ddl-auto: validate`, sem SQL verboso ou logs de parâmetros. Desenvolvimento preserva `update` para compatibilidade local; habilitar Flyway em um banco local novo permite ensaiar a migração. Nunca usar o perfil de desenvolvimento contra produção.

- `V1__initial_schema.sql` cria as cinco tabelas do modelo atual.
- `V2__unique_startup_member.sql` adiciona a unicidade de startup/usuário e falha se encontrar duplicatas.
- Banco vazio: Flyway executa V1 e V2 antes da validação Hibernate.
- Banco existente criado por Hibernate: não habilitar `baseline-on-migrate` automaticamente. Fazer backup, restaurar uma cópia isolada e comparar tabelas, colunas, tipos, FKs e enums com V1 e entidades. Verificar duplicatas por `(startup_id, usuario_id)` e reconciliá-las com decisão de negócio. Confirmada a equivalência, executar o comando `baseline` do Flyway com versão **1** e credenciais fornecidas pelo ambiente, depois `migrate` para V2. Validar a aplicação e testar rollback operacional/restauração antes de repetir em produção.
- Se houver divergência, preparar a migração específica antes do baseline. Não executar V1 sobre tabelas existentes, nem marcar V2 como aplicada sem verificar a constraint.

As migrações e a validação Hibernate são executadas automaticamente nos testes de segurança com H2 em modo PostgreSQL. O Docker local estava desligado: não houve ensaio em PostgreSQL real ou acesso ao Supabase. A validação numa cópia PostgreSQL do ambiente é pré-requisito de deploy.

## Frontend e Postman

O modo API oferece `/entrar` e `/conta`. A guarda consulta `/auth/me`, o estado da conta fica em memória e a senha do formulário de login é limpa ao enviar. O interceptor trata 401/403 e invalida o CSRF em memória, sem repetir automaticamente operações de escrita. Login/logout renovam CSRF antes de concluir o fluxo. A página de perfil demonstrativo continua separada; `/meu-perfil` no modo API encaminha para a conta.

Os arquivos existentes do frontend foram preservados. Há uma pendência anterior independente: o cadastro Angular de mentor ainda não envia `disponibilidades`, obrigatórias no backend; usar a coleção Postman para criar a conta fictícia completa enquanto esse formulário não for alinhado. Edição online, questionário persistido, descoberta e matching não fazem parte desta entrega.

Na coleção Postman, usar a pasta Autenticação e preencher `authEmail`/`authPassword` somente no ambiente local com dados fictícios. O Postman deve manter o cookie jar. Os scripts removem a variável CSRF após login/logout para exigir nova consulta. Não exportar variáveis preenchidas nem cookies.

## Limitações operacionais

- Rate limit de login/cadastro ainda depende do proxy/gateway ou de armazenamento compartilhado. Antes de exposição pública, configurar limites por origem/identidade minimizada, alertas e resposta 429. Não foi criado contador em memória que aparentasse proteger múltiplas réplicas.
- Sessões estão em memória na instância: reinícios encerram sessões. Múltiplas instâncias exigem armazenamento compartilhado (por exemplo Spring Session) ou estratégia operacional explícita; não escalar horizontalmente presumindo sessão compartilhada.
- Papéis são carregados no login. Mudanças administrativas de papel/remoção de conta precisarão invalidar sessões ativas quando esses casos de uso forem implementados.
- Auditoria usa o logger `security.audit` com eventos fixos de login aprovado/negado, logout e acesso negado. Não registra email, UUID, IP, URI, senha, token ou ID de sessão; correlação por identidade foi deliberadamente omitida. Agregação, retenção e alertas pertencem à configuração operacional.
- Atualização de versão do Spring Boot/Security e avaliação de dependências permanecem necessárias no ciclo normal de manutenção; esta alteração usa as versões já fixadas pelo projeto.

## Validação

`mvn -pl backend test` executa testes unitários, de arquitetura, regressão HTTP, integração de autenticação/autorização, migrações e cookies reais no servidor de teste. No Windows desta sessão, Maven foi encontrado em `C:\Users\mario\AppData\Local\Temp\da-match-maven-3.9.9\apache-maven-3.9.9\bin\mvn.cmd`.

Frontend: `npm.cmd run lint`, `npm.cmd run test:coverage`, `npm.cmd run build` e `npm.cmd run build:api`. A configuração de cobertura e os testes existentes não foram desabilitados.

Resultado local em 20/10/2026: **81 testes do backend**, sem falhas/erros/ignorados e `BUILD SUCCESS`; **192 testes do frontend**, lint e ambos os builds aprovados. Cobertura de linhas do frontend: **97,86%** (referência anterior: 97,60%). O log Maven desta validação fica em `backend/target/security-validation.log`; relatórios detalhados em `backend/target/surefire-reports`, `backend/target/site/jacoco` e `frontend/coverage/frontend`.

Referências de implementação: [CSRF e SPA](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html), [persistência do contexto e sessões](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html) e [integração CORS](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html). APIs utilizadas foram compiladas e testadas contra o Spring Security fornecido pelo Spring Boot 3.3.3 do projeto.
