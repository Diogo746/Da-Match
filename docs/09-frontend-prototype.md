# DaMatch — primeira versão do frontend

Branch: `feature/frontend-access`.
Base: `main`, commit `4795f9c8ae1bc28be52a32e614368d962a1db597`.

Esta versão substitui a tela de demonstração do starter pelo protótipo do DaMatch. As referências visuais são os conceitos de interface apresentados no benchmark e no pré-pitch: azul-marinho, verde-petróleo, menta, menu lateral e cartões. As pessoas e organizações mostradas são inventadas. A jornada foi construída para revisão da equipe, sem integração com a API de negócio.

## O que está disponível

- Descoberta de mentores, investidores e startups fictícios.
- Busca sem diferença de caixa ou acento; filtros combinados por setor, estágio e cidade.
- Resultados em ordem de nome; estado vazio e limpeza dos filtros.
- Detalhes do perfil em diálogo nativo, com fechamento por Escape.
- Salvos compartilhados entre páginas enquanto a aplicação permanece aberta.
- Explicação da jornada prevista do produto.
- Solicitação de acesso demonstrativa: nome, e-mail e Startup/Mentor/Investidor.
- Validação, bloqueio de cliques repetidos durante envio, erro de duplicidade e protocolo DEMO pendente.
- Layouts para desktop e celular, foco visível, rótulos e mensagens de erro.

O formulário não pede senha nem oferece ADMIN. A ciência do modo de demonstração não substitui uma política de privacidade real. Busca e salvos são funcionalidades de protótipo, não novas decisões de escopo aprovadas.

## Limites desta entrega

Nenhuma conta é criada e nenhum dado é enviado à equipe. Login, LLDAP, aprovação administrativa, matching, interesses, conexões, reuniões e persistência real não estão implementados no frontend. Os motivos apresentados nos perfis são exemplos fixos; não há pontuação de matching calculada. Recarregar a página apaga salvos e solicitações da memória. A descoberta pública existe apenas para testar os perfis fictícios: a futura descoberta com dados reais dependerá da autenticação e das permissões previstas nos requisitos.

As duas diferenças do backend (PostgreSQL/Supabase versus SQLite e senha local versus LLDAP) permanecem para alinhamento da equipe. Esta branch não altera o backend.

## 1. Testar rapidamente no Windows, sem alterar o repositório

1. Extraia `DaMatch-Frontend-v0.1.zip` usando “Extrair tudo”.
2. Instale ou use Node.js 24.15 ou mais recente da linha 24. O Angular deste projeto também aceita Node 22 a partir de 22.22.3. Java não é necessário para esta demonstração.
3. No VS Code, escolha Arquivo → Abrir Pasta e abra a pasta `frontend` extraída.
4. Abra Terminal → Novo Terminal. Confirme `node -v` e `npm.cmd -v`.
5. Execute:

```powershell
npm.cmd ci
npm.cmd start
```

`npm ci` instala as dependências a partir do arquivo de versões. `npm start` executa o servidor de desenvolvimento. Aguarde a indicação de que a compilação terminou.

6. Abra `http://localhost:4200` no navegador. Use essa URL; abrir `index.html` com dois cliques não executa um projeto Angular.
7. Para parar, pressione Ctrl+C no terminal. Para executar novamente, use apenas `npm.cmd start`.

O uso de `npm.cmd` evita o bloqueio comum de `npm.ps1` no PowerShell, sem alterar a política de execução do Windows.

## 2. Roteiro de conferência manual

| Ação | Resultado esperado |
| --- | --- |
| Abrir Descobrir | Quatro mentores fictícios em ordem alfabética |
| Buscar `validacao` | Encontrar perfis com “validação”, sem exigir acento |
| Combinar Mentor + Tecnologia + Ideação + Recife | Mostrar Marina Albuquerque |
| Buscar uma palavra inexistente | Mostrar orientação para ampliar os filtros |
| Salvar um perfil e abrir Perfis salvos | Mostrar o perfil selecionado |
| Remover esse perfil dos salvos | Atualizar a lista e seu estado vazio |
| Abrir Ver perfil | Mostrar detalhes e exemplos dos motivos da conexão |
| Pressionar Escape no diálogo | Fechar o diálogo |
| Enviar formulário vazio | Apresentar erros; não gerar recibo |
| Selecionar Investidor e enviar nome fictício/e-mail válido | Gerar protocolo DEMO pendente |
| Testar outra solicitação com o mesmo e-mail em outra caixa | Informar duplicidade nesta sessão |
| Recarregar a página | Reiniciar os dados temporários |
| Reduzir a janela e usar Tab/Shift+Tab | Conferir adaptação do layout e foco dos controles |

Esta conferência de navegador ainda precisa ser feita no seu computador. Build e testes de lógica não substituem avaliação visual, teste assistivo ou aprovação WCAG.

## 3. Colocar esta versão em uma branch do repositório

O arquivo `damatch-frontend.bundle` transporta a branch e seus commits, sem precisar copiar arquivos sobre a main. O código já está comprometido nesse bundle. A branch ainda não foi enviada ao GitHub.

Se você ainda não tem o projeto clonado, abra um terminal na pasta onde deseja guardar projetos e execute:

