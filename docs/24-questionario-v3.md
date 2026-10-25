# 24 — Questionário v3: fases, perguntas novas e contrato para o backend

**Responsável:** Christopher (Product Owner) · **Data:** 25/10/2026 · **Branch:** `feature/quiz-gamificacao`

Esta versão traz de volta partes do quiz original do DaMatch que ficaram de fora na v0.5.0, sem mudar o visual nem o Lumen. Tudo continua no modo demonstração: as respostas ficam só no navegador.

---

## 1. O que mudou

| Antes (v0.5.0) | Agora (v3) |
| --- | --- |
| 5 etapas em sequência | 6 etapas em **3 fases**: Sua ideia / Sua missão / Seu ritmo (mentor: Sua experiência / Sua contribuição / Seu ritmo) |
| Sem pausa entre as etapas | Ao fechar uma fase, o Lumen comemora e mostra um **resumo do que a pessoa respondeu** naquela fase |
| Balão do Lumen só com instruções | Depois de cada resposta, o Lumen **reage** com uma frase curta |
| 8 setores | **23 áreas**, com busca sem diferenciar acentos. Startup até 2, mentor até 5 |
| 6 assuntos | **14 tipos de ajuda**. Startup até 2 (principal + secundária), mentor até 6 |
| — | Pergunta nova: **público** (B2C, B2B, B2B2C, B2G) |
| — | Pergunta nova: **áreas que o time domina** (startup, até 3) / **formação ou experiência** (mentor, até 2) |
| Mentor só com "recebendo startups" | Pergunta nova: **quantas startups o mentor topa acompanhar** |
| Tela final só com texto | Tela final mostra **quantas indicações foram encontradas**, com animação |
| Porcentagem visível nos cards e nos detalhes | **A porcentagem não aparece para o participante.** Só o selo **Match master** quando a nota é 95 ou mais |

As perguntas novas são guardadas, mas **não mudam a nota do match** por enquanto. A regra de cálculo continua sendo a decisão pendente do [documento 16](16-decisao-regra-matching.md).

---

## 2. Decisões de produto

| # | Decisão | Motivo |
| --- | --- | --- |
| Q1 | A porcentagem fica só com a equipe | Evita desanimar com notas baixas e permite estudar e ajustar o match com os dados. |
| Q2 | Selo **Match master** para nota ≥ 95, com destaque no card | Deixa claras as combinações muito fortes sem expor números. Com a regra atual, só a nota 100 recebe o selo. |
| Q3 | A pergunta de áreas da startup fala do **time**, não só do CEO | O objetivo é achar o mentor que cobre o que falta no time. Limite de 3 para forçar prioridade. |
| Q4 | Mentor marca até 2 áreas de formação ou experiência | Ele fala só de si; as especialidades já dizem como ajuda. |
| Q5 | Sem card de "tipo de fundador" | Não ajuda quem quer achar um mentor e tirava o foco do botão de indicações. |
| Q6 | A palavra "conexão" fica reservada para interesse mútuo (US-23) | O fim do cadastro mostra **indicações**, não conexões. |

---

## 3. Contrato das respostas

Códigos definidos em `frontend/src/app/core/profile.models.ts`. Versão do questionário: `damatch-profile-v3`.

