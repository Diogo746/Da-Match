# 16 — Decisão pendente: qual regra de matching usar

**Responsável:** Christopher (Product Owner) · **Data:** 17/10/2026 · **Situação:** aguardando decisão do time

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
| Opção escolhida | _a definir na reunião do time_ |
| Data | |
| Participantes | |
| Próximo passo | Atualizar o SRS (seção 7) e os cenários da US-16 com a regra escolhida |
