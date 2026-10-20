package br.senac.fullstack.mentor.api.dto;

import br.senac.fullstack.mentor.domain.enums.StatusPerfilMentor;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

public record MentorResponse(
        UUID id,
        UUID usuarioId,
        String nome,
        String email,
        String biografia,
        String linkedin,
        String instagram,
        String site,
        Set<DisponibilidadeMentorResponse> disponibilidades,
        StatusPerfilMentor status,
        LocalDate dataEntradaPlataforma
) {
}
