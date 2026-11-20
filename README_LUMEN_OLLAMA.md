# DaMatch · Lumen com Ollama em um PC servidor

O DaMatch continua sendo aberto pelo link do site. Quem usa o site conversa com o Lumen pelo navegador. O Spring Boot hospedado acessa o **Ollama no PC servidor** por um túnel do Cloudflare com autenticação de serviço. O modelo escolhido é **Qwen3 4B Instruct**, com download de aproximadamente 2,5 GB. A equipe instala o modelo no PC servidor, onde as respostas são geradas.

```text
Navegador → Angular → Spring Boot → Cloudflare Tunnel + Access → Ollama no PC servidor
```

## O que foi implementado

- Na tela **Recomendações**, o botão **Perguntar ao Lumen** abre o chat no contexto de um mentor recomendado.
- O backend verifica a sessão, a proteção CSRF, o vínculo com a startup e a presença atual do mentor entre as recomendações elegíveis. A regra de compatibilidade que já existe no DaMatch faz essa seleção.
- O Spring Boot chama `POST /api/chat` do Ollama com as instruções do Lumen e dois tipos de evidência: os tópicos públicos do mentor que coincidem com as necessidades da startup e a existência de uma janela de agenda comum. Nomes, contatos, horários exatos e histórico da conversa ficam fora dessa chamada.
- O Ollama gera uma explicação em português no formato JSON. O backend valida as chaves das evidências, e o Lumen exibe a justificativa e as evidências no chat. A startup decide se quer entrar em contato.
- As dúvidas gerais do chat usam a base de ajuda do projeto. Se o Ollama ou o túnel estiver indisponível, o Lumen avisa e a recomendação continua disponível.

## 1. Equipe de infraestrutura · preparar o PC servidor

1. Instale o [Ollama para Windows](https://ollama.com/download/windows) e o [cloudflared](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/).
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
   $resposta.message.content | ConvertFrom-Json
   ```

   Confira `True` e um JSON com `texto` e `referencias`, incluindo `VALIDATION`. Mantenha o PC servidor ligado e sem suspensão durante a apresentação.

## 2. Equipe de backend · preparar o túnel

Esta configuração usa uma conta **Cloudflare Zero Trust** e um domínio gerenciado no Cloudflare. Escolham um subdomínio dedicado, por exemplo `ollama.seudominio.com.br`.

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

## 3. Equipe de backend · publicar e validar

Cadastre estas variáveis **na hospedagem do Spring Boot**, no ambiente que será usado na apresentação:

| Variável | Valor |
| --- | --- |
| `OLLAMA_BASE_URL` | Origem HTTPS do túnel, por exemplo `https://ollama.seudominio.com.br`. O backend acrescenta `/api/chat`. |
| `OLLAMA_MODEL` | `qwen3:4b-instruct`. Esse também é o valor padrão. |
| `OLLAMA_CF_ACCESS_CLIENT_ID` | Client ID do Service Token do Cloudflare Access. |
| `OLLAMA_CF_ACCESS_CLIENT_SECRET` | Client Secret do mesmo Service Token. Armazene como segredo da hospedagem. |

O `OLLAMA_BASE_URL` vazio desativa a geração. Para testar com Spring Boot e Ollama **no mesmo PC**, use `OLLAMA_BASE_URL=http://127.0.0.1:11434` e deixe as duas variáveis de autenticação vazias. Os arquivos `backend/.env.example` e `backend/.env.vercel.example` são referências. Carregue os valores no ambiente do processo do Spring Boot.

1. Publique o backend e o Angular pelo fluxo que o DaMatch já usa. O frontend precisa estar em **modo API**, com `BACKEND_ORIGIN` direcionando para o Spring Boot.
2. Em outro computador ou no celular pelo 4G, abra o link do DaMatch. Entre com uma conta de startup de demonstração e vá a **Recomendações → Perguntar ao Lumen**. Use uma startup e um mentor fictícios já publicados e compatíveis.
3. Confira se aparece a justificativa e a lista de evidências. Valide com antecedência e repita uma chamada perto do horário da apresentação para aquecer o modelo.

Se o teste direto no PC servidor falhar, confira o processo Ollama e `ollama list`. Se funciona localmente e falha pelo subdomínio, confira o estado do conector, a rota, o cabeçalho Host e a política Service Auth. Se funciona pelo túnel e falha no Lumen, confira as quatro variáveis no ambiente que fez o deploy, a recomendação da conta usada e o tempo de resposta. A chamada do Spring Boot ao Ollama tem limite de leitura de 28 segundos.

## Referências

- [Qwen3 no catálogo do Ollama](https://ollama.com/library/qwen3/tags)
- [Ollama local e variáveis de configuração](https://docs.ollama.com/faq)
- [API de chat e saídas estruturadas do Ollama](https://docs.ollama.com/api/chat)
- [Configurar Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/get-started/)
- [Configurar Service Token no Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/)
