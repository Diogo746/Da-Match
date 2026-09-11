package br.senac.fullstack.controller;

import br.senac.fullstack.dto.HealthStatusDTO;
import br.senac.fullstack.service.HealthCheckService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HealthCheckController.class)
class HealthCheckControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HealthCheckService healthCheckService;

    @Test
    void shouldReturnHealthStatusOk() throws Exception {
        HealthStatusDTO mockDto = new HealthStatusDTO(
            "UP",
            "test-app",
            "development",
            Instant.now(),
            12345L
        );

        when(healthCheckService.checkHealth()).thenReturn(mockDto);

        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.application").value("test-app"))
                .andExpect(jsonPath("$.environment").value("development"));
    }
}
