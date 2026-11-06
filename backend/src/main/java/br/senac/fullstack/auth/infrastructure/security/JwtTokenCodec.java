package br.senac.fullstack.auth.infrastructure.security;

import br.senac.fullstack.auth.domain.JwtIdentity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.UnsupportedJwtException;

import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public final class JwtTokenCodec {
    private final JwtProperties properties;
    private final Clock clock;
    private final RSAPrivateKey signingKey;
    private final JwtParser parser;

    public JwtTokenCodec(JwtProperties properties, Clock clock) {
        properties.validatePolicy();
        this.properties = properties;
        this.clock = clock;
        Map<String, RSAPublicKey> keys = new HashMap<>();
        try {
            KeyFactory factory = KeyFactory.getInstance("RSA");
            for (var entry : properties.getPublicKeys().entrySet()) {
                if (!entry.getKey().matches("[A-Za-z0-9_-]{1,64}")) {
                    throw new IllegalArgumentException("kid inválido");
                }
                RSAPublicKey key = (RSAPublicKey) factory.generatePublic(
                        new X509EncodedKeySpec(Base64.getDecoder().decode(entry.getValue())));
                if (key.getModulus().bitLength() < 2048) {
                    throw new IllegalArgumentException("RSA insuficiente");
                }
                keys.put(entry.getKey(), key);
            }
            signingKey = (RSAPrivateKey) factory.generatePrivate(
                    new PKCS8EncodedKeySpec(Base64.getDecoder().decode(properties.getPrivateKey())));
            RSAPublicKey active = keys.get(properties.getActiveKeyId());
            if (active == null || !active.getModulus().equals(signingKey.getModulus())) {
                throw new IllegalArgumentException("Par de chaves inválido");
            }
        } catch (Exception exception) {
            // Never attach parsing causes: configuration may contain private key material.
            throw new IllegalStateException("Configure um par RSA válido e chaves públicas JWT com pelo menos 2048 bits.");
        }
        parser = Jwts.parser().clock(() -> Date.from(clock.instant()))
                .requireIssuer(properties.getIssuer())
                .sig().clear().add(Jwts.SIG.RS256).and()
                .zip().clear().and()
                .keyLocator(header -> {
                    if (!"RS256".equals(header.get("alg")) || !"at+jwt".equals(header.get("typ"))) {
                        throw new UnsupportedJwtException("JWT inválido.");
                    }
                    RSAPublicKey key = keys.get(header.get("kid"));
                    if (key == null) {
                        throw new UnsupportedJwtException("JWT inválido.");
                    }
                    return key;
                }).build();
    }

    public String issue(UUID userId, UUID sessionId, Instant expiresAt) {
        Instant now = clock.instant().truncatedTo(ChronoUnit.SECONDS);
        return Jwts.builder().header().keyId(properties.getActiveKeyId()).type("at+jwt").and()
                .issuer(properties.getIssuer()).audience().add(properties.getAudience()).and()
                .subject(userId.toString()).id(UUID.randomUUID().toString()).claim("sid", sessionId.toString())
                .issuedAt(Date.from(now)).notBefore(Date.from(now)).expiration(Date.from(expiresAt))
                .signWith(signingKey, Jwts.SIG.RS256).compact();
    }

    public JwtIdentity verify(String token) {
        if (token == null || token.length() > 4096) {
            throw new JwtException("JWT inválido.");
        }
        Claims claims = parser.parseSignedClaims(token).getPayload();
        try {
            Instant issuedAt = claims.getIssuedAt().toInstant();
            Instant notBefore = claims.getNotBefore().toInstant();
            Instant expiresAt = claims.getExpiration().toInstant();
            Instant now = clock.instant();
            if (!Set.of(properties.getAudience()).equals(claims.getAudience())
                    || issuedAt.isAfter(now.plusSeconds(30)) || !notBefore.equals(issuedAt)
                    || !expiresAt.isAfter(now) || !expiresAt.isAfter(issuedAt)
                    || expiresAt.isAfter(issuedAt.plus(properties.getAccessTtl()))) {
                throw new IllegalArgumentException("Claims inválidas");
            }
            canonicalUuid(claims.getId());
            return new JwtIdentity(canonicalUuid(claims.getSubject()),
                    canonicalUuid(claims.get("sid", String.class)), expiresAt);
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new JwtException("JWT inválido.");
        }
    }

    private static UUID canonicalUuid(String value) {
        UUID id = UUID.fromString(value);
        if (!id.toString().equals(value)) {
            throw new IllegalArgumentException("UUID inválido");
        }
        return id;
    }
}
