package br.senac.fullstack.auth.infrastructure.security;

import org.springframework.security.authentication.BadCredentialsException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

public final class JwtSecrets {
    private static final SecureRandom RANDOM = new SecureRandom();

    private JwtSecrets() {
    }

    public static String refreshToken(UUID sessionId) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return sessionId + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static UUID sessionId(String token) {
        if (token == null || !token.matches("[0-9a-f-]{36}\\.[A-Za-z0-9_-]{43}")) {
            throw denied();
        }
        try {
            UUID id = UUID.fromString(token.substring(0, 36));
            if (!id.toString().equals(token.substring(0, 36))) {
                throw denied();
            }
            return id;
        } catch (IllegalArgumentException exception) {
            throw denied();
        }
    }

    public static String hash(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 indisponível.");
        }
    }

    public static BadCredentialsException denied() {
        return new BadCredentialsException("Autenticação necessária ou credenciais inválidas.");
    }
}
