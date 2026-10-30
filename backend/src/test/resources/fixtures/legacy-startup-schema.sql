-- Populated startup schema before publication status. Mentor/user schema is initialized first.
CREATE TABLE startup (
    id UUID PRIMARY KEY,
    nome_provisorio VARCHAR(255) NOT NULL,
    pitch_curto VARCHAR(255) NOT NULL,
    problema_central TEXT NOT NULL,
    solucao_proposta TEXT NOT NULL,
    publico_alvo VARCHAR(255) NOT NULL,
    modelo_de_negocio VARCHAR(255) NOT NULL,
    status_validacao VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE TABLE membros_da_startup (
    id UUID PRIMARY KEY,
    startup_id UUID NOT NULL REFERENCES startup(id),
    usuario_id UUID NOT NULL REFERENCES usuario(id),
    papel_membro VARCHAR(255) NOT NULL,
    data_entrada DATE NOT NULL,
    CONSTRAINT uk_startup_usuario UNIQUE(startup_id, usuario_id)
);
INSERT INTO usuario(id, nome, email, senha, tipo_usuario)
VALUES ('00000000-0000-0000-0000-000000000003', 'Fundador Ficticio', 'legacy-startup@example.test',
        'hash-ficticio-nao-autenticavel', 'STARTUP');
INSERT INTO startup VALUES ('00000000-0000-0000-0000-000000000004', 'Projeto legado', 'Resumo legado',
    'Problema legado', 'Solucao legada', 'Publico legado', 'Modelo legado', 'PESQUISA_MERCADO',
    TIMESTAMP WITH TIME ZONE '2026-01-01 12:00:00+00');
INSERT INTO membros_da_startup VALUES ('00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003',
    'FUNDADOR', DATE '2026-01-01');
