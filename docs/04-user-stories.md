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

---

## 🎯 Épico 3: Descoberta de perfis (DESCOBERTA)

### 🔹 `US-12`: Pesquisar startups
* **Como** mentor ou investidor,
* **Quero** buscar startups por nome e filtrar por setor, estágio e localização,
* **Para que** eu encontre projetos dentro da minha área sem depender só das recomendações.

> **Critérios de aceitação:**
> * **Cenário 1 (Filtros combinados):**
>   * **Dado** que existem startups de setores, estágios e cidades diferentes,
>   * **Quando** combino filtros (ex.: Tecnologia + Ideação + Recife),
>   * **Então** aparecem só as startups publicadas que atendem a todos os filtros, em páginas de até 20 itens.
> * **Cenário 2 (Nada encontrado):**
>   * **Dado** que nenhuma startup atende aos filtros,
>   * **Quando** faço a busca,
>   * **Então** o sistema mostra claramente que não há resultados.
* *Prioridade:* P1 · *Rastreabilidade:* RF12, RN12, RN13, CA10.

---

### 🔹 `US-13`: Pesquisar mentores
* **Como** startup,
* **Quero** buscar mentores por nome, setor, área de experiência, formato e localização,
* **Para que** eu escolha quem pode me orientar no próximo passo.

> **Critérios de aceitação:**
> * **Cenário 1 (Resultado filtrado):**
>   * **Dado** que apliquei filtros de setor e formato,
>   * **Quando** vejo a lista,
>   * **Então** aparecem só mentores publicados e ativos que atendem aos filtros.
> * **Cenário 2 (Perfil indisponível):**
>   * **Dado** que um mentor está em rascunho ou suspenso,
>   * **Quando** faço qualquer busca,
>   * **Então** ele não aparece.
* *Prioridade:* P1 · *Rastreabilidade:* RF13, RN12, RN13, CA11, CA12.

---

### 🔹 `US-14`: Pesquisar investidores
* **Como** startup,
* **Quero** buscar investidores por setor, estágio de interesse, faixa de investimento, formato e localização,
* **Para que** eu saiba quem costuma investir em projetos como o meu.

> **Critérios de aceitação:**
> * **Cenário 1 (Filtro por faixa):**
>   * **Dado** que filtrei por uma faixa de investimento,
>   * **Quando** vejo a lista,
>   * **Então** aparecem só investidores cuja faixa tem interseção com a que filtrei.
> * **Cenário 2 (Busca não é conexão):**
>   * **Dado** que encontrei um investidor na busca,
>   * **Quando** abro o resultado,
>   * **Então** nenhum interesse ou conexão é criado automaticamente.
* *Prioridade:* P1 · *Rastreabilidade:* RF14, RN09, RN12, RN13, CA11.

---

### 🔹 `US-15`: Ver o perfil de um participante
* **Como** participante,
* **Quero** abrir o perfil de alguém que encontrei na busca ou nas recomendações,
* **Para que** eu decida se vale demonstrar interesse.

> **Critérios de aceitação:**
> * **Cenário 1 (Só dados públicos):**
>   * **Dado** que abri um perfil publicado,
>   * **Quando** vejo os detalhes,
>   * **Então** aparecem apresentação e campos de descoberta, sem e-mail de login, grupos ou dados administrativos.
> * **Cenário 2 (Contato protegido):**
>   * **Dado** que ainda não tenho conexão ativa com a pessoa,
>   * **Quando** abro o perfil dela,
>   * **Então** os dados de contato não aparecem.
* *Prioridade:* P1 · *Rastreabilidade:* RF15, RN12, RN29, CA10, CA11, CA12.

---

> ⚠️ **Ponto de atenção para o time:** pelo SRS (RN12), startup só pesquisa mentores e investidores, e mentor/investidor só pesquisa startups. O protótipo atual mostra as abas "Todos / Mentores / Startups" para qualquer usuário. Na integração com o backend, a tela precisa respeitar o papel de quem está logado.

---

## 🎯 Épico 4: Matching e recomendações (MATCH)

