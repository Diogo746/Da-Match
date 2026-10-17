package br.senac.fullstack.mentor.api.dto;

import java.util.UUID;

public record AtualizarPerfilMentorRequest(
        UUID id,
        String biografia,
        String linkedin,
        String instagram,
        String site
) {
}
