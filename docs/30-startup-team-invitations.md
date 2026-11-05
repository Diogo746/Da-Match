# Integrantes da startup e convites com aceite — etapa 4

Contrato preparado em 04/11/2026, após as respostas do usuário na retomada da main `de71fa5`. Contrato integrado pelo PR #29 na main `33e8671`, CI pós-merge #102 aprovada. **Backend integrado pelo PR #30 em `fc600c7`, CI #105 aprovada; interface integrada pelo PR #31 na main `dc66ec7`, CI #108 aprovada.** Evidências nos guias [31](31-startup-team-api-validation.md) e [32](32-startup-team-ui-validation.md). Autenticação atual por sessão e CSRF; JWT com CSRF continua decisão futura.

## Decisões do usuário

1. Somente contas `STARTUP` já cadastradas poderão receber novos vínculos de equipe.
2. Fundador ou representante informa o e-mail exato de uma conta existente. Ela recebe um convite **dentro do sistema** e precisa aceitar antes de integrar o projeto. Não haverá envio de e-mail nesta versão.
3. Novos vínculos podem ser `MEMBRO` ou `REPRESENTANTE`. Alteração de papel de integrantes existentes e concessão de `FUNDADOR` ficam fora desta versão.
4. Convites vencem em **7 dias**; depois poderá ser emitido outro convite.

Não foi solicitada migração dos vínculos legados, criação de contas sem projeto, mudança do onboarding ou alteração do algoritmo de matching. Uma conta pode continuar participando de várias startups. A decisão acima foi dada pelo usuário; não atribuir aprovação adicional ao PO/time.

## Base existente e mudança necessária

Antes desta implementação, `POST /api/v1/startups/{startupId}/membros` recebe `usuarioId` e `papelMembro`, criava imediatamente o vínculo e retornava `201 MembroStartupResponse`, sem verificar o tipo da conta destinatária. A consulta própria e o questionário, porém, exigem papel de conta `STARTUP`.

A nova inclusão deve ocorrer **somente no aceite autenticado**. Na implementação, a rota antiga de inclusão direta deve deixar de criar vínculos: uma chamada válida, com sessão STARTUP e CSRF, receberá `410 Gone`, orientando usar convites. Atualizar testes, matriz de segurança e Postman nessa mesma entrega; não manter um caminho alternativo que contorne o aceite. O cadastro público continua criando o vínculo inicial FUNDADOR na mesma transação, sem precisar de convite.

`GET /api/v1/startups/{startupId}/membros` e DELETE do integrante mantêm seus formatos. A consulta da equipe deve exigir conta STARTUP com vínculo atual; a remoção continua exigindo FUNDADOR/REPRESENTANTE e CSRF. Sem exceção ADMIN. Não converter o endpoint de consulta de equipe em busca de usuários.

## Identidade, autorização e dados visíveis

- Não oferecer busca geral de contas ou autocomplete de e-mails. Resolver apenas o e-mail exato informado pelo gestor, depois de verificar o acesso dele ao projeto. Preservar a identidade de e-mail já usada pelo cadastro/login: remover espaços externos, sem introduzir conversão automática para minúsculas nesta etapa.
- Conta inexistente ou de tipo diferente de STARTUP recebe a mesma mensagem genérica: `Não foi possível convidar essa conta.` Não revelar o tipo de conta nem retornar dados pessoais extras. Essa validação exata não equivale a tornar o cadastro de contas público.
- Quem recebe o convite precisa autenticar-se na própria conta destinatária. Identificadores de ator, remetente ou destinatário enviados pelo cliente não concedem autorização. UUID do convite não é um token de acesso e não substitui a sessão/CSRF.
- Gestores atuais do projeto podem consultar e cancelar seus convites pendentes, inclusive os emitidos por outro gestor. Somente a conta destinatária pode aceitar ou recusar.
- Membro comum consulta os integrantes, sem convidar, cancelar, remover ou mudar papéis. Representante pode convidar outro representante, conforme o papel de gestão já explicado ao usuário.
- O destinatário pode consultar o nome do projeto, nome de quem convidou, papel oferecido, estado e datas do convite antes do aceite. Isso não libera consulta do perfil completo, questionário, integrantes, contato privado ou gestão do projeto.
- Respostas não incluem e-mail, credenciais, hashes, entidades JPA ou questionário. Não persistir e-mail duplicado como identidade do destinatário: associar à conta existente. Registros e exemplos usam somente dados fictícios.
- Vínculos legados com MENTOR/ADMIN não são apagados ou convertidos silenciosamente. Continuam visíveis aos membros STARTUP autorizados pela equipe; esses tipos não podem receber novos convites. A restrição de acesso STARTUP permanece.

