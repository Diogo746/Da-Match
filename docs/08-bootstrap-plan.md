# 08 — Bootstrap Plan: Inicialização do Repositório do Projeto

Guia passo a passo para a equipe estruturar o repositório oficial no GitHub.

---

## 1. Estrutura Padrão de Diretórios

```
seu-projeto-extensao/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # Pipeline automatizado de testes e SonarQube
├── backend/                   # Projeto Spring Boot 3.x (Java 21)
│   ├── src/
│   │   ├── main/java/...
│   │   └── test/java/...
│   ├── pom.xml
│   └── mvnw
├── frontend/                  # Aplicação Angular 17+ (TypeScript)
│   ├── src/
│   ├── angular.json
│   └── package.json
├── docs/                      # Documentação de Engenharia (Esta pasta!)
│   ├── 00-architecture-frontier.md
│   ├── 01-project-charter.md
│   ├── 02-software-requirements-specification.md
│   ├── 03-use-cases.md
│   ├── 04-user-stories.md
│   ├── 05-devops-and-cicd.md
│   ├── 06-ui-ux-screen-descriptions.md
│   ├── 07-ui-ux-walkthrough-roadmap.md
│   └── README.md
└── README.md                  # Apresentação do projeto e instruções de execução
```

---

## 2. Comandos de Inicialização Rápida

### Backend (Spring Boot):
```bash
# Na pasta raiz do seu repositório:
mkdir backend && cd backend
# Inicialize com Spring Web, Spring Data JPA, Validation e Security
```

### Frontend (Angular):
```bash
# Na pasta raiz do seu repositório:
npx @angular/cli@17 new frontend --routing --style=css --ssr=false
```
