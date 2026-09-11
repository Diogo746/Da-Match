# 🚀 Fullstack Project Starter (Spring Boot 3 + Angular 22 Zoneless)

> **Unidade de Extensão: Fullstack (SENAC 2026.2)**  
> **Docente:** Prof. Fábio Chicout  
> **Servidor SonarQube:** [https://sonar.fchicout.dev](https://sonar.fchicout.dev)

---

## 🏛️ Visão Geral da Arquitetura

Este repositório contém o scaffolding padronizado e atualizado para o desenvolvimento dos projetos da Unidade de Extensão Fullstack:
- **Backend:** Java 21 LTS, Spring Boot 3.3, Spring Web, Spring Validation, Actuator, ArchUnit, Checkstyle (Linting) e JaCoCo (Cobertura de Código).
- **Frontend:** Angular 22 (Arquitetura 100% **Zoneless**, Reatividade com **Signals**, Detecção **OnPush**, runner moderno **Vitest**, linter **ESLint** e build com esbuild/Vite).
- **Quality, Supply Chain & Security Gates:**
  - **Linting:** Checkstyle (Java) + ESLint (Angular 22).
  - **SAST:** Análise estática com **Semgrep** (OWASP Top 10, Spring e TypeScript).
  - **Secret Scanning:** **Betterleaks** (detecção avançada de credenciais e tokens vazados).
  - **Supply Chain Security:** **Syft** (Geração de SBOM em formato SPDX) + **Grype** (Varredura de CVEs de dependências).
  - **Quality Gate:** SonarQube institucional (`sonar.fchicout.dev`) com padrão "Sonar way".
  - **DAST Diferenciado:**
    - **Staging / Branch `development`:** Varredura dinâmica com **ProjectDiscovery Nuclei**.
    - **Produção / Branch `main`:** Varredura dinâmica aprofundada com **OWASP ZAP Baseline Scan**.
- **CI/CD Automatizado:** Workflows no GitHub Actions com deploy condicional para **Staging** (branch `development`) e **Produção** (branch `main`).

---

## 🌳 Política de Branches & Fluxo Git Paralelo

Seguindo o fluxo profissional de integração contínua:
* `development`: Branch de integração ativa. Todo push dispara testes, lint, SAST, Betterleaks, Syft/Grype, SonarQube, DAST (Nuclei) e deploy no ambiente de **Staging**.
* `main`: Branch de entrega de versão estável. Todo push dispara validações completas, DAST (OWASP ZAP) e deploy no ambiente de **Produção**.
* `feature/*` ou `bugfix/*`: Branches de trabalho individuais dos desenvolvedores vinculadas a Issues, integradas via Pull Request para a branch `development`.

Consulte o passo a passo completo do fluxo de desenvolvimento no [GITHUB_SETUP_GUIDE.md](GITHUB_SETUP_GUIDE.md).

---

## ⚙️ Guia Passo a Passo: Provisionamento no SonarQube & Secrets do GitHub

Para que a esteira de CI/CD execute com sucesso o **Quality Gate do SonarQube (`sonar.fchicout.dev`)** e as travas de segurança, siga os passos abaixo antes de abrir o primeiro Pull Request:

### 1. Criando o Projeto no SonarQube Institucional
1. Acesse o servidor institucional: [**https://sonar.fchicout.dev**](https://sonar.fchicout.dev).
2. Faça login com suas credenciais institucionais fornecidas pelo professor.
3. No canto superior direito, clique em **Projects &rarr; Create Project &rarr; Manually**.
4. Configure as propriedades do projeto:
   - **Project display name:** Nome do projeto da sua equipe (ex: `Fullstack - Equipe DaMatch` ou `Fullstack - Equipe Azrael`).
   - **Project key:** Identificador único (ex: `senac-fullstack-damatch` ou `senac-fullstack-azrael`).
     *(Certifique-se de que este valor seja idêntico à propriedade `<sonar.projectKey>` no arquivo `pom.xml` da raiz).*
   - **Main branch name:** Defina como `main`.
5. Clique em **Set Up** e selecione a opção **With GitHub Actions**.
6. **Gere o Token de Autenticação:**
   - Acesse seu perfil (canto superior direito) &rarr; **My Account** &rarr; aba **Security**.
   - Em *Generate Tokens*, insira um nome (ex: `github-actions-token`), selecione o tipo **Project Analysis Token** (ou *User Token*) e o projeto associado.
   - Clique em **Generate** e copie o token hexadecimal gerado.

---

### 2. Cadastrando os Secrets no Repositório do GitHub
1. No repositório do seu time no GitHub (ex: `senac-fullstack-damatch`), acesse:
   **Settings &rarr; Secrets and variables &rarr; Actions**.
2. Clique no botão verde **New repository secret**.
3. Cadastre os seguintes segredos:

| Nome do Secret | Valor | Descrição |
| :--- | :--- | :--- |
| **`SONAR_TOKEN`** *(Obrigatório)* | Token copiado do SonarQube | Autentica a análise Maven no SonarQube e aguarda o Quality Gate. |
| **`SONAR_HOST_URL`** *(Opcional)* | `https://sonar.fchicout.dev` | Endpoint da instância SonarQube institucional. |

4. **Permissões do GitHub Actions:**
   - Acesse **Settings &rarr; Actions &rarr; General &rarr; Workflow permissions**.
   - Selecione a opção **Read and write permissions** e clique em **Save**. *(Isso permite o upload de relatórios SARIF de segurança e publicação de artefatos).*

---

### 3. Regras de Proteção de Branches (Branch Protection Rules)
Para evitar quebra de código acidental em produção e staging:
1. No GitHub, vá em **Settings &rarr; Branches &rarr; Add branch protection rule**.
2. Crie uma regra para `development` e outra para `main`:
   - Marque: **Require a pull request before merging** (mínimo de 1 aprovação de colega).
   - Marque: **Require status checks to pass before merging**:
     - `🧪 Lint & Automated Tests`
     - `🛡️ SonarQube Quality Gate`
     - `🔒 SAST - Semgrep Security Audit`
     - `📦 Supply Chain - Syft (SBOM) & Grype (CVEs)`
   - Marque: **Require branches to be up to date before merging**.

---

## 💻 Execução e Validação Local (Shift-Left)

Antes de abrir um Pull Request, valide localmente para garantir Zero Falhas na esteira:

### 1. Backend (Spring Boot 3 + Java 21)
```bash
# Executar análise de Checkstyle, testes JUnit 5 e relatório JaCoCo
mvn -B checkstyle:check test jacoco:report -f backend/pom.xml

# Executar a aplicação localmente
mvn clean spring-boot:run -f backend/pom.xml
```
* **Endpoint de Boas-Vindas:** `http://localhost:8080/api/v1/hello`
* **Endpoint de Healthcheck:** `http://localhost:8080/api/v1/health`
* **Relatório JaCoCo:** `backend/target/site/jacoco/index.html`

### 2. Frontend (Angular 22 Zoneless)
```bash
cd frontend

# Instalação limpa de dependências
npm ci

# Executar ESLint
npm run lint

# Executar testes unitários com Vitest
npm run test:coverage

# Compilar para produção com esbuild
npm run build

# Executar servidor de desenvolvimento local
npm start
```
* **Aplicação Web:** `http://localhost:4200`

