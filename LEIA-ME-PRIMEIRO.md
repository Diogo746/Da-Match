# DaMatch — frontend v0.5.0

Esta entrega reúne o frontend v0.5.0 com as correções dos oito apontamentos do SonarQube e a main e8132da, conferida em 17/10/2026. O código do backend foi preservado. O pipeline mantém a atualização do colega que isola o banco usado nos testes de segurança.

## Correção incluída

O projeto completo já contém as correções de Unicode nas cores, resumo do questionário, contador acessível de agenda, CSS do perfil, justificativas de compatibilidade e proteção na conclusão do cadastro.

Validação local: **172 testes passaram em 15 arquivos**, cobertura de linhas de **97,61%**, lint, tipos e builds DEMO/API aprovados. A aprovação do SonarQube depende de uma nova execução do pipeline após o envio ao GitHub.

## Começar pelo teste das telas

Extraia o ZIP. Abra no VS Code a pasta que contém `backend`, `frontend` e `docs`.

No terminal dessa pasta:

```powershell
cd frontend
npm.cmd ci
npm.cmd start
```

Abra **http://localhost:4200**. Mantenha o terminal aberto. Para parar, use **Ctrl+C**. A demonstração não precisa do backend; use dados fictícios.

## O que mudou

- Questionário de cinco etapas com perguntas nos balões do Lumen.
- Momento da ideia, especialidades, experiência declarada e frequência dos encontros.
- Agenda com pares de dia/período, revisão final e edição por seção em Meu perfil.
- Compatibilidade 70/20/10, motivos, limitações e desempate por experiência prática.
- Seis poses do Lumen, brilho calmo, flutuação e redução de movimento.
- Cards azuis para mentores e verdes para startups, com duas variações por papel e tema escuro.

Os dados da demonstração ficam em memória e reiniciam ao recarregar. O cadastro conectado de mentor continua disponível com `npm.cmd run start:api`, quando o backend estiver funcionando em 8080. Startup, login, questionário persistido e recomendações reais ainda precisam de endpoints.

O passo a passo está em [frontend/README.md](frontend/README.md). A descrição desta revisão está em [docs/18-frontend-v0.5.0.md](docs/18-frontend-v0.5.0.md). A paleta está em [docs/19-visual-identity.md](docs/19-visual-identity.md).

## Pastas e versionamento

Comandos npm são executados dentro de `frontend`. Comandos Git são executados na raiz da cópia que já está conectada ao repositório.

O ZIP inclui os arquivos do projeto, sem `.git`, `node_modules`, builds ou relatórios de cobertura. Extrair o pacote não conecta automaticamente a pasta ao GitHub.

O backend incluído é a cópia fornecida nesta conversa. Ao atualizar uma cópia mais recente do repositório, aplique as alterações de frontend e documentação preservando eventuais avanços posteriores dos colegas no backend.

