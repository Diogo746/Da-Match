-- Test-only snapshot of a schema previously created by Hibernate, with a short biography column.
CREATE TABLE usuario (
    id UUID PRIMARY KEY,
    id_ldap UUID,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(255) NOT NULL
);
CREATE TABLE mentor (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuario(id),
    biografia VARCHAR(255) NOT NULL,
    linkedin VARCHAR(255),
    instagram VARCHAR(255),
    site VARCHAR(255),
    status VARCHAR(255) NOT NULL,
    data_entrada_plataforma DATE NOT NULL
);
INSERT INTO usuario (id, nome, email, senha, tipo_usuario)
VALUES ('00000000-0000-0000-0000-000000000001', 'Pessoa Ficticia', 'legacy@example.test',
        'hash-ficticio-nao-autenticavel', 'MENTOR');
INSERT INTO mentor (id, usuario_id, biografia, status, data_entrada_plataforma)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
        'Biografia ficticia preservada', 'RASCUNHO', DATE '2026-01-01');
