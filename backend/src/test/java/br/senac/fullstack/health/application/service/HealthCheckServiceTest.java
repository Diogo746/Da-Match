package br.senac.fullstack.health.application.service;

import br.senac.fullstack.health.api.dto.HealthStatusDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HealthCheckServiceTest {

    private HealthCheckService healthCheckService;

    @BeforeEach
    void setUp() {
        healthCheckService = new HealthCheckService();
        ReflectionTestUtils.setField(healthCheckService, "applicationName", "test-api");
        ReflectionTestUtils.setField(healthCheckService, "environment", "test");
    }

    @Test
    void shouldReturnValidHealthStatus() {
        HealthStatusDTO status = healthCheckService.checkHealth();

        assertNotNull(status);
        assertEquals("UP", status.status());
        assertEquals("test-api", status.application());
        assertEquals("test", status.environment());
        assertNotNull(status.timestamp());
        assertTrue(status.uptimeMillis() >= 0);
    }
}
