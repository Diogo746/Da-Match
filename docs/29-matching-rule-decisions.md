# Regra de matching de mentoria — damatch-mentoria-v1

**Definida pelo usuário em 30/10/2026, após 13 respostas em quatro blocos.** Esta é a especificação para a futura etapa 6 do [roteiro](27-startup-next-sessions.md); o algoritmo do backend ainda não foi implementado. A definição antecipada não muda a ordem das entregas de código.

Esta decisão usa o questionário persistido `damatch-profile-v3` do [guia 25](25-questionnaire-api.md). O [guia 16](16-decisao-regra-matching.md) preserva as propostas anteriores; o protótipo `damatch-rules-v2` não é uma decisão automática sobre a regra do servidor. Respostas abaixo foram dadas pelo usuário; não atribuir aprovação separada do PO/time sem registro.

## O que já está definido no projeto

- Primeiro fluxo: startup em ideação e mentor, com recomendações nos dois sentidos. Investidores pertencem a outra entrega.
- Cálculo no backend, usando os dados persistidos e autorização da sessão. A nota enviada pelo cliente não é confiável.
- Participante recebe indicações ordenadas e o selo `superDamatch` a partir de 95; não recebe porcentagem nem detalhamento numérico. Dados completos são restritos à equipe autorizada.
- Publicação, aptidão atual e recebimento de novas mentorias fazem parte da elegibilidade; um questionário válido não publica o perfil. Uma indicação não cria interesse, conexão ou reserva.

## Bloco 1 — Condições para receber indicação

Respostas confirmadas pelo usuário em 30/10/2026:

| Pergunta | Decisão |
| --- | --- |
| 1. Quais necessidades o mentor deve atender? | Pelo menos uma necessidade da startup; a principal tem maior peso que a secundária. |
| 2. Ausência de dia/período em comum exclui o par? | **Não.** O par pode ser indicado; perde os 10 pontos de agenda, conforme o bloco 2. |
| 3. Frequências fixas diferentes permitem indicação? | **Não.** Excluir quando ambas forem fixas e diferentes; aceitar quando houver a mesma frequência ou alguma opção `FLEXIBLE`. |

Consequência: a agenda deixa de ser um filtro obrigatório como no protótipo. Não reutilizar seu bloqueio de agenda no backend. Frequência continua sendo filtro. Modalidade/cidade seguem a exigência de um encontro possível do contrato atual; os detalhes devem aparecer na consolidação final.

Uma janela de agenda significa o par exato de dia e período. Não cruzar os dias de um período com os períodos de outro dia. A indicação sem janela comum não garante possibilidade de agendamento imediato; a orientação da interface deverá deixar isso claro quando houver o fluxo real.

## Bloco 2 — Pesos e experiência

Respostas confirmadas pelo usuário em 30/10/2026:

| Pergunta | Decisão |
| --- | --- |
| 4. Distribuição de 100 pontos | Necessidades 50; setor 15; momento da ideia 10; público 10; agenda 10; formação complementar 5. |
| 5. Divisão de necessidades | Com duas: 70% do peso para a principal (35 pontos) e 30% para a secundária (15). Com uma única necessidade, ela pode receber os 50 pontos. |
| 6. Experiência por assunto | `PRACTICAL` recebe 100% dos pontos do assunto; `KNOWLEDGE` recebe 70%. Sem correspondência de assunto: zero. |

Um ou mais pares de agenda em comum rendem 10 pontos; nenhum rende zero, sem excluir o par. Frequência é filtro, não recebe outra pontuação. Os pesos são uma decisão do produto, não uma probabilidade estatística de sucesso.

Consequências aritméticas: com duas necessidades, conhecimento vale 24,5 na principal e 10,5 na secundária; com apenas uma, conhecimento vale 35. Prática vale, respectivamente, 35, 15 e 50.

## Bloco 3 — Correspondências e exceções

