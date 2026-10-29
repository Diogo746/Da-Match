package br.senac.fullstack.shared.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

public final class BcryptUtf8PasswordEncoder implements PasswordEncoder {
    private final BCryptPasswordEncoder delegate = new BCryptPasswordEncoder();

    @Override
    public String encode(CharSequence rawPassword) {
        if (rawPassword == null || !PasswordPolicy.fitsBcrypt(rawPassword.toString())) {
            throw new IllegalArgumentException("Senha deve ter no máximo 72 bytes em UTF-8.");
        }
        return delegate.encode(rawPassword);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        return rawPassword != null && PasswordPolicy.fitsBcrypt(rawPassword.toString())
                && delegate.matches(rawPassword, encodedPassword);
    }
}
