package br.senac.fullstack.service;

import br.senac.fullstack.dto.HelloWorldDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class HelloWorldServiceTest {

    private HelloWorldService helloWorldService;

    @BeforeEach
    void setUp() {
        helloWorldService = new HelloWorldService();
        ReflectionTestUtils.setField(helloWorldService, "applicationName", "test-fullstack-api");
        ReflectionTestUtils.setField(helloWorldService, "environment", "test");
    }

    @Test
    void shouldReturnDefaultGreetingWhenNameIsNull() {
        HelloWorldDTO result = helloWorldService.getGreeting(null);
        assertNotNull(result);
        assertEquals("Olá, Mundo! Bem-vindo à Unidade de Extensão Fullstack Senac 2026.2.", result.message());
        assertEquals("test-fullstack-api", result.application());
        assertEquals("test", result.environment());
        assertNotNull(result.timestamp());
    }

    @Test
    void shouldReturnCustomGreetingWhenNameIsProvided() {
        HelloWorldDTO result = helloWorldService.getGreeting("Aluno Senac");
        assertNotNull(result);
        assertEquals("Olá, Aluno Senac! Bem-vindo à Unidade de Extensão Fullstack Senac 2026.2.", result.message());
    }
}