```powershell
git clone https://github.com/Diogo746/Da-Match.git
cd Da-Match
```

Se você já tem uma cópia, abra essa pasta no VS Code. Em ambos os casos, execute `git status` primeiro. Se houver trabalho não salvo, faça commit dele antes de mudar de branch. Não use comandos de descarte para prosseguir.

Na raiz do repositório, importe o bundle. Substitua o caminho de exemplo pelo caminho do arquivo extraído:

```powershell
git fetch "C:\caminho\DaMatch-Frontend-v0.1\damatch-frontend.bundle" feature/frontend-access:feature/frontend-access
git switch feature/frontend-access
cd frontend
npm.cmd ci
npm.cmd start
```

O comando `git fetch` acima cria a branch local a partir do pacote; `git switch` passa a trabalhar nessa versão. Não é necessário executar `git switch -c` depois da importação. Se uma branch com esse nome já existir, pare e confira seu conteúdo antes de substituí-la.

Para rodar as verificações, abra outro terminal dentro de `frontend`:

```powershell
npm.cmd run lint
npm.cmd run test:coverage
npm.cmd run build
```

Quando você revisar e quiser compartilhar a branch, volte à raiz e envie:

```powershell
cd ..
git status
git push -u origin feature/frontend-access
```

O envio pode solicitar autenticação do seu GitHub. Depois, na página do repositório, use “Compare & pull request”, com base `main` e comparação `feature/frontend-access`. O pipeline poderá continuar falhando nas etapas SonarQube já identificadas; verificar localmente não comprova aprovação do Sonar.

Não faça merge antes da revisão da equipe e dos controles exigidos pelo professor. Se a equipe adotar develop/development como destino, ajuste a base do PR ao fluxo acordado.

## 4. Entender os arquivos, na ordem

| Arquivo/pasta | O que estudar |
| --- | --- |
| `src/main.ts` | Inicializa a aplicação Angular |
| `src/app/app.config.ts` | Registra navegação e o serviço demonstrativo |
| `src/app/app.routes.ts` | Associa cada URL à sua página |
| `src/app/app.component.html` | Estrutura principal: menu, cabeçalho e conteúdo |
| `src/styles.css` | Cores, botões, campos e estilos compartilhados |
| `src/app/features/explore/` | Página de descoberta e componentes menores |
| `src/app/core/profiles.store.ts` | Dados fictícios e estado dos perfis salvos |
| `src/app/features/access/` | Formulário e confirmação |
| `src/app/core/access.gateway.ts` | Contrato de envio e sua implementação simulada |
| `*.spec.ts` | Testes de comportamento |

- HTML define a estrutura e os textos.
- CSS define aparência e adaptações de tela.
- TypeScript define comportamento e tipos.
- Um componente junta a estrutura, a aparência e o comportamento de uma parte da interface.
- Um serviço concentra uma responsabilidade compartilhada. Aqui, `ProfilesStore` mantém salvos e `AccessGateway` define como enviar uma solicitação.
- `signal` guarda um valor que a interface acompanha. Quando ele muda, o Angular atualiza a parte correspondente.
- `computed` deriva um resultado de outros valores: a lista visível depende dos filtros e dos salvos.
- `FormGroup` reúne campos e validações do formulário.

## 5. Seu primeiro exercício

Com `npm start` executando:

1. Abra `src/app/features/explore/discovery-hero.component.html`.
2. Localize o texto “Seu próximo passo começa com uma conexão.”.
3. Altere para um texto curto que a equipe aprove e salve o arquivo.
4. Confira a atualização automática no navegador.
5. Abra `src/styles.css` e identifique `--navy` e `--teal`. São as cores compartilhadas.
6. Abra `profiles.store.ts` e encontre `Marina Albuquerque`. Observe seus campos.
7. Abra `explore.component.ts`. Relacione os filtros com `visibleProfiles`.
8. Abra `access.component.ts`. Relacione o botão de envio com `submit` e as validações.

Após uma alteração sua, confira o resultado e execute os checks antes do commit:

```powershell
git diff
git add frontend/src/app/features/explore/discovery-hero.component.html
git commit -m "feat(frontend): ajusta apresentação inicial do DaMatch"
git push
```

Execute esses comandos na raiz do repositório; o caminho do `git add` acima presume essa localização. Inclua apenas os arquivos que você alterou e revisou.

## 6. Integração futura

`AccessGateway` é um contrato TypeScript, não a confirmação de um endpoint existente. Quando a equipe definir URL, campos JSON, respostas e erros do RF01, um serviço HTTP poderá implementar esse contrato. A troca ocorre no provider de `app.config.ts`; o formulário não precisará ser redesenhado.

O backend deverá validar novamente os dados, normalizar e-mail, impedir duplicidade e devolver protocolo/status. Validações no Angular ajudam a experiência do usuário; não substituem controles no servidor. A aprovação e o vínculo LLDAP são etapas posteriores (RF02/RF03).

## Validação desta entrega

Instalação limpa (`npm ci`), lint, testes Vitest e build de produção foram verificados no ambiente de desenvolvimento. Não foi realizado teste visual em navegador nem análise SonarQube desta branch. Não declarar homologação completa, conformidade WCAG ou aprovação de Quality Gate com base nesses checks.
