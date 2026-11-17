# DAMATCH-SRS-001 — adendo de matching para revisão 1.1

Data: 17/11/2026. Estado: proposta de consolidação documental para revisão; não declara nova aprovação formal do professor/PO. Base histórica: [Documentação de Requisitos v1.0](DaMatch-Documentacao-de-Requisitos-v1.0.pdf), 05/10/2026, preservada sem alterações. Escopo deste adendo: decisões de mentoria já aprovadas pelo usuário em 30/10 no [guia 29](29-matching-rule-decisions.md), com contrato/validação no [guia 37](37-mentorship-matching.md).

Estas cláusulas substituem somente os trechos conflitantes de matching de mentoria na v1.0. Demais requisitos permanecem sujeitos ao roteiro de implementação. Investimento, interesses, conexões e reuniões não são declarados implementados por este adendo. O arquivo `02-software-requirements-specification.md` é um modelo genérico legado, não a especificação formal DaMatch.

## Requisitos funcionais revisados

| ID | Redação para revisão 1.1 |
| --- | --- |
| RF16 | Recomendar perfis complementares de mentoria a STARTUP/MENTOR autenticados, com origem e destino publicados, completos e quiz v3 válido; mentor aceitando novas startups. STARTUP consulta por projeto com vínculo atual. Aplicar filtros/cálculo do guia 29 no backend e exibir até 20 pares com nota interna >=60, em ordem determinística. |
| RF18 | Ao participante, mostrar somente ordem e selo Super DaMatch para nota interna >=95, sem nota/contribuições em tela, JSON ou erro. Informar ausência de agenda comum. Relatório numérico por par é exclusivo de ADMIN e separado dos DTOs dos participantes. A antiga exposição da pontuação aos participantes fica substituída. |
| RF19 | Recalcular a cada consulta sobre snapshot consistente dos dados atuais; apresentar data/versão e impedir uso de resposta de conta/projeto anterior. Revalidar ao abrir detalhe após edição, publicação, pausa ou mudança de agenda/recebimento. Relatório interno inclui versões/revisões e dados normativos usados no cálculo. |

## Regras de negócio revisadas/preservadas

| ID | Redação para revisão 1.1 |
| --- | --- |
| RN15 | Versão inicial normativa `damatch-mentoria-v1`, separada do quiz `damatch-profile-v3` e do DEMO `damatch-rules-v2`. Critérios, pesos, corte, selo, limite e casos do guia 29 são versionados; novas mudanças exigem decisão e exemplos revisados antes da liberação. |
| RN16 | Dados obrigatórios ausentes/inválidos impedem recomendar e são explicados somente ao titular. `DISCOVERING` e `UNKNOWN` são respostas válidas, valem zero em seu critério e mantêm denominador 100; não excluir critério nem redistribuir peso. Falta de agenda comum não exclui o par. |
| RN17 | Seis critérios 50/15/10/10/10/5; necessidades principal/secundária 70/30 quando duas, uma recebe todo o peso; prática 100%, conhecimento 70%. Nota decimal exata, sem arredondamento para corte >=60, ordenação e selo >=95. Desempatar por mais necessidades, mais prática, agenda comum e UUID textual crescente; limitar a 20 após classificação completa. A formatação administrativa não altera decisões. |
| RN18 | Preservada: recomendação não cria interesse ou conexão. Busca continua independente do corte de recomendação; futura manifestação de interesse deve obedecer ao contrato próprio e à elegibilidade atual. |
| RN19 | Preservada: indicação/reunião não garantem mentoria ou resultado financeiro e não fazem intermediação financeira. Janelas de disponibilidade não são reservas; capacidade declarada não é controle automático de vagas. |

Filtros adicionais de elegibilidade do par: ao menos uma necessidade atendida; modalidade compatível, cidade comum se exclusivamente presencial; frequência igual ou alguma flexível. Agenda rende dez pontos somente com par exato dia/período. Formação complementar ignora OTHER/STUDENT e exige área específica nos dois lados. Setor/público com alguma interseção rende todo o critério; mentor GENERAL rende 7,5 no setor salvo startup DISCOVERING (zero). Fórmulas completas e 14 exemplos vinculantes permanecem no guia 29.

## Critérios de aceite revisados

| ID | Verificação |
| --- | --- |
| CA13 | Aplicar publicação, completude e filtros do par; classificar todos antes de limitar. Sem candidatos >=60, lista vazia com orientação, sem DEMO nem corte adaptativo. |
| CA15 | Bloquear origem incompleta com pendências privadas; desconhecidos válidos valem zero sem renormalização. Sem agenda comum, continuar permitindo indicação e explicar a necessidade de combinar horários. |
| CA16 | Edição/pausa/agenda/accepting refletem a próxima consulta/detalhe. Respostas tardias de outra conta/projeto não podem reaparecer. |
| CA32 | Validar 59,5 excluído, 60 incluído, 95 com selo e 95,5 com selo, os 14 exemplos, todos os desempates e máximo 20. Rejeitar tentativas de fornecer pontuação pelo cliente; somente ADMIN recebe relatório numérico. |

Rastreabilidade: US-16/18/19 do [backlog](04-user-stories.md), guia29, domínio `RegraMentoria`, testes `RegraMentoriaTest`/`CandidatoMatchingTest`/`MatchingIntegrationTest`, serviço/parser/tela de recomendações. Evidências locais e limites no guia37; aprovação de CI não equivale a homologação publicada ou aprovação formal desta revisão documental.
