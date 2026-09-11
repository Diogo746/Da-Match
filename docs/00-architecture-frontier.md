# 00 — Architecture Frontier & Decisões Arquiteturais (ADR)

**Projeto:** [Nome do Projeto de Extensão Full Stack]  
**Equipe:** [Nome da Equipe / Alunos]  
**Organização Parceira (ONG):** [Nome da Organização Parceira]  

---

## 1. Visão Geral da Arquitetura (System Context)

Descreva em alto nível o ecossistema da aplicação, as fronteiras entre os subsistemas e a integração com serviços externos.

```mermaid
flowchart TD
    subgraph Client ["Frontend: Single Page Application (SPA)"]
        UI ["Angular v17+ (Standalone Components, RxJS, Tailwind/CSS)"]
    end

    subgraph Gateway ["Camada de Borda / Segurança"]
        AuthGuard ["Auth Interceptor / Route Guards (JWT Bearer Token)"]
    end

    subgraph Backend ["Backend: API REST Enterprise"]
        Spring ["Spring Boot 3.x (Spring Web, Spring Security, Spring Data JPA)"]
        LLDAPClient ["Cliente de Autenticação LDAP / LLDAP"]
    end

    subgraph Persistence ["Camada de Dados & Infraestrutura"]
        SQLite [("Banco de Dados SQLite3 (extensao.db)")]
        LLDAPServer [("Servidor LLDAP / Homelab (cn=gestor, cn=operador)")]
    end

    UI -->|HTTP / REST JSON| Gateway
    Gateway -->|Requisições Autenticadas| Spring
    Spring -->|Validação de Credenciais| LLDAPClient
    LLDAPClient <-->|Bind LDAP| LLDAPServer
    Spring <-->|JPA / Hibernate ORM| SQLite
```

---

## 2. Matriz Tecnológica Obrigatória (Tech Stack)

| Camada | Tecnologia Adotada | Justificativa Técnica |
| :--- | :--- | :--- |
| **Front-End** | **Angular 17+ / 18+** | Framework opinado, tipagem estrita com TypeScript, arquitetura de componentes e injeção de dependências nativa. |
| **Back-End** | **Java SE 21 + Spring Boot 3.x** | Padrão corporativo, robustez em APIs REST, segurança integrada (`Spring Security`) e validações declarativas (`@Valid`). |
| **Persistência** | **Spring Data JPA + SQLite3** | Facilidade de implantação local/edge sem necessidade de gerenciar daemons de banco pesados, portabilidade e persistência em arquivo único (`extensao.db`). |
| **Autenticação** | **LLDAP (LDAP Light)** | Gestão centralizada de identidades e RBAC (*Role-Based Access Control*) com grupos institucionais. |
| **Qualidade & CI/CD** | **GitHub Actions + SonarQube** | Validação automatizada de testes, cobertura de código e aplicação de Quality Gate estrito. |

---

## 3. Architecture Decision Records (ADR)

### 📄 ADR-001: Adoção do SQLite3 para o MVP de Extensão Comunitária
* **Status:** Aprovado.
* **Contexto:** A organização parceira possui infraestrutura computacional enxuta e necessita de um sistema de manutenção simplificada e backup por cópia de arquivo.
* **Decisão:** Utilizar SQLite3 via driver JPA para simplificar a esteira de deploy e eliminar custos de infraestrutura de nuvem na fase de validação.
* **Consequências:** Deploy em container único; necessidade de controle de concorrência de escrita via WAL mode (`PRAGMA journal_mode=WAL`).

### 📄 ADR-002: Gestão de Identidades Centralizada via LLDAP
* **Status:** Aprovado.
* **Contexto:** Segregação de papéis entre administradores da ONG, voluntários operadores e beneficiários comunitários.
* **Decisão:** Autenticação delegada ao servidor LLDAP do homelab com mapeamento de *Roles* para Authorities do Spring Security.
