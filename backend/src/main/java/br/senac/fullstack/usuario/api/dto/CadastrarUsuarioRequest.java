package br.senac.fullstack.usuario.api.dto;

import br.senac.fullstack.usuario.api.validation.SenhaCompativelBcrypt;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CadastrarUsuarioRequest(
        @NotBlank(message = "Nome não pode estar vazio")
        @Size(min = 4, max = 255, message = "Nome deve conter de 4 a 255 caracteres")
        String nome,

        @NotBlank(message = "Email não pode estar vazio")
        @Email
        @Size(max = 254)
        String email,

        @NotBlank(message = "Senha não pode estar vazia")
        @SenhaCompativelBcrypt
        @Size(min = 6, max = 72, message = "Senha deve conter de 6 a 72 caracteres")
        String senha
) {
    @Override
    public String toString() {
        return "CadastrarUsuarioRequest[redacted]";
    }
}