| Campo | Startup | Mentor | Códigos |
| --- | --- | --- | --- |
| `moments` | 1 | 1 a 4 | `PROBLEM`, `AUDIENCE`, `SOLUTION`, `VALIDATING` |
| `sectors` | 1 a 2, ou só `DISCOVERING` | 1 a 5, ou só `GENERAL` | `TECH`, `HEALTH`, `EDUCATION`, `AGRO`, `SOCIAL`, `ENVIRONMENT`, `FINANCE`, `INSURANCE`, `COMMERCE`, `FOOD`, `LOGISTICS`, `REAL_ESTATE`, `LEGAL`, `WORK`, `MARKETING`, `INDUSTRY`, `TOURISM`, `CREATIVE`, `GAMES`, `FASHION`, `SPORTS`, `PETS`, `GOVERNMENT` |
| `topics` | 1 a 2, **em ordem** (o primeiro é a prioridade) | 1 a 6 | `VALIDATION`, `CUSTOMERS`, `BUSINESS`, `PROTOTYPE`, `PRICING`, `PITCH`, `TECHNOLOGY`, `DESIGN`, `MARKETING`, `FIRST_CUSTOMERS`, `LEGAL`, `PARTNERS`, `GRANTS`, `ORGANIZATION` |
| `experience` | — | um valor por tópico escolhido | `PRACTICAL`, `KNOWLEDGE` |
| `audiences` | 1 a 2, ou só `UNKNOWN` | 1 a 4 (sem `UNKNOWN`) | `B2C`, `B2B`, `B2B2C`, `B2G`, `UNKNOWN` |
| `backgrounds` | 1 a 3 | 1 a 2 (sem `STUDENT`) | `TECH`, `BUSINESS`, `DESIGN`, `HEALTH`, `EDUCATION`, `LAW`, `ENGINEERING`, `AGRO`, `STUDENT`, `OTHER` |
| `capacity` | — | obrigatório | `ONE`, `FEW` (2 a 3), `MANY` (4 ou mais) |
| `format` | obrigatório | obrigatório | `ONLINE`, `PRESENCIAL`, `AMBOS` |
| `cityId` | obrigatório se `PRESENCIAL` | igual | ex.: `PE_RECIFE` (lista reduzida no protótipo) |
| `availability` | 1 ou mais pares | igual | `{ day: MON…SUN, period: MORNING / AFTERNOON / EVENING }` |
| `cadence` | obrigatório | obrigatório | `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `FLEXIBLE` |
| `accepting` | — | sim/não | pausa novas mentorias |
| `projectName` | opcional, até 60 caracteres | — | texto |

Exemplo de startup, sem credenciais:

```json
{
  "questionnaireVersion": "damatch-profile-v3",
  "kind": "STARTUP",
  "projectName": "Minha Ideia",
  "moments": ["PROBLEM"],
  "sectors": ["HEALTH"],
  "topics": ["VALIDATION", "PRICING"],
  "audiences": ["B2C"],
  "backgrounds": ["TECH", "BUSINESS"],
  "format": "ONLINE",
  "cityId": "",
  "availability": [{ "day": "THU", "period": "EVENING" }],
  "cadence": "FLEXIBLE"
}
```

---

## 4. O que depende do backend (combinar com o Mário)

Nada abaixo foi alterado nesta branch. São pontos para conversar antes de integrar:

1. **Guardar as respostas.** Hoje o questionário fica só no navegador. É preciso decidir as tabelas e campos para os códigos acima, ligados à startup ou ao mentor.
2. **Receber as respostas.** Um endpoint para salvar e ler o perfil de match (sugestão: `PUT/GET /api/v1/{startups|mentores}/{id}/perfil-match`).
3. **Agenda do mentor.** O backend já usa `diaSemana` (1 a 7) e `MANHA / TARDE / NOITE`; o questionário usa `MON…SUN` e `MORNING / AFTERNOON / EVENING`. É preciso escolher um formato ou converter.
4. **Calcular o match no servidor.** A nota calculada no navegador não é confiável. O backend calcula, guarda a porcentagem para a equipe e devolve ao participante só a ordem e um indicador `matchMaster` (nota ≥ 95), **sem o número**.
5. **Área da equipe.** Para "só nós vemos a porcentagem", é preciso uma tela ou relatório administrativo.
6. **Texto da tela de cadastro.** `register.component.html` ainda diz "cinco etapas". Agora são seis. O trecho é do Mário e não foi alterado.
7. **Testes instáveis.** `mentor-flow.integration.spec.ts` e `startup-flow.integration.spec.ts` às vezes passam do limite de 5 segundos quando a máquina está carregada (acontece também na `main`).

---

## 5. Verificação

* 315 testes do frontend passando (`ng test --watch=false`), lint sem erros e build de produção sem avisos.
* Testado no navegador: cadastro de startup e de mentor, comemoração das fases, tela final com contagem e selo Match master no card.
