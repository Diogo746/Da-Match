package br.senac.fullstack.mentor.api.dto;

import br.senac.fullstack.mentor.domain.enums.PeriodoDisponibilidade;

public record DisponibilidadeMentorResponse(
        Integer diaSemana,
        PeriodoDisponibilidade periodo
) {
}
