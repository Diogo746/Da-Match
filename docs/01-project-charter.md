# 01 — Project Charter (Termo de Abertura do Projeto)

**Padrão:** Alinhado aos princípios de planejamento de projetos de software da **IEEE/ISO/IEC 15288**.  
**Componente Curricular:** Unidade de Extensão: Full Stack (ADS 5P — 2026.2)  
**Instituição:** Faculdade Senac Pernambuco  

---

## 1. Justificativa & Problema de Negócio (Problem Statement)

* **Organização Parceira:** [Nome da ONG, Associação Comunitária ou Instituição Beneficiada]
* **Diagnóstico da Dor:** [Descreva o problema real enfrentado pelo parceiro. Ex: Gestão manual de doações em planilhas de papel, filas desorganizadas para atendimento social, falta de rastreabilidade de estoques de alimentos, etc.]
* **Impacto Social Gerado:** [Como o software desenvolvido transformará a operação da instituição e beneficiará a comunidade local?]

---

## 2. Objetivos & Critérios de Sucesso do Projeto (SMART)

* **O1:** Desenvolver e homologar uma plataforma web Full Stack (Angular + Spring Boot) que automatize 100% do fluxo de [Fluxo Principal. Ex: Cadastro e Distribuição de Cestas Básicas].
* **O2:** Integrar a autenticação com controle de acesso baseado em papéis (RBAC) via LLDAP, garantindo que voluntários e gestores tenham acessos segregados.
* **O3:** Implementar pipeline automatizado de CI/CD via GitHub Actions com aprovação obrigatória no Quality Gate do SonarQube (Zero vulnerabilidades críticas e &gt; 80% de cobertura de testes).
* **O4:** Capacitar os colaboradores da ONG parceira através de documentação de uso e realizar a transferência de tecnologia até o final do semestre letivo 2026.2.

---

## 3. Escopo do Projeto (Scope Baseline)

### ✅ Dentro do Escopo (In-Scope)
- [Funcionalidade 1: Ex. Módulo de Cadastro e Validação de Famílias Beneficiárias]
- [Funcionalidade 2: Ex. Painel de Controle de Entradas e Saídas de Doações]
- [Funcionalidade 3: Ex. Emissão de Relatórios em PDF/CSV para prestação de contas]
- [Funcionalidade 4: Ex. Autenticação e Gestão de Sessão Segura com LLDAP / JWT]
- [Funcionalidade 5: Ex. Interface Responsiva e Acessível (WCAG Nível AA)]

### ❌ Fora do Escopo (Out-of-Scope)
- Aplicativo móvel nativo (iOS / Android) — o foco é Web App responsivo.
- Integração com gateways de pagamento com cartão de crédito na versão inicial (MVP).
- Módulos contábeis ou de folha de pagamento complexos.

---

## 4. Partes Interessadas (Stakeholders)

| Papel | Representante / Contato | Responsabilidade no Projeto |
| :--- | :--- | :--- |
| **Cliente / Parceiro Real** | [Nome do Representante da ONG] | Validação dos requisitos de negócio, aceite das histórias de usuário e homologação. |
| **Tech Lead / Aluno 1** | [Nome do Aluno] | Arquitetura de software, modelagem de dados e pipeline CI/CD. |
| **Full Stack Dev / Aluno 2** | [Nome do Aluno] | Implementação de APIs REST Spring Boot e componentes Angular. |
| **QA / Frontend Dev / Aluno 3**| [Nome do Aluno] | Design System, Acessibilidade UX/UI e testes automatizados. |
| **Docente / Sponsor** | Prof. Fábio Chicout | Governança acadêmica, mentoria técnica e avaliação das releases. |

---

## 5. Cronograma de Marcos e Entregas (Milestones)

| Marco | Prazo Estimado | Entregável Principal |
| :---: | :---: | :--- |
| **M0** | 28/Ago/2026 | Project Charter aprovado & 5 Primeiras User Stories refinadas. |
| **M1** | 04/Set/2026 | Arquitetura Backend Spring Boot + JPA + SQLite3 inicializada. |
| **M2** | 11/Set/2026 | Frontend Angular + Design System configurados. |
| **M3** | 18/Set/2026 | Pipeline GitHub Actions & Release `v0.1.0-alpha` (Protótipo). |
| **M4** | 02/Out/2026 | Sprint 1 & 2: Autenticação LLDAP e Funcionalidades Core. |
| **M5** | 30/Out/2026 | Homologação com a ONG em ambiente Staging (`v0.5.0-beta`). |
| **M6** | 27/Nov/2026 | Deploy Final em Produção (`v1.0.0`), Treinamento & Pitch no Senac. |

---

## 6. Riscos & Plano de Mitigação

| Risco Identificado | Severidade | Ação Preventiva / Mitigação |
| :--- | :---: | :--- |
| Indisponibilidade ou atraso de feedback da ONG parceira. | Média | Agendamento de reuniões quinzenais curtas e envio de vídeos demonstrativos do protótipo navegável. |
| Dificuldade técnica na integração com servidor LLDAP. | Alta | Utilização do template oficial de Spring Security LDAP fornecido na disciplina e mock local para desenvolvimento. |
| Reprovação no Quality Gate do SonarQube por dívida técnica. | Alta | Rodar o linter e testes unitários localmente antes de cada Pull Request. |
