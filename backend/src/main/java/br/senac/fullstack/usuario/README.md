# Módulo Usuário

Este módulo concentra tudo que pertence ao cadastro e à gestão de usuários.

```text
usuario/
├── api/
│   ├── controller/                 # Endpoints REST (@RestController)
│   └── dto/                        # Contratos HTTP: requests e responses
├── application/
│   └── service/                    # Casos de uso e regras de negócio (@Service)
├── domain/
│   └── entity/                     # Entidades JPA (@Entity); cada uma representa uma tabela
└── infrastructure/
    └── persistence/
        └── repository/             # Acesso a dados (JpaRepository)
```

Fluxo de dependências: `controller -> service -> repository`; o serviço usa as
entidades e converte dados de entrada/saída em DTOs. Entidades não devem ser
devolvidas diretamente pela API.

Exemplo de nomes futuros:

- `api/controller/UsuarioController.java`
- `api/dto/CriarUsuarioRequest.java` e `UsuarioResponse.java`
- `application/service/UsuarioService.java`
- `domain/entity/Usuario.java` (mapeada para a tabela `usuarios`)
- `infrastructure/persistence/repository/UsuarioRepository.java`
