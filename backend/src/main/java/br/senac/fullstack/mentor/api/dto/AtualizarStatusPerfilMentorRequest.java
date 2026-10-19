package br.senac.fullstack.mentor.api.dto;

import br.senac.fullstack.mentor.domain.enums.StatusPerfilMentor;
import jakarta.validation.constraints.NotNull;

public record AtualizarStatusPerfilMentorRequest(
        @NotNull
        StatusPerfilMentor status
) {
}
