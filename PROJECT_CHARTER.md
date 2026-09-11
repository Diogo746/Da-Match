#  TERMO DE ABERTURA DO PROJETO INTEGRADOR (PI PROJECT CHARTER)

---

## 1. Identificação Geral do Projeto

| Campo                                   | Especificação                                    |
| :-------------------------------------- | :----------------------------------------------- |
| **Nome Oficial do Projeto**             | *DaMach*                                         |
| **Parceiro Comunitário / Cliente Real** | *Faculdade Senac*                                |
| **Semestre Letivo**                     | 2026.2 — 5º Período ADS (Faculdade Senac Recife) |
| **Data de Emissão do Charter**          | 21 de Agosto de 2026                             |
| **Repositório GitHub Oficial**          | `https://github.com/Diogo746/Projeto-Full-Stack` |

----

##  2. Matriz de Papéis & Equipe de Desenvolvimento (Scrum Roles)

| Nome do Estudante | E-mail Institucional                   | Papel Principal no PI (Scrum Role) | Responsabilidades no Projeto                                |
| :---------------- | :------------------------------------- | :--------------------------------- | :---------------------------------------------------------- |
| *Diogo Barbosa*   | *diogo.barbosa@edu.pe.senac.br*        | **Scrum Master DevOps Lead**       | Git Flow, CI/CD GitHub Actions & Quality Gate SonarQube     |
| *Mário Brandão*   | *jose.guimaraes@edu.pe.senac.br*       | **Full Stack Lead (Back-End)**     | Arquitetura REST Spring Boot, Security, LLDAP & SQLite3     |
| *Davi Maia*       | *DAVI.MAIA@edu.pe.senac.br*            | **Full Stack Lead (Front-End)**    | Interfaces Angular Standalone, RxJS, Forms & Acessibilidade |
| *Christopher*     | *christopher.carvalho@edu.pe.senac.br* | **Product Owner / Analyst**        | Gestão do BackLog, User Stories e ponte com o Cliente Real  |

---

## 3. Visão do Produto & Problema a Resolver

### 3.1 O Problema Real do Cliente
>Atualmente, o ecossistema do Porto Digital enfrenta dificuldades para centralizar e facilitar a comunicação entre startups nascentes, mentores e investidores-anjo. Muitas dessas conexões acontecem de maneira dispersa, por meio de eventos, indicações, redes sociais ou contatos informais, o que dificulta que uma startup encontre pessoas realmente compatíveis com sua área de atuação, seu estágio de desenvolvimento e suas necessidades.

Ao mesmo tempo, mentores e investidores podem ter dificuldade para localizar e analisar startups que estejam de acordo com suas áreas de experiência, interesses e critérios de investimento. A ausência de uma plataforma específica para organizar esses perfis, recomendar conexões e acompanhar os contatos realizados pode fazer com que boas oportunidades de mentoria, parceria e investimento não sejam aproveitadas.

### 3.2 A Solução Proposta
>O **DaMatch** será uma plataforma Web Full Stack responsiva para cadastrar e conectar startups ou projetos empreendedores a mentores e investidores interessados no ecossistema de inovação do Nordeste.

Ajudar startups e agentes do ecossistema de inovação a encontrar realmente compatíveis, reduzindo o tempo e o esforço necessário para descobrir e avaliar oportunidades de conexão.

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

##  ## 4. Declaração do Escopo (O que ESTÁ e o que NÃO ESTÁ incluso)

### O que ESTÁ Incluso no Escopo do Semestre (In-Scope)

-  Autenticação dos usuários por meio do LLDAP.
    
-  Autorização baseada nos grupos cadastrados no LLDAP, utilizando o modelo RBAC.
    
-  Integração entre LLDAP e Spring Security para autenticação e controle de acesso.
    
-  Cadastro de usuários no LLDAP realizado ou aprovado pelo administrador.
    
-  Associação dos usuários aos grupos de acesso do projeto (`admin`, `investidor` e `startup`).
    
-  Cadastro e gerenciamento do perfil de startups e projetos empreendedores.
    
-  Cadastro e gerenciamento do perfil de investidores, incluindo áreas de interesse, experiências, disponibilidade e critérios de investimento.
    
-  Implementação das regras de compatibilidade entre startups e investidores com base nos critérios definidos pela plataforma.
    
-  Geração e apresentação de recomendações e pontuações de compatibilidade entre os perfis cadastrados.
    
-  Exibição dos critérios responsáveis pela recomendação e pelo nível de compatibilidade entre os perfis.
    
-  Registro de interesse entre startups e investidores.
    
-  Criação e acompanhamento de conexões entre usuários quando houver interesse conforme as regras definidas pela plataforma.
    
-  Registro e acompanhamento de reuniões relacionadas às conexões realizadas.
    
