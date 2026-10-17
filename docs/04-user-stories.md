# 04 — Backlog de Histórias de Usuário (User Stories)

**Padrão:** histórias no formato INVEST, com critérios de aceitação em **Dado / Quando / Então**.

**Base:** [Documentação de Requisitos v1.0](DaMatch-Documentacao-de-Requisitos-v1.0.pdf) (DAMATCH-SRS-001). Cada história indica os requisitos (RF), regras (RN) e critérios (CA) de onde veio.

**Prioridade:** P1 = essencial para o MVP; P2 = desejável.

---

## 🎯 Épico 1: Acesso à plataforma (ACESSO)

### 🔹 `US-01`: Solicitar acesso
* **Como** startup, mentor ou investidor interessado,
* **Quero** pedir acesso informando nome, e-mail e o perfil que pretendo usar,
* **Para que** eu possa participar do DaMatch depois de ser aprovado.

> **Critérios de aceitação:**
> * **Cenário 1 (Solicitação válida):**
>   * **Dado** que informei dados válidos e não tenho outra solicitação com o mesmo e-mail,
>   * **Quando** envio a solicitação,
>   * **Então** recebo um protocolo, a solicitação fica PENDENTE e eu ainda não acesso as áreas protegidas.
> * **Cenário 2 (E-mail repetido):**
>   * **Dado** que já existe solicitação pendente ou aprovada para o meu e-mail (sem diferenciar maiúsculas),
>   * **Quando** tento enviar de novo,
>   * **Então** o sistema não cria uma segunda solicitação.
* *Prioridade:* P1 · *Rastreabilidade:* RF01, RN01, RN03, CA01.

---

### 🔹 `US-02`: Aprovar ou rejeitar solicitações
* **Como** administrador,
* **Quero** analisar as solicitações pendentes e aprovar ou rejeitar cada uma,
* **Para que** só pessoas revisadas entrem na plataforma, cada uma com o perfil certo.

> **Critérios de aceitação:**
> * **Cenário 1 (Aprovação):**
>   * **Dado** que a identidade e o grupo do usuário foram confirmados no LLDAP,
>   * **Quando** concluo a aprovação,
>   * **Então** o usuário fica ativo apenas com o papel solicitado.
> * **Cenário 2 (Rejeição):**
>   * **Dado** que decidi rejeitar uma solicitação,
>   * **Quando** confirmo a rejeição,
>   * **Então** o sistema exige um motivo e registra a decisão.
> * **Cenário 3 (Vínculo falhou):**
>   * **Dado** que o vínculo com o LLDAP não foi confirmado,
>   * **Quando** tento ativar a conta,
>   * **Então** o usuário continua sem acesso.
* *Prioridade:* P1 · *Rastreabilidade:* RF02, RN01–RN04, CA02.

---

### 🔹 `US-03`: Entrar na plataforma
* **Como** usuário aprovado,
* **Quero** entrar com minhas credenciais,
* **Para que** eu acesse as telas do meu perfil (startup, mentor ou investidor).

> **Critérios de aceitação:**
> * **Cenário 1 (Login válido):**
>   * **Dado** que minha conta está ativa e tem um papel permitido,
>   * **Quando** informo credenciais corretas,
>   * **Então** a sessão é criada e vejo a área do meu perfil.
> * **Cenário 2 (Credencial inválida):**
>   * **Dado** que informei senha errada ou um usuário que não existe,
>   * **Quando** tento entrar,
>   * **Então** o acesso é negado com uma mensagem que não revela se a conta existe.
> * **Cenário 3 (Conta suspensa ou LLDAP fora do ar):**
>   * **Dado** que minha conta está suspensa ou o diretório está indisponível,
>   * **Quando** tento entrar,
>   * **Então** o acesso é negado sem mostrar detalhes internos do sistema.
* *Prioridade:* P1 · *Rastreabilidade:* RF03, RN02, RN04, RN05, CA03, CA04.

---

### 🔹 `US-04`: Sair da plataforma
* **Como** usuário autenticado,
* **Quero** encerrar minha sessão,
* **Para que** ninguém use minha conta depois de mim, principalmente em computador compartilhado.

> **Critérios de aceitação:**
> * **Cenário 1 (Logout):**
>   * **Dado** que estou logado,
>   * **Quando** clico em "Sair",
>   * **Então** volto para a tela de acesso e os dados da sessão são apagados da interface.
> * **Cenário 2 (Sessão encerrada de verdade):**
>   * **Dado** que saí da plataforma,
>   * **Quando** alguém repete uma chamada protegida com a sessão antiga, mesmo fora da interface,
>   * **Então** a API recusa a chamada.
* *Prioridade:* P1 · *Rastreabilidade:* RF04, RN05, CA04.

---

### 🔹 `US-05`: Ver e alterar só o que é meu
* **Como** participante (startup, mentor ou investidor),
* **Quero** que o sistema só me deixe ver e alterar o que meu papel permite,
* **Para que** meus dados e os dos outros fiquem protegidos.

> **Critérios de aceitação:**
> * **Cenário 1 (Recurso de outra pessoa):**
>   * **Dado** que estou logado,
>   * **Quando** tento consultar ou alterar o perfil, interesse ou conexão de outra pessoa direto pela API,
>   * **Então** a operação é recusada e nenhum dado dela é retornado.
> * **Cenário 2 (Botão escondido não basta):**
>   * **Dado** que uma ação não aparece na tela para o meu papel,
>   * **Quando** chamo o endpoint dessa ação manualmente,
>   * **Então** o backend também bloqueia.
* *Prioridade:* P1 · *Rastreabilidade:* RF05, RN04–RN06, RN20, RN21, RN29, CA02, CA04, CA08, CA26.

---

> ⚠️ **Ponto de atenção para o time:** o SRS define acesso por **solicitação + aprovação do administrador** (US-01/US-02), com senha guardada no LLDAP. Hoje o backend tem cadastro direto com senha criptografada no banco (`UsuarioService`) e o protótipo do frontend também simula cadastro com senha. É preciso decidir qual fluxo vale para o MVP.
