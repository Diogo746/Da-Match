package br.senac.fullstack.startup.api.dto;

import br.senac.fullstack.startup.domain.enums.StatusValidacao;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AtualizarStartupRequest(
        @Size(max = 255) @Pattern(regexp = "(?s).*\\S.*") String nomeProvisorio,
        @Size(max = 255) @Pattern(regexp = "(?s).*\\S.*") String pitchCurto,
        @Size(max = 5000) @Pattern(regexp = "(?s).*\\S.*") String problemaCentral,
        @Size(max = 5000) @Pattern(regexp = "(?s).*\\S.*") String solucaoProposta,
        @Size(max = 255) @Pattern(regexp = "(?s).*\\S.*") String publicoAlvo,
        @Size(max = 255) @Pattern(regexp = "(?s).*\\S.*") String modeloDeNegocio,
        StatusValidacao statusValidacao
) {
}
