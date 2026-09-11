package br.senac.fullstack.controller;

import br.senac.fullstack.dto.HelloWorldDTO;
import br.senac.fullstack.service.HelloWorldService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HelloWorldController.class)
class HelloWorldControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HelloWorldService helloWorldService;

    @Test
    void shouldReturnGreetingOk() throws Exception {
        HelloWorldDTO mockDto = new HelloWorldDTO(
            "Olá, Mundo!",
            "test-app",
            "test",
            Instant.now()
        );

        when(helloWorldService.getGreeting(any())).thenReturn(mockDto);

        mockMvc.perform(get("/api/v1/hello"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Olá, Mundo!"))
                .andExpect(jsonPath("$.application").value("test-app"));
    }
}
