# Contrato de publicação da startup

Definido na etapa 1 em 30/10/2026, a partir da main `52055a0`, após a homologação local e integração do PR #23. **Este documento especifica a próxima implementação; os endpoints e campos novos abaixo ainda não estão disponíveis.** Não houve mudança de código, schema ou dados remotos nesta etapa.

## Decisões e alcance

O usuário confirmou em 30/10:

1. Publicar exige os dados obrigatórios do cadastro **e o questionário v3 completo e salvo** para aquela startup.
2. Deve ser possível voltar manualmente a `RASCUNHO`, além de publicar, pausar e retomar, como já ocorre no perfil de mentor.

As demais definições preservam os contratos atuais de validação, sessão/CSRF e autorização. A publicação habilita elegibilidade para a descoberta quando ela for implementada; esta entrega não cria catálogo, cálculo de matching, conexão ou reunião.

## Estado e transições

Criar `StatusPerfilStartup` com `RASCUNHO`, `PUBLICADO` e `PAUSADO`, persistidos como texto em `Startup.status`. Novos registros e registros anteriores recebem `RASCUNHO`. O campo é separado de `statusValidacao` (`APENAS_IDEIA/PESQUISA_MERCADO`) e dos momentos do questionário. Uma ideia inicial pode ser publicada se cumprir os requisitos; não exigir pesquisa de mercado ou validação comercial adicional.

| Estado | Significado |
| --- | --- |
| `RASCUNHO` | Perfil em preparação, fora da descoberta e das recomendações futuras. |
| `PUBLICADO` | Gestor autorizou a participação; somente perfis publicados e aptos serão elegíveis quando existir descoberta real. |
| `PAUSADO` | Gestor escolheu manter o perfil fora da descoberta, preservando conta, integrantes, dados e respostas. |

O endpoint recebe um estado de destino, seguindo o padrão de mentor. Todas as transições entre os três estados são aceitas para um gestor atual; o destino `PUBLICADO` sempre exige aptidão. Isso inclui uma solicitação repetida de `PUBLICADO`: revalidar os requisitos, sem confiar na consulta anterior. Destinos `RASCUNHO` e `PAUSADO` não exigem questionário completo, pois retiram/mantêm o perfil fora da descoberta.

| Origem | Destino `RASCUNHO` | Destino `PUBLICADO` | Destino `PAUSADO` |
| --- | --- | --- | --- |
| `RASCUNHO` | `200`, sem alteração | `200` se apta; senão `409` | `200` |
| `PUBLICADO` | `200` | `200` se apta; senão `409` | `200` |
| `PAUSADO` | `200` | `200` se apta; senão `409` | `200`, sem alteração |

Repetir o destino não cria outro evento de domínio ou recurso. A autorização e as verificações de publicação continuam obrigatórias em toda chamada. Não há histórico de publicação ou data de primeira publicação no escopo desta etapa.

## Requisitos de aptidão

| Origem dos dados | Verificação |
| --- | --- |
| Perfil da startup | `nomeProvisorio`, `pitchCurto`, `problemaCentral`, `solucaoProposta`, `publicoAlvo` e `modeloDeNegocio` não nulos nem em branco; limites do cadastro: quatro textos de até 255 e problema/solução de até 5.000 caracteres. |
| Momento declarado | `statusValidacao` preenchido com um dos valores existentes, sem conversão a partir do quiz. |
| Questionário da startup selecionada | Registro persistido com versão `damatch-profile-v3`, tipo `STARTUP` e respostas válidas conforme [guia 25](25-questionnaire-api.md). Respostas de outro projeto, do mentor ou só em memória no navegador não contam. |

Reutilizar a regra atual de validação de `PerfilMatch` para verificar os dados persistidos. Não criar outra lista de critérios no frontend. Agenda, modalidade/cidade, frequência, quantidades, exclusividades e ordem de prioridade seguem o contrato v3.

`DISCOVERING` como setor e `UNKNOWN` como público são respostas válidas quando usadas de forma exclusiva conforme o v3; elas não significam questionário incompleto. `projectName` continua opcional e limitado a 60, sem substituir o nome real. Cidade só é obrigatória no formato presencial. Campos exclusivos de mentor não se tornam requisitos da startup.

Integrantes continuam sujeitos às invariantes existentes: sem duplicatas, com fundador e sem remoção do único fundador. Não acrescentar requisitos de foto, logo, CNPJ, redes sociais, contato público, número adicional de integrantes ou verificação de e-mail.

### Salvar e editar

