package br.senac.fullstack.auth.infrastructure.security;

import br.senac.fullstack.auth.domain.JwtIdentity;
import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public final class JwtTokenCodec {
    private final JwtProperties properties;
    private final Clock clock;
    private final Algorithm signingAlgorithm;
    private final Map<String, JWTVerifier> verifiers;

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
            RSAPrivateKey signingKey = (RSAPrivateKey) factory.generatePrivate(
                    new PKCS8EncodedKeySpec(Base64.getDecoder().decode(properties.getPrivateKey())));
            RSAPublicKey active = keys.get(properties.getActiveKeyId());
            if (active == null || !active.getModulus().equals(signingKey.getModulus())) {
                throw new IllegalArgumentException("Par de chaves inválido");
            }
            signingAlgorithm = Algorithm.RSA256(active, signingKey);
        } catch (Exception exception) {
            // Never attach parsing causes: configuration may contain private key material.
            throw new IllegalStateException("Configure um par RSA válido e chaves públicas JWT com pelo menos 2048 bits.");
        }
        verifiers = keys.entrySet().stream().collect(Collectors.toUnmodifiableMap(
                Map.Entry::getKey, entry -> verifier(entry.getValue())));
    }

    public String issue(UUID userId, UUID sessionId, Instant expiresAt) {
        Instant now = clock.instant().truncatedTo(ChronoUnit.SECONDS);
        return JWT.create().withKeyId(properties.getActiveKeyId()).withHeader(Map.of("typ", "at+jwt"))
                .withIssuer(properties.getIssuer()).withAudience(properties.getAudience())
                .withSubject(userId.toString()).withJWTId(UUID.randomUUID().toString()).withClaim("sid", sessionId.toString())
                .withIssuedAt(now).withNotBefore(now).withExpiresAt(expiresAt).sign(signingAlgorithm);
    }

    public JwtIdentity verify(String token) {
        if (token == null || token.length() > 4096) {
            throw JwtSecrets.denied();
        }
        try {
            DecodedJWT claims = JWT.decode(token);
            verifySignature(claims);
            Instant issuedAt = claims.getIssuedAtAsInstant();
            Instant notBefore = claims.getNotBeforeAsInstant();
            Instant expiresAt = claims.getExpiresAtAsInstant();
            Instant now = clock.instant();
            if (!properties.getIssuer().equals(claims.getIssuer())
                    || !List.of(properties.getAudience()).equals(claims.getAudience())
                    || issuedAt.isAfter(now) || !notBefore.equals(issuedAt)
                    || !expiresAt.isAfter(now) || !expiresAt.isAfter(issuedAt)
                    || expiresAt.isAfter(issuedAt.plus(properties.getAccessTtl()))) {
                throw new IllegalArgumentException("Claims inválidas");
            }
            canonicalUuid(claims.getId());
            return new JwtIdentity(canonicalUuid(claims.getSubject()),
                    canonicalUuid(claims.getClaim("sid").asString()), expiresAt);
        } catch (JWTVerificationException | IllegalArgumentException | NullPointerException exception) {
            throw JwtSecrets.denied();
        }
    }

    private void verifySignature(DecodedJWT jwt) {
        JWTVerifier verifier = verifiers.get(jwt.getKeyId());
        if (verifier == null || !"RS256".equals(jwt.getAlgorithm()) || !"at+jwt".equals(jwt.getType())
                || !jwt.getHeaderClaim("zip").isMissing() || !jwt.getHeaderClaim("crit").isMissing()) {
            throw JwtSecrets.denied();
        }
        // Decoding grants no trust. The library verifies pinned RS256, issuer,
        // audience and time claims; our required-claim/lifetime policy also applies.
        verifier.verify(jwt);
    }

    private JWTVerifier verifier(RSAPublicKey key) {
        var configuration = (JWTVerifier.BaseVerification) JWT.require(Algorithm.RSA256(key, null));
        configuration.withIssuer(properties.getIssuer()).withAudience(properties.getAudience());
        // The public Clock overload keeps library checks and application policy
        // on the same injected clock, including deterministic expiry tests.
        return configuration.build(clock);
    }

    private static UUID canonicalUuid(String value) {
        UUID id = UUID.fromString(value);
        if (!id.toString().equals(value)) {
            throw new IllegalArgumentException("UUID inválido");
        }
        return id;
    }
}
