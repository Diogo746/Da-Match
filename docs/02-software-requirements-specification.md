# 02 — Software Requirements Specification (SRS)

**Padrão:** Estruturado conforme a norma **IEEE 29148-2018** (Systems and software engineering — Life cycle processes — Requirements engineering).  

---

## 1. Requisitos Funcionais (Functional Requirements)

Cada requisito possui um identificador unívoco no formato `REQ-XXX` para assegurar rastreabilidade bidirecional.

### Módulo: Autenticação e Perfis (AUTH)
* **`REQ-AUTH-01` (Login Centralizado):** O sistema deve autenticar usuários contra a base LLDAP utilizando credenciais institucionais seguras.
* **`REQ-AUTH-02` (Controle de Acesso RBAC):** O sistema deve restringir o acesso a rotas do frontend e endpoints do backend conforme o papel do usuário (`ROLE_GESTOR`, `ROLE_OPERADOR`, `ROLE_BENEFICIARIO`).
* **`REQ-AUTH-03` (Expiração de Sessão):** O token de autenticação JWT deve expirar em no máximo 2 horas de inatividade, exigindo nova autenticação.

### Módulo: Gestão do Fluxo Principal (CORE)
* **`REQ-CORE-01` (Cadastro de Entidades):** O sistema deve permitir o cadastro, listagem, edição e desativação lógica (soft delete) de [Entidade Principal. Ex: Beneficiários / Doações].
* **`REQ-CORE-02` (Validação de Dados):** O sistema deve validar no backend (Spring `@Valid`) a unicidade de documentos (CPF/CNPJ), formato de e-mail e campos de preenchimento obrigatório.
* **`REQ-CORE-03` (Registro de Movimentações):** Toda alteração de estado crítico no sistema deve registrar data/hora e o ID do operador responsável (Trilha de Auditoria).

### Módulo: Relatórios e Transparência (REP)
* **`REQ-REP-01` (Exportação de Dados):** O sistema deve permitir que usuários gestores exportem relatórios consolidados em formatos CSV e PDF.
* **`REQ-REP-02` (Dashboard de Indicadores):** A tela inicial do gestor deve exibir métricas resumidas (Total atendido no mês, saldo disponível, pendências).

---

## 2. Requisitos Não Funcionais (Non-Functional Requirements)

| Identificador | Categoria | Especificação Técnica |
| :--- | :--- | :--- |
| **`NFR-SEC-01`** | Segurança | Todas as senhas trafegadas devem ser protegidas por TLS/HTTPS. Nenhuma senha ou chave de API deve ser salva em texto plano. |
| **`NFR-PERF-01`**| Performance | 95% das consultas REST com filtros padrão devem responder em tempo inferior a **500ms** no ambiente de homologação. |
| **`NFR-A11Y-01`**| Acessibilidade | A interface Angular deve atender às diretrizes de acessibilidade **WCAG 2.1 Nível AA** (contraste de cores adequado e navegação via teclado). |
| **`NFR-COMP-01`**| Compatibilidade | O frontend deve ser totalmente responsivo, funcionando perfeitamente em telas móveis (&ge; 360px) e desktops (&ge; 1080px). |
| **`NFR-QUAL-01`**| Qualidade de Código | O código-fonte deve ser aprovado no SonarQube com **Quality Gate Verde (Passed)**, sem vulnerabilidades (*Security Rating A*) e com cobertura de testes unitários &ge; 70%. |
