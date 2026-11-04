package br.senac.fullstack.startup.api.dto;

import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CriarConviteStartupRequest(@NotNull UUID solicitacaoId,
        @NotBlank @Email @Size(max = 254) String email, @NotNull PapelMembroStartup papelMembro) {
    public CriarConviteStartupRequest {
        if (email != null) {
            email = email.trim();
        }
    }

    @AssertTrue(message = "Escolha MEMBRO ou REPRESENTANTE.")
    public boolean isPapelPermitido() {
        return papelMembro == PapelMembroStartup.MEMBRO || papelMembro == PapelMembroStartup.REPRESENTANTE;
    }

    @Override
    public String toString() {
        return "CriarConviteStartupRequest[redacted]";
    }
}