- Cadastro, PATCH de perfil e PUT de questionário não publicam, pausam nem retomam implicitamente.
- Edição válida de perfil/questionário preserva o estado atual, inclusive `PUBLICADO`.
- Entrada inválida é rejeitada atomicamente com `400`, preservando dados anteriores e estado. Não salvar uma versão incompleta e depois despublicar silenciosamente.
- Para um perfil `PUBLICADO`, avaliar o resultado completo da edição antes de persistir; se a alteração retirar um requisito de publicação, rejeitar a edição com `400` e preservar o registro anterior. Não basta validar isoladamente os campos presentes no PATCH.
- O PUT de questionário atual já exige respostas completas; não criar salvamento parcial de quiz nesta entrega. A startup pode continuar em rascunho antes de ter qualquer questionário salvo.
- Se dados legados incompatíveis forem encontrados, a consulta informa pendências e a publicação retorna `409`. GET não corrige dados nem muda estado. A descoberta futura deverá exigir `PUBLICADO` e aptidão atual, sem presumir que o estado sozinho prova integridade de dados legados.

## Acesso e concorrência

| Operação | Autorização |
| --- | --- |
| Consultar estado e pendências | Sessão `STARTUP` com vínculo atual de qualquer papel na startup selecionada. |
| Alterar estado | Sessão `STARTUP`, CSRF e vínculo atual `FUNDADOR` ou `REPRESENTANTE`. |

ADMIN não tem exceção; MENTOR e STARTUP sem vínculo são negados. O ator vem do principal autenticado, nunca do request. Uma pessoa pode ter múltiplos projetos; estado e aptidão pertencem a cada projeto.

No serviço, obter a startup sob o bloqueio transacional já usado por PATCH, questionário e integrantes, conferir vínculo atual e calcular aptidão antes de alterar o estado. Não reutilizar pendências ou permissões enviadas pelo cliente. Isso serializa as escritas relevantes, mas não introduz controle otimista para formulários antigos.

## Contrato HTTP a implementar na etapa 2

| Rota proposta | Resultado |
| --- | --- |
| `GET /api/v1/startups/{startupId}/status` | `200` com `PublicacaoStartupResponse`, inclusive quando ainda não existe questionário; `401/403/404` conforme sessão, vínculo e existência. |
| `PATCH /api/v1/startups/{startupId}/status` | JSON `AtualizarStatusPerfilStartupRequest` com somente `status`; `200` com a mesma resposta confirmada, `400` para payload inválido, `409` quando o destino é `PUBLICADO` e há pendências; demais erros `401/403/404`. Exige CSRF. |

Usar nomes explícitos em `@PathVariable("startupId")`. `StartupResponse` ganhará apenas o campo `status` com o enum textual, para os contratos existentes de criação, consulta e edição. O PATCH antigo do perfil continua restrito aos sete campos atuais; nenhum campo de onboarding pode impor estado inicial diferente de `RASCUNHO`.

O novo GET retorna pendências apenas a integrantes autorizados. Não acrescentar pendências/respostas do questionário à listagem geral de startups, que hoje pode ser consultada por outras contas autenticadas. Essa listagem mantém seu contrato e ainda pode retornar projetos em rascunho/pausados; ela não passa a ser um catálogo de descoberta filtrado por publicação. A política de descoberta será tratada na etapa 5.

Exemplo ilustrativo, startup em rascunho sem questionário:

```json
{
  "startupId": "00000000-0000-4000-8000-000000000001",
  "status": "RASCUNHO",
  "aptoParaPublicacao": false,
  "podeGerenciar": true,
  "pendencias": [
    {
      "codigo": "QUESTIONARIO_AUSENTE",
      "campo": "perfilMatch",
      "mensagem": "Preencha e salve o questionário desta startup."
    }
  ]
}
```

`aptoParaPublicacao` representa a integridade dos dados, independentemente do papel do leitor ou do estado atual. Um membro comum pode receber `true` e `podeGerenciar: false`; isso não concede escrita. Sem pendências, a lista é `[]`. `podeGerenciar` é calculado para a conta da sessão e serve à apresentação; o serviço sempre revalida o vínculo no PATCH.

Publicar/retomar:

```json
{ "status": "PUBLICADO" }
```

Pausar ou voltar a rascunho usa, respectivamente, `PAUSADO` ou `RASCUNHO`. Não aceitar estado desconhecido, ausente ou nulo. JSON inválido é `400`; tipo de mídia inadequado segue `415` e o tratamento comum da API. Não aceitar flags de aptidão, identificação do ator ou pendências como entrada confiável.

### Pendências e conflito de publicação

| Código estável | Campo | Quando retornar |
| --- | --- | --- |
| `CAMPO_OBRIGATORIO` | Nome real do campo do perfil | Campo obrigatório nulo/em branco. |
| `CAMPO_INVALIDO` | Nome real do campo do perfil | Limite ou valor inválido em dados legados. |
| `QUESTIONARIO_AUSENTE` | `perfilMatch` | Nenhum questionário persistido para a startup. |
| `QUESTIONARIO_INCOMPATIVEL` | `perfilMatch` | Versão/tipo não compatível com `damatch-profile-v3`/STARTUP. |
| `QUESTIONARIO_INVALIDO` | `perfilMatch` | Registro existente não satisfaz as regras atuais do v3. |

