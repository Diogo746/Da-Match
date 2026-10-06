package br.senac.fullstack.usuario.application.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CadastrarUsuarioRequestTest {

    private ValidatorFactory validatorFactory;
    private Validator validator;

    @BeforeEach
    void setUp() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterEach
    void tearDown() {
        validatorFactory.close();
    }

    @Test
    void shouldAcceptValidRegistrationRequest() {
        CadastrarUsuarioRequest request = new CadastrarUsuarioRequest(
                "Maria Silva",
                "maria@damatch.com",
                "senha-segura"
        );

        Set<ConstraintViolation<CadastrarUsuarioRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty());
    }

    @Test
    void shouldRejectInvalidRegistrationRequest() {
        CadastrarUsuarioRequest request = new CadastrarUsuarioRequest("Ana", "email-invalido", "123");

        Set<ConstraintViolation<CadastrarUsuarioRequest>> violations = validator.validate(request);
        Set<String> camposInvalidos = violations.stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(Collectors.toSet());

        assertEquals(3, violations.size());
        assertTrue(camposInvalidos.contains("nome"));
        assertTrue(camposInvalidos.contains("email"));
        assertTrue(camposInvalidos.contains("senha"));
    }
}
