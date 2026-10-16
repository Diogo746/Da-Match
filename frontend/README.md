# DaMatch — frontend

Protótipo Angular para conectar **startups em ideação e mentores** do Nordeste. A interface mantém azul-marinho, verde-petróleo e menta. Há quatro mentores e duas startups fictícias, busca, filtros, detalhes, salvos e cadastro demonstrativo.

## Executar no Windows

Requer Node.js 24 a partir de **24.15.0**, dentro da linha 24, ou Node.js 22 a partir de **22.22.3**, dentro da linha 22. O npm acompanha o Node.

1. Abra esta pasta `frontend` no VS Code. Ela contém `package.json`, `angular.json` e `src`.
2. Abra **Terminal → Novo Terminal** e execute:

```powershell
node -v
npm.cmd -v
npm.cmd ci
npm.cmd start
```

3. Abra **http://localhost:4200** quando a compilação terminar. Mantenha o terminal aberto. Para parar, pressione **Ctrl+C**.

No Linux/macOS, use `npm` no lugar de `npm.cmd`. Se o Angular perguntar sobre compartilhar dados de uso, responder **N** permite continuar normalmente. Não abra `index.html` com dois cliques.

O backend, o banco e o LLDAP não precisam estar rodando para testar esta versão. Para executar outra vez, basta `npm.cmd start`; repita `npm.cmd ci` quando as dependências forem alteradas.

## Cadastro e relação com o backend

A tela **Cadastrar**, em `/cadastro`, oferece os perfis **Startup em ideação** e **Mentor**. Ambos usam os campos encontrados em `CadastrarUsuarioRequest`:

| Campo   | Regra aplicada                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------ |
| `nome`  | Obrigatório; mínimo de 4 caracteres após remover espaços nas extremidades                        |
| `email` | Obrigatório; formato válido; espaços nas extremidades removidos e caixa normalizada no protótipo |
| `senha` | Obrigatória; mínimo de 6 caracteres; não pode conter apenas espaços                              |

Exemplo de dados da conta, conforme o DTO existente:

```json
{
  "nome": "Maria Teste",
  "email": "maria@example.test",
  "senha": "senha-de-teste"
}
```

O tipo `STARTUP` ou `MENTOR` fica separado desse objeto na chamada interna de `RegistrationGateway`. O DTO enviado pelo colega não define esse campo no JSON. A ciência do modo de demonstração também pertence apenas à interface.

Os ZIPs de backend analisados não contêm rotas de cadastro, entidade própria de startup ou mentor, nem o campo `biografia`. Por isso, esta versão prepara o cadastro básico da conta com os campos existentes. Os dados completos dos perfis dependem da implementação desses contratos pelo backend.

A senha é usada apenas durante o preenchimento e a validação do teste. Não é gravada em armazenamento do navegador, incluída na confirmação ou enviada por HTTP. Após sucesso, seu campo é limpo. O BCrypt encontrado no backend será responsabilidade da integração real; esta demonstração não simula autenticação nem guarda hashes.

## Roteiro de teste manual

Utilize dados fictícios, como `Maria Teste`, `maria@example.test` e uma senha inventada.

| Ação                                                        | Resultado esperado                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------- |
| Abrir Descobrir                                             | Quatro mentores em ordem alfabética                                 |
| Escolher Todos                                              | Seis perfis: quatro mentores e duas startups                        |
| Escolher Startups                                           | Mostrar somente duas startups em ideação                            |
| Combinar Mentores + Tecnologia + Recife                     | Mostrar Marina Albuquerque e Rafael Nascimento                      |
| Buscar `ANDRE`                                              | Encontrar André Monteiro, sem exigir acento ou caixa                |
| Buscar texto inexistente                                    | Apresentar estado vazio e opção de ampliar a busca                  |
| Limpar filtros                                              | Restaurar os resultados da categoria selecionada                    |
| Abrir Ver perfil e pressionar Escape                        | Abrir e depois fechar os detalhes                                   |
| Salvar um perfil e abrir Perfis salvos                      | Mostrar o perfil durante esta sessão                                |
| Remover dos salvos                                          | Atualizar a lista                                                   |
| Abrir Cadastrar                                             | Oferecer Startup em ideação e Mentor                                |
| Enviar formulário vazio                                     | Apresentar os campos obrigatórios                                   |
| Usar nome `Ana`, e-mail inválido ou senha de 5 caracteres   | Impedir a conclusão                                                 |
| Clicar em Mostrar/Ocultar                                   | Alternar a visibilidade da senha sem enviar o formulário            |
| Enviar dados válidos com ciência da demonstração            | Mostrar confirmação local, perfil e e-mail de teste; limpar a senha |
| Clicar repetidamente durante o envio                        | Concluir somente um envio                                           |
| Testar outro cadastro com o mesmo e-mail em caixa diferente | Informar duplicidade na sessão, mesmo ao trocar de tipo de perfil   |
| Recarregar a página                                         | Reiniciar salvos e cadastros temporários                            |
| Navegar com Tab/Shift+Tab e reduzir a janela                | Conferir foco, leitura e adaptação do layout                        |

Os perfis exibidos são exemplos fixos. Um cadastro simulado não adiciona um novo cartão à descoberta.

## Verificações automáticas

Dentro de `frontend`, execute:

```powershell
npm.cmd run lint
npm.cmd run test:coverage
npm.cmd run build
```

`npm.cmd test` executa os testes sem gerar cobertura. A suíte utiliza **Vitest**, não Karma/Jasmine.

Nesta entrega, a instalação limpa, o lint, a checagem de tipos dos testes e os **32 testes** passaram. O relatório V8 apresentou **86,95% de cobertura de linhas nos arquivos medidos**. O relatório local pode ser aberto em `coverage/index.html`, e o LCOV é gerado em `coverage/lcov.info`.

O build de produção fica em `dist/frontend/browser`. Para hospedar, utilize um servidor HTTP com fallback de navegação para `index.html`; não abra o HTML compilado por `file://`.

A análise SonarQube e a revisão visual em navegador não foram executadas nesta entrega. A aprovação do Quality Gate depende da análise do commit no pipeline da equipe.

## Dificuldades comuns

| Situação                                             | Como resolver                                          |
| ---------------------------------------------------- | ------------------------------------------------------ |
| `node` não reconhecido                               | Instalar uma versão compatível e reabrir o VS Code     |
| Bloqueio de `npm.ps1`                                | Usar `npm.cmd`                                         |
| `package.json` não encontrado                        | Conferir se o terminal está dentro de `frontend`       |
| Porta 4200 ocupada                                   | Encerrar o outro servidor com Ctrl+C                   |
| Dependências inconsistentes depois de trocar a pasta | Parar o servidor e executar `npm.cmd ci` na pasta nova |

## Limites e integração

O envio é simulado por `DemoRegistrationGateway`. Os e-mails usados no teste e os perfis salvos ficam somente na memória até recarregar a página. Não há criação real de conta, login, persistência, chamada à API de negócio ou cálculo de matching.

A implementação HTTP deverá ser ligada a `RegistrationGateway` quando o backend definir rotas, respostas e erros. As regras definitivas e o armazenamento da senha protegida pertencem à API. O guia de integração dos arquivos no repositório está em [docs/09-frontend-prototype.md](../docs/09-frontend-prototype.md).
