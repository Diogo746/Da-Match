# DaMatch

> **Projeto Integrador — Extensão Full Stack | ADS — Faculdade Senac Recife**

🚧 **Status: Em desenvolvimento**

---

## 📌 Sobre o projeto

O **DaMatch** é uma plataforma Web Full Stack responsiva voltada para o ecossistema de inovação do Nordeste.

A plataforma tem como objetivo facilitar a conexão entre **startups ou projetos empreendedores**, **mentores** e **investidores**, utilizando informações dos perfis e regras objetivas de compatibilidade para apresentar possíveis conexões.

O sistema permitirá o cadastro de perfis, definição de interesses e necessidades, recomendações de possíveis conexões e registro de reuniões.

> **Importante:** este README é temporário. Requisitos, regras de negócio e decisões técnicas ainda serão refinados durante o desenvolvimento.

---

## 🎯 Problema

Startups nascentes podem encontrar dificuldades para localizar mentores e investidores compatíveis com seu setor, estágio de desenvolvimento e necessidades.

Atualmente, muitas conexões acontecem de forma dispersa por meio de eventos, indicações, redes sociais e contatos informais.

Da mesma forma, mentores e investidores podem ter dificuldade para encontrar startups alinhadas às suas áreas de experiência, interesses e critérios.

O DaMatch busca centralizar essas informações e facilitar a identificação de oportunidades de **mentoria, parceria e investimento**.

---

## 💡 Solução

A plataforma permitirá que startups ou projetos empreendedores apresentem informações como:

* Setor de atuação;
* Estágio de desenvolvimento;
* Modelo de negócio;
* Localização;
* Objetivo da conexão;
* Apresentação resumida do projeto.

Mentores e investidores poderão informar:

* Áreas de interesse;
* Experiências;
* Disponibilidade;
* Critérios para receber recomendações;
* Faixa de investimento, quando aplicável.

A plataforma utilizará regras de compatibilidade para gerar uma **pontuação de match**.

Entre os critérios inicialmente previstos estão:

* Setor de atuação;
* Estágio da startup;
* Tipo de apoio procurado;
* Área de experiência;
* Faixa de investimento;
* Localização;
* Disponibilidade;
* Modelo de negócio.

Quando os dois lados demonstrarem interesse, será criada uma conexão e poderá ser registrada uma reunião.

O sistema não realizará investimentos, contratos ou movimentações financeiras.

---

# 🏛️ Informações do Projeto

| Campo                              | Informação                            |
| ---------------------------------- | ------------------------------------- |
| **Nome**                           | DaMatch                               |
| **Parceiro Comunitário / Cliente** | Faculdade Senac                       |
| **Semestre**                       | 2026.2                                |
| **Curso**                          | Análise e Desenvolvimento de Sistemas |
| **Período**                        | 5º período                            |
| **Instituição**                    | Faculdade Senac Recife                |
| **Data do Charter**                | 21/08/2026                            |
| **Status**                         | Em desenvolvimento                    |

---

# 👥 Equipe

| Integrante          | Papel                       |
| ------------------- | --------------------------- |
| **Diogo Barbosa**   | Scrum Master / DevOps Lead  |
| **Mário Brandão**   | Full Stack Lead — Back-End  |
| **Davi Maia**       | Full Stack Lead — Front-End |
| **Christopher**     | Product Owner / Analyst     |
| **Nikolas Messias** | Project Manager             |

### Responsabilidades

#### Diogo Barbosa — Scrum Master / DevOps Lead:

* Git Flow;
* CI/CD;
* GitHub Actions;
* Quality Gate;
* SonarQube.

#### Mário Brandão — Full Stack Lead / Back-End:

* Arquitetura REST;
* Spring Boot;
* Spring Security;
* LLDAP;
* SQLite3.

#### Davi Maia — Full Stack Lead / Front-End:

* Angular Standalone;
* RxJS;
* Forms;
* Acessibilidade;
* Interfaces.

#### Christopher — Product Owner / Analyst:

* Product Backlog;
* User Stories;
* Análise;
* Comunicação com o cliente.

**Nikolas Messias — Project Manager**
*  **Roadmap Definition**
*  **Backlog Prioritization** 

---

# 📦 Organização dos Repositórios

O projeto será organizado em **3 repositórios independentes**, evitando a utilização de um único monorepo.

## Repositório 1 — Frontend

Responsável pela aplicação cliente Web.

**Tecnologia principal:**

* Angular Standalone;
* RxJS;
* Angular Forms.

Responsabilidades:

* Interfaces;
* Componentes;
* Páginas;
* Formulários;
* Consumo da API;
* Validações;
* Feedback ao usuário;
* Responsividade;
* Acessibilidade.

**Repositório:**

> 🔗 A definir

---

## Repositório 2 — Backend

Responsável pela API e pelas regras de negócio da aplicação.

**Tecnologia principal:**