> Mentoria: regra **damatch-mentoria-v1**, definida pelo usuário em 30/10/2026 no [guia 29](29-matching-rule-decisions.md). Nota interna de 0 a 100, corte inclusivo 60, até 20 indicações após ordenação; participante recebe somente ordem e selo Super DaMatch a partir de 95. O SRS anterior deve ser atualizado na próxima revisão formal. Investimento continua em entrega própria; não aplicar esta regra automaticamente a investidores. A pontuação não é probabilidade estatística nem garantia de mentoria.

### 🔹 `US-16`: Receber recomendações de mentoria
* **Como** startup que busca mentoria (ou mentor procurando startups),
* **Quero** receber uma lista de perfis compatíveis, ordenada pela pontuação,
* **Para que** eu comece pelas conexões com mais chance de fazer sentido.

> **Critérios de aceitação:**
> * **Cenário 1 (Prioridade da ajuda):**
>   * **Dado** um par elegível com duas necessidades da startup, somente a principal atendida com prática e todos os demais critérios completos,
>   * **Quando** a recomendação é calculada,
>   * **Então** a nota interna é **85**; caso só a secundária seja atendida com prática, é **65**. Ambos aparecem sem selo e sem nota no JSON do participante.
> * **Cenário 2 (Corte):**
>   * **Dado** candidatos elegíveis com notas internas exatas 59,5 e 60,
>   * **Quando** a lista é montada,
>   * **Então** o de 59,5 fica de fora e o de 60 aparece, sem arredondamento prévio e sem reduzir o corte para preencher a lista.
> * **Cenário 3 (Perfil inelegível):**
>   * **Dado** um mentor sem formato de encontro em comum comigo,
>   * **Quando** a lista é calculada,
>   * **Então** ele é excluído antes da pontuação.
> * **Cenário 4 (Agenda sem interseção):**
>   * **Dado** um par elegível, com duas necessidades atendidas com prática e demais critérios completos, mas sem dia/período em comum,
>   * **Quando** consulto as indicações,
>   * **Então** sua nota interna é **90**, aparece sem selo e orienta que os horários precisam ser combinados; não cria reserva nem reunião.
> * **Cenário 5 (Frequência):**
>   * **Dado** frequências fixas diferentes,
>   * **Quando** o par é avaliado,
>   * **Então** é excluído; frequências iguais ou alguma `FLEXIBLE` passam por esse filtro.
> * **Cenário 6 (Empates):**
>   * **Dado** candidatos com a mesma nota,
>   * **Quando** a lista é ordenada,
>   * **Então** prevalecem, nesta ordem, mais necessidades atendidas, mais dessas necessidades com prática, agenda em comum e UUID textual crescente do candidato; consultas iguais mantêm a ordem.
> * **Cenário 7 (Capacidade e elegibilidade):**
>   * **Dado** um mentor publicado, apto e recebendo novas startups,
>   * **Quando** o par é avaliado,
>   * **Então** a capacidade declarada não consome nem bloqueia vagas automaticamente; pausar, retirar publicação, invalidar requisitos ou deixar de receber startups retira a elegibilidade.
* *Prioridade:* P1 · *Rastreabilidade:* RF16, RN11, RN15–RN17, CA13, CA32.

---

### 🔹 `US-17`: Receber recomendações de investimento
* **Como** startup que busca investimento (ou investidor procurando startups),
* **Quero** receber perfis compatíveis considerando a faixa de investimento,
* **Para que** eu não perca tempo com quem investe em valores muito diferentes.

> **Critérios de aceitação:**
> * **Cenário 1 (Faixas que se encostam):**
>   * **Dado** que a startup busca R$ 50.000 a R$ 100.000 e o investidor oferece R$ 100.000 a R$ 150.000,
>   * **Quando** as recomendações são geradas,
>   * **Então** o par é considerado compatível, porque o limite em comum conta.
> * **Cenário 2 (Faixas sem interseção):**
>   * **Dado** que a startup busca R$ 50.000 a R$ 99.000 e o investidor oferece R$ 100.000 a R$ 150.000,
>   * **Quando** as recomendações são geradas,
>   * **Então** o investidor é excluído antes da pontuação.
* *Prioridade:* P1 · *Rastreabilidade:* RF17, RN09, RN11, RN15–RN17, CA14, CA32.