Respostas confirmadas pelo usuário em 30/10/2026:

| Pergunta | Decisão |
| --- | --- |
| 7. Setor | Uma área específica em comum rende 15 pontos, independentemente de haver uma ou duas áreas na startup. Mentor `GENERAL` rende 7,5. Setor diferente rende zero, sem excluir. |
| 8. Setor/público ainda em descoberta | `DISCOVERING` e `UNKNOWN` rendem zero no respectivo critério, sem excluir, sem redistribuir peso nem recalcular o restante para 100. |
| 9. Público | Pelo menos um público em comum rende os 10 pontos. Sem interseção: zero. Não dividir proporcionalmente ao número de públicos. |
| 10. Formação complementar | Dar 5 se houver pelo menos uma área específica do mentor ausente das áreas do time; caso contrário, zero. Ignorar `OTHER` e `STUDENT`. Exigir alguma área específica em ambos os lados para fazer essa comparação; se não houver, zero. |

Em setor, `DISCOVERING` da startup tem precedência: rende zero mesmo diante de mentor `GENERAL`. Não tratar respostas em descoberta como quiz inválido nem presumir compatibilidade. A descrição de formação expressa a comparação das áreas autodeclaradas, sem certificar competências.

## Bloco 4 — Corte, ordenação e capacidade

Respostas confirmadas pelo usuário em 30/10/2026:

| Pergunta | Decisão |
| --- | --- |
| 11. Nota mínima | **60 de 100**, inclusive. Abaixo disso não aparece. Se ninguém atingir o mínimo, mostrar lista vazia e orientação; não baixar o corte automaticamente. |
| 12. Desempate | Maior número de necessidades atendidas; depois maior número dessas necessidades com experiência prática; depois existência de agenda em comum; por fim identificador do perfil recomendado, para ordem estável. |
| 13. Capacidade | Informativa nesta primeira versão. Não contar nem reservar acompanhamentos automaticamente; receber indicações exige publicação/elegibilidade e `accepting=true`. Limite automático será definido junto à gestão das mentorias. |

`ONE`, `FEW` e `MANY` não viram limites arbitrários de 1/3/4: `MANY` significa quatro ou mais, sem teto exato. Uma indicação, interesse ou conexão não pode consumir uma vaga por suposição.

## Especificação consolidada

### Elegibilidade antes da nota

1. Par startup/mentor com perfis publicados, dados obrigatórios válidos e questionários v3 persistidos e válidos. Verificar aptidão atual, não apenas o estado de publicação. `accepting` do mentor precisa ser verdadeiro.
2. Pelo menos uma necessidade da startup aparece nos assuntos do mentor. Conhecimento ou prática satisfazem essa correspondência; a experiência muda os pontos, não esse filtro.
3. Modalidade compatível: se ambos aceitam online, permitir independentemente da cidade. Caso contrário, exigir que ambos aceitem presencial e tenham a mesma cidade preenchida. `AMBOS` aceita os dois formatos; cidade ausente não cria compatibilidade presencial.
4. Frequências iguais ou ao menos uma `FLEXIBLE`. Duas frequências fixas diferentes excluem antes da nota.

Não acrescentar filtros de mesmo setor, mesmo momento, mesmo público, formação ou agenda em comum. Não usar `statusValidacao` no lugar do momento do questionário. Um perfil com quiz ausente/inválido fica fora; setor/público em descoberta continua válido e pontua conforme as regras acima.

### Fórmula

Para cada necessidade selecionada pela startup, usar o fator `1` se o mentor declara `PRACTICAL`, `0,7` se declara `KNOWLEDGE` e `0` se não oferece o assunto. Com duas necessidades, manter a ordem persistida: a primeira é principal.

```text
Uma necessidade: necessidades = 50 × fator(principal)
Duas necessidades: necessidades = 35 × fator(principal) + 15 × fator(secundária)

nota = necessidades + setor + momento + público + agenda + formação
```

