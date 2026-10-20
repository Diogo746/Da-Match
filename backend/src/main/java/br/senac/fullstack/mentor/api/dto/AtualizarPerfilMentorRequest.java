package br.senac.fullstack.mentor.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record AtualizarPerfilMentorRequest(
        @Size(max = 1000, message = "Biografia deve ter no máximo 1000 caracteres")
        String biografia,
        String linkedin,
        String instagram,
        String site,
        @Size(min = 1, message = "Disponibilidades não podem ficar vazias")
        @Valid
        Set<DisponibilidadeMentorRequest> disponibilidades
) {
}