---

### 🔹 `US-18`: Saber quais indicações são as mais fortes
* **Como** participante,
* **Quero** ver minhas indicações em ordem e saber quais são as combinações mais fortes,
* **Para que** eu comece pelos perfis com mais chance de fazer sentido, sem precisar entender números.

> **Critérios de aceitação:**
> * **Cenário 1 (Combinação muito forte):**
>   * **Dado** que uma indicação tem nota 95 ou mais,
>   * **Quando** vejo a lista ou abro os detalhes do perfil,
>   * **Então** o perfil aparece com o selo **Super DaMatch** em destaque, sem mostrar a porcentagem.
> * **Cenário 2 (Demais indicações):**
>   * **Dado** que uma indicação tem nota abaixo de 95,
>   * **Quando** vejo a lista,
>   * **Então** ela aparece na ordem da nota, sem selo e sem número.
> * **Cenário 3 (Dado faltando):**
>   * **Dado** que não preenchi um dado obrigatório para o meu objetivo,
>   * **Quando** peço recomendações,
>   * **Então** o sistema avisa o que falta e não trata o dado ausente como compatível.
> * **Cenário 3b (Resposta válida em descoberta):**
>   * **Dado** um questionário completo com setor `DISCOVERING` ou público `UNKNOWN`,
>   * **Quando** o par é avaliado,
>   * **Então** o critério desconhecido recebe zero, sem invalidar o quiz, redistribuir pesos ou normalizar para 100; a indicação depende do corte normal.
> * **Cenário 4 (Uso interno):**
>   * **Dado** que sou da equipe do DaMatch e possuo autorização administrativa para o relatório,
>   * **Quando** consulto os dados de matching,
>   * **Então** vejo a nota, a contribuição de cada critério e a versão do cálculo, para estudar e ajustar a regra.
> * **Cenário 5 (Fronteira do selo):**
>   * **Dado** pares elegíveis com notas internas 95 e 95,5,
>   * **Quando** aparecem nas indicações,
>   * **Então** ambos recebem o selo sem expor a nota; mentor de atuação geral, mesmo com todos os demais critérios completos, chega a 92,5 e não recebe selo.
* *Prioridade:* P1 · *Rastreabilidade:* RF18, RN16, RN19, CA13, CA14, CA15.
* *Decisão do PO (25/10/2026):* a porcentagem e a explicação por critério ficam só com a equipe; o participante vê apenas a ordem e o selo Super DaMatch. Isso altera a RF18 do SRS v1.0 e precisa entrar na próxima revisão do documento de requisitos. Ver [documento 24](24-questionario-v3.md).

---

### 🔹 `US-19`: Recomendações atualizadas depois de mudanças
* **Como** participante,
* **Quero** que as recomendações sejam refeitas quando eu ou a outra pessoa mudarmos dados importantes,
* **Para que** eu não veja indicações baseadas em informações antigas.

> **Critérios de aceitação:**
> * **Cenário 1 (Mudança de setor):**
>   * **Dado** que já recebi recomendações,
>   * **Quando** altero meu setor, objetivo ou faixa e consulto de novo,
>   * **Então** o resultado usa os dados atuais e mostra a data e a versão do cálculo.
> * **Cenário 2 (Pausa e revisão de agenda):**
>   * **Dado** uma indicação anterior,
>   * **Quando** um dos perfis pausa ou deixa de atender os requisitos, ou o mentor altera a agenda compartilhada/pergunta de recebimento,
>   * **Então** a próxima consulta reflete a elegibilidade e os dados atuais, sem reutilizar resultado de outra revisão; data e versão não expõem contribuições numéricas ao participante.
> * **Cenário 3 (Múltiplos projetos):**
>   * **Dado** uma conta vinculada a mais de uma startup,
>   * **Quando** seleciona outro projeto autorizado,
>   * **Então** o cálculo usa o questionário desse projeto e respostas antigas de outro projeto/conta não substituem o contexto atual.
* *Prioridade:* P1 · *Rastreabilidade:* RF19, RN14, RN15, CA16.