## Estado e validade do convite

Estados textuais: `PENDENTE`, `ACEITO`, `RECUSADO`, `CANCELADO`, `EXPIRADO`. Novo convite começa PENDENTE; não cria `MembroStartup` nem faz o projeto aparecer na consulta própria do destinatário.

| Origem | Ação/condição | Resultado |
| --- | --- | --- |
| PENDENTE e válido | Destinatário aceita | Cria o vínculo no papel oferecido e registra ACEITO na mesma transação |
| PENDENTE e válido | Destinatário recusa | RECUSADO, sem vínculo |
| PENDENTE e válido | Gestor atual cancela | CANCELADO, sem vínculo |
| PENDENTE | Agora maior ou igual ao vencimento | EXPIRADO, sem vínculo |
| Estado final | Tentativa de outra transição | Rejeição; não reabrir nem trocar o papel |

Instantes de criação/vencimento são `Instant`, serializados em ISO-8601 UTC. Vencimento é criação mais 7 dias de 24 horas; exatamente no vencimento o aceite já é proibido. Usar `Clock` nos serviços/testes; exibir datas na interface em `America/Sao_Paulo`. Não depender de um agendador para impedir aceite vencido. GET não precisa gravar para apresentar EXPIRADO efetivo.

Repetição da mesma ação já confirmada pode retornar `200` com o estado final, depois de conferir autorização. Nunca recriar o vínculo de um convite ACEITO que depois teve seu integrante removido. Convite CANCELADO/RECUSADO/EXPIRADO não é reativado: novo envio gera novo UUID, com novo prazo e papel explícito.

Não convidar a própria conta nem quem já integra o projeto (`409`). Impedir dois convites pendentes válidos para o mesmo par projeto/destinatário (`409`), sem impedir convites de projetos diferentes. O gestor pode cancelar o anterior e enviar outro; isso não edita o convite antigo.

No aceite, revalidar o tipo STARTUP do destinatário, ausência de vínculo, prazo e estado. Revalidar também que quem emitiu o convite ainda possui vínculo FUNDADOR/REPRESENTANTE. Convite emitido por gestor que perdeu permissão não concede acesso: retornar `409 CONVITE_INDISPONIVEL`; um gestor atual poderá cancelá-lo e emitir outro. Não confiar em permissões existentes apenas na emissão.

## API integrada à main pelo PR #30

Todos os endpoints exigem sessão STARTUP. POST/PATCH/DELETE exigem o CSRF atual, obtido em `/csrf`. Sem parâmetros de identidade do ator.

| Método e rota | Permissão | Resposta de sucesso |
| --- | --- | --- |
| `POST /api/v1/startups/{startupId}/convites` | FUNDADOR/REPRESENTANTE atual | `201 ConviteStartupResponse` |
| `GET /api/v1/startups/{startupId}/convites` | FUNDADOR/REPRESENTANTE atual | `200 PaginaConvitesStartupResponse` |
| `GET /api/v1/startups/convites/me` | Conta destinatária autenticada | `200 PaginaConvitesStartupResponse` |
| `GET /api/v1/startups/convites/{conviteId}` | Destinatário ou gestor atual do projeto | `200 ConviteStartupResponse` |
| `GET /api/v1/startups/{startupId}/convites/solicitacoes/{solicitacaoId}` | Gestor atual que emitiu a solicitação | `200 ConviteStartupResponse`, ou `404` sem solicitação confirmada |
| `PATCH /api/v1/startups/convites/{conviteId}/aceite` | Destinatário | `200 ConviteStartupResponse` |
| `PATCH /api/v1/startups/convites/{conviteId}/recusa` | Destinatário | `200 ConviteStartupResponse` |
| `PATCH /api/v1/startups/{startupId}/convites/{conviteId}/cancelamento` | FUNDADOR/REPRESENTANTE atual desse projeto | `200 ConviteStartupResponse` |

Criação aceita somente:

```json
{
  "solicitacaoId": "bf428eea-581b-4ef0-b4d1-742f9dc13a02",
  "email": "integrante@example.test",
  "papelMembro": "MEMBRO"
}
```

