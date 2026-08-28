
# 📋 TERMO DE ABERTURA DO PROJETO INTEGRADOR (PI PROJECT CHARTER)

---

## 🏛️ 1. Identificação Geral do Projeto

| Campo                                   | Especificação                                    |
| :-------------------------------------- | :----------------------------------------------- |
| **Nome Oficial do Projeto**             | *DaMach*                                         |
| **Parceiro Comunitário / Cliente Real** | *Faculdade Senac*                                |
| **Semestre Letivo**                     | 2026.2 — 5º Período ADS (Faculdade Senac Recife) |
| **Data de Emissão do Charter**          | 21 de Agosto de 2026                             |
| **Repositório GitHub Oficial**          | `https://github.com/Diogo746/Projeto-Full-Stack` |

---

## 👥 2. Matriz de Papéis & Equipe de Desenvolvimento (Scrum Roles)

| Nome do Estudante | E-mail Institucional             | Papel Principal no PI (Scrum Role) | Responsabilidades no Projeto                                |
| :---------------- | :------------------------------- | :--------------------------------- | :---------------------------------------------------------- |
| *Diogo Barbosa*   | *diogo.barbosa@edu.pe.senac.br*  | **Scrum Master DevOps Lead**       | Git Flow, CI/CD GitHub Actions & Quality Gate SonarQube     |
| *Mário Brandão*   | *jose.guimaraes@edu.pe.senac.br* | **Full Stack Lead (Back-End)**     | Arquitetura REST Spring Boot, Security, LLDAP & SQLite3     |
| *Davi Maia*       | *DAVI.MAIA@edu.pe.senac.br*      | **Full Stack Lead (Front-End)**    | Interfaces Angular Standalone, RxJS, Forms & Acessibilidade |
| *Christopher*     | *[email4@senacpe.edu.br]*        | **Product Owner / Analyst**        | Gestão do BackLog, User Stories e ponte com o Cliente Real  |

---

## 🎯 3. Visão do Produto & Problema a Resolver

### 3.1 O Problema Real do Cliente
>Atualmente, o ecossistema do Porto Digital enfrenta dificuldades para centralizar e facilitar a comunicação entre startups nascentes, mentores e investidores-anjo. Muitas dessas conexões acontecem de maneira dispersa, por meio de eventos, indicações, redes sociais ou contatos informais, o que dificulta que uma startup encontre pessoas realmente compatíveis com sua área de atuação, seu estágio de desenvolvimento e suas necessidades.

Ao mesmo tempo, mentores e investidores podem ter dificuldade para localizar e analisar startups que estejam de acordo com suas áreas de experiência, interesses e critérios de investimento. A ausência de uma plataforma específica para organizar esses perfis, recomendar conexões e acompanhar os contatos realizados pode fazer com que boas oportunidades de mentoria, parceria e investimento não sejam aproveitadas.

### 3.2 A Solução Proposta
>O **DaMatch** será uma plataforma Web Full Stack responsiva para cadastrar e conectar startups ou projetos empreendedores a mentores e investidores interessados no ecossistema de inovação do Nordeste.

Cada startup poderá cadastrar seu perfil, setor de atuação, estágio de desenvolvimento, modelo de negócio, localização, objetivo da conexão e uma apresentação resumida do projeto. Mentores e investidores poderão informar suas áreas de interesse, experiências, disponibilidade e critérios para receber recomendações.

A plataforma utilizará regras objetivas para calcular a compatibilidade entre os perfis. O resultado será apresentado em forma de pontuação, acompanhado dos critérios responsáveis pela recomendação, como:

- Compatibilidade do setor de atuação;
- Estágio atual da startup;
- Tipo de apoio procurado;
- Área de experiência do mentor;
- Faixa de investimento;
- Localização;
- Disponibilidade;
- Modelo de negócio.

Quando os dois lados demonstrarem interesse, a plataforma criará uma conexão e permitirá o registro de uma reunião. O NexoNE acompanhará o status dessa conexão, sem realizar investimentos, contratos ou movimentações financeiras dentro do sistema.

A autenticação e a autorização serão realizadas pelo **LLDAP**. O LLDAP armazenará as credenciais e os grupos de acesso, enquanto o SQLite3 armazenará os dados de negócio, como perfis, startups, preferências, matches, interesses e reuniões.

---

## 🚫 4. Declaração do Escopo (O que ESTÁ e o que NÃO ESTÁ incluso)

### 🟢 O que ESTÁ Incluso no Escopo do Semestre (In-Scope)
- [ ] Autenticação dos usuários por meio do LLDAP.
- [ ] Autorização baseada nos grupos cadastrados no LLDAP.
- [ ] Painel Dashboard reativo em Angular com indicadores de impacto social.
- [ ] Integração entre LLDAP e Spring Security
- [ ] Cadastro de usuários no LLDAP realizado ou aprovado pelo administrador.
- [ ] Associação dos usuários aos grupos de acesso do projeto.
- [ ] Cadastro e gerenciamento do perfil de startups e projetos empreendedores.
- [ ] Pipeline CI/CD com Quality Gate aprovado no SonarQube (`sonar.fchicout.dev`).
- [ ] Homologação em Staging e Deploy final em Produção.

### 🔴 O que NÃO ESTÁ Incluso (Out-of-Scope)
- Aplicativo nativo mobile (iOS / Android) — a solução é uma SPA Web Responsiva.
- Integração com gateways de pagamento bancário real (serão utilizados mocks).

---

## 🔐 5. Mapeamento de Perfis de Acesso LLDAP (RBAC)

| Grupo LLDAP                 | Nome da Role Spring Security | Descrição do Nível de Acesso                                                       |
| :-------------------------- | :--------------------------- | :--------------------------------------------------------------------------------- |
| `cn=[projeto]_admin`        | `ROLE_ADMIN`                 | Acesso total, configurações do sistema, relatórios sensíveis e gestão de usuários. |
| `cn=[projeto]_operador`     | `ROLE_OPERADOR`              | Lançamento diário de dados, cadastro de itens e fluxo de atendimento operacional.  |
| `cn=[projeto]_beneficiario` | `ROLE_BENEFICIARIO`          | Visualização pública, consulta de agenda/status e solicitação de serviços.         |

---

## 🚩 6. Marcos de Entrega & Releases (Milestones)

| Milestone / Tag | Data Alvo | Entregável Principal |
| :--- | :--- | :--- |
| **Baseline (Meet 03)** | 28/Ago/2026 | Project Charter assinado + Modelagem Relacional SQLite3 (`extensao.db`). |
| **Release `v0.1.0-alpha` (Meet 06)** | 19/Set/2026 | Protótipo Navegável Angular + Arquitetura Spring Boot + Pipeline CI/CD. |
| **Release `v0.5.0-beta` (Meet 12)** | 31/Out/2026 | MVP Funcional homologado em Staging com o Cliente Real. |
| **Release `v1.0.0` (Meet 16)** | 28/Nov/2026 | Deploy em Produção + Quality Gate SonarQube Verde + Pitch na Banca do PI. |

---

## ✍️ 7. Assinatura do Project Charter

Ao commitar este arquivo na branch `main`, todos os membros da equipe confirmam o compromisso com o escopo, governança de código e entregas do Projeto Integrador.

- **Data:** ____ / ____ / 2026  
- **Equipe:** *[Nomes dos Integrantes]*