---

> **Referência atual:** implementar mentoria conforme o [guia 29](29-matching-rule-decisions.md), após as dependências do roteiro. O protótipo `damatch-rules-v2` é experimental e preserva uma regra anterior; não usá-lo como cálculo confiável no modo API. As 13 respostas estão registradas; falta implementar e incorporar a decisão na próxima revisão formal do SRS.

---

## 🎯 Épico 5: Interesses e conexões (CONEXAO)

> Fluxo: interesse de A para B → interesse de B para A → conexão ATIVA. Interesse de um lado só não cria conexão.

### 🔹 `US-20`: Demonstrar interesse
* **Como** participante,
* **Quero** demonstrar interesse em um perfil que encontrei na busca ou nas recomendações,
* **Para que** a outra pessoa saiba que quero conversar.

> **Critérios de aceitação:**
> * **Cenário 1 (Interesse registrado):**
>   * **Dado** que o perfil é complementar ao meu (startup ↔ mentor/investidor), ativo e publicado,
>   * **Quando** clico em "Tenho interesse",
>   * **Então** é criado um único interesse ATIVO, visível só para nós dois, sem criar conexão.
> * **Cenário 2 (Clique repetido):**
>   * **Dado** que já demonstrei interesse nesse perfil,
>   * **Quando** clico de novo,
>   * **Então** nenhum interesse duplicado é criado.
> * **Cenário 3 (Par inválido):**
>   * **Dado** que tento demonstrar interesse em mim mesmo ou em alguém do mesmo tipo (startup → startup),
>   * **Quando** envio,
>   * **Então** a operação é recusada.
* *Prioridade:* P1 · *Rastreabilidade:* RF20, RN18, RN21, CA17.

---

### 🔹 `US-21`: Ver interesses enviados e recebidos
* **Como** participante,
* **Quero** ver quem demonstrou interesse em mim e em quem eu demonstrei, com data e estado,
* **Para que** eu possa retribuir os que me interessam.

> **Critérios de aceitação:**
> * **Cenário 1 (Minhas listas):**
>   * **Dado** que tenho interesses enviados e recebidos,
>   * **Quando** abro a tela de interesses,
>   * **Então** vejo só os que envolvem a mim, com o estado atualizado.
* *Prioridade:* P1 · *Rastreabilidade:* RF21, RN20, CA17.

---

### 🔹 `US-22`: Retirar um interesse
* **Como** autor de um interesse,
* **Quero** desfazer o interesse antes de virar conexão,
* **Para que** eu possa mudar de ideia.

> **Critérios de aceitação:**
> * **Cenário 1 (Retirada):**
>   * **Dado** que tenho um interesse ATIVO sem conexão,
>   * **Quando** retiro o interesse,
>   * **Então** ele fica RETIRADO e não gera mais conexão.
> * **Cenário 2 (Interesse de outra pessoa):**
>   * **Dado** que o interesse foi criado por outro usuário,
>   * **Quando** tento retirá-lo,
>   * **Então** a operação é recusada.
* *Prioridade:* P1 · *Rastreabilidade:* RF22, RN21, CA18.

---

### 🔹 `US-23`: Virar conexão quando o interesse é mútuo
* **Como** participante,
* **Quero** que a conexão seja criada sozinha quando os dois lados demonstrarem interesse,
* **Para que** a gente possa partir para uma conversa.

> **Critérios de aceitação:**
> * **Cenário 1 (Reciprocidade):**
>   * **Dado** que A tem interesse ativo em B,
>   * **Quando** B demonstra interesse em A,
>   * **Então** é criada uma conexão ATIVA e as duas partes a veem.
> * **Cenário 2 (Cliques ao mesmo tempo):**
>   * **Dado** que A e B clicam em "Tenho interesse" quase ao mesmo tempo ou várias vezes,
>   * **Quando** o sistema processa,
>   * **Então** existe exatamente uma conexão ativa para o par.
* *Prioridade:* P1 · *Rastreabilidade:* RF23, RN22, CA19.

---

