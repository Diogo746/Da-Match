package br.senac.fullstack.mentor.api.dto;

import br.senac.fullstack.usuario.api.dto.CadastrarUsuarioRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CadastrarMentorRequest(
        @NotNull
        @Valid
        CadastrarUsuarioRequest usuario,

        @NotBlank(message = "Biografia não pode ta vazia")
        @Size(max = 1000, message = "Biografia deve ter no máximo 1000 caracteres")
        String biografia,
        @Size(max = 255)
        String linkedin,
        @Size(max = 255)
        String instagram,
        @NotEmpty
        @Valid
        Set<DisponibilidadeMentorRequest> disponibilidades
) {
}
