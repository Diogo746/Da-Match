package br.senac.fullstack.auth.domain;

import java.time.Instant;
import java.util.UUID;

public record JwtIdentity(UUID userId, UUID sessionId, Instant expiresAt) {
}
