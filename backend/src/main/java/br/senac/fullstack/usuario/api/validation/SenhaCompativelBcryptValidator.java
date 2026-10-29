package br.senac.fullstack.usuario.api.validation;

import br.senac.fullstack.shared.security.PasswordPolicy;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class SenhaCompativelBcryptValidator implements ConstraintValidator<SenhaCompativelBcrypt, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || PasswordPolicy.fitsBcrypt(value);
    }
}