| Critério | Regra exata |
| --- | --- |
| Necessidades | Fórmula acima, máximo 50. Não redistribuir os pontos de um assunto não atendido. |
| Setor | Startup `DISCOVERING`: 0; senão, alguma área em comum: 15; senão, mentor `GENERAL`: 7,5; demais: 0. |
| Momento | O momento único da startup está entre os momentos atendidos pelo mentor: 10; senão: 0. |
| Público | Startup `UNKNOWN`: 0; senão, alguma interseção de públicos: 10; sem interseção: 0. |
| Agenda | Existe pelo menos um par exato dia/período em comum: 10; senão: 0. Mais pares não somam pontos extras. |
| Formação | Remover `OTHER`/`STUDENT` dos dois conjuntos. Se ambos restantes forem não vazios e existir área do mentor fora do conjunto do time: 5; senão: 0. |

O denominador permanece 100. Com estes pesos e fatores, as notas são múltiplos de 0,5; usar representação decimal exata, sem erro de ponto flutuante. Comparar a nota sem arredondar para corte, ordenação e selo. Formatação do relatório interno não muda o resultado.

### Resultado e ordem

- Somente pares elegíveis com nota **maior ou igual a 60** entram nas indicações. Sem candidatos, lista vazia; não preencher com dados DEMO, pares inelegíveis ou abaixo do corte.
- Ordenar pela tupla: nota decrescente; quantidade de necessidades atendidas decrescente; quantidade delas com prática decrescente; agenda em comum primeiro; UUID do perfil recomendado em representação textual canônica crescente. O UUID final é escolha técnica de estabilidade; não usar ordem do banco nem aleatoriedade.
- Manter o limite atual de até 20 indicações da US-16, aplicado após filtros e ordenação. O contrato HTTP/paginação será detalhado na etapa 6, sem filtrar apenas uma página arbitrária antes do cálculo.
- `superDamatch=true` somente para indicação elegível com nota **maior ou igual a 95**. Comparação inclusiva; nenhum número ou detalhamento numérico vai ao participante, inclusive em JSON ou mensagens de erro.
- Mesmo par e mesma revisão de dados produzem a mesma nota/selo, consultado pela startup ou pelo mentor. O desempate final usa o identificador do candidato da lista em questão.
- Versão normativa: `damatch-mentoria-v1`, distinta de `damatch-profile-v3` (perguntas) e de `damatch-rules-v2` (demonstração). Data/versão do cálculo e revisões de origem devem permitir rastreabilidade interna.

### Atualização, acesso e reuniões

Recalcular com os dados atuais ao consultar após edição de qualquer lado, incluindo quiz/agenda compartilhada, publicação, pausa ou `accepting`. A implementação deve impedir resultado de revisão/conta/projeto anterior e não reaproveitar cálculo quando os dados relevantes mudarem. Uma conta com vários projetos recebe resultados para o projeto selecionado e autorizado; não misturar respostas.

Definir DTO de participante e relatório administrativo separados. Nota e contribuições por critério ficam somente no relatório da equipe autorizada; não basta esconder números no HTML. Sessão/CSRF e autorização por recurso seguem os contratos existentes. A matriz e as rotas novas serão fechadas na etapa de implementação; este documento não apresenta endpoints inexistentes como disponíveis.

Uma indicação sem agenda comum deve explicar que os horários ainda precisam ser combinados, sem mostrar a nota. Reunião exige dia/hora exatos e confirmação futura; períodos do quiz não são reservas. A capacidade declarada não autoriza aceitar agendamento incompatível nem pressupõe controle de vagas já implementado.

## Casos de referência para implementação

Nos exemplos pontuados, assumir elegibilidade, duas necessidades salvo indicação contrária e 50 pontos nos demais critérios quando estiverem todos atendidos. Cada linha descreve suas diferenças; valores são internos à equipe.