-  Painel Dashboard reativo em Angular com informações e indicadores relacionados à utilização e ao impacto da plataforma.
    
-  Desenvolvimento de uma SPA Web responsiva utilizando Angular.
    
-  Desenvolvimento de uma API REST utilizando Spring Boot para centralização das regras de negócio e integração entre os componentes da aplicação.
    
-  Persistência dos dados de negócio em SQLite3, incluindo perfis, startups, preferências, matches, interesses e reuniões.
    
-  Separação entre os dados de autenticação e autorização, mantidos no LLDAP, e os dados de negócio, armazenados no SQLite3.
    
-  Pipeline CI/CD utilizando GitHub Actions para automação das etapas de integração, validação e entrega da aplicação.
    
-  Análise da qualidade do código e aprovação do Quality Gate no SonarQube (`sonar.fchicout.dev`).
    
-  Disponibilização do ambiente de Staging para homologação e validação com o cliente real.
    
-  Deploy final da aplicação em ambiente de Produção.
    

### O que NÃO ESTÁ Incluso (Out-of-Scope)

-  Aplicativo nativo para dispositivos móveis (iOS / Android) — a solução será desenvolvida como uma SPA Web responsiva.
    
-  Integração com gateways de pagamento ou instituições financeiras reais — funcionalidades relacionadas a pagamentos ou investimentos financeiros utilizarão apenas dados simulados ou mocks.
    
-  Realização de investimentos, transferências financeiras ou movimentações monetárias dentro da plataforma.
    
-  Formalização, assinatura ou validação jurídica de contratos entre startups, investidores ou outras partes.
    
-  Garantia de investimento, parceria ou sucesso de uma conexão gerada pelo sistema — as recomendações representam apenas resultados baseados nos critérios de compatibilidade definidos pela aplicação.
    
-  Atuação da plataforma como corretora, intermediadora financeira ou responsável pelas negociações realizadas entre os usuários.

---

## 5. Mapeamento de Perfis de Acesso LLDAP (RBAC)

| Grupo no LLDAP | DN do Grupo             | Authority no Spring Security | Perfil de Usuário                                             | Nível de Acesso       | Principais Permissões e Responsabilidades                                                                                                                                                                                                                                                                                                                         |
| -------------- | ----------------------- | ---------------------------- | ------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin`        | `cn=damatch_admin`      | `ROLE_ADMIN`                 | Administrador do Sistema                                      | Administrativo        | Responsável pela administração da plataforma. Pode realizar ou aprovar o cadastro de usuários no LLDAP, associar usuários aos grupos de acesso, gerenciar informações administrativas e acessar funcionalidades restritas necessárias à operação e governança do sistema.                                                                                         |
| `investidor`   | `cn=damatch_investidor` | `ROLE_INVESTIDOR`            | Investidor ou agente interessado em oportunidades de inovação | Usuário Especializado | Pode cadastrar e gerenciar seu perfil profissional, incluindo áreas de interesse, experiências e critérios de investimento. Pode consultar startups compatíveis, visualizar informações relevantes para avaliação, demonstrar interesse em conexões e participar do processo de agendamento e acompanhamento de reuniões.                                         |
| `startup`      | `cn=damatch_startup`    | `ROLE_STARTUP`               | Startup ou Projeto Empreendedor                               | Usuário Especializado | Pode cadastrar e gerenciar o perfil da startup ou projeto empreendedor, incluindo setor de atuação, estágio de desenvolvimento, modelo de negócio, localização, objetivo da conexão e apresentação do projeto. Pode receber recomendações de investidores compatíveis, demonstrar interesse em conexões e participar do agendamento e acompanhamento de reuniões. |


---

##  6. Marcos de Entrega & Releases (Milestones)

| Milestone / Tag                      | Data Alvo   | Entregável Principal                                                      |
| :----------------------------------- | :---------- | :------------------------------------------------------------------------ |
| **Baseline (Meet 03)**               | 28/Ago/2026 | Project Charter assinado + Modelagem Relacional SQLite3 (`extensao.db`).  |
| **Release `v0.1.0-alpha` (Meet 06)** | 19/Set/2026 | Protótipo Navegável Angular + Arquitetura Spring Boot + Pipeline CI/CD.   |
| **Release `v0.5.0-beta` (Meet 12)**  | 31/Out/2026 | MVP Funcional homologado em Staging com o Cliente Real.                   |
| **Release `v1.0.0` (Meet 16)**       | 28/Nov/2026 | Deploy em Produção + Quality Gate SonarQube Verde + Pitch na Banca do PI. |

---

##  7. Assinatura do Project Charter

Ao commitar este arquivo na branch `main`, todos os membros da equipe confirmam o compromisso com o escopo, governança de código e entregas do Projeto Integrador.

- **Data:** ____ / ____ / 2026  
- **Equipe:** *[Nomes dos Integrantes]*
