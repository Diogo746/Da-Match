package br.senac.fullstack.shared.config;

import br.senac.fullstack.shared.security.BcryptUtf8PasswordEncoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;

import java.util.Map;

@Configuration
public class PasswordConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        DelegatingPasswordEncoder encoder = new DelegatingPasswordEncoder(
                "bcrypt-utf8", Map.of("bcrypt-utf8", new BcryptUtf8PasswordEncoder()));
        // Untagged hashes predate byte validation. Preserve access without rewriting existing credentials.
        encoder.setDefaultPasswordEncoderForMatches(new BCryptPasswordEncoder());
        return encoder;
    }

}
