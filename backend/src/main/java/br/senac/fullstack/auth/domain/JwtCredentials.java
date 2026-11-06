package br.senac.fullstack.auth.domain;

import java.time.Instant;

public record JwtCredentials(String accessToken, String refreshToken, Instant accessExpiresAt) {
    @Override
    public String toString() {
        return "JwtCredentials[redacted]";
    }
}