E-mail obrigatório/válido, até 254 caracteres após normalização. Papel obrigatório, somente MEMBRO/REPRESENTANTE. `FUNDADOR` não é válido mesmo sendo um valor do enum do vínculo. `solicitacaoId` é UUID obrigatório gerado pelo cliente para correlação/idempotência, sem valor de autorização. As três ações PATCH não precisam receber campos de negócio; não aceitar papel, destinatário ou estado arbitrário no corpo.

Associar a solicitação ao emissor autenticado, projeto e conteúdo normalizado. Repetição do mesmo identificador e conteúdo retorna o convite já confirmado, sem criar outro registro ou renovar prazo; reutilização para outro conteúdo/projeto retorna `409 SOLICITACAO_DIVERGENTE`, após a verificação de acesso. A unicidade de emissor/solicitação precisa de constraint e teste concorrente. O GET por solicitação permite recuperar o resultado de POST cuja resposta se perdeu; não depender da ausência do item em uma página da lista. Não enviar o e-mail em query de recuperação nem tratar o UUID como credencial.

`ConviteStartupResponse` seleciona explicitamente: `id`, `startupId`, `nomeStartup`, `nomeConvidante`, `nomeDestinatario`, `papelMembro`, `status`, `criadoEm`, `expiraEm`. Não expor entidades ou adicionar respostas completas do perfil. Criar DTO/mapper próprio.

Listas recebem `pagina` (padrão 0) e `tamanho` (padrão 20, máximo 50); negativos, zero no tamanho e valores acima do limite retornam `400`. Ordenação: criação decrescente e UUID textual crescente para empate. Resposta: `itens`, `pagina`, `tamanho`, `totalItens`, `totalPaginas`. Sem resultados: `200`, itens vazios. As páginas incluem histórico, com estado efetivo de expiração; interface permite distinguir convites pendentes de finalizados.

### Erros e confirmação

- `400`: e-mail, papel, paginação ou corpo inválido.
- `401`: sessão ausente/expirada.
- `403`: papel de conta incorreto, CSRF inválido, ausência do vínculo/permissão necessários; não devolver pendências/dados do recurso.
- `404`: projeto/convite inexistente, convite que não pertence ao projeto informado, ou destinatário indisponível para novo convite. Não expor detalhes de outra conta/projeto.
- `409`: já integrante, convite pendente duplicado, transição incompatível, perda de permissão do emissor no aceite ou conflito com regra de fundador na remoção.
- `410`: convite vencido ao tentar uma ação, ou rota antiga de inclusão direta descontinuada. Repetição de estado final já confirmado segue a idempotência descrita acima.
- `415`: tipo de conteúdo incompatível nas rotas com corpo JSON.

Erro de conflito usa ProblemDetail com código estável, por exemplo `CONVITE_PENDENTE`, `JA_INTEGRANTE`, `CONVITE_INDISPONIVEL`, `CONVITE_FINALIZADO`. Vencimento usa `CONVITE_EXPIRADO`; rota antiga usa `CONVITE_OBRIGATORIO`. Destinatário inexistente ou de outro tipo retorna `404 DESTINATARIO_INDISPONIVEL` com a mesma mensagem genérica. Postman atualizado; frontend ainda será conectado. Ações PATCH usam JSON `{}` ou corpo vazio com Content-Type application/json e rejeitam campos de negócio.

## Persistência, concorrência e remoção

Novo domínio de convite nas camadas startup `api`, `application`, `domain`, `infrastructure`; relações para startup, emissor e destinatário, papel/estado textuais, instantes obrigatórios. `Startup` continua 1:N `MembroStartup`; não adicionar array direto de usuários.

Serializar emissão, aceite, cancelamento e inclusão/remoção de vínculos pelo mesmo bloqueio pessimista da startup já usado pelos serviços. Obter a identidade do projeto de um convite sem reutilizar uma entidade lida antes do bloqueio; reconsultar o convite dentro da seção protegida. Validar e persistir vínculo/estado na mesma transação. Testar aceite duplo, cancelamento versus aceite e remoção do gestor versus aceite. Constraint `(startup_id, usuario_id)` continua protegendo a associação final; não depender somente da interface.

A remoção existente preserva pelo menos um integrante e pelo menos um fundador. Esta entrega não muda essa regra, não implementa transferência de fundação e não cria alteração de papel por remover/reinserir FUNDADOR. Integrantes anteriores não são reclassificados.

