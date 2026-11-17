package br.senac.fullstack.matching.domain;

import br.senac.fullstack.descoberta.domain.PerfilDescoberta;

import java.time.Instant;

public record PerfilMatching(PerfilDescoberta perfil, DadosMatching dados,
        Instant questionarioAtualizadoEm, String revisao) { }
