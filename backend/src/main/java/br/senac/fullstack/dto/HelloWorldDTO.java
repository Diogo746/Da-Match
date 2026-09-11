package br.senac.fullstack.dto;

import java.time.Instant;

public record HelloWorldDTO(
    String message,
    String application,
    String environment,
    Instant timestamp
) {}
