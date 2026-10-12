package br.senac.fullstack.shared.api.dto;

public record CsrfResponse(
        String headerName,
        String token
) {
}