| Caso | Necessidades | Setor | Momento | Público | Agenda | Formação | Total | Resultado |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Duas necessidades com prática; demais completos | 50 | 15 | 10 | 10 | 10 | 5 | 100 | Indica com Super DaMatch |
| Mesmo par, sem formação complementar | 50 | 15 | 10 | 10 | 10 | 0 | 95 | Indica com Super DaMatch |
| Mesmo par, sem agenda comum | 50 | 15 | 10 | 10 | 0 | 5 | 90 | Indica sem selo; orientar horários |
| Mesmo par, mentor de atuação geral | 50 | 7,5 | 10 | 10 | 10 | 5 | 92,5 | Indica sem selo |
| Mesmo par, setor em descoberta | 50 | 0 | 10 | 10 | 10 | 5 | 85 | Indica sem selo |
| Mesmo par, público desconhecido | 50 | 15 | 10 | 0 | 10 | 5 | 90 | Indica sem selo |
| Só necessidade principal atendida com prática | 35 | 15 | 10 | 10 | 10 | 5 | 85 | Indica sem selo |
| Só necessidade secundária atendida com prática | 15 | 15 | 10 | 10 | 10 | 5 | 65 | Indica sem selo |
| Só secundária atendida com conhecimento | 10,5 | 15 | 10 | 10 | 10 | 5 | 60,5 | Indica sem selo |
| Principal com conhecimento e secundária com prática | 39,5 | 15 | 10 | 10 | 10 | 5 | 89,5 | Indica sem selo |
| Principal com prática e secundária com conhecimento | 45,5 | 15 | 10 | 10 | 10 | 5 | 95,5 | Indica com Super DaMatch |
| Uma única necessidade, com conhecimento | 35 | 15 | 10 | 10 | 10 | 5 | 85 | Indica sem selo |
| Fronteira do corte: principal com prática | 35 | 15 | 10 | 0 | 0 | 0 | 60 | Indica sem selo |
| Principal com conhecimento, secundária com prática; só momento/agenda em comum | 39,5 | 0 | 10 | 0 | 10 | 0 | 59,5 | Não indica |

Também exigir cenários sem pontuar: nenhum assunto em comum; modalidade incompatível; presencial sem cidade comum; frequência fixa diferente; mentor pausado/rascunho/não recebendo; quiz ausente/inválido. Nos empates, testar cada nível e repetição da mesma consulta. Cobrir `DISCOVERING` com `GENERAL` (zero de setor), ambos os desconhecidos (teto 75), vários setores/públicos, `OTHER`/`STUDENT`, um ou vários pares de agenda e isolamento entre projetos/contas.

Consequências da regra: sem agenda o máximo é 90; com setor desconhecido, 85; com público desconhecido, 90; com ambos desconhecidos, 75; mentor de atuação geral chega a 92,5. Esses casos podem superar o corte, mas não chegam ao selo 95. O teto não é recalculado para 100.

## Entrega desta decisão e próximos passos

Questionário e especificação concluídos; implementar e validar na etapa 6, após publicação/frontend/integrantes/descoberta. Atualizar a próxima revisão formal do SRS com esta decisão, preservando o PDF anterior como histórico. O guia 16 e US-16/18/19 apontam para esta regra. O demonstrativo do frontend continua com sua versão experimental até uma entrega própria; não alegar que já executa esta fórmula. Não houve mudança de algoritmo, API, schema, banco remoto ou deploy nesta definição.

Validação documental em 30/10: soma dos pesos igual a 100; fatores de experiência e 14 totais/exemplos conferidos com aritmética decimal exata; links relativos novos conferidos; `git diff --check` aprovado. Script e relatório locais ignorados em `backend/target/check-matching-decision.py` e `matching-decision-check.json`. Essa verificação dos exemplos não é teste de uma implementação de matching; suites de aplicação não foram repetidas porque esta entrega altera somente documentação.
