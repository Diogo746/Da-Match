package br.senac.fullstack.startup.api.dto;

import br.senac.fullstack.startup.domain.enums.StatusValidacao;
import br.senac.fullstack.usuario.api.dto.CadastrarUsuarioRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CriarStartupRequest(
        @NotNull
        @Valid
        CadastrarUsuarioRequest fundador,
        @NotBlank String nomeProvisorio,
        @NotBlank String pitchCurto,
        @NotBlank String problemaCentral,
        @NotBlank String solucaoProposta,
        @NotBlank String publicoAlvo,
        @NotBlank String modeloDeNegocio,
        @NotNull StatusValidacao statusValidacao
) {
}
