package br.senac.fullstack.shared.security;

import java.nio.charset.StandardCharsets;

public final class PasswordPolicy {
    public static final int BCRYPT_MAX_BYTES = 72;

    private PasswordPolicy() {
    }

    public static boolean fitsBcrypt(String password) {
        return password != null && password.getBytes(StandardCharsets.UTF_8).length <= BCRYPT_MAX_BYTES;
    }
}
