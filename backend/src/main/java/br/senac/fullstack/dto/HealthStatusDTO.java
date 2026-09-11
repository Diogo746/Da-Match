package br.senac.fullstack.dto;

import java.time.Instant;

public record HealthStatusDTO(
    String status,
    String application,
    String environment,
    Instant timestamp,
    long uptimeMillis
) {}
