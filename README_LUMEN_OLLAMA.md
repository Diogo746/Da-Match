# Guia de configuração do Lumen com Ollama

O backend do DaMatch usa o **Qwen3 4B Instruct** no Ollama para explicar por que um mentor foi recomendado. O modelo baixa aproximadamente 2,5 GB e gera as respostas na máquina que executa o Ollama.

| Onde você quer testar | Etapas |
| --- | --- |
| Só o modelo, na máquina da equipe | Instale o Ollama e faça o teste HTTP local (etapa 1). |
| DaMatch e Ollama na mesma máquina | Faça as etapas 1 e 2. |
| Site publicado com Spring Boot e Ollama em máquinas diferentes | Faça as etapas 1, 3 e 4. O Spring Boot acessa o Ollama por HTTPS com Cloudflare Tunnel e Access. |

## O que foi implementado

- Na tela **Recomendações**, o botão **Perguntar ao Lumen** abre o chat no contexto de um mentor recomendado.
- O backend verifica a sessão, a proteção CSRF, o vínculo com a startup e a presença atual do mentor entre as recomendações elegíveis. A regra de compatibilidade que já existe no DaMatch faz essa seleção.
- O Spring Boot chama `POST /api/chat` do Ollama com as instruções do Lumen e dois tipos de evidência: os tópicos públicos do mentor que coincidem com as necessidades da startup e a existência de uma janela de agenda comum. Nomes, contatos, horários exatos e histórico da conversa ficam fora dessa chamada.
- O Ollama gera uma explicação em português no formato JSON. O backend valida as chaves das evidências, e o Lumen exibe a justificativa e as evidências no chat. A startup decide se quer entrar em contato.
- As dúvidas gerais do chat usam a base de ajuda do projeto. Se o Ollama ou o túnel estiver indisponível, o Lumen avisa e a recomendação continua disponível.

## 1. Instalar e testar o Ollama