* Java;
* Spring Boot;
* Spring Security;
* API REST.

Responsabilidades:

* API REST;
* Regras de negócio;
* Validações;
* Autenticação;
* Autorização;
* Integração com LLDAP;
* Persistência dos dados;
* Sistema de matching;
* Conexões;
* Reuniões.

**Repositório:**

> 🔗 A definir

---

## Repositório 3 — Módulos

O terceiro repositório será utilizado para os módulos definidos pela equipe.

> ⚠️ **A estrutura e a responsabilidade exata deste terceiro repositório ainda precisam ser definidas.**

**Repositório:**

> 🔗 A definir

---

# 🏗️ Arquitetura Inicial

A comunicação principal entre Frontend e Backend será realizada através de uma API REST.

```text
┌──────────────────────────────┐
│          FRONTEND            │
│                              │
│          Angular             │
│       RxJS / Forms           │
└──────────────┬───────────────┘
               │
               │ HTTP / REST
               ▼
┌──────────────────────────────┐
│           BACKEND            │
│                              │
│         Spring Boot          │
│       Spring Security        │
│                              │
│     Regras de negócio        │
│          API REST            │
└──────────┬───────────┬───────┘
           │           │
           ▼           ▼
┌────────────────┐ ┌────────────────┐
│    SQLite3     │ │     LLDAP      │
│                │ │                │
│ Dados de       │ │ Credenciais    │
│ negócio        │ │ Grupos         │
└────────────────┘ └────────────────┘
```

---

# 🧰 Tecnologias

## Frontend

* Angular Standalone
* RxJS
* Angular Forms

## Backend

* Java
* Spring Boot
* Spring Security
* REST API

## Banco de Dados

* SQLite3

## Autenticação e Autorização

* LLDAP
* Spring Security
* RBAC

## DevOps

* Git
* GitHub
* GitHub Actions
* SonarQube
* CI/CD

---

# 🔐 Autenticação e Autorização

A autenticação e a autorização serão realizadas utilizando **LLDAP**, integrado ao **Spring Security**.

O LLDAP será responsável pelo gerenciamento de:

* Credenciais;
* Grupos de acesso.

O SQLite3 será responsável pelos dados relacionados ao negócio.

### Roles inicialmente previstas

| Grupo LLDAP              | Spring Security     |
| ------------------------ | ------------------- |
| `[projeto]_admin`        | `ROLE_ADMIN`        |
| `[projeto]_operador`     | `ROLE_OPERADOR`     |
| `[projeto]_beneficiario` | `ROLE_BENEFICIARIO` |

> ⚠️ A relação dessas roles com os perfis de Startup, Mentor e Investidor ainda precisa ser validada.

---

# 🗄️ Banco de Dados

O banco de dados de negócio utilizará **SQLite3**.

Entre os dados inicialmente previstos estão:

* Perfis;
* Startups;
* Preferências;
* Matches;
* Interesses;
* Conexões;
* Reuniões.

A modelagem relacional será definida antes da implementação das funcionalidades.

Arquivo previsto para o banco:

```text
extensao.db
```

---

# 🔄 Fluxo Conceitual

```text
Cadastro
   │
   ▼
Perfil
   │
   ▼
Preferências / Necessidades
   │
   ▼
Cálculo de Compatibilidade
   │
   ▼
Recomendações
   │
   ▼
Interesse
   │
   ▼
Conexão
   │
   ▼
Reunião
```

---

# 🎯 Sistema de Matching

O sistema deverá calcular a compatibilidade entre os perfis.

Critérios inicialmente previstos:

| Critério              | Participação |
| --------------------- | ------------ |
| Setor de atuação      | A definir    |
| Estágio da startup    | A definir    |
| Tipo de apoio         | A definir    |
| Área de experiência   | A definir    |
| Faixa de investimento | A definir    |
| Localização           | A definir    |
| Disponibilidade       | A definir    |
| Modelo de negócio     | A definir    |

> ⚠️ Os pesos, fórmula de cálculo e critérios mínimos para recomendação ainda não foram definidos.

---

# 📊 Dashboard

Está previsto um **Dashboard reativo em Angular**.

O dashboard deverá apresentar indicadores relacionados ao impacto social do projeto.

Os indicadores definitivos ainda serão especificados.

---

# 🔗 Conexões e Reuniões

Quando houver interesse mútuo entre participantes, a plataforma deverá permitir o estabelecimento de uma conexão.

Após a conexão, deverá ser possível registrar uma reunião.

As regras para:

* criação;
* alteração;
* cancelamento;
* status;
* permissões;

ainda serão definidas.

---

# 🧪 Qualidade e CI/CD

O projeto contará com uma pipeline de **CI/CD utilizando GitHub Actions**.

Também será utilizado **SonarQube** para análise da qualidade do código.

O projeto deverá atingir um **Quality Gate aprovado** para a versão final.

