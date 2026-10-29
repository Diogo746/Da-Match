package br.senac.fullstack.shared.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PasswordConfigTest {

    @Test
    void shouldEncodeAndValidatePassword() {
        PasswordEncoder passwordEncoder = new PasswordConfig().passwordEncoder();
        String senha = "senha-segura";
        String senhaCodificada = passwordEncoder.encode(senha);

        assertNotEquals(senha, senhaCodificada);
        assertTrue(passwordEncoder.matches(senha, senhaCodificada));
    }

    @Test
    void newHashesRejectAnIgnoredUnicodeSuffixAndPasswordsOverTheByteLimit() {
        PasswordEncoder encoder = new PasswordConfig().passwordEncoder();
        String boundary = "é".repeat(36);
        String oversized = boundary + "X";
        String hash = encoder.encode(boundary);

        assertTrue(hash.startsWith("{bcrypt-utf8}"));
        assertTrue(encoder.matches(boundary, hash));
        assertFalse(encoder.matches(oversized, hash));
        assertFalse(encoder.matches(null, hash));
        assertThrows(IllegalArgumentException.class, () -> encoder.encode(oversized));
        assertThrows(IllegalArgumentException.class, () -> encoder.encode(null));
    }

    @Test
    void legacyUntaggedHashesRemainUsableIncludingExistingUnicodePasswords() {
        String legacyPassword = "é".repeat(36) + "X";
        String hash = new BCryptPasswordEncoder().encode(legacyPassword);
        PasswordEncoder encoder = new PasswordConfig().passwordEncoder();

        assertTrue(encoder.matches(legacyPassword, hash));
        assertFalse(encoder.matches("different-test-password", hash));
    }
}
