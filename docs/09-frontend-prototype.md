# 09 — Protótipo do frontend v0.5.0

O frontend atual atende startups em ideação e mentores. A demonstração reúne cadastro, cinco etapas guiadas pelo Lumen, revisão antes de concluir, Meu perfil com edição por seção, descoberta e recomendações explicáveis. Os perfis públicos são fictícios.

O cadastro conectado de mentor da v0.4.3 foi preservado. Ele usa o contrato da main fornecida em 17/10/2026 e depende do backend em execução. Questionário e recomendações continuam demonstrativos.

## Executar

Dentro da pasta `frontend`:

```powershell
npm.cmd ci
npm.cmd start
```

Abra http://localhost:4200. O [README do frontend](../frontend/README.md) contém os roteiros de startup, mentor e integração com a API.

## Organização

| Arquivo ou pasta em frontend | Responsabilidade |
| --- | --- |
| `src/app/core/profile.models.ts` | Códigos, cinco etapas e validação do perfil |
| `src/app/core/profile-session.store.ts` | Perfil temporário e versão do questionário |
| `src/app/core/matching.engine.ts` | Viabilidade, regra v2, pontuação e explicações |
| `src/app/core/profile-appearance.ts` | Variação de cor estável por papel/identificador |
| `src/app/core/motion.store.ts` | Pausa e preferência de movimento reduzido |
| `src/app/core/demo-profiles.json` | Dez perfis fictícios com respostas v2 |
| `src/app/core/http-mentor-registration.gateway.ts` | CSRF e cadastro real de mentor |
| `src/app/features/profile/` | Questionário, revisão, cartão, conclusão e Meu perfil |
| `src/app/features/explore/` | Catálogo, filtros, salvos, indicações e detalhes |
| `src/app/shared/lumen*` | Pose, halo, flutuação e balões |
| `src/app/shared/profile-tones.css` | Variações de azul/verde em ambos os temas |
| `public/assets/lumen/` | Seis poses transparentes do Lumen |

## Verificações locais

Lint, tipos dos testes, 168 testes em 15 arquivos e builds DEMO/API concluídos. Cobertura: linhas 97,60%; declarações 96,19%; ramificações 95,36%; funções 92,60%. Os limites globais de 80% foram mantidos.

A revisão visual em navegador real não foi concluída por indisponibilidade do navegador no ambiente. A homologação com Java/Supabase, leitor de tela e participantes também continua pendente. Os testes HTTP usam respostas simuladas.

A aprovação no SonarQube deve ser conferida no pipeline após o envio desta versão. O guia detalhado está em [18-frontend-v0.5.0.md](18-frontend-v0.5.0.md); a identidade visual, em [19-visual-identity.md](19-visual-identity.md).

As descrições anteriores dos documentos 10 a 14 são históricas; o documento 18 registra o comportamento atual.

