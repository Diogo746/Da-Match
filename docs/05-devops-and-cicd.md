# 05 — DevOps, Pipeline CI/CD & Gestão de Qualidade

**Padrão:** Estrutura de automação de engenharia e esteira de entrega contínua (**GitHub Actions + SonarQube + SemVer**).  

---

## 1. Estratégia de Ramificação (Git Flow Adaptado)

```
main (Produção - Apenas Releases estáveis taggeadas v1.0.0)
  ▲
  │ (Pull Request com Quality Gate Verde)
develop (Ambiente de Integração & Staging)
  ▲
  ├── feature/US-01-login-lldap
  ├── feature/US-02-rbac-guards
  └── feature/US-03-cadastro-beneficiario
```

* **Regras de Proteção de Branch:**
  - Proibido commit direto na `main` e na `develop`.
  - Todo merge exige Pull Request com pelo menos 1 aprovação (Peer Review).
  - O pipeline de CI/CD deve executar e passar 100% dos testes e Quality Gate antes do merge.

---

## 2. Pipeline de CI/CD (`.github/workflows/ci-cd.yml`)

O workflow executa automaticamente em cada `push` e `pull_request`:

```yaml
name: CI/CD Pipeline - Full Stack Extension

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-build-test:
    name: Backend Build & Test (Spring Boot)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      - name: Build and Run Tests
        run: |
          cd backend
          ./mvnw clean verify

  frontend-build-test:
    name: Frontend Build & Lint (Angular)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install Dependencies & Lint
        run: |
          cd frontend
          npm ci
          npm run lint --if-present
          npm run build -- --configuration production

  sonarqube-quality-gate:
    name: SonarQube Quality Gate Audit
    needs: [backend-build-test, frontend-build-test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@v2
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

---

## 3. Padrão de Versionamento Semântico (SemVer)

* **`v0.1.0-alpha` (Meet 06):** Protótipo navegável inicial com tela de login e esqueleto das rotas.
* **`v0.5.0-beta` (Meet 12):** Versão homologada com dados reais e regras de negócio completas.
* **`v1.0.0` (Meet 16):** Versão final de produção apresentada na Feira de Extensão Senac.
