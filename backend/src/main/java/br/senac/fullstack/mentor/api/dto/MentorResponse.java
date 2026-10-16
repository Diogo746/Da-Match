package br.senac.fullstack.mentor.api.dto;

import java.time.LocalDate;
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
        LocalDate dataEntradaPlataforma
) {
}
