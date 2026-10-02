package br.senac.fullstack.shared.web.dto;

import org.springframework.http.HttpStatus;

public record ApiResponse<T>(
        HttpStatus status,
        T dados
) {
}
