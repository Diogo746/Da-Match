# 16 — Decisão da regra de matching e histórico das propostas

**Propostas originais:** 17/10/2026, Christopher (Product Owner). **Situação atual:** regra de mentoria definida pelo usuário em 30/10/2026, em 13 respostas, no [guia 29 — damatch-mentoria-v1](29-matching-rule-decisions.md). Implementação ainda pendente na etapa 6.

O guia 29 é a especificação atual do servidor. As comparações e recomendações abaixo registram propostas históricas e não prevalecem sobre essa decisão. A atribuição de autoria das propostas ao PO não significa atribuir a ele as respostas dadas pelo usuário nesta conversa. A próxima revisão formal do SRS deve incorporar a regra consolidada; o protótipo continua experimental.

## 1. O problema

Hoje existem duas regras de matching diferentes no projeto:

* **match-1.0**: proposta da [Documentação de Requisitos v1.0](DaMatch-Documentacao-de-Requisitos-v1.0.pdf), seção 7;
* **damatch-rules-v1**: implementada no protótipo do frontend (`frontend/src/app/core/matching.engine.ts`, branch `feature/frontend-profile-lumen`) e descrita no `docs/10-profile-and-matching.md` dessa branch.

O mesmo par de startup e mentor recebe notas diferentes em cada uma. Se o backend implementar uma regra e a tela explicar a outra, o usuário vai ver uma pontuação que não bate com a explicação. É preciso escolher **antes** de implementar o cálculo no backend (US-16 e US-18).

---

## 2. Comparação (mentoria)

| Ponto | match-1.0 (SRS) | damatch-rules-v1 (protótipo) |
| --- | --- | --- |
| Setor | 25 pontos | 30 (experiência direta) ou 15 (mentor de atuação geral) |
| Estágio da startup | 15 pontos | Não usa (protótipo só tem startups em ideação) |
| Necessidades atendidas | 20 pontos, proporcional (ex.: 1 de 2 = 10) | Prioridade principal: 50 (ou 70 se for a única); secundária: 20 |
| Disponibilidade | 25 pontos se houver período em comum | Não pontua; **sem dia e período em comum, o par é excluído** |
| Formato / localização | Formato em comum é obrigatório; mesma cidade vale 10 (não se aplica se for online) | Formato em comum é obrigatório; presencial exige mesma cidade; não pontua |
| Modelo de negócio | 5 pontos (só se houver preferência) | Não usa |
| Mentor pausado | Não previsto | Excluído ("não está recebendo novas startups") |
| Nota mínima | Corte em 60 | Não tem corte; basta atender pelo menos uma necessidade |
| Setor "ainda descobrindo" | Não permitido: setor é obrigatório (RN08) | Permitido; a indicação aparece sem porcentagem |
| Critério não aplicável | Sai do denominador (a nota é recalculada sobre o que se aplica) | Pesos fixos que sempre somam 100 |

---

## 3. O mesmo exemplo nas duas regras

Startup de **tecnologia**, em ideação, precisa de **validação (principal)** e **preços (secundária)**, online, quinta à noite.
Mentor de **tecnologia** que orienta **validação e protótipo**, online, quinta à noite.

| Critério | match-1.0 | damatch-rules-v1 |
| --- | --- | --- |
| Setor | 25 de 25 | 30 de 30 |
| Estágio | 15 de 15 | — |
| Necessidades (1 de 2) | 10 de 20 | 50 de 50 (principal) + 0 de 20 (secundária) |
| Disponibilidade | 25 de 25 | — (já passou no filtro) |
| Localização | não aplicável (online) | — |
| Modelo de negócio | não aplicável | — |
| **Nota** | **75 de 85 = 88,2** | **80 de 100 = 80** |

E se o mentor atendesse só a necessidade **secundária** (preços)?

* match-1.0: continua **88,2**, porque a regra não diferencia necessidade principal de secundária.
* damatch-rules-v1: cai para **50** (0 + 20 + 30), porque a prioridade da startup pesa mais.

---

## 4. Opções

