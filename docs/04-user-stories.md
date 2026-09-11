# 04 — Backlog de Histórias de Usuário (User Stories)

**Padrão:** Backlog Ágil refinado no padrão **INVEST** (Independent, Negotiable, Valuable, Estimable, Small, Testable) com critérios de aceitação no formato **Given / When / Then (GWT)**.  

---

## 🎯 Épico 1: Autenticação, Identidade & Controle de Acesso (AUTH)

### 🔹 `US-01`: Login Unificado com Credenciais LLDAP
* **Como** colaborador ou voluntário da organização parceira,
* **Quero** autenticar-me na plataforma utilizando minhas credenciais corporativas LLDAP,
* **Para que** eu não precise memorizar senhas avulsas e tenha acesso seguro às minhas funções.

> **Critérios de Aceitação (GWT):**
> * **Cenário 1 (Login com sucesso):**  
>   * **Dado** que sou um usuário ativo no diretório LLDAP,  
>   * **Quando** eu informo meu usuário e senha corretos na tela de login,  
>   * **Então** recebo meu token JWT e sou direcionado ao Dashboard do meu perfil.
> * **Cenário 2 (Senha incorreta):**  
>   * **Dado** que insiro uma senha divergente do LLDAP,  
>   * **Quando** aciono o botão "Entrar",  
>   * **Então** o sistema exibe a mensagem de erro *"Credenciais inválidas"* sem expor detalhes internos.
* *Rastreabilidade:* `UC-01`, `REQ-AUTH-01`.

---

### 🔹 `US-02`: Segregação de Telas por Papel de Acesso (RBAC)
* **Como** gestor da ONG,
* **Quero** que voluntários operadores não tenham acesso às configurações administrativas e relatórios financeiros,
* **Para que** os dados sensíveis da instituição sejam preservados conforme as regras de governança.

> **Critérios de Aceitação (GWT):**
> * **Cenário 1 (Acesso de Gestor):**  
>   * **Dado** que estou autenticado com a role `ROLE_GESTOR`,  
>   * **Quando** navego pela aplicação,  
>   * **Então** visualizo as abas de "Administração" e "Relatórios Gerenciais".
> * **Cenário 2 (Tentativa de acesso por Operador):**  
>   * **Dado** que estou autenticado com a role `ROLE_OPERADOR`,  
>   * **Quando** tento acessar a URL `/admin` diretamente,  
>   * **Então** o Route Guard do Angular bloqueia a navegação e me redireciona para a página de acesso negado (HTTP 403).
* *Rastreabilidade:* `UC-01`, `REQ-AUTH-02`.

---

## 🎯 Épico 2: Gestão Operacional & Fluxo Central do Parceiro (CORE)

### 🔹 `US-03`: [Título da US Principal 1. Ex: Cadastro Rápido de Beneficiário]
* **Como** [Papel do Ator],
* **Quero** [Ação pretendida no sistema],
* **Para que** [Benefício real e mensurável para a operação].

> **Critérios de Aceitação (GWT):**
> * **Cenário 1 (Cadastro válido):**  
>   * **Dado** que todos os campos obrigatórios estão preenchidos corretamente,  
>   * **Quando** clico em "Salvar Beneficiário",  
>   * **Então** o registro é salvo no banco de dados e vejo um toast de sucesso.
> * **Cenário 2 (CPF duplicado):**  
>   * **Dado** que informo um CPF já existente na base,  
>   * **Quando** tento submeter o formulário,  
>   * **Então** o backend rejeita com HTTP 409 e o formulário destaca o campo duplicado.
* *Rastreabilidade:* `UC-02`, `REQ-CORE-01`.

---

### 🔹 `US-04`: [Título da US Principal 2. Ex: Registro e Baixa de Doações]
* **Como** [Papel do Ator],
* **Quero** [Ação pretendida],
* **Para que** [Benefício].

> **Critérios de Aceitação (GWT):**
> * **Cenário 1 (Baixa com saldo suficiente):**  
>   * **Dado** que há estoque disponível do item solicitado,  
>   * **Quando** confirmo a entrega ao beneficiário,  
>   * **Então** a quantidade é subtraída do estoque e o histórico é registrado.
* *Rastreabilidade:* `REQ-CORE-03`.

---

### 🔹 `US-05`: [Título da US Principal 3. Ex: Emissão de Relatório Mensal]
* **Como** gestor da organização parceira,
* **Quero** gerar um relatório consolidado das atividades do mês em formato PDF,
* **Para que** eu possa prestar contas aos órgãos reguladores e à comunidade do impacto social realizado.

> **Critérios de Aceitação (GWT):**
> * **Cenário 1 (Geração de relatório):**  
>   * **Dado** que selecionei o mês e ano desejados,  
>   * **Quando** clico em "Exportar PDF",  
>   * **Então** o sistema faz o download de um documento formatado contendo os totais de atendimentos.
* *Rastreabilidade:* `REQ-REP-01`.
