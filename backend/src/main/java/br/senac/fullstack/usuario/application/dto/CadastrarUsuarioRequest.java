package br.senac.fullstack.usuario.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.Length;

public record CadastrarUsuarioRequest(
        @NotBlank(message = "Nome não pode está vazio")
        @Length(min = 4)
        String nome,

        @NotBlank(message = "Email não pode está vazio")
        @Email()
        String email,

        @NotBlank(message = "Senha não pode está vazia")
        @Length(min = 6, message = "Senha deve conter no minimo 6 caracteres")
        String senha
) {
}