### 🔹 `US-24`: Acompanhar minhas conexões
* **Como** participante,
* **Quero** ver minhas conexões com estado, datas, o perfil da outra parte e as reuniões ligadas a cada uma,
* **Para que** eu acompanhe cada relacionamento.

> **Critérios de aceitação:**
> * **Cenário 1 (Só as minhas):**
>   * **Dado** que tenho conexões ativas e encerradas,
>   * **Quando** abro a tela de conexões,
>   * **Então** vejo só as minhas, e uma conexão encerrada não aparece como ativa.
* *Prioridade:* P1 · *Rastreabilidade:* RF24, RN20, RN23, CA19, CA20.

---

### 🔹 `US-25`: Encerrar uma conexão
* **Como** participante de uma conexão,
* **Quero** encerrá-la com uma confirmação,
* **Para que** eu termine um relacionamento que não faz mais sentido.

> **Critérios de aceitação:**
> * **Cenário 1 (Encerramento):**
>   * **Dado** que a conexão tem reuniões já realizadas e reuniões futuras em aberto,
>   * **Quando** confirmo o encerramento,
>   * **Então** a conexão fica ENCERRADA, as reuniões futuras são CANCELADAS e as realizadas continuam no histórico.
> * **Cenário 2 (Depois de encerrar):**
>   * **Dado** que a conexão foi encerrada,
>   * **Quando** alguém tenta marcar reunião nela,
>   * **Então** o sistema recusa. Para conectar de novo, os dois precisam demonstrar interesse outra vez.
* *Prioridade:* P1 · *Rastreabilidade:* RF25, RN23, RN25, CA20.

---

## 🎯 Épico 6: Reuniões (REUNIAO)

> Estados da reunião: PROPOSTA → CONFIRMADA ou RECUSADA → REALIZADA (ou CANCELADA). Só existe reunião dentro de uma conexão ATIVA. A reunião acontece fora da plataforma (presencial ou por link); o DaMatch só organiza o registro.

### 🔹 `US-26`: Propor uma reunião
* **Como** participante de uma conexão ativa,
* **Quero** propor data, horário, duração, formato e local ou link,
* **Para que** a gente combine a conversa dentro da plataforma.

> **Critérios de aceitação:**
> * **Cenário 1 (Proposta válida):**
>   * **Dado** que a conexão está ativa e escolhi um horário futuro, com duração entre 15 e 120 minutos (de 15 em 15),
>   * **Quando** envio a proposta,
>   * **Então** a reunião fica PROPOSTA, o horário fica reservado para os dois e aguarda a decisão da outra parte.
> * **Cenário 2 (Conflito de horário):**
>   * **Dado** que um de nós já tem reunião das 14h às 15h,
>   * **Quando** proponho das 14h30 às 15h30,
>   * **Então** a proposta é recusada. Já uma reunião começando às 15h é aceita.
* *Prioridade:* P1 · *Rastreabilidade:* RF26, RN24, RN26, CA21.

---

### 🔹 `US-27`: Confirmar ou recusar uma reunião
* **Como** quem recebeu a proposta,
* **Quero** confirmar ou recusar a reunião,
* **Para que** a outra pessoa saiba se o encontro vai acontecer.

> **Critérios de aceitação:**
> * **Cenário 1 (Decisão):**
>   * **Dado** que recebi uma proposta ainda válida,
>   * **Quando** confirmo ou recuso,
>   * **Então** a reunião fica CONFIRMADA ou RECUSADA e quem propôs vê a decisão.
> * **Cenário 2 (Confirmar pelo outro):**
>   * **Dado** que fui eu quem propôs,
>   * **Quando** tento confirmar minha própria proposta,
>   * **Então** o sistema não permite.
* *Prioridade:* P1 · *Rastreabilidade:* RF27, RN24, RN27, CA22.

---

### 🔹 `US-28`: Remarcar uma reunião
* **Como** participante da reunião,
* **Quero** propor nova data, horário, formato ou local para uma reunião futura,
* **Para que** a gente ajuste o encontro se surgir um imprevisto.

