package br.senac.fullstack.auth.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(max = 72) String senha
) {
    @Override
    public String toString() {
        return "LoginRequest[redacted]";
    }
}
