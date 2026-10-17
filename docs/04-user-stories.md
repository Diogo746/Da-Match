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

---

## 🎯 Épico 2: Perfis dos participantes (PERFIL)

### 🔹 `US-06`: Cadastrar o perfil da startup
* **Como** representante de uma startup em ideação,
* **Quero** cadastrar nome, resumo, setor, estágio, modelo de negócio, cidade/UF e o tipo de apoio que procuro,
* **Para que** mentores e investidores compatíveis encontrem meu projeto.

> **Critérios de aceitação:**
> * **Cenário 1 (Publicação completa):**
>   * **Dado** que preenchi todos os campos obrigatórios e pelo menos um objetivo (mentoria e/ou investimento),
>   * **Quando** publico o perfil,
>   * **Então** ele fica PUBLICADO e passa a aparecer na descoberta.
> * **Cenário 2 (Campos faltando):**
>   * **Dado** que escolhi mentoria mas não informei necessidades, formatos ou disponibilidade,
>   * **Quando** tento publicar,
>   * **Então** a publicação é recusada e o sistema lista o que falta.
* *Prioridade:* P1 · *Rastreabilidade:* RF06, RN07, RN08, CA05.

---

### 🔹 `US-07`: Cadastrar o perfil do mentor
* **Como** mentor,
* **Quero** informar minha apresentação, setores, áreas de experiência, estágios que já acompanhei, formatos de mentoria, cidade/UF e disponibilidade,
* **Para que** o sistema me indique startups que eu realmente consigo ajudar.

> **Critérios de aceitação:**
> * **Cenário 1 (Perfil completo):**
>   * **Dado** que preenchi todos os campos obrigatórios,
>   * **Quando** publico o perfil,
>   * **Então** fico elegível para recomendações de mentoria.
> * **Cenário 2 (Rascunho):**
>   * **Dado** que faltam campos obrigatórios,
>   * **Quando** salvo o perfil,
>   * **Então** ele fica em RASCUNHO e não aparece na descoberta.
* *Prioridade:* P1 · *Rastreabilidade:* RF07, RN07, RN10, CA06.

---

### 🔹 `US-08`: Cadastrar o perfil do investidor
* **Como** investidor,
* **Quero** informar setores e estágios de interesse, faixa de investimento, formatos de atendimento e cidade/UF,
* **Para que** eu receba startups dentro do que costumo avaliar.

> **Critérios de aceitação:**
> * **Cenário 1 (Faixa válida):**
>   * **Dado** que informei uma faixa em reais com mínimo menor ou igual ao máximo,
>   * **Quando** publico o perfil,
>   * **Então** a faixa é salva e passa a ser usada no matching.
> * **Cenário 2 (Faixa inválida):**
>   * **Dado** que informei mínimo maior que o máximo ou valor zero/negativo,
>   * **Quando** tento salvar,
>   * **Então** o sistema recusa e mantém os dados anteriores.
* *Prioridade:* P1 · *Rastreabilidade:* RF08, RN09, CA07.
* *Observação:* a faixa é só critério de descoberta. A plataforma não movimenta dinheiro.

---

### 🔹 `US-09`: Editar meu perfil
* **Como** participante,
* **Quero** alterar os dados do meu perfil e ver a confirmação de que foi salvo,
* **Para que** minhas informações e recomendações fiquem atualizadas.

> **Critérios de aceitação:**
> * **Cenário 1 (Edição válida):**
>   * **Dado** que alterei um campo com valor válido,
>   * **Quando** salvo,
>   * **Então** a mudança continua lá quando abro o perfil de novo e as recomendações antigas deixam de valer.
> * **Cenário 2 (Perfil de outra pessoa):**
>   * **Dado** que conheço o identificador do perfil de outro usuário,
>   * **Quando** tento editá-lo pela API,
>   * **Então** a alteração é recusada.
* *Prioridade:* P1 · *Rastreabilidade:* RF09, RN06, RN07, CA08.

---

### 🔹 `US-10`: Saber o que falta no meu perfil
* **Como** participante,
* **Quero** ver quais campos obrigatórios ainda faltam e por que meu perfil não está aparecendo,
* **Para que** eu consiga completá-lo sem adivinhar.

> **Critérios de aceitação:**
> * **Cenário 1 (Perfil incompleto):**
>   * **Dado** que meu perfil está em rascunho,
>   * **Quando** abro a tela do perfil,
>   * **Então** vejo a lista de campos pendentes e o aviso de que ainda não apareço nas recomendações.
> * **Cenário 2 (Salvar rascunho):**
>   * **Dado** que ainda não tenho todas as informações,
>   * **Quando** salvo o que preenchi,
>   * **Então** o rascunho é guardado sem ser publicado.
* *Prioridade:* P1 · *Rastreabilidade:* RF10, RN07, RN08, RN10, CA05, CA06, CA07.

---

### 🔹 `US-11`: Ajustar minhas preferências de conexão
* **Como** participante,
* **Quero** atualizar objetivos, interesses e formatos de encontro, sabendo quais deles influenciam as recomendações,
* **Para que** as indicações acompanhem o momento atual do meu projeto ou da minha agenda.

> **Critérios de aceitação:**
> * **Cenário 1 (Preferências salvas):**
>   * **Dado** que alterei minhas preferências,
>   * **Quando** saio e entro de novo,
>   * **Então** elas continuam salvas e são usadas na próxima consulta de recomendações.
* *Prioridade:* P1 · *Rastreabilidade:* RF11, RN11, CA09.

---

> ⚠️ **Ponto de atenção para o time:** a entidade `Mentor` da branch `feature/database-models` tem biografia, LinkedIn, Instagram e site. Ainda faltam os campos obrigatórios do SRS para o mentor entrar no matching (setores, áreas de experiência, estágios, formatos, cidade/UF e disponibilidade). Startup e investidor ainda não têm entidade.