> **Critérios de aceitação:**
> * **Cenário 1 (Nova proposta):**
>   * **Dado** que a reunião futura está PROPOSTA ou CONFIRMADA,
>   * **Quando** proponho novos dados válidos,
>   * **Então** a versão anterior fica no histórico, a reunião volta para PROPOSTA e a outra parte precisa aceitar de novo.
* *Prioridade:* P1 · *Rastreabilidade:* RF28, RN26, RN27, CA23.

---

### 🔹 `US-29`: Cancelar uma reunião
* **Como** participante da reunião,
* **Quero** cancelar uma reunião futura, podendo informar o motivo,
* **Para que** o horário seja liberado e a outra pessoa fique sabendo.

> **Critérios de aceitação:**
> * **Cenário 1 (Cancelamento):**
>   * **Dado** que a reunião futura está PROPOSTA ou CONFIRMADA,
>   * **Quando** confirmo o cancelamento,
>   * **Então** ela fica CANCELADA, o horário é liberado e ela não pode mais ser marcada como realizada.
* *Prioridade:* P1 · *Rastreabilidade:* RF29, RN25, RN27, CA24.

---

### 🔹 `US-30`: Registrar que a reunião aconteceu
* **Como** participante da reunião,
* **Quero** marcar a reunião como realizada depois do horário e deixar uma observação curta,
* **Para que** fique o histórico do acompanhamento.

> **Critérios de aceitação:**
> * **Cenário 1 (Depois do horário):**
>   * **Dado** que a reunião estava CONFIRMADA e o horário final já passou,
>   * **Quando** registro a realização,
>   * **Então** ela fica REALIZADA, com meu nome e a data do registro.
> * **Cenário 2 (Antes da hora ou cancelada):**
>   * **Dado** que a reunião ainda não aconteceu, foi recusada ou foi cancelada,
>   * **Quando** tento marcar como realizada,
>   * **Então** o sistema recusa.
* *Prioridade:* P1 · *Rastreabilidade:* RF30, RN19, RN27, CA25.
* *Observação:* "realizada" é uma declaração do participante. Não comprova investimento, contrato ou resultado.

---

## 🎯 Épico 7: Administração e privacidade (ADMIN)

### 🔹 `US-31`: Suspender e reativar um participante
* **Como** administrador,
* **Quero** suspender o acesso de um participante informando o motivo, e reativá-lo depois da revisão,
* **Para que** eu consiga agir rápido diante de mau uso da plataforma.

> **Critérios de aceitação:**
> * **Cenário 1 (Suspensão):**
>   * **Dado** que o participante está logado e tem conexões ativas,
>   * **Quando** suspendo o acesso dele,
>   * **Então** a próxima chamada dele é bloqueada, o perfil sai da descoberta, as conexões ficam SUSPENSAS e as reuniões futuras são canceladas.
> * **Cenário 2 (Reativação):**
>   * **Dado** que reativei o participante,
>   * **Quando** ele volta a usar a plataforma,
>   * **Então** as reuniões canceladas na suspensão não voltam sozinhas.
* *Prioridade:* P1 · *Rastreabilidade:* RF31, RN23, RN25, RN29, CA26.

---

### 🔹 `US-32`: Ver indicadores de uso
* **Como** administrador,
* **Quero** um painel com perfis ativos por tipo, conexões ativas e reuniões propostas, confirmadas e realizadas, filtrando por período,
* **Para que** eu acompanhe se a plataforma está gerando conexões de verdade.

> **Critérios de aceitação:**
> * **Cenário 1 (Totais corretos):**
>   * **Dado** uma base de teste com quantidades conhecidas,
>   * **Quando** escolho um período no painel,
>   * **Então** os totais batem com os registros.
> * **Cenário 2 (Acesso restrito):**
>   * **Dado** que sou startup, mentor ou investidor,
>   * **Quando** tento abrir o painel administrativo,
>   * **Então** o acesso é negado.
* *Prioridade:* P1 · *Rastreabilidade:* RF32, CA27.
* *Observação:* os números não podem ser apresentados como "investimento captado" ou "impacto comprovado".

---

