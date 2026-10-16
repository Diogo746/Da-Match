# DaMatch — protótipo do frontend v0.2

Esta versão adapta o frontend da branch `feature/frontend-access` ao escopo de **startups em ideação e mentores**. Mantém a identidade visual e as funcionalidades de descoberta, detalhes e salvos. O backend não é alterado por este pacote.

## Mudanças

- Dois tipos de participação: startup em ideação e mentor.
- Seis perfis fictícios: quatro mentores e duas startups em ideação.
- Busca sem diferença de acento ou caixa, filtros por setor e cidade e resultados em ordem de nome.
- Cadastro em `/cadastro`, com nome, e-mail e senha, baseado no DTO existente do backend.
- O caminho anterior `/solicitar-acesso` redireciona para `/cadastro`.
- Confirmação demonstrativa com o perfil e o e-mail usados no teste.
- Validação dos campos, prevenção de envios repetidos e tratamento de e-mail repetido na sessão.
- Senha oculta por padrão, botão Mostrar/Ocultar e limpeza do campo após o sucesso.
- Testes ajustados ao novo escopo e documentação de execução atualizada.

## O que foi considerado do backend

A referência são os ZIPs `Da-Match-feature-database-models.zip` e `Da-Match-main (1).zip`, enviados para análise. Seus 78 arquivos têm conteúdo idêntico. O frontend usado como base veio do ZIP separado `Da-Match-feature-frontend-access(1).zip`.

| Código do backend                                      | Relação com o frontend                                                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `usuario/application/dto/CadastrarUsuarioRequest.java` | Define nome, e-mail e senha; nome com mínimo de 4 caracteres e senha com mínimo de 6                        |
| `shared/enums/TipoUsuario.java`                        | Contém `STARTUP`, `MENTOR` e `ADMIN`; o cadastro público desta prévia oferece os dois tipos de participante |
| `usuario/application/service/UsuarioService.java`      | Tem a criação interna da conta, verificação de e-mail e codificação da senha                                |
| `usuario/domain/entity/Usuario.java`                   | Representa a conta no banco; o frontend não solicita os identificadores gerados internamente                |

Ainda não há rotas de cadastro nem campos próprios de startup ou mentor nesses arquivos. O exemplo de mentor com `usuario` e `biografia` fornecido na conversa é uma indicação de formato futuro, mas não tem implementação correspondente nos ZIPs. A prévia usa os três campos do DTO existente, sem presumir esse contrato futuro.

O objeto `RegistrationRequest` contém exatamente `nome`, `email` e `senha`. O tipo do perfil é um argumento separado de `RegistrationGateway.register`. Isso organiza a interface enquanto o contrato HTTP não está definido; não indica que já exista uma rota capaz de receber o cadastro.

O banco configurado no backend enviado é PostgreSQL/Supabase. A documentação geral ainda contém referências ao planejamento anterior. Esta alteração não modifica o banco nem decide a futura autenticação.

## Executar para testar

1. Extraia `DaMatch-Frontend-v0.2.zip` em uma pasta nova.
2. Abra a pasta `frontend` extraída no VS Code.
3. Use Node 24 a partir de 24.15.0 ou Node 22 a partir de 22.22.3, dentro das respectivas linhas.
4. No terminal dessa pasta, execute:

```powershell
npm.cmd ci
npm.cmd start
```

5. Abra **http://localhost:4200**. Não é necessário iniciar Java ou banco de dados.
6. Siga o roteiro de testes em `frontend/README.md`.
7. Para parar o servidor, pressione Ctrl+C.

O pacote funciona sozinho para teste e não contém histórico Git. Se `git status` informar que a pasta extraída não é um repositório, isso é esperado. Os commits devem ser feitos na sua cópia já conectada ao GitHub.

## Aplicar na sua cópia do repositório

Aplique depois de testar a pasta extraída. O pacote tem apenas o frontend e este guia: não substitua a raiz do repositório nem o backend.

