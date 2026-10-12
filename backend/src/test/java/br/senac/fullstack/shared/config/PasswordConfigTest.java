package br.senac.fullstack.shared.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordConfigTest {

    @Test
    void shouldEncodeAndValidatePassword() {
        PasswordEncoder passwordEncoder = new PasswordConfig().passwordEncoder();
        String senha = "senha-segura";
        String senhaCodificada = passwordEncoder.encode(senha);

        assertNotEquals(senha, senhaCodificada);
        assertTrue(passwordEncoder.matches(senha, senhaCodificada));
    }
}
