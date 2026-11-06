# Preparação do backend para Vercel — JWT com CSRF

## Estado e limite aprovado

Em 05/11/2026, o usuário autorizou ajustar o backend e criar seu projeto Vercel, usando **somente recursos gratuitos**. Não ativar Pro, trial pago, complementos ou integrações pagas. O projeto separado usa Container Runtime (beta) e Java 21/Spring Boot; o Angular continua em seu projeto próprio. A main `5d54233` já contém a descoberta real do PR #34; a preparação está em `codex/vercel-backend-jwt`.

A prova de conceito com H2 descartável respondeu ao health-check. Isso comprova execução do container, sem comprovar persistência/capacidade de produção. Render, frontend publicado e banco remoto permanecem com a configuração anterior. H2 não pode ser promovido a backend real.

## Contrato JWT

- `SESSION` continua padrão, preservando o ambiente atual. `APP_SECURITY_AUTH_MODE=JWT` ativa o novo contrato. O perfil `vercel` inclui `prod`, exige JWT e cookies Secure, reduz o pool JDBC e habilita encerramento gracioso.
- Spring Security mantém a autorização e CSRF. Assinatura/parsing usam JJWT 0.13.0 (Apache 2.0), sem provedor pago. Somente RS256, RSA de pelo menos 2048 bits e `kid` presente no mapa externo. Não buscar chaves em URL indicada pelo token. Configuração ausente, fraca ou incompatível impede iniciar JWT.
- Exigir assinatura, `typ=at+jwt`, emissor, audiência exata, `sub`/`sid`/`jti` UUIDs canônicos, `iat`, `nbf`, `exp` e duração permitida. Limitar tamanho; rejeitar token sem assinatura, algoritmo diferente, chave desconhecida, adulteração e expiração. JWT não carrega nome, e-mail, papel, senha ou hash.
- Access: 15 minutos. Refresh: 256 bits aleatórios, uso único, 30 minutos sem renovar. Família: máximo oito horas. Configuração pode reduzir esses prazos, nunca superar os tetos. Não há opção "lembrar de mim"; os cookies não persistem por Max-Age no navegador.
- `DAMATCH-ACCESS`: HttpOnly, Path=/; `DAMATCH-REFRESH`: HttpOnly, Path=/api/v1/auth. Sem Domain. Secure obrigatório em produção, SameSite configurável com a validação existente. Preferir proxy na mesma origem e Lax. CSRF permanece obrigatório com cookies.
- JWT não lê HttpSession nem aceita Bearer como fonte alternativa. Cada pedido confere família vigente, conta atual e impressão da senha/papel no banco. Nome/e-mail vêm da conta atual; vínculos continuam conferidos pelos serviços.

JWT elimina a dependência de sessão **na memória da instância**, mas esta implementação mantém estado mínimo no PostgreSQL existente para renovação e logout imediato. Não é arquitetura sem armazenamento. Hibernate adiciona `auth_session` (conta, datas, revogação, impressão interna da credencial/papel) e `auth_refresh_token` (somente SHA-256 de cada refresh, nunca o token bruto). Famílias vencidas e seus hashes são removidos ao criar novos logins.

Troca de senha/papel invalida a família na próxima consulta. Logout revoga pelo refresh reconhecido ou access validado e remove cookies. Login substituindo cookies revoga a família anterior. Rotação bloqueia a família no banco e funciona entre instâncias. Reusar um refresh consumido revoga a família inteira, inclusive tokens posteriores. Pedidos já autorizados e em andamento não são cancelados retroativamente.

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

Antes do corte: CI/Quality Gates no head; backup/schema do destino; credenciais/chaves próprias; JDBC/pool; proteção contra abuso em login/cadastro/refresh; cookies/CSRF pela origem real; medir cold start frente ao timeout frontend de 15s; pipeline com commit fixo, health antes da promoção e rollback. Depois atualizar BACKEND_ORIGIN na Vercel frontend e na Repository Variable usada pelo prebuilt. Preservar Render até confirmar o fluxo real.

O pipeline atual ainda publica no Render. Esta preparação não troca o hook por projeto sem credenciais definitivas. Matching (etapa 6) aguarda esta prioridade solicitada pelo usuário.

## Validação desta preparação

- 299 testes backend, Checkstyle e arquitetura aprovados. Incluem assinatura/claims/chaves, expiração, renovação/reuso, concorrência, troca de senha/papel, compatibilidade SESSION e HTTP real com o perfil vercel/prod. Renovar/restaurar JWT preserva CSRF; login/logout o invalidam.
- 621 testes frontend + 8 de configuração, lint e builds DEMO/API aprovados. Cobertura de linhas: 99,11% (2679/2703), sem reduzir limites/exclusões. Pacote backend de envio conferido pela CLI: 125 arquivos, cerca de 219kB, sem dados/chaves locais. Imagem definitiva construída localmente com sucesso.
- Ensaio em cópia **fictícia** PG18: backup prévio de 39.987 bytes; dados das 14 tabelas anteriores preservados antes/depois do update; somente auth_session/auth_refresh_token adicionadas. Segunda instância iniciou com validate. Isso não comprova backup/schema de produção.
- 14 cenários HTTP por Angular/proxy → Spring → PG18: cadastro, login, catálogo de 21 mentores, outra instância, reinício, renovação, logout e concorrência/reuso. JWT continuou válido após reinício; revogação foi respeitada por ambas.
- Chrome local: login, recarga, catálogo, renovação induzida por política curta **só no QA**, consulta/edição de startup com CSRF, persistência após recarga e logout. Imagem em frontend/.angular/cache/vercel-jwt-profile-saved.png; logs/scripts/dumps ignorados em backend/database/vercel-poc-20261105.
- Ocorrências corrigidas: rotação indevida de CSRF pela estratégia de sessão foi reproduzida por cliente real que respeita Set-Cookie, corrigida na ordem do filtro e coberta por regressão. Uma asserção de headers encontrou configuração ausente no recurso de teste; a política none ficou explícita em prod. Empacotamento Windows encontrou o JAR aberto pelas APIs de QA; parar somente essas APIs liberou repackage, sem clean nem perda de evidências. A primeira lista de envio omitia backend por barras nas negações de diretório; dry-run confirmou a correção antes de envio.

## Fontes oficiais

- [Container Runtime](https://vercel.com/docs/functions/runtimes/container), [migração Render](https://vercel.com/kb/guide/migrate-render-to-vercel).
- [Preços/franquias](https://vercel.com/pricing), [Hobby](https://vercel.com/docs/plans/hobby).
- [JJWT](https://github.com/jwtk/jjwt), [release 0.13.0](https://github.com/jwtk/jjwt/releases/tag/0.13.0).
- [CSRF Spring Security](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html).
- [Conexões Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).
