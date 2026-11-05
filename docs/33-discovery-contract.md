# Descoberta real — contrato da primeira versão

Decisões confirmadas pelo usuário em 05/11/2026. Contrato integrado pelo [PR #32](https://github.com/Diogo746/Da-Match/pull/32) na main `c34edc6`, CI pós-merge #110 aprovada. Este documento define a etapa 5 do [roteiro](27-startup-next-sessions.md). **Backend integrado pelo PR #33 na main `5b2207e`, CI pós-merge #113 aprovada. Interface real implementada/validada localmente em `codex/discovery-ui`, aguardando CI/revisão/integração ([guia 35](35-discovery-ui-validation.md)).** Evidências e limite de volume no [guia 34](34-discovery-api-validation.md); CI não substitui homologação funcional publicada.

## Decisões e escopo

| Tema | Decisão |
| --- | --- |
| Acesso | Somente participantes STARTUP e MENTOR autenticados; visitantes não consultam o catálogo real. |
| Elegibilidade do perfil encontrado | PUBLICADO, cadastro válido e questionário v3 completo e válido. Mentor também exige `accepting=true`. |
| Apresentação da startup | Nome real e resumo (`nomeProvisorio`/`pitchCurto`), setores, cidade/modalidade e temas de ajuda. Problema, solução, público-alvo e modelo de negócio completos ficam privados. |
| Privacidade | Integrantes, e-mail de login, contatos e agenda semanal exata não entram na resposta de descoberta. Mentor mostra nome, biografia e os campos gerais definidos abaixo. |

Preservar a direção já definida pela RN12/US-12/13: **STARTUP pesquisa MENTOR; MENTOR pesquisa STARTUP**. O catálogo não terá abas Todos/Mentores/Startups disponíveis indistintamente no modo API. ADMIN não ganha exceção; investidores permanecem fora desta entrega. A escolha do tipo do ator vem da sessão, nunca de parâmetro enviado pelo cliente.

Consultar não depende de o próprio leitor ter um perfil publicado, quiz completo ou vínculo com uma startup. Essas condições são exigidas do perfil encontrado. Não criar vínculo, interesse, conexão, mentoria, reserva ou publicação ao pesquisar/abrir um resultado.

Catálogo e recomendação são casos diferentes. Nesta etapa não calcular nota, verificar compatibilidade do par, ordenar por match nem apresentar selo Super DaMatch. O [guia 29](29-matching-rule-decisions.md) continua normativo para a futura etapa 6.

## Revisão da base e fontes

- [US-12, US-13 e US-15](04-user-stories.md) definem pesquisa, direção entre papéis e contato protegido. A revisão atual do SRS/PDF deve preservar o documento antigo como histórico.
- `StartupResponse` contém integrantes e textos privados; `MentorResponse` contém e-mail, links e agenda. Nenhum deles pode ser usado como DTO de descoberta. As consultas de gestão continuam privadas e com as permissões atuais.
- `PerfilMatchResponse` também não é DTO de descoberta: traz agenda, frequência, formação, públicos e outras respostas além do recorte aprovado.
- Startup já possui avaliação de cadastro/quiz no `AptidaoPublicacaoStartupService`; publicação e `statusValidacao` são informações independentes. Reutilizar regras de validade sem expor suas pendências ao leitor do catálogo.
- Mentor hoje pode mudar o status para PUBLICADO sem exigir quiz. Não interpretar esse estado isolado como elegibilidade. Esta entrega não muda implicitamente o contrato de PATCH de publicação do mentor: um publicado incompleto fica fora do catálogo, com orientação na própria tela para completar os requisitos.
- **Agenda de mentor tem fonte única em `disponibilidade_mentor`.** `PerfilMatchService.salvarMentor` limpa a agenda duplicada do quiz após gravar a agenda do mentor. A elegibilidade precisa validar uma cópia do perfil com os pares atuais convertidos dessa fonte; chamar `validar(MENTOR)` diretamente na coleção vazia persistida do quiz excluiria mentores válidos. Não preencher/alterar a entidade gerenciada durante um GET.
- Conta suspensa/desativação não possui fluxo implementado nesta base; não declarar essa proteção como entregue nem criar regras sobre um campo inexistente. Quando houver esse estado, integrar sua elegibilidade em entrega própria.

## Elegibilidade em cada leitura

Para lista e detalhe, verificar os requisitos atuais, sem confiar apenas no estado publicado:

1. Perfil existente e `PUBLICADO`; tipo de conta associado coerente no caso de mentor.
2. Cadastro válido: textos obrigatórios e limites atuais, sem exigir contato opcional para descobrir. Para startup, conservar os sete campos exigidos pelo cadastro/publicação. Para mentor, nome válido e biografia obrigatória de até 1.000 caracteres, além da agenda válida de origem única.
3. Questionário da própria startup/mentor, versão `damatch-profile-v3`, tipo correto e todas as validações do domínio: listas, códigos, exclusividade, experiência por assunto, formato/cidade e pares de agenda.
4. Para mentor, `accepting=true`; capacidade declarada não é convertida em limite de mentorias.

RASCUNHO, PAUSADO, quiz ausente/inválido/de outra versão e cadastro incompatível ficam fora. `DISCOVERING` e `UNKNOWN` são respostas válidas, sem excluir o perfil. O `projectName` opcional do quiz não substitui o nome real do projeto.

Não exigir assunto, setor, público, frequência ou horário em comum entre leitor e resultado; não aplicar corte de 60 nem selo de 95 ao catálogo. Os filtros explícitos abaixo restringem a pesquisa e não calculam compatibilidade.

Pausar, retirar publicação, invalidar requisitos ou mudar `accepting` deve afetar a próxima leitura. O detalhe de um item que deixou de ser elegível retorna o mesmo 404 de um item inexistente, sem estado privado/pendências. Não prometer remoção instantânea de texto já renderizado sem nova consulta ou uma infraestrutura de notificações.

## API integrada à main pelo PR #33

Todas as rotas são GET com sessão. Escritas de outros fluxos continuam exigindo CSRF por JSON de `/csrf`; a descoberta não altera o mecanismo atual, cookies HttpOnly ou CORS. Não migrar para JWT nesta etapa.

| Rota | Papel do leitor | Sucesso |
| --- | --- | --- |
| `GET /api/v1/descoberta/mentores` | STARTUP | 200 `PaginaPerfisDescobertaResponse` |
| `GET /api/v1/descoberta/mentores/{mentorId}` | STARTUP | 200 `PerfilDescobertaResponse` |
| `GET /api/v1/descoberta/startups` | MENTOR | 200 `PaginaPerfisDescobertaResponse` |
| `GET /api/v1/descoberta/startups/{startupId}` | MENTOR | 200 `PerfilDescobertaResponse` |

O ID é o identificador do perfil mentor/startup, nunca o ID da conta, do quiz ou do integrante. Não aceitar ator/usuário/projeto leitor como parâmetro de autorização.

### Pesquisa, filtros e ordem

| Parâmetro | Contrato |
| --- | --- |
| `busca` | Opcional, até 100 caracteres após aparar bordas; branco equivale a ausente. Substring literal de nome/apresentação, ignorando caixa e acentos; não pesquisar dados privados. `%`, `_`, aspas e demais caracteres não viram operadores SQL. |
| `setor` | Um código do catálogo v3. Corresponde a um dos setores declarados, não a um rótulo traduzido. `GENERAL` só para mentores; `DISCOVERING` só para startups. |
| `topico` | Um código v3 de tema oferecido pelo mentor ou necessário à startup. Não considerar experiência/nota do leitor. |
| `formato` | `ONLINE`, `PRESENCIAL` ou `AMBOS`. ONLINE inclui ONLINE/AMBOS; PRESENCIAL inclui PRESENCIAL/AMBOS; AMBOS exige a opção AMBOS declarada. |
| `cidade` | Código de cidade do catálogo v3. Igualdade explícita de `cityId`; não inferir endereço/residência nem incluir automaticamente todo perfil online. Rotular na interface como cidade para encontros presenciais. |
| `pagina` | Inteiro a partir de zero; padrão 0. |
| `tamanho` | Inteiro de 1 a 20; padrão 20, conforme US-12. |

Combinar filtros por AND, com uma seleção por parâmetro. Um setor em comum com o filtro basta quando o perfil declara vários. Atuação geral não é incluída automaticamente em todo filtro setorial; o usuário pode consultar sem filtro ou escolher GENERAL. Não adicionar bloqueios por desconhecimento de setor/público.

O escopo desta versão é ideação. Não oferecer filtros de tração/escala/investimento ou converter os quatro momentos do quiz em `statusValidacao`. A futura ampliação de estágios exige contrato próprio; a pesquisa inicial não adiciona um filtro variável de estágio empresarial.

Ordem fixa: nome normalizado sem caixa/acentos, seguido de UUID textual crescente para empate. Não ordenar pela data de entrada, privacidade da conta, nota demonstrativa ou página recebida anteriormente. Aplicar validade/filtros e ordenação **antes** de paginar; contagens também representam apenas os elegíveis filtrados. Uma página além do fim retorna 200 com itens vazios e totais reais.

Parâmetros repetidos, desconhecidos, códigos fora do catálogo, setor incompatível com o tipo, paginação inválida ou UUID malformado retornam 400. Não usar concatenação de SQL, aceitar ordenação arbitrária ou expor critérios de consulta de gestão.

### DTO público para participantes autenticados

`PerfilDescobertaResponse` contém somente:

| Campo | Origem/limite |
| --- | --- |
| `id` | UUID do perfil |
| `tipo` | MENTOR/STARTUP |
| `nome` | Nome da conta do mentor ou `nomeProvisorio` real da startup, até 255 |
| `apresentacao` | Biografia do mentor, até 1.000; `pitchCurto` da startup, até 255 |
| `setores` | Códigos declarados do quiz; lista ordenada, respeitando os limites por tipo |
| `topicos` | Códigos declarados de ajuda; ordem de prioridade da startup preservada |
| `formato` | Código v3 de modalidade |
| `cidadeId` | Código v3 ou string vazia, conforme modalidade e resposta persistida |

Lista e detalhe usam esse mesmo recorte; abrir o detalhe não desbloqueia textos adicionais. O card pode abreviar a apresentação visualmente, mas o detalhe mostra a apresentação inteira permitida. Não retornar e-mail, senha/hash, links de contato, `usuarioId`, integrantes/papéis, agenda exata, frequência, capacidade, mapa de experiência, públicos/formações, respostas completas, datas de atividade, pendências, notas, contribuições ou `superDamatch`.

Os campos estruturados de contato ficam privados. Nome/apresentação são textos escritos pelo próprio autor e podem conter contato que ele inseriu; esta política não equivale a anonimizar texto livre. Informar ao autor quais campos aparecem para outros participantes; não implementar censura por regex ou prometer anonimização completa.

Exemplo de lista (dados fictícios):

```json
{
  "itens": [
    {
      "id": "cbbde424-9a85-4624-98db-1dcb477f11db",
      "tipo": "MENTOR",
      "nome": "Pessoa Mentora Fictícia",
      "apresentacao": "Ajudo projetos em ideação a organizar as primeiras validações.",
      "setores": ["TECH"],
      "topicos": ["VALIDATION", "BUSINESS"],
      "formato": "ONLINE",
      "cidadeId": ""
    }
  ],
  "pagina": 0,
  "tamanho": 20,
  "totalItens": 1,
  "totalPaginas": 1
}
```

Exemplo sem resultados:

```json
{
  "itens": [],
  "pagina": 0,
  "tamanho": 20,
  "totalItens": 0,
  "totalPaginas": 0
}
```

### Erros e cache

- 401: sessão ausente/expirada. 403: papel não permitido, inclusive ADMIN e consulta ao mesmo tipo. Verificar acesso antes de procurar o perfil solicitado.
- 400: parâmetros/ID inválidos. 404: inexistente ou atualmente inelegível, sem distinguir o motivo privado. Falhas de infraestrutura continuam erro, nunca lista vazia fictícia.
- Respostas de descoberta não devem ir para cache compartilhado: `Cache-Control: private, no-store`. Não gravar payloads/dados de terceiros em armazenamento persistente do navegador nesta entrega.

## Backend e banco

Criar domínio de consulta `descoberta` com camadas api/application/domain/infrastructure e DTOs explícitos; não tornar controllers/mappers de gestão públicos. Reusar validações de domínio, preparando uma cópia de validação do mentor com a agenda real. Não persistir alterações durante GET.

Usar consultas de leitura próprias; não remover o bloqueio pessimista das rotas de integrantes, edição, quiz ou publicação para otimizar catálogo. Evitar N+1 e multiplicação de itens por joins de coleções; UUIDs/contagens/páginas não podem duplicar um perfil por setor ou tema. Revalidar os detalhes e conferir contagens em PostgreSQL. Avaliar consultas/volume durante a implementação, sem prometer latência ou paginação correta apenas por testes com poucos registros.

O contrato não exige nova tabela/coluna nem mudanças remotas de banco. Se a implementação demonstrar necessidade de índice/schema, registrar a justificativa e ensaiar em cópia PostgreSQL antes de integração/deploy. Hibernate permanece responsável; sem Flyway. Não presumir autorização para produção.

## Interface API e DEMO

- No modo API, a entrada de descoberta restaura a sessão antes de consultar perfis. Visitante recebe entrada/cadastro; ADMIN recebe orientação para sua conta. Exibir somente o tipo permitido pelo papel atual. Não exigir publicar o próprio perfil para consultar o catálogo.
- Usar exclusivamente respostas reais no modo API. Não consultar `ProfilesStore`/`ProfileSessionStore` demonstrativos como fallback, não executar `calculateMatch` local e não misturar IDs, salvos ou recomendações fictícios com os perfis reais.
- DEMO mantém seu comportamento explícito. Salvos persistidos, interesses/conexões, contatos e matching ficam nas etapas seguintes; não mostrar ações aparentando executar esses fluxos no catálogo API.
- Restaurar filtros/página pela URL, com validação; histórico/recarga preservam a pesquisa da sessão correta. Alterar filtro volta à página zero; consulta normal não altera perfil/quiz. Descartar respostas antigas de conta, revisão da sessão, filtros, página ou detalhe, inclusive sair/entrar na mesma conta. Ao trocar conta, limpar também detalhes e mensagens antigos.
- Reconsultar o detalhe ao abri-lo; se ficar indisponível, retirar dados anteriores e orientar nova busca. Não confundir falta de resultados, carregamento, sessão expirada, falta de acesso e falha de rede. Sem retry infinito nem lista de demonstração substituindo erro.
- Preservar paleta e seleção/retorno dos projetos nas áreas de gestão. Dialog deve suportar teclado, Escape, foco inicial e retorno ao acionador; estado em `<output>` sem papel redundante. Testar 360 px, temas, nomes longos e biografia de 1.000 caracteres.
- Nas telas próprias, explicar que descoberta exige publicação, cadastro e quiz completos; mentor também precisa aceitar novas startups. Não sugerir que o novo catálogo já oferece recomendações personalizadas.

## Critérios de validação e sequência

| Fronteira | Casos obrigatórios na implementação |
| --- | --- |
| Acesso/privacidade | Sem sessão, papel invertido, ADMIN, leitor sem projeto/quiz/publicação, tentativa de trocar ator e IDs; mesma projeção segura em lista/detalhe, sem vazamento dos DTOs de gestão. |
| Elegibilidade | RASCUNHO/PAUSADO, publicado incompleto, quiz ausente/versão errada/inválido, `accepting=false`, perfil válido com setor/público desconhecido; vínculo quiz/perfil correto. |
| Mentor | Agenda do quiz persistida vazia e agenda real preenchida; PATCH antigo refletido; agenda real inválida legada excluída sem gravar nem derrubar todo o catálogo. |
| Consulta | Filtros combinados, formatos AMBOS, código da cidade, busca com acentos/caixa/caracteres SQL literais, códigos incompatíveis, máximos, duplicatas de parâmetros, nomes empatados, vários setores/temas e páginas/contagens sem duplicação. |
| Concorrência/estado | Item pausado/inelegível depois da listagem deixa de ser retornado no detalhe; leitura não altera perfil; respostas antigas não atravessam conta/página/filtro/detalhe. |
| Fluxo real | Publicar perfil completo → outro papel pesquisa → abre detalhe seguro → autor pausa/fecha recebimento → consulta deixa de disponibilizar; novo login/recarga e falhas. Navegador → proxy → Spring → PostgreSQL → interface. |

1. **Contrato integrado:** PR #32/main `c34edc6`, com decisões, exemplos e continuidade. Definição preservada neste guia.
2. **Backend integrado:** PR #33/main `5b2207e`, CI pós-merge #113 aprovada. Implementação, testes e PostgreSQL no guia 34; Postman/matriz de segurança atualizados.
3. **Interface local:** modo API com perfis do banco, DEMO separado, testes de sessão/URL/respostas antigas, lint/cobertura/builds e navegador/PostgreSQL no guia 35. Conferir gate e CI do head, depois revisão/integração.
4. Validar publicado/acessibilidade/rate limit na etapa operacional. Só então considerar descoberta entregue e avançar para a implementação do matching do guia 29, sem repetir suas decisões.