Fluxo previsto:

```text
Commit
   │
   ▼
GitHub
   │
   ▼
GitHub Actions
   │
   ├── Build
   ├── Testes
   └── SonarQube
          │
          ▼
     Quality Gate
          │
          ▼
       Deploy
```

---

# 🚀 Ambientes

O projeto prevê três etapas principais:

```text
Desenvolvimento
       │
       ▼
    Staging
       │
       ▼
   Produção
```

A versão MVP deverá ser homologada em **Staging** antes do deploy definitivo.

---

# 📅 Roadmap

## 🟦 Baseline — 28/08/2026

* [x] Project Charter
* [ ] Modelagem relacional SQLite3
* [ ] Banco `extensao.db`

---

## 🟨 `v0.1.0-alpha` — 19/09/2026

* [ ] Protótipo navegável Angular
* [ ] Arquitetura Spring Boot
* [ ] Pipeline CI/CD

---

## 🟧 `v0.5.0-beta` — 31/10/2026

* [ ] MVP funcional
* [ ] Homologação em Staging
* [ ] Validação com cliente real

---

## 🟩 `v1.0.0` — 28/11/2026

* [ ] Deploy em Produção
* [ ] Quality Gate SonarQube aprovado
* [ ] Pitch / apresentação na banca

---

# 📋 Escopo

## ✅ Incluído

* [ ] Autenticação via LLDAP
* [ ] Autorização baseada em grupos
* [ ] Integração LLDAP + Spring Security
* [ ] Cadastro e gerenciamento de startups
* [ ] Perfis de usuários
* [ ] Sistema de matching
* [ ] Recomendações
* [ ] Conexões
* [ ] Registro de reuniões
* [ ] Dashboard
* [ ] CI/CD
* [ ] Quality Gate SonarQube
* [ ] Staging
* [ ] Produção

## ❌ Fora do Escopo

* Aplicativo nativo iOS;
* Aplicativo nativo Android;
* Gateway de pagamento bancário real.

A solução será uma **SPA Web Responsiva**.

---

# ⚠️ Pendências

Este README representa o estado atual do projeto e contém decisões ainda abertas.

### Produto

* [ ] Confirmar nome oficial;
* [ ] Definir perfis definitivos;
* [ ] Definir permissões;
* [ ] Validar requisitos com o cliente.

### Matching

* [ ] Definir fórmula;
* [ ] Definir pesos;
* [ ] Definir critérios mínimos;
* [ ] Definir tratamento de dados ausentes.

### Banco

* [ ] Finalizar entidades;
* [ ] Definir atributos;
* [ ] Definir PKs;
* [ ] Definir FKs;
* [ ] Definir cardinalidades;
* [ ] Validar normalização;
* [ ] Criar `extensao.db`.

### Backend

* [ ] Definir arquitetura interna;
* [ ] Definir endpoints;
* [ ] Definir DTOs;
* [ ] Definir validações;
* [ ] Definir tratamento de erros.

### Frontend

* [ ] Definir páginas;
* [ ] Definir componentes;
* [ ] Definir fluxos;
* [ ] Definir identidade visual;
* [ ] Definir acessibilidade.

### Infraestrutura

* [ ] Configurar LLDAP;
* [ ] Integrar Spring Security;
* [ ] Configurar GitHub Actions;
* [ ] Configurar SonarQube;
* [ ] Definir Staging;
* [ ] Definir Produção.

### Repositórios

* [ ] Criar repositório Frontend;
* [ ] Criar repositório Backend;
* [ ] Criar terceiro repositório;
* [ ] Definir responsabilidade do terceiro repositório;
* [ ] Definir estratégia de integração entre os três.

---

# 📚 Documentação

Durante o desenvolvimento serão produzidos documentos relacionados a:

* Requisitos;
* User Stories;
* Arquitetura;
* Modelagem do banco;
* API;
* Decisões técnicas;
* Testes;
* Segurança;
* Resultados;
* Limitações;
* Apresentação.

---

# 🎓 Objetivo Acadêmico

O projeto busca proporcionar experiência prática em:

* Desenvolvimento Full Stack;
* Engenharia de Software;
* Arquitetura de sistemas;
* Banco de dados;
* APIs REST;
* Autenticação e autorização;
* Git e GitHub;
* CI/CD;
* Testes;
* Segurança;
* Acessibilidade;
* Documentação;
* Trabalho em equipe.

---

# 📌 Status

**🚧 Projeto em desenvolvimento**

Este README será atualizado conforme os requisitos, decisões arquiteturais e funcionalidades forem definidos.

---

## 🔗 Repositórios

### Frontend

> 🔗 A definir

### Backend

> 🔗 A definir

### Módulos

> 🔗 A definir

---

## 📜 Projeto Integrador

**Faculdade Senac Recife — ADS**
**Semestre 2026.2**

> *Projeto Integrador — Extensão Full Stack*
