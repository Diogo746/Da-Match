-- Test-only snapshot of a populated schema predating mentor status and weekly availability.
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
    data_entrada_plataforma DATE NOT NULL
);
INSERT INTO usuario (id, nome, email, senha, tipo_usuario)
VALUES ('00000000-0000-0000-0000-000000000001', 'Pessoa Ficticia', 'legacy@example.test',
        'hash-ficticio-nao-autenticavel', 'MENTOR');
INSERT INTO mentor (id, usuario_id, biografia, data_entrada_plataforma)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
        'Biografia ficticia preservada', DATE '2026-01-01');
