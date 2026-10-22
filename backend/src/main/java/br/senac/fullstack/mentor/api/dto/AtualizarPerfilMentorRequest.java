package br.senac.fullstack.mentor.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

import java.util.Set;

public record AtualizarPerfilMentorRequest(
        @Size(max = 1000, message = "Biografia deve ter no máximo 1000 caracteres")
        @Pattern(regexp = "(?s).*\\S.*", message = "Biografia não pode ficar vazia")
        String biografia,
        @Size(max = 255)
        String linkedin,
        @Size(max = 255)
        String instagram,
        @Size(max = 255)
        String site,
        @Size(min = 1, message = "Disponibilidades não podem ficar vazias")
        @Valid
        Set<DisponibilidadeMentorRequest> disponibilidades
) {
}
