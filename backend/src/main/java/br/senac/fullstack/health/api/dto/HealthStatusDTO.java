package br.senac.fullstack.health.api.dto;

import java.time.Instant;

public record HealthStatusDTO(
    String status,
    String application,
    String environment,
    Instant timestamp,
    long uptimeMillis
) {}
