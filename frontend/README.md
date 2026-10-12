# DaMatch — guia para executar e testar o frontend

Esta branch contém a primeira versão demonstrativa da interface do DaMatch: descoberta de perfis fictícios, filtros, detalhes, perfis salvos e solicitação de acesso. O frontend pode ser executado sozinho, sem iniciar o backend, banco de dados ou LLDAP.

## 1. Preparar o computador

Instale Git, VS Code e uma versão de Node.js compatível:

- Node 24 a partir de **24.15.0**, dentro da linha 24;
- ou Node 22 a partir de **22.22.3**, dentro da linha 22.

O npm acompanha a instalação do Node. Confira no terminal:

```powershell
node -v
npm.cmd -v
git --version
```

Os exemplos abaixo usam PowerShell no Windows. No Linux/macOS, utilize `npm` no lugar de `npm.cmd`. O sufixo `.cmd` evita o bloqueio de `npm.ps1` no PowerShell.

## 2. Abrir a branch de teste

### Se ainda não tiver o repositório no computador

Depois que a branch estiver publicada no GitHub, abra um terminal na pasta onde deseja guardar o projeto e execute:

```powershell
git clone --branch feature/frontend-access https://github.com/Diogo746/Da-Match.git
cd Da-Match
code .
```

Se `code .` não funcionar, abra o VS Code e escolha **Arquivo → Abrir Pasta → Da-Match**.

### Se já tiver o repositório clonado

Abra a pasta do repositório no VS Code. No terminal, execute:

```powershell
git status
git fetch origin
git switch feature/frontend-access
```

Se `git status` mostrar alterações suas, salve esse trabalho em um commit antes de trocar de branch. Para atualizar uma branch local de teste sem alterações próprias:

```powershell
git pull --ff-only origin feature/frontend-access
```

Se a branch não for encontrada, confira se ela já foi enviada ao GitHub e se seu acesso ao repositório está liberado. O pacote ZIP também permite teste independente: extraia-o e abra diretamente sua pasta `frontend`; nesse caso, pule os comandos Git.

## 3. Instalar e executar

No VS Code, abra **Terminal → Novo Terminal**. Se o terminal estiver na raiz `Da-Match`, entre na pasta do frontend:

```powershell
cd frontend
```

Se o terminal já terminar com `\frontend>`, não execute `cd frontend` novamente. Essa pasta contém `package.json`, `angular.json` e `src`.

Na primeira execução, instale as dependências:

```powershell
npm.cmd ci
```

Depois, inicie o servidor:

```powershell
npm.cmd start
```

Se o Angular perguntar sobre compartilhar dados de uso (`y/N`), pode responder **N** e pressionar Enter. Isso não impede a execução.

Aguarde a compilação terminar e abra:

**http://localhost:4200**

Mantenha o terminal aberto enquanto utiliza a aplicação. Para parar o servidor, pressione **Ctrl+C**. Para executar novamente, use `npm.cmd start`; a instalação só precisa ser repetida quando as dependências forem alteradas.

Não abra `src/index.html` com dois cliques. Uma aplicação Angular precisa ser compilada e servida por HTTP.

## 4. Conferir a interface

Use dados inventados, como `Fundador Teste` e `fundador@example.test`.

| Teste | Resultado esperado |
| --- | --- |
| Abrir Descobrir | Exibir quatro mentores fictícios em ordem alfabética |
| Trocar para Investidores ou Startups | Mostrar somente o tipo selecionado |
| Buscar `validacao` | Encontrar textos com “validação”, sem exigir acento |
| Combinar Mentor + Tecnologia + Ideação + Recife | Mostrar Marina Albuquerque |
| Buscar algo inexistente | Mostrar estado vazio com opção de ampliar a busca |
| Limpar filtros | Restaurar os resultados do tipo selecionado |
| Clicar em Ver perfil | Abrir detalhes e exemplos dos motivos da conexão |
| Pressionar Escape no diálogo | Fechar os detalhes |
| Salvar um perfil e abrir Perfis salvos | Mostrar o perfil selecionado |
| Remover o perfil dos salvos | Atualizar a listagem |
| Enviar solicitação vazia ou com e-mail inválido | Apresentar erros e impedir o envio |
| Escolher Startup, Mentor ou Investidor e enviar dados válidos | Mostrar protocolo DEMO e status pendente |
| Testar outra solicitação com o mesmo e-mail em caixa diferente | Informar duplicidade nessa sessão |
| Recarregar a página | Reiniciar salvos e solicitações temporárias |
| Reduzir a janela e navegar com Tab/Shift+Tab | Conferir adaptação do layout e foco dos controles |

