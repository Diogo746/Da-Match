package br.senac.fullstack.usuario.api.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.nio.charset.StandardCharsets;
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

    @ParameterizedTest
    @ValueSource(strings = {"a", "é", "\uD83D\uDE00"})
    void shouldValidateTheUtf8BoundaryInsteadOfOnlyCharacterCount(String symbol) {
        int repetitions = 72 / symbol.getBytes(StandardCharsets.UTF_8).length;
        CadastrarUsuarioRequest valid = new CadastrarUsuarioRequest(
                "Pessoa Ficticia", "person@example.test", symbol.repeat(repetitions));
        CadastrarUsuarioRequest oversized = new CadastrarUsuarioRequest(
                "Pessoa Ficticia", "person@example.test", symbol.repeat(repetitions + 1));

        assertTrue(validator.validate(valid).isEmpty());
        assertTrue(validator.validate(oversized).stream()
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("senha")));
    }

    @Test
    void shouldLeaveNullPasswordToTheRequiredConstraint() {
        CadastrarUsuarioRequest request = new CadastrarUsuarioRequest("Pessoa Ficticia", "person@example.test", null);
        assertEquals(1, validator.validate(request).size());
    }
}