### 🔹 `US-33`: Consultar a trilha de auditoria
* **Como** administrador autorizado,
* **Quero** consultar quem fez o quê e quando (aprovações, acessos, perfis, interesses, conexões, reuniões e mudanças no matching),
* **Para que** eu consiga investigar problemas e prestar contas.

> **Critérios de aceitação:**
> * **Cenário 1 (Evento registrado):**
>   * **Dado** que uma operação crítica foi concluída,
>   * **Quando** consulto a trilha,
>   * **Então** vejo autor, ação, recurso, data/hora e resultado, sem senha nem token.
> * **Cenário 2 (Acesso restrito):**
>   * **Dado** que sou participante comum,
>   * **Quando** tento consultar a trilha geral,
>   * **Então** o acesso é negado.
* *Prioridade:* P1 · *Rastreabilidade:* RF33, CA28.

---

### 🔹 `US-34`: Controlar quem vê meu contato
* **Como** participante,
* **Quero** saber para que meus dados são usados e decidir se meu e-mail de contato aparece para minhas conexões,
* **Para que** eu tenha controle sobre minha privacidade.

> **Critérios de aceitação:**
> * **Cenário 1 (Contato liberado):**
>   * **Dado** que autorizei compartilhar meu contato e tenho uma conexão ativa,
>   * **Quando** a outra parte abre os detalhes da conexão,
>   * **Então** ela vê meu contato.
> * **Cenário 2 (Contato retirado):**
>   * **Dado** que retirei a autorização ou a conexão foi encerrada,
>   * **Quando** a outra parte consulta de novo, pela tela ou pela API,
>   * **Então** o contato não é mais retornado.
* *Prioridade:* P1 · *Rastreabilidade:* RF34, RN29, CA29.

---

### 🔹 `US-35`: Desativar meu perfil
* **Como** titular de um perfil,
* **Quero** pedir a desativação do meu perfil no DaMatch,
* **Para que** eu saia da plataforma quando não quiser mais participar.

> **Critérios de aceitação:**
> * **Cenário 1 (Desativação):**
>   * **Dado** que confirmei a desativação,
>   * **Quando** o pedido é processado,
>   * **Então** meu perfil some da descoberta, meus interesses ativos são retirados, minhas conexões são encerradas e as reuniões futuras são canceladas.
* *Prioridade:* P1 · *Rastreabilidade:* RF35, RN23, RN29, CA30.

---

### 🔹 `US-36`: Receber avisos dentro da plataforma
* **Como** startup, mentor ou investidor,
* **Quero** ver avisos de interesse recebido, nova conexão, encerramento e mudanças de reunião, marcando como lidos,
* **Para que** eu não perca nada sem precisar conferir cada tela.

> **Critérios de aceitação:**
> * **Cenário 1 (Um aviso por evento):**
>   * **Dado** que alguém demonstrou interesse em mim,
>   * **Quando** abro meus avisos,
>   * **Então** vejo um único aviso desse evento e posso marcá-lo como lido.
> * **Cenário 2 (Não é chat):**
>   * **Dado** que estou na tela de avisos,
>   * **Quando** procuro como responder,
>   * **Então** não existe envio de mensagem livre. Chat está fora do MVP.
* *Prioridade:* **P2** (desejável) · *Rastreabilidade:* RF36, CA31.
* *Observação:* se ficar para depois, os eventos continuam visíveis nas telas de interesses, conexões e reuniões.

---

## 📋 Resumo do backlog

| Épico | Histórias | Requisitos | Prioridade |
| --- | --- | --- | --- |
| 1. Acesso | US-01 a US-05 | RF01–RF05 | P1 |
| 2. Perfis | US-06 a US-11 | RF06–RF11 | P1 |
| 3. Descoberta | US-12 a US-15 | RF12–RF15 | P1 |
| 4. Matching | US-16 a US-19 | RF16–RF19 | P1 |
| 5. Interesses e conexões | US-20 a US-25 | RF20–RF25 | P1 |
| 6. Reuniões | US-26 a US-30 | RF26–RF30 | P1 |
| 7. Administração e privacidade | US-31 a US-36 | RF31–RF36 | P1 (US-36 é P2) |

**Total:** 36 histórias, uma para cada requisito funcional do SRS v1.0.
