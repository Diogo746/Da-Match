package br.senac.fullstack.mentor.api.dto;

import br.senac.fullstack.mentor.domain.enums.PeriodoDisponibilidade;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record DisponibilidadeMentorRequest(
        @NotNull
        @Min(1)
        @Max(7)
        Integer diaSemana,
        @NotNull
        PeriodoDisponibilidade periodo
) {
}
