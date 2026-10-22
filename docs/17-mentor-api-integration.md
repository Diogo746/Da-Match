# 17 — Integração do cadastro de mentor — contrato preservado na v0.5.0

A validação e as novidades da revisão atual estão no [documento 18](18-frontend-v0.5.0.md). O resultado de testes abaixo se refere à entrega inicial da v0.4.3.

## Escopo

Adaptação do frontend v0.4.2 corrigido ao código de `Da-Match-main-att.zip`, recebido em 17/10/2026. O pacote inclui a base da main e o frontend atualizado; os arquivos do backend foram preservados byte a byte. Não há alteração de Java, banco, autenticação ou regra de matching.

## Contrato implementado

1. `GET /csrf` deve devolver `{ "headerName": "X-XSRF-TOKEN", "token": "..." }` e o cookie `XSRF-TOKEN`.
2. O navegador mantém o cookie. O valor do JSON é enviado como header do cadastro; o frontend não precisa ler o cookie HttpOnly nem desativar CSRF.
3. `POST /api/v1/mentores` recebe:

```json
{
  "usuario": {
    "nome": "Maria Teste",
    "email": "maria.teste@example.test",
    "senha": "senha-inventada"
  },
  "biografia": "Mentora em produtos digitais e validação de ideias.",
  "linkedin": "https://www.linkedin.com/in/maria-teste",
  "instagram": "maria.teste"
}
```

LinkedIn e Instagram são omitidos do JSON quando vazios. O frontend não envia `tipoUsuario`, `site`, respostas do questionário, pontuação ou identificadores de usuário. A rota do backend define o papel MENTOR. Nome e e-mail são normalizados; a senha é preservada exatamente como digitada.

4. A confirmação exige **201 Created** e os campos não vazios `id`, `usuarioId`, `nome`, `email`, `biografia` e `dataEntradaPlataforma`. LinkedIn, Instagram e site podem ser nulos. A interface recebe uma lista explícita desses campos; propriedades inesperadas não são propagadas.
5. A tela mostra os dados retornados. Não cria sessão autenticada, não popula o catálogo fictício e não apresenta as respostas de questionário como persistidas.

## Modos e arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `src/environments/environment.ts` | Demonstração por padrão |
| `src/environments/environment.api.ts` | Cadastro conectado de mentor |
| `src/app/core/registration.config.ts` | Escolha explícita do gateway |
| `src/app/core/registration.gateway.ts` | Contratos, validação compartilhada e simulação |
| `src/app/core/http-mentor-registration.gateway.ts` | CSRF, POST, confirmação e tradução de falhas |
| `proxy.conf.json` | Encaminhamento local de `/api/**` e `/csrf` para 8080 |

`npm start` preserva o teste completo sem backend. `npm run start:api` substitui o arquivo de ambiente e habilita o proxy. Não há troca silenciosa de modo após erro. O modo de integração oferece somente mentor; a navegação não apresenta Meu perfil como se houvesse consulta autenticada disponível.

## Falhas e reenvio

| Situação | Comportamento |
| --- | --- |
| Dados inválidos no formulário | Não chama a rede; orienta o preenchimento |
| Falha de rede ou espera acima de 15 s antes do POST | Informa conexão indisponível; permite nova tentativa |
| Resposta CSRF incompleta ou header inesperado | Interrompe antes de enviar dados de cadastro |
| HTTP 400 no cadastro | Informa rejeição dos dados, sem sucesso fictício |
| HTTP 403 | Informa falha na proteção do envio |
| HTTP 409 no POST | Reconhece e-mail já cadastrado, quando o backend disponibilizar esse contrato |
| Falha de rede, timeout, erro de servidor ou resposta inesperada após o POST | Informa resultado sem confirmação e bloqueia outro envio naquela tela |

Não há retry automático de POST. No resultado incerto, a senha é limpa. Não se presume que a conta deixou de ser criada. O registro deve ser conferido antes de um novo cadastro. Mensagens internas ou corpos de erro do servidor não são exibidos diretamente.

## Pontos de alinhamento com o backend

