# 15 — Priorização do backlog para a beta e a v1.0

**Responsável:** Christopher (Product Owner) · **Data:** 17/10/2026 · **Situação:** proposta para validação do time

Este documento divide as 36 histórias do [backlog](04-user-stories.md) em entregas, considerando o prazo da `v0.5.0-beta` (31/10/2026) e da `v1.0.0` (28/11/2026).

---

## 1. Ponto de partida (17/10/2026)

| Parte | O que já existe | Onde |
| --- | --- | --- |
| Backend | Cadastro de usuário com senha criptografada e e-mail único | `main` |
| Backend | Perfil de mentor (biografia e links), `POST /api/v1/mentores` | `feature/database-models` (não mergeada) |
| Frontend | Protótipo com descoberta, cadastro guiado em 4 etapas e cálculo de match, tudo com dados fictícios | `feature/frontend-profile-lumen` (não mergeada) |
| Infra | Deploy do backend no Render e pipeline no GitHub Actions | `main` |

Ainda não existem: login, perfil de startup, perfil de investidor, matching no backend, interesses, conexões e reuniões.

---

## 2. Critério usado

A beta precisa mostrar **o fluxo principal funcionando de ponta a ponta**, mesmo que só para um tipo de apoio:

```text
Cadastro → Perfil → Recomendação → Interesse → Conexão → Reunião
```

Com duas semanas de prazo, a escolha foi fazer esse fluxo **só entre startup e mentor**, porque o mentor já foi iniciado no backend e no protótipo. O investidor repete o mesmo fluxo depois, com a faixa de investimento a mais.

---

## 3. Ondas de entrega

### 🟧 Beta — `v0.5.0-beta` (31/10/2026): startup ↔ mentor

| História | Descrição |
| --- | --- |
| US-03, US-04 | Entrar e sair (login simples, ver decisão D2) |
| US-06, US-07 | Perfil da startup e do mentor |
| US-09, US-10 | Editar perfil e ver o que falta |
| US-13, US-15 | Buscar mentores e ver perfil |
| US-16, US-18 | Recomendações de mentoria com explicação da pontuação |
| US-20, US-21 | Demonstrar interesse e ver interesses |
| US-23, US-24 | Conexão por interesse mútuo e lista de conexões |
| US-26, US-27 | Propor e confirmar/recusar reunião |

**Total:** 16 histórias.

### 🟩 Versão final — `v1.0.0` (28/11/2026): completar o MVP

| História | Descrição |
| --- | --- |
| US-08, US-14, US-17 | Investidor: perfil, busca e recomendações de investimento |
| US-01, US-02, US-05 | Solicitação e aprovação de acesso, permissões completas |
| US-11, US-12, US-19 | Preferências, busca de startups e recálculo das recomendações |
| US-22, US-25 | Retirar interesse e encerrar conexão |
| US-28, US-29, US-30 | Remarcar, cancelar e registrar reunião realizada |
| US-31, US-32, US-33 | Suspensão, indicadores e auditoria |
| US-34, US-35 | Privacidade do contato e desativação do perfil |

**Total:** 19 histórias.

### ⬜ Depois do semestre

| História | Descrição |
| --- | --- |
| US-36 | Avisos internos (já é P2 no SRS) |

---

## 4. Decisões

| # | Decisão | Motivo |
| --- | --- | --- |
| D1 | Investidor fica para a v1.0 | Reduz pela metade o trabalho de perfil, busca e matching até a beta. |
| D2 | Na beta, o login usa o cadastro com senha que já existe no backend. O fluxo do SRS (solicitação + aprovação do admin + LLDAP) entra na v1.0. | O LLDAP ainda não está configurado, e montar isso em duas semanas travaria o resto do fluxo. |
| D3 | Avisos internos ficam fora do semestre | É P2 e o SRS prevê o adiamento sem perda de funcionalidade. |

> ⚠️ A decisão D2 diverge do SRS (RF01–RF03). Ela precisa ser aceita pelo time e registrada como mudança na próxima revisão do documento de requisitos.

---

## 5. Riscos para a beta

* **Branches abertas:** o perfil de mentor e o protótipo ainda não estão na `main`. Quanto antes forem mergeados, menos conflito.
* **Regra de matching:** o protótipo e o SRS usam pesos diferentes. É preciso escolher uma antes de implementar o cálculo no backend.
* **Entidade Mentor incompleta:** faltam setores, experiência, estágios, formatos, cidade e disponibilidade, que são obrigatórios para o matching.
* **Pipeline falhando:** o job "Detect Component Changes" falha em todo push na `main`, então nenhum teste ou deploy roda. Precisa ser corrigido para a homologação em staging.

---

## 6. Próximos passos

1. Validar esta priorização com o time na próxima reunião.
2. Criar as issues ou cards da beta a partir das 16 histórias.
3. Decidir a regra de matching.
4. Mergear `feature/database-models` e `feature/frontend-profile-lumen`.
