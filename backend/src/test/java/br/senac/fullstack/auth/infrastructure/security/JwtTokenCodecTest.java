package br.senac.fullstack.auth.infrastructure.security;

import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenCodecTest {
    private static final Instant NOW = Instant.parse("2026-11-05T18:00:00Z");
    private static final KeyPair KEYS = keys(2048);
    private static final KeyPair OTHER = keys(2048);
    private static final UUID USER = UUID.randomUUID();
    private static final UUID SESSION = UUID.randomUUID();
    private final Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
    private JwtProperties properties;
    private JwtTokenCodec codec;

    @BeforeEach
    void prepare() {
        properties = properties(KEYS);
        codec = new JwtTokenCodec(properties, clock);
    }

    @Test
    void roundTripCarriesOnlyOpaqueIdentityAndStandardClaims() {
        String jwt = codec.issue(USER, SESSION, NOW.plusSeconds(900));
        var result = codec.verify(jwt);
        assertThat(result.userId()).isEqualTo(USER);
        assertThat(result.sessionId()).isEqualTo(SESSION);
        assertThat(result.expiresAt()).isEqualTo(NOW.plusSeconds(900));
        String payload = new String(Base64.getUrlDecoder().decode(jwt.split("\\.")[1]),
                java.nio.charset.StandardCharsets.UTF_8);
        assertThat(payload).doesNotContain("email", "senha", "role", "tipoUsuario", "nome");
    }

    @ParameterizedTest
    @ValueSource(strings = {"issuer", "audience", "extraAudience", "subject", "sid", "jti", "iat", "nbf", "exp",
            "future", "expired", "longLifetime", "reversed", "kid", "type", "algorithm", "signature", "unsigned"})
    void rejectsInvalidOrMissingClaimsAndHeaders(String fault) {
        JwtBuilder builder = valid();
        switch (fault) {
            case "issuer" -> builder.issuer("other");
            case "audience" -> builder.audience().clear().add("other");
            case "extraAudience" -> builder.audience().add("other");
            case "subject" -> builder.subject("1-1-1-1-1");
            case "sid" -> builder.claim("sid", "invalid");
            case "jti" -> builder.id(null);
            case "iat" -> builder.issuedAt(null);
            case "nbf" -> builder.notBefore(null);
            case "exp" -> builder.expiration(null);
            case "future" -> builder.issuedAt(Date.from(NOW.plusSeconds(60)))
                    .notBefore(Date.from(NOW.plusSeconds(60)));
            case "expired" -> builder.expiration(Date.from(NOW));
            case "longLifetime" -> builder.expiration(Date.from(NOW.plusSeconds(901)));
            case "reversed" -> builder.issuedAt(Date.from(NOW.plusSeconds(20)))
                    .notBefore(Date.from(NOW.minusSeconds(20)));
            case "kid" -> builder.header().keyId("unknown");
            case "type" -> builder.header().type("refresh+jwt");
            case "algorithm" -> builder.signWith(KEYS.getPrivate(), Jwts.SIG.RS512);
            case "signature" -> builder.signWith(OTHER.getPrivate(), Jwts.SIG.RS256);
            case "unsigned" -> builder = Jwts.builder().subject(USER.toString());
            default -> throw new IllegalArgumentException(fault);
        }
        String token = builder.compact();
        assertThatThrownBy(() -> codec.verify(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void acceptsPreviousPublicKeyDuringRotationAndRejectsItAfterRemoval() {
        String old = codec.issue(USER, SESSION, NOW.plusSeconds(900));
        JwtProperties rotated = properties(OTHER);
        rotated.setActiveKeyId("new");
        rotated.setPublicKeys(Map.of("new", encode(OTHER.getPublic().getEncoded()),
                "test", encode(KEYS.getPublic().getEncoded())));
        JwtTokenCodec next = new JwtTokenCodec(rotated, clock);
        assertThat(next.verify(old).userId()).isEqualTo(USER);
        assertThat(next.verify(next.issue(USER, SESSION, NOW.plusSeconds(900))).userId()).isEqualTo(USER);
        rotated.setPublicKeys(Map.of("new", encode(OTHER.getPublic().getEncoded())));
        JwtTokenCodec retired = new JwtTokenCodec(rotated, clock);
        assertThatThrownBy(() -> retired.verify(old)).isInstanceOf(JwtException.class);
    }

    @Test
    void rejectsOversizedAndMalformedTokens() {
        String oversized = "a".repeat(4097);
        assertThatThrownBy(() -> codec.verify(oversized)).isInstanceOf(JwtException.class);
        assertThatThrownBy(() -> codec.verify("malformed")).isInstanceOf(JwtException.class);
        assertThatThrownBy(() -> codec.verify(null)).isInstanceOf(JwtException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"missing", "weak", "mismatch", "ttl", "refresh", "absolute", "kid"})
    void failsClosedOnInvalidExternalConfigurationWithoutPrintingKeys(String fault) {
        switch (fault) {
            case "missing" -> properties.setPrivateKey(null);
            case "weak" -> properties = properties(keys(1024));
            case "mismatch" -> properties.setPrivateKey(encode(OTHER.getPrivate().getEncoded()));
            case "ttl" -> properties.setAccessTtl(Duration.ofHours(1));
            case "refresh" -> properties.setRefreshTtl(Duration.ofDays(1));
            case "absolute" -> properties.setAbsoluteTtl(Duration.ofDays(1));
            case "kid" -> properties.setActiveKeyId("bad/path");
            default -> throw new IllegalArgumentException(fault);
        }
        assertThatThrownBy(() -> new JwtTokenCodec(properties, clock)).isInstanceOf(IllegalStateException.class)
                .hasNoCause().hasMessageNotContaining(encode(KEYS.getPrivate().getEncoded()));
    }

    private JwtBuilder valid() {
        return Jwts.builder().header().keyId("test").type("at+jwt").and()
                .issuer("test-issuer").audience().add("test-audience").and()
                .subject(USER.toString()).id(UUID.randomUUID().toString()).claim("sid", SESSION.toString())
                .issuedAt(Date.from(NOW)).notBefore(Date.from(NOW)).expiration(Date.from(NOW.plusSeconds(900)))
                .signWith(KEYS.getPrivate(), Jwts.SIG.RS256);
    }

    static JwtProperties properties(KeyPair keys) {
        JwtProperties result = new JwtProperties();
        result.setIssuer("test-issuer");
        result.setAudience("test-audience");
        result.setActiveKeyId("test");
        result.setPrivateKey(encode(keys.getPrivate().getEncoded()));
        result.setPublicKeys(Map.of("test", encode(keys.getPublic().getEncoded())));
        return result;
    }

    static KeyPair keys(int size) {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(size);
            return generator.generateKeyPair();
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    static String encode(byte[] bytes) {
        return Base64.getEncoder().encodeToString(bytes);
    }
}