1. Pare o servidor de desenvolvimento.
2. Na sua cópia do repositório, confira `git status`. Preserve em commit ou cópia qualquer alteração sua que ainda não tenha sido guardada.
3. Confirme a branch com `git branch --show-current`. Para continuar o trabalho anterior, use `feature/frontend-access`.
4. Faça uma cópia de segurança da pasta `frontend` atual **fora do repositório**.
5. Substitua a pasta `frontend` inteira pela nova. Não apenas mescle os arquivos: as antigas pastas `src/app/features/access/` e os arquivos `core/access.gateway.*` foram substituídos por `features/register/` e `core/registration.gateway.*`.
6. Copie este arquivo para `docs/09-frontend-prototype.md` na sua cópia do repositório.
7. Dentro da nova pasta `frontend`, execute:

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd run test:coverage
npm.cmd run build
```

8. Abra o terminal na raiz do repositório e confira o que será enviado:

```powershell
git status
git diff --stat
git add frontend docs/09-frontend-prototype.md
git diff --cached --stat
```

9. Depois da sua revisão, faça o commit e envie a branch:

```powershell
git commit -m "feat(frontend): ajusta escopo de ideação e cadastros"
git push origin feature/frontend-access
```

O ZIP de entrega, a cópia de segurança, `node_modules`, `dist`, `.angular` e `coverage` não fazem parte do commit. O `.gitignore` do frontend cobre as pastas geradas.

O push atualiza a branch. A entrada na `main` ocorre pelo Pull Request e pelos checks exigidos pela equipe. O destino do PR deve seguir a branch de integração acordada no projeto. O workflow enviado executa automaticamente em PRs para `main` ou `development`; um push isolado em `feature/frontend-access`, sem PR aberto, não aciona esse gatilho.

## Onde estudar o código

| Arquivo/pasta                                   | Responsabilidade                                  |
| ----------------------------------------------- | ------------------------------------------------- |
| `frontend/src/main.ts`                          | Inicialização do Angular                          |
| `frontend/src/app/app.config.ts`                | Navegação e escolha do serviço demonstrativo      |
| `frontend/src/app/app.routes.ts`                | URLs de descoberta, salvos, cadastro e explicação |
| `frontend/src/app/app.component.html`           | Menu, cabeçalho e área das páginas                |
| `frontend/src/styles.css`                       | Cores e estilos compartilhados                    |
| `frontend/src/app/core/profiles.store.ts`       | Perfis fictícios e estado temporário dos salvos   |
| `frontend/src/app/features/explore/`            | Busca, filtros, cartões e detalhes                |
| `frontend/src/app/features/register/`           | Formulário e confirmação de cadastro              |
| `frontend/src/app/core/registration.gateway.ts` | Dados da conta e simulação de envio               |
| `frontend/src/app/features/about/`              | Explicação da proposta e da jornada prevista      |
| `*.spec.ts`                                     | Testes de comportamento                           |

HTML organiza os elementos; CSS define a apresentação; TypeScript controla o comportamento. O `FormGroup` reúne os campos e suas validações. Um `signal` guarda estado acompanhado pela interface; um `computed` calcula resultados a partir desse estado.

## Verificação desta entrega

| Verificação                                                | Resultado          |
| ---------------------------------------------------------- | ------------------ |
| Instalação limpa com `npm ci`                              | Concluída          |
| ESLint                                                     | Sem erros          |
| Tipos dos testes, com `tsc -p tsconfig.spec.json --noEmit` | Sem erros          |
| Vitest                                                     | 32 testes passaram |
| Cobertura V8 de linhas nos arquivos medidos                | 86,95%             |
| Build Angular de produção                                  | Concluído          |
| Revisão visual em navegador                                | Pendente           |
| Análise SonarQube deste código                             | Não executada      |

A suíte verifica os limites do DTO, a separação dos campos do cadastro, erros e nova tentativa, bloqueio de envios repetidos, limpeza da senha, busca, filtros e salvos. Os testes de componentes exercitam a lógica em contexto de injeção; não substituem navegação real em navegador, revisão de acessibilidade ou testes integrados com a API.

A prévia mantém somente e-mails e IDs salvos em memória. Não grava senha, não cria conta real e não adiciona o cadastro simulado à lista fixa de perfis. A integração dependerá das rotas, respostas, erros e regras definitivas do backend.
