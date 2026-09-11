# 03 — Especificação de Casos de Uso (Use Cases)

**Padrão:** Especificações formais no padrão **Alistair Cockburn (Fully-Dressed)**.  

---

## 📌 `UC-01`: Autenticar Usuário no Sistema

* **Ator Principal:** Usuário do Sistema (Gestor ou Operador Voluntário).
* **Pré-condições:** O usuário possui cadastro ativo no servidor LLDAP da instituição.
* **Pós-condições:** Usuário autenticado com token JWT emitido e redirecionado para o painel correspondente ao seu perfil.
* **Requisitos Rastreados:** `REQ-AUTH-01`, `REQ-AUTH-02`.

### Fluxo Principal (Caminho Feliz):
1. O usuário acessa a URL do sistema e visualiza a tela de login.
2. O usuário informa seu identificador de usuário e senha.
3. O frontend valida o preenchimento dos campos e envia a requisição para o endpoint `/api/auth/login`.
4. O backend realiza o bind no servidor LLDAP e recupera os grupos de permissão do usuário.
5. O backend gera o token JWT assinado contendo os papéis de acesso e retorna código HTTP `200 OK`.
6. O frontend armazena o token de forma segura e redireciona o usuário para o Dashboard.

### Fluxos Alternativos & Exceções:
* **3a. Credenciais Inválidas:** Se o LLDAP rejeitar o bind por senha incorreta, o backend retorna HTTP `401 Unauthorized` e o frontend exibe a mensagem amigável: *"Usuário ou senha incorretos."*
* **3b. Servidor LLDAP Indisponível:** Se a conexão com o LLDAP falhar, o backend retorna HTTP `503 Service Unavailable` e registra log de erro estruturado.

---

## 📌 `UC-02`: [Nome do Caso de Uso Principal. Ex: Cadastrar Nova Doação]

* **Ator Principal:** [Ex: Operador Voluntário].
* **Pré-condições:** [Ex: Operador autenticado com papel `ROLE_OPERADOR`].
* **Pós-condições:** [Ex: Registro persistido no SQLite e saldo atualizado no painel].
* **Requisitos Rastreados:** `REQ-CORE-01`, `REQ-CORE-02`.

### Fluxo Principal:
1. O operador clica no botão "Novo Registro" no menu lateral.
2. O sistema exibe o formulário de cadastro com os campos obrigatórios.
3. O operador preenche os dados e aciona o botão "Salvar".
4. O frontend valida a conformidade dos campos e envia payload JSON para o backend.
5. O backend processa a regra de negócio, persiste a transação no SQLite e retorna HTTP `201 Created`.
6. O sistema exibe notificação de sucesso e atualiza a listagem.