Hibernate continua responsável pelo schema, sem Flyway. A implementação adiciona a tabela `convite_startup`; antes de integração que dispare deploy, ensaiar em cópia PostgreSQL com dados e vínculos legados, preservando os registros existentes. H2 e um PostgreSQL vazio não substituem esse ensaio. Ensaio local PostgreSQL com cópia populada e dados fictícios descrito no guia 31; sem alteração de banco remoto.

## Interface e separação DEMO/API

- A partir do projeto selecionado, acessar a equipe preservando `startupId` e retorno `?projeto=ID`. Mostrar nome e papel dos integrantes confirmados pela API. Membro tem consulta; gestor tem emissão, cancelamento de convite e remoção com confirmação clara da pessoa/projeto.
- A conta STARTUP terá entrada para convites recebidos, inclusive sem vínculo com aquele projeto. Aceitar/recusar somente pelo contexto da própria conta, com nome do projeto, emissor, papel e vencimento visíveis.
- Convite emitido tem mensagem de convite, sem anunciar integrante adicionado. Após aceite confirmado, reler `/startups/me` e os vínculos antes de oferecer acesso. Nenhum convite publica o perfil, responde o quiz ou muda matching.
- Não renderizar dados/respostas antigas de outra conta, sessão, projeto, página ou convite. Preservar revisão de sessão inclusive no caso sair/entrar na mesma conta. Backend continua sendo a autoridade de permissão.
- Durante envio, bloquear ações concorrentes daquele contexto. Falha de conexão, timeout, `5xx` ou DTO inválido bloqueia novas escritas até GET confirmado; sem retry automático. Recuperar emissão por GET da solicitação, demais ações de convite por GET do convite, aceite também por `/startups/me`, remoção por perfil/vínculos atuais. GET de recuperação do projeto usa o mesmo bloqueio transacional; um `404` de solicitação só permite nova tentativa explícita com o mesmo identificador/conteúdo, preservando a idempotência caso uma requisição atrasada ainda chegue. Leitura vazia de uma página isolada não comprova resultado de escrita cujo item pode estar em outra página.
- Tratar expiração, duplicidade, perda de vínculo/permissão, falta de resultados, carregamento e sessão expirada. Erro não vira sucesso fictício. Não adicionar ações operacionais no modo DEMO sem implementação explícita e separada.
- Preservar a paleta introduzida pela equipe no PR #28; usar variáveis do tema. Validar desktop/360 px, temas, teclado e estados de confirmação/erro, mantendo `<output>` sem papel redundante para avisos de estado.

## Sequência e critérios de entrega

1. **Contrato:** este guia registra as quatro respostas e os contratos propostos. Validar diff/links/exemplo JSON e revisar no PR documental; não alegar implementação.
2. **Backend:** persistência, ciclo completo, autorização, descontinuação do caminho direto, concorrência, datas, paginação e testes. Atualizar matriz de segurança e Postman, deixando rotas não implementadas em PENDENTE até estarem disponíveis. Executar Maven/Checkstyle e Quality Gate do SHA enviado.
3. **Pré-deploy:** ensaio em cópia PostgreSQL legada antes de merge/deploy do schema; respeitar a ausência de autorização para dados remotos.
4. **Frontend:** equipe e convites recebidos com sessão/CSRF e contratos reais; testes de conta/projeto/resultado incerto e fluxo pelo navegador → API → banco → resposta. Lint, cobertura e builds DEMO/API, com Quality Gate do SHA enviado.

Etapa 4 somente estará concluída depois da implementação e validação do fluxo: emitir convite → destinatário entra e consulta → aceita → novo vínculo aparece → permissões do papel são respeitadas → remoção/revogação impede novo acesso. Incluir recusa, cancelamento, vencimento exato, reenvio com novo UUID, conta/tipo incorretos, duplicidade, CSRF, novo login e concorrência. Incluir regressões do único fundador, publicação e seleção de projetos.

Não antecipar descoberta/matching nem migração JWT/Vercel ao implementar integrantes. A sequência principal permanece no [guia 27](27-startup-next-sessions.md); decisão de matching no [guia 29](29-matching-rule-decisions.md).

Consulta legada de perfil/listagem também foi restringida nesta implementação: GET por ID exige vínculo atual STARTUP e GET geral retorna somente projetos da própria conta. Isso impede contornar a privacidade anterior ao aceite pela API antiga; descoberta permanece futura.