Ordem determinística: campos na ordem do cadastro (nome, pitch, problema, solução, público, modelo, `statusValidacao`), depois questionário. Um único motivo por campo; no questionário, priorizar ausência, incompatibilidade e, por fim, invalidade. Mensagens são orientações fixas, sem ecoar entrada, exceções ou dados de outro perfil. Códigos/campos são o contrato do cliente; a redação não deve comandar a lógica.

O `409` segue `ProblemDetail` do projeto, com as extensões específicas `codigo` e `pendencias`. Criar tratamento de conflito específico, preservando os demais handlers genéricos. Exemplo ilustrativo:

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "A startup possui pendências para publicação.",
  "codigo": "STARTUP_INCOMPLETA",
  "pendencias": [
    {
      "codigo": "QUESTIONARIO_AUSENTE",
      "campo": "perfilMatch",
      "mensagem": "Preencha e salve o questionário desta startup."
    }
  ]
}
```

Rejeição preserva o estado anterior. Não devolver uma entidade JPA, respostas completas do quiz, contas, e-mails, credenciais ou nota de matching. Erros de acesso mantêm as mensagens genéricas atuais, sem pendências de recursos não autorizados.

## Comportamento esperado da interface — etapa 3

Mostrar estado confirmado, pendências e permissão no projeto selecionado. Rascunho oferece publicar; publicado oferece pausar/voltar a rascunho; pausado oferece retomar/voltar a rascunho. Desabilitar publicar/retomar enquanto não apto, sem retirar as orientações para corrigir pendências. A API ainda verifica o requisito se um cliente tentar contornar a interface. Membro consulta, sem ações de gestão.

Depois de salvar perfil ou quiz, consultar novamente o estado/aptidão quando necessário antes de apresentar as ações. Uma atualização atrasada de outra conta/projeto não pode substituir o contexto atual. Não enviar novo PATCH com base em resposta antiga após troca de projeto.

Durante envio, bloquear ações concorrentes. Não repetir escrita automaticamente. `400/409` exibem orientação e preservam o estado confirmado; `401/403/404` seguem os padrões atuais. Falha de conexão, timeout, `5xx` ou resposta inválida exige GET válido de confirmação antes de permitir nova escrita. O bloqueio deve abranger edição e publicação do projeto naquela tela; a recuperação pode consultar também o perfil quando necessário para descartar dados antigos.

Manter DEMO separado da API. Nenhuma falha pode virar publicação fictícia. No modo API, ausência/invalidade do campo novo é incompatibilidade a tratar, não permissão para presumir `PUBLICADO`. Implementar backend antes de conectar o frontend.

## Persistência, implantação e critérios de entrega

Etapa 2: adicionar enum textual, inicializador Java e default SQL `RASCUNHO` (`@ColumnDefault("'RASCUNHO'")`), preservando `statusValidacao` textual. Hibernate continua responsável pelo schema; não reintroduzir migrations/Flyway. Startup antiga sem quiz fica `RASCUNHO` e com pendência, sem respostas inventadas.

Testar criação e tabela populada antes da coluna nova; validar em cópia PostgreSQL com backup antes do deploy que altera schema. Este contrato documental não autoriza alteração de banco remoto nem deploy antecipado.

Testes obrigatórios da implementação:

- Cadastro e registros legados em RASCUNHO; enum/default textual e preservação de registros.
- Consulta com/sem quiz, códigos/ordem das pendências e nenhum vazamento de dados.
- Publicar/retomar somente com perfil e quiz válido da startup correta; quiz de outro projeto não satisfaz requisitos; `projectName` vazio e opções exclusivas válidas continuam aceitos.
- Todas as transições/repetições da matriz, sem publicação implícita; edição válida mantém estado e inválida mantém dados/estado.
- Sessão, CSRF real, membro/intruso/MENTOR/ADMIN, vínculo de gestão revogado e múltiplos projetos.
- Aptidão e autorização recalculadas sob o mesmo bloqueio usado pelas outras escritas relevantes.
- HTTP `400/401/403/404/409/415`, corpo de conflito específico e DTOs sem segredos/entidades.
- Frontend: estados, permissões, troca de conta/projeto, resposta antiga, `409`, resultado incerto/GET de confirmação, recarga e novo login; desktop/mobile e teclado.

Atualizar Postman na implementação, mantendo as rotas em `PENDENTE` até existirem. Executar backend/Checkstyle, lint, cobertura e builds relevantes, conferir gates do commit e registrar a homologação no [guia 27](27-startup-next-sessions.md). A etapa 1 termina com este contrato; as etapas 2 e 3 continuam sem implementação.
