# Integração de mentor — Render e Vercel

Este guia corresponde à branch `feature/mentor-integration`. Contém nomes de variáveis e exemplos fictícios; não contém credenciais nem endereços de produção. Não copie os domínios de exemplo como se fossem os seus serviços.

## Fluxo implementado

1. `/cadastro`: nome, e-mail, senha, biografia, redes opcionais e ao menos um dia/período de disponibilidade. `diaSemana` vai de 1 (segunda-feira) a 7 (domingo); períodos: `MANHA`, `TARDE`, `NOITE`, no fuso de São Paulo.
2. `GET /csrf` entrega o token no JSON; o navegador mantém o cookie HttpOnly. `POST /api/v1/mentores` recebe a conta aninhada e cria o perfil como `RASCUNHO`, sem autenticar automaticamente.
3. `/entrar`: autenticação por sessão. Login e logout renovam CSRF. Credenciais e identificadores de sessão não são persistidos pelo JavaScript.
4. `/conta` oferece acesso a `/mentor/perfil` para contas `MENTOR`.
5. `GET /api/v1/mentores/me` obtém o usuário do contexto de segurança. Não recebe `usuarioId` nem permite escolher o perfil de outra conta. Retorna DTO, sem entidade JPA, senha ou hash. Visitantes recebem 401; outras funções recebem 403; mentor sem perfil recebe 404.
6. `PATCH /api/v1/mentores/{mentorId}` edita biografia, redes, site e agenda. Uma agenda enviada substitui a anterior e não pode estar vazia. Biografia enviada não pode estar em branco e aceita até 1.000 caracteres; campos sociais aceitam até 255. Campos sociais omitidos são preservados; uma string vazia limpa o campo.
7. `PATCH /api/v1/mentores/{mentorId}/status` altera `RASCUNHO`, `PUBLICADO` ou `PAUSADO`. Edição e publicação exigem mentor titular e CSRF. ADMIN não tem exceção automática. A interface exige salvar alterações pendentes antes de publicar/pausar.

Catálogo, salvos, questionário e matching continuam demonstrativos. Publicar um perfil ainda não o inclui em um catálogo real. Cadastro de startup será conectado em etapa própria.

## Topologia de deploy

O navegador acessa somente a origem da Vercel. `frontend/vercel.ts` encaminha `/api/v1/**` e `/csrf` ao backend HTTPS definido em `BACKEND_ORIGIN`; as outras rotas usam o fallback Angular. Cookies ficam vinculados ao site do frontend, sem `Domain` explícito. Esse desenho evita depender de cookies de terceiros entre os domínios Vercel e Render.

Na Vercel, configure **Root Directory: `frontend`**. `vercel.ts` define **Build Command: `npm run build:api`** e **Output Directory: `dist/frontend-api/browser`**. Use Node.js 24 ou outra versão aceita por `frontend/package.json`. Se usar CLI, mantenha uma versão atual que suporte `vercel.ts`.

No Render, mantenha o serviço Docker com `Dockerfile` e contexto na raiz do monorepo. Health check: `/api/v1/health`. O Dockerfile já ativa `prod`. O Blueprint mantém deploy automático desativado: um deploy depende do hook de CI ou de acionamento manual. Este trabalho não altera a configuração das contas remotas nem dispara deploys.

## Variáveis do Render

Em **serviço → Environment**, configure:

