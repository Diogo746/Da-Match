CREATE TABLE usuario (
    id UUID PRIMARY KEY,
    id_ldap UUID,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(255) NOT NULL CHECK (tipo_usuario IN ('MENTOR', 'STARTUP', 'ADMIN'))
);

CREATE TABLE mentor (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuario(id),
    biografia VARCHAR(255) NOT NULL,
    linkedin VARCHAR(255),
    instagram VARCHAR(255),
    site VARCHAR(255),
    status VARCHAR(255) NOT NULL CHECK (status IN ('RASCUNHO', 'PUBLICADO', 'PAUSADO')),
    data_entrada_plataforma DATE NOT NULL
);

CREATE TABLE disponibilidade_mentor (
    mentor_id UUID NOT NULL REFERENCES mentor(id),
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    periodo VARCHAR(255) NOT NULL CHECK (periodo IN ('MANHA', 'TARDE', 'NOITE'))
);

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
    papel_membro VARCHAR(255) NOT NULL CHECK (papel_membro IN ('FUNDADOR', 'REPRESENTANTE', 'MEMBRO')),
    data_entrada DATE NOT NULL
);
