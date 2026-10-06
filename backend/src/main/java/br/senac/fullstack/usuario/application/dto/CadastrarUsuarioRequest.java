package br.senac.fullstack.usuario.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CadastrarUsuarioRequest(
        @NotBlank(message = "Nome não pode está vazio")
        @Size(min = 4, message = "Nome deve conter no mínimo 4 caracteres")
        String nome,

        @NotBlank(message = "Email não pode está vazio")
        @Email
        String email,

        @NotBlank(message = "Senha não pode está vazia")
        @Size(min = 6, message = "Senha deve conter no mínimo 6 caracteres")
        String senha
) {
}