1. Instale o [Ollama](https://ollama.com/download) na máquina da equipe. Os comandos a seguir usam PowerShell no Windows.
2. Se o aplicativo Ollama já estiver rodando na bandeja do Windows, encerre-o para liberar a porta. Abra o PowerShell e rode:

   ```powershell
   $env:OLLAMA_HOST = "127.0.0.1:11434"
   $env:OLLAMA_NO_CLOUD = "1"
   ollama serve
   ```

3. Em outro PowerShell, baixe o modelo e teste via HTTP. O primeiro teste também aquece o modelo.

   ```powershell
   ollama pull qwen3:4b-instruct
   $corpo = @{
     model = "qwen3:4b-instruct"
     stream = $false
     keep_alive = "30m"
     options = @{ num_ctx = 2048; temperature = 0; num_predict = 256 }
     messages = @(@{
       role = "user"
       content = "No campo texto, explique que startup e mentor coincidem em validacao. Em referencias, use VALIDATION."
     })
     format = @{
       type = "object"
       additionalProperties = $false
       required = @("texto", "referencias")
       properties = @{
         texto = @{ type = "string" }
         referencias = @{ type = "array"; items = @{ type = "string"; enum = @("VALIDATION") } }
       }
     }
   } | ConvertTo-Json -Depth 10
   $resposta = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:11434/api/chat" `
     -ContentType "application/json" -Body $corpo
   $resposta.done
   $resposta.done_reason
   $resposta.message.content | ConvertFrom-Json
   ```

   Confira `True`, `stop` e um JSON com `texto` e `referencias`, incluindo `VALIDATION`. Mantenha o PC servidor ligado e sem suspensão durante a apresentação.

## 2. Rodar o DaMatch e o Ollama na mesma máquina

Use Java 21, Maven, Node compatível com `frontend/package.json` e um banco PostgreSQL de desenvolvimento. O Spring Boot lê a conexão em `SUPABASE_DB_URL`. Informe a URL JDBC do banco de teste na sessão que vai iniciar o backend e use as demais configurações locais adotadas no projeto.

1. Na raiz do projeto, em um PowerShell novo, inicie o Spring Boot:

   ```powershell
   $env:OLLAMA_BASE_URL = "http://127.0.0.1:11434"
   $env:OLLAMA_MODEL = "qwen3:4b-instruct"
   Remove-Item Env:OLLAMA_CF_ACCESS_CLIENT_ID, Env:OLLAMA_CF_ACCESS_CLIENT_SECRET -ErrorAction SilentlyContinue
   mvn -f backend/pom.xml spring-boot:run
   ```

2. Em outro terminal, abra a pasta `frontend` e execute:

   ```powershell
   npm ci
   npm run start:api
   ```

3. Abra `http://localhost:4200`. Entre com uma conta vinculada a uma startup fictícia publicada, com pelo menos um mentor recomendado. Clique em **Recomendações → Perguntar ao Lumen**. O chat deve mostrar a justificativa e as evidências usadas.

## 3. Preparar o túnel para o site hospedado

Instale o [cloudflared](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/) na máquina que executa o Ollama. Esta configuração usa uma conta **Cloudflare Zero Trust** e um domínio gerenciado no Cloudflare. Escolham um subdomínio dedicado, por exemplo `ollama.seudominio.com.br`.

1. Em **Access controls → Service credentials → Service Tokens**, crie um token para o backend do DaMatch e guarde o **Client ID** e o **Client Secret**.
2. Em **Access controls → Applications**, crie uma aplicação **Self-hosted** para o subdomínio inteiro. Use uma política **Service Auth** que inclua especificamente o token do DaMatch. Deixe o subdomínio coberto por essa política e sem regra de bypass.
3. Em **Networking → Tunnels**, crie um túnel nomeado. Adicione uma rota **Published application** para o subdomínio, com caminho `/api/chat` e serviço `http://127.0.0.1:11434`. Nas opções HTTP dessa rota, configure o **HTTP Host Header** com `127.0.0.1:11434`.
4. No PC servidor, siga o comando para o sistema operacional da máquina fornecido pelo painel para conectar o `cloudflared` ao túnel. Se instalar como serviço, abra o terminal como administrador. O token do conector fica no PC servidor. Preserve a porta 11434 no loopback dessa máquina.
5. De outra rede, confira que uma requisição ao subdomínio sem o Service Token é bloqueada pelo Access. Depois repita o teste HTTP da etapa 1 usando o endereço HTTPS do túnel e acrescentando os dois cabeçalhos:

   ```powershell
   $headers = @{
     "CF-Access-Client-Id" = $env:OLLAMA_CF_ACCESS_CLIENT_ID
     "CF-Access-Client-Secret" = $env:OLLAMA_CF_ACCESS_CLIENT_SECRET
   }
   Invoke-RestMethod -Method Post -Uri "https://ollama.seudominio.com.br/api/chat" `
     -Headers $headers -ContentType "application/json" -Body $corpo
   ```

   Para esse teste, preencha as duas variáveis apenas na sessão de terminal que vai executar o comando. `$corpo` é o JSON montado na etapa 1.

## 4. Configurar a hospedagem e validar pelo site

Cadastre estas variáveis **na hospedagem do Spring Boot**, no ambiente que será usado na apresentação:

| Variável | Valor |
| --- | --- |
| `OLLAMA_BASE_URL` | Origem HTTPS do túnel, por exemplo `https://ollama.seudominio.com.br`. O backend acrescenta `/api/chat`. |
| `OLLAMA_MODEL` | `qwen3:4b-instruct`. Esse também é o valor padrão. |
| `OLLAMA_CF_ACCESS_CLIENT_ID` | Client ID do Service Token do Cloudflare Access. |
| `OLLAMA_CF_ACCESS_CLIENT_SECRET` | Client Secret do mesmo Service Token. Armazene como segredo da hospedagem. |

O `OLLAMA_BASE_URL` vazio desativa a geração. Os arquivos `backend/.env.example` e `backend/.env.vercel.example` são referências. Cadastre os valores no ambiente do Spring Boot e mantenha os segredos fora do frontend e do Git.

1. Publique o backend e o Angular pelo fluxo que o DaMatch já usa. O frontend precisa estar em **modo API**, com `BACKEND_ORIGIN` direcionando para o Spring Boot.
2. Em outro computador ou no celular pelo 4G, abra o link do DaMatch. Entre com uma conta de startup de demonstração e vá a **Recomendações → Perguntar ao Lumen**. Use uma startup e um mentor fictícios já publicados e compatíveis.
3. Confira se aparece a justificativa e a lista de evidências. Valide com antecedência e repita uma chamada perto do horário da apresentação para aquecer o modelo.

## Se algo falhar

| Sintoma | Onde verificar |
| --- | --- |
| O teste em `127.0.0.1:11434` falha | Confirme se o Ollama está rodando e se `ollama list` mostra `qwen3:4b-instruct`. |
| O teste local funciona e o HTTPS falha | Confira o conector, a rota `/api/chat`, o cabeçalho Host e a política Service Auth. |
| O HTTPS funciona e o Lumen informa que a explicação está indisponível | Confira as variáveis da hospedagem, se a nova configuração chegou ao processo do Spring Boot e quanto o modelo demora. A leitura tem limite de 28 segundos. |
| O botão não aparece | Confira se a página está em modo API e se a conta está vinculada a uma startup com um mentor na lista de recomendações. |

Para demonstrar, faça uma chamada pouco antes da apresentação para reduzir o tempo da primeira geração. Use contas e perfis fictícios.

## Referências

- [Qwen3 no catálogo do Ollama](https://ollama.com/library/qwen3/tags)
- [Ollama local e variáveis de configuração](https://docs.ollama.com/faq)
- [API de chat e saídas estruturadas do Ollama](https://docs.ollama.com/api/chat)
- [Configurar Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/get-started/)
- [Configurar Service Token no Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/)