Para testar responsividade, também utilize o modo de dispositivos das ferramentas de desenvolvedor do navegador. A avaliação visual, os testes assistivos e a validação com usuários ainda fazem parte da revisão da equipe.

## 5. Executar as verificações automáticas

Mantenha o servidor no terminal atual e abra outro terminal dentro de `frontend`. Execute:

```powershell
npm.cmd run lint
npm.cmd run test:coverage
npm.cmd run build
```

| Comando | Finalidade |
| --- | --- |
| `lint` | Verificar regras de escrita e organização do código |
| `test:coverage` | Executar os testes de comportamento e gerar relatório de cobertura |
| `build` | Compilar a aplicação para distribuição |

Nesta entrega foram executados 23 testes com sucesso. O relatório local apresentou 85,84% de cobertura de linhas do código incluído na medição. Esse resultado não comprova aprovação do Quality Gate do SonarQube.

O build é gerado em `dist/frontend/browser`. O arquivo `coverage/index.html` contém o relatório visual de cobertura local.

## 6. Resolver dificuldades comuns

| Situação | Como conferir |
| --- | --- |
| `node` não reconhecido | Instalar o Node e reabrir completamente o VS Code |
| Versão do Node abaixo do requisito | Atualizar para uma das versões compatíveis acima |
| Bloqueio de `npm.ps1` | Usar `npm.cmd` nos comandos |
| Erro de `package.json` não encontrado | Conferir se o terminal está dentro de `frontend` |
| Porta 4200 ocupada | Encerrar o outro servidor ou usar `npm.cmd start -- --port 4201` e abrir a porta indicada |
| Branch não encontrada | Conferir publicação, executar `git fetch origin` e verificar acesso ao repositório |
| Avisos de vulnerabilidade no `npm ci` | Registrar o resultado de `npm.cmd audit` para análise da equipe antes da publicação; evitar correções automáticas sem revisar as alterações de dependências |
| Erro no build ou instalação | Registrar o comando e a mensagem completa para permitir reprodução |

A instalação desta versão reportou vulnerabilidades de dependências no computador de teste do integrante. Elas ainda precisam de análise e correção; o sucesso do build não elimina esse registro.

## 7. Entender os limites

Os perfis e protocolos são fictícios. Solicitações e salvos ficam apenas na memória e são apagados ao recarregar a página. Não há criação de conta, autenticação, aprovação administrativa, persistência ou chamada à API de negócio.

Os motivos de conexão são exemplos fixos; nenhuma pontuação de matching é calculada. A descoberta pública existe somente para esta demonstração com dados inventados. A versão integrada deverá respeitar a autenticação e a autorização dos requisitos.

A implementação foi separada em componentes menores e no contrato `AccessGateway`. A futura integração HTTP depende da definição dos endpoints, dados e erros pelo backend. A validação no frontend melhora a experiência; os controles definitivos pertencem à API.

## 8. Registrar a revisão da equipe

Ao relatar um problema, informe a branch/commit, comando usado, versão do Node, navegador, tamanho de janela, passos para reproduzir, resultado esperado e resultado observado. Utilize dados fictícios nas capturas.

O tutorial de Git e estudo dos arquivos está em [docs/09-frontend-prototype.md](../docs/09-frontend-prototype.md).