| Variável | Obrigatoriedade | Valor e finalidade |
| --- | --- | --- |
| `SUPABASE_DB_URL` | Obrigatória; segredo | URL JDBC PostgreSQL fornecida pelo responsável pelo banco, com usuário/senha e TLS. Formato ilustrativo: `jdbc:postgresql://<HOST>:5432/<BANCO>?user=<USUARIO>&password=<SENHA_CODIFICADA>&sslmode=require`. Codifique caracteres reservados da senha como componentes de URL; não compartilhe a URL preenchida. Use o endpoint de conexão compatível com o serviço, conforme as instruções do banco. |
| `APP_SECURITY_CORS_ALLOWED_ORIGINS` | Obrigatória em produção | Origem HTTPS exata do frontend, por exemplo `https://frontend.example.test`. Sem barra final, caminho, aspas, credenciais, query, fragmento ou curinga. Para mais de uma origem confiável, separe por vírgula. |
| `APP_SECURITY_COOKIES_SECURE` | Deve ser `true` em produção | O padrão de `prod` é `true`; recomenda-se declarar explicitamente. A aplicação rejeita `false`. |
| `APP_SECURITY_COOKIES_SAME_SITE` | Recomendado declarar | `Lax` para o proxy de mesma origem deste guia. `None` somente para uma topologia cross-site deliberada, sempre com Secure; não é necessário neste desenho. |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | Recomendado declarar | `update`. Mantém o schema gerenciado pelo Hibernate, sem migrations. Não use `create` ou `create-drop` em produção. |
| `APP_SECURITY_SESSION_TIMEOUT` | Opcional | `30m` por padrão; controla a duração da sessão no servidor. |
| `SPRING_PROFILES_ACTIVE` | Recomendado para clareza | `prod`. O Dockerfile também força esse perfil, para preservar as proteções de produção. Não use o perfil de desenvolvimento em banco de produção. |
| `PORT` | Fornecida pelo Render | Não é segredo. O Blueprint usa `10000`; `application-prod.yml` consome a variável. Normalmente não é preciso cadastrá-la manualmente. |

Não são necessários JWT secret, segredo de cliente OAuth, chave de IA, chave de serviço Supabase nem senha de conta de usuário como variável de ambiente para este fluxo. A conexão JDBC é suficiente; não invente ou exponha credenciais adicionais.

## Variáveis da Vercel

Em **Project → Settings → Environment Variables**, configure:

| Variável | Obrigatoriedade | Valor e finalidade |
| --- | --- | --- |
| `BACKEND_ORIGIN` | Obrigatória para o deploy | Origem HTTPS exata do backend Render, por exemplo `https://backend.example.test`, sem caminho, query, fragmento ou credenciais. `vercel.ts` rejeita valor ausente ou inválido. Ela configura o proxy durante o deploy e não é incorporada ao JavaScript Angular. |

Mantenha `environment.apiBaseUrl` vazio: as chamadas são relativas e passam pelo proxy. A versão conectada é selecionada pelo comando `build:api`; não é necessário criar uma variável de modo.

Nunca copie `SUPABASE_DB_URL`, senha de banco, tokens de CI ou chaves de serviço para a Vercel ou para variáveis públicas de frontend. Não há necessidade de prefixos `NEXT_PUBLIC_` ou `VITE_` neste projeto Angular.

Selecione **Production** para o frontend de produção. Para Preview, use um backend/banco isolado e valores próprios; autorize no Render apenas as origens de preview realmente necessárias. Não use curingas para permitir todos os previews. Variáveis configuradas em Development não atendem automaticamente Production/Preview. Após editar `BACKEND_ORIGIN`, faça novo deploy da Vercel.

## Correção do erro de inicialização reportado no Render

O log recebido em 21/10/2026 informou:

```text
Property: app.security.cors.allowedOrigins
Value: "[]"
Reason: must not be empty
```

Isso confirma uma lista de CORS vazia em produção. Configure `APP_SECURITY_CORS_ALLOWED_ORIGINS` no serviço correto com a origem real do frontend e faça novo deploy. Não use `[]`, string vazia, `*` nem uma URL com `/cadastro` ou `/` no final. O erro em `corsFilterRegistration`/Tomcat era consequência dessa configuração; não exige desabilitar CORS, CSRF ou a validação.

Na tentativa seguinte, o log informou `app.security.cors.exactOrigins=false`. Nesse caso a lista deixou de estar vazia, mas ao menos uma origem tem formato inválido. `exactOrigins` é uma verificação derivada, não uma variável de ambiente a preencher. Corrija o valor de `APP_SECURITY_CORS_ALLOWED_ORIGINS`: apenas `https://<host-do-frontend>`, sem barra final, aspas, colchetes ou caminho. A mensagem de varredura de portas do Render não era a causa: o mesmo log confirmou Tomcat inicializado na porta 10000 antes da validação falhar.