Registro histórico desta primeira integração. A entrega posterior descrita em [Integração de mentor](20-mentor-integration.md) conecta sessão, consulta própria, edição e publicação, envia a agenda obrigatória, trata conflito de cadastro e declara `length = 1000` na biografia. O banco continua gerenciado pelo Hibernate `update`, sem migrations, por decisão do responsável. As pendências abaixo refletem o diagnóstico anterior.

### Biografia e coluna do banco

`CadastrarMentorRequest` declara `@Size(max = 1000)`, que é o limite usado no formulário. A entidade `Mentor` usa `@Column(nullable = false)` em `biografia`, sem declarar `length`. O padrão de length no JPA é 255.

Isso identifica um desalinhamento no mapeamento, mas não comprova o tamanho da coluna já existente no Supabase. O responsável pelo backend deve conferir o esquema e, se necessário, alinhar a anotação e a migração da coluna para comportar 1.000 caracteres. Uma biografia curta permite iniciar a homologação; os casos de 255, 256 e 1.000 caracteres precisam ser testados no banco real antes de considerar esse limite validado.

### E-mail existente

`UsuarioService` verifica duplicidade e lança `EmailExistenteException`. Não foi encontrado handler HTTP que a converta em 409 com um código de erro estável. O frontend não tenta descobrir duplicidade a partir de uma resposta 500: considera o resultado sem confirmação. O backend precisa padronizar esse erro para permitir a mensagem específica em todas as situações.

### Funcionalidades seguintes

Continuam pendentes: cadastro e perfil de startup; autenticação; consulta e atualização do próprio perfil; lista e detalhes de mentores; persistência das respostas; API de recomendações. Os métodos internos de busca/atualização de mentor não equivalem a rotas HTTP disponíveis. A decisão da regra de matching permanece no documento 16.

## Homologação com o backend executando

Requer Java 21, Maven e `SUPABASE_DB_URL` configurada apenas no servidor. O responsável pelo banco deve fornecer a configuração por canal apropriado, sem versionar credenciais.

1. Na raiz: `mvn -pl backend spring-boot:run`.
2. Em `frontend`: `npm ci` e `npm run start:api`.
3. Abra `http://localhost:4200/cadastro`. No DevTools, a aba Network deve mostrar GET `/csrf`, seguido de POST `/api/v1/mentores` com 201.
4. Use um e-mail fictício novo, biografia curta e senha inventada. Confirme que a tela mostra a resposta recebida.
5. Confira usuário e mentor no banco com o responsável pelo backend. A senha não deve aparecer como texto aberto.
6. Teste campos obrigatórios, biografias nos limites, links vazios/preenchidos e e-mail já existente.
7. Pare o backend antes de um cadastro novo e confira a mensagem de conexão indisponível.
8. Se houver resultado sem confirmação depois do POST, confira o banco antes de tentar novamente. Não use repetidos cliques ou atualização automática como estratégia de recuperação.

## Verificação realizada

Em 17/10/2026, passaram lint, tipos dos testes, 153 testes em 12 arquivos e builds de produção DEMO/API. Cobertura: linhas 97,37%; declarações 96,05%; ramificações 95,80%; funções 91,19%. Os novos cenários cobrem JSON aninhado, CSRF, respostas e erros HTTP, timeout, limite de biografia, ausência de fallback e fluxo renderizado de confirmação.

Os testes HTTP usam respostas simuladas. Esta entrega não executou o backend Java, não gravou dados no Supabase e não comprovou a integração com o banco real. A aprovação da v0.4.3 no Sonar depende de novo push/PR e execução do pipeline.

## Referências técnicas

- [Testes HTTP do Angular](https://angular.dev/guide/http/testing).
- [Proxy no servidor de desenvolvimento Angular](https://angular.dev/tools/cli/serve).
- [Proteção CSRF do Spring Security](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html).
- [Especificação Jakarta Persistence 3.1 — definição de Column](https://jakarta.ee/specifications/persistence/3.1/jakarta-persistence-spec-3.1.pdf).