| Opção | O que significa | A favor | Contra |
| --- | --- | --- | --- |
| **A. Seguir o SRS (match-1.0)** | O frontend é ajustado para a regra do documento | Já está documentada e aprovada como proposta; tem exemplos e casos de teste prontos | Usa estágio e modelo de negócio, que o protótipo não coleta; ignora a prioridade entre necessidades |
| **B. Adotar a regra do protótipo** | O SRS é revisado para a damatch-rules-v1 | Já está implementada e testada no frontend; respeita a prioridade da startup; combina com o escopo da beta (só ideação e mentoria) | Sem corte mínimo; não cobre investimento; exige revisar o SRS |
| **C. Juntar as duas (match-1.1)** | Mantém a estrutura do protótipo e acrescenta o que o SRS tem de melhor | Prioridade entre necessidades **+** corte mínimo, versão e explicação do SRS; disponibilidade e formato continuam como filtro | Exige uma revisão curta do SRS e um ajuste pequeno no frontend |

## 5. Recomendação do PO

**Opção C.** Para a beta (só startup em ideação e mentor), a regra do protótipo representa melhor o que a startup precisa, porque respeita qual necessidade ela marcou como prioridade. Do SRS, vale manter:

* o **corte mínimo** (60 ou outro valor que o time definir) e a ordenação com desempate;
* a **versão do cálculo** exibida na explicação (RF18);
* a **regra de investimento** (faixa de valor) para a v1.0, que o protótipo não cobre.

O setor "ainda descobrindo" precisa de uma decisão própria: ou o SRS passa a aceitar esse valor, ou o protótipo deixa de oferecer a opção.

## 6. Decisão

| Campo | Valor |
| --- | --- |
| Regra escolhida | `damatch-mentoria-v1`, conforme [guia 29](29-matching-rule-decisions.md), construída pelas 13 respostas; não corresponde integralmente às antigas opções A–D. |
| Data | 30/10/2026 |
| Participante da decisão | Usuário nesta conversa; sem atribuir aprovação separada do PO/time. |
| Próximo passo | Implementar na etapa 6 após as dependências, e incorporar na próxima revisão formal do SRS; US-16/18/19 atualizadas para esta decisão. |

## Atualização do protótipo — v0.5.0

O frontend demonstrativo passa a usar `damatch-rules-v2`: necessidades até 70, setor até 20 e momento dentro da ideação até 10, com filtros de modalidade, pares de agenda e frequência. Experiência prática desempata notas iguais. O setor em descoberta continua parcial. A especificação atual está no [documento 18](18-frontend-v0.5.0.md).

Essa implementação experimental não registra uma aprovação do PO ou uma alteração automática do SRS. O alinhamento da regra definitiva e dos critérios de aceitação com a equipe continua necessário antes do cálculo no backend.

## Atualização — 25/10/2026

### Mais uma opção: regra do quiz original

O quiz que serviu de base para o cadastro usava outra pontuação. Ela entra como opção **D** para a reunião:

| Critério | Peso |
| --- | --- |
| Tipo de ajuda (necessidades atendidas; experiência prática vale mais) | 35 |
| Área / setor | 25 |
| Momento da ideia | 15 |
| Público (B2C, B2B…) | 10 |
| Frequência e horários | 10 |
| Formação complementar (áreas diferentes valem mais) | 5 |

Corte: abaixo de 30 o perfil não aparece. A vantagem é usar as perguntas novas de público e formação (ver [documento 24](24-questionario-v3.md)). A desvantagem é não diferenciar a necessidade principal da secundária.

### Decisão do PO: porcentagem só para a equipe

Seja qual for a regra escolhida, o participante **não vê a porcentagem** nem a explicação por critério. Ele vê as indicações em ordem e o selo **Super DaMatch** quando a nota for 95 ou mais. A nota completa fica guardada para a equipe estudar e ajustar o match. Essa decisão muda a RF18 do SRS e a US-18 já foi atualizada.

## Definição guiada — 30/10/2026

O usuário concluiu as 13 respostas do [guia 29](29-matching-rule-decisions.md). Pesos: necessidades 50, setor 15, momento 10, público 10, agenda 10 e formação 5. Necessidades divididas 70/30; prática recebe 100% e conhecimento 70% por assunto. Ao menos uma necessidade precisa ser atendida; falta de agenda perde 10 pontos sem excluir. Frequências fixas diferentes excluem, salvo flexível; modalidade/cidade devem permitir encontro. Setor geral recebe metade, desconhecidos recebem zero sem normalização, público pontua com uma interseção, formação premia área específica adicional ao time. Corte inclusivo 60; selo inclusivo 95. Empate: mais necessidades atendidas, mais delas com prática, agenda comum, UUID estável. Capacidade somente informativa nesta primeira versão. Fórmula, exceções, privacidade e casos de referência estão consolidados no guia 29; implementação permanece futura.