## Banco gerenciado pelo Hibernate

O Supabase existente foi criado pelo Hibernate e continuará assim, por decisão do responsável em 21/10/2026. O projeto não usa migrations: as dependências, scripts e configuração Flyway foram removidos. `SPRING_JPA_HIBERNATE_DDL_AUTO=update` permite que Hibernate ajuste o schema pelas entidades, incluindo a coluna de biografia com 1.000 caracteres.

Para corrigir **o deploy antigo** que ainda mostra `Found non-empty schema(s) "public" but no schema history table`, configure temporariamente no Render:

```dotenv
SPRING_FLYWAY_ENABLED=false
SPRING_JPA_HIBERNATE_DDL_AUTO=update
```

Depois faça novo deploy. Não é necessário criar histórico, executar baseline nem apagar tabelas. No código novo, sem dependência Flyway, `SPRING_FLYWAY_ENABLED` pode ser removida. Se houver uma variável antiga de DDL definida como `validate`, altere-a para `update`.

Mantenha backup e confira a atualização numa cópia PostgreSQL antes de produção. Hibernate `update` não fornece histórico versionado nem rollback e não resolve qualquer transformação de dados automaticamente. Duplicatas ou valores incompatíveis com constraints exigem análise própria; nunca remova registros silenciosamente. Não configure `create` ou `create-drop` no Render.

O teste local `HibernateLegacySchemaTest` usa schema fictício populado, confirma preservação dos dados, ampliação da biografia e criação de tabelas ausentes sem histórico de migrations. Os testes usam H2 em modo PostgreSQL; o Supabase real não foi acessado nem modificado nesta sessão.

## Sequência de configuração e conferência

1. Identifique a origem estável do frontend e a origem HTTPS do backend, sem copiar credenciais para mensagens ou arquivos versionados.
2. Prepare/valide o banco isoladamente e configure as variáveis do Render. Confira que `/api/v1/health` responde 200. Se o serviço estiver em um plano que suspende por inatividade, a primeira inicialização pode exceder os timeouts do cliente; aguarde o health check antes de testar o fluxo.
3. Configure `BACKEND_ORIGIN` na Vercel, Root Directory `frontend` e faça deploy do código desta branch após aprovação e merge.
4. Pela URL do frontend, `GET /csrf` deve responder JSON com `headerName` e `token`, sem cache. Confira que o cookie `XSRF-TOKEN` está HttpOnly/Secure. As respostas CSRF não devem ser comprimidas pelo proxy/CDN.
5. Cadastre um mentor fictício com e-mail único e agenda; entre; abra o perfil; edite; publique; recarregue e confira os dados; pause e saia. Depois do logout, a consulta privada deve exigir novo login.
6. Confira que `/mentor/perfil` funciona após recarga direta, os cookies `JSESSIONID`/`XSRF-TOKEN` são mantidos no domínio do frontend e não há requisições do navegador para uma API de terceiro.
7. Configure rate limit de login/cadastro no gateway/infraestrutura antes de exposição pública. Sessões são mantidas em memória: reinícios encerram sessões; múltiplas réplicas exigem armazenamento compartilhado ou uma estratégia de sessão definida.

Segredos de deploy hook do Render, tokens da Vercel e tokens SonarQube usados pela esteira pertencem a **GitHub Secrets**, conforme o workflow existente; não são configurações da aplicação Angular/Spring e não devem ir ao navegador.

Referências oficiais: [configuração programática da Vercel](https://vercel.com/docs/project-configuration/vercel-ts), [rewrites](https://vercel.com/docs/routing/rewrites), [variáveis Vercel](https://vercel.com/docs/environment-variables), [variáveis Render](https://render.com/docs/configure-environment-variables).
