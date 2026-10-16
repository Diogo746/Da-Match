package br.senac.fullstack.mentor.api.controller;

import br.senac.fullstack.mentor.api.dto.CadastrarMentorRequest;
import br.senac.fullstack.mentor.api.dto.MentorResponse;
import br.senac.fullstack.mentor.application.service.MentorService;
import br.senac.fullstack.shared.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MentorController.class)
@Import(SecurityConfig.class)
class MentorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MentorService mentorService;

    @Test
    void shouldCreateMentorWhenRequestIsValidAndHasCsrfToken() throws Exception {
        UUID mentorId = UUID.randomUUID();
        when(mentorService.criarMentor(any(CadastrarMentorRequest.class))).thenReturn(new MentorResponse(
                mentorId,
                UUID.randomUUID(),
                "Mentor de Teste",
                "mentor.teste@example.com",
                "Experiencia em produtos digitais.",
                "https://www.linkedin.com/in/mentor-teste",
                "mentor.teste",
                null,
                LocalDate.of(2026, 10, 15)
        ));

        mockMvc.perform(post("/api/v1/mentores")
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "usuario": {
                                    "nome": "Mentor de Teste",
                                    "email": "mentor.teste@example.com",
                                    "senha": "senha-ficticia"
                                  },
                                  "biografia": "Experiencia em produtos digitais.",
                                  "linkedin": "https://www.linkedin.com/in/mentor-teste",
                                  "instagram": "mentor.teste"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(mentorId.toString()))
                .andExpect(jsonPath("$.email").value("mentor.teste@example.com"));

        ArgumentCaptor<CadastrarMentorRequest> requestCaptor =
                ArgumentCaptor.forClass(CadastrarMentorRequest.class);
        verify(mentorService).criarMentor(requestCaptor.capture());
        assertEquals("mentor.teste@example.com", requestCaptor.getValue().usuario().email());
        assertEquals("Experiencia em produtos digitais.", requestCaptor.getValue().biografia());
    }

    @Test
    void shouldRejectMentorCreationWithoutCsrfToken() throws Exception {
        mockMvc.perform(post("/api/v1/mentores")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldRejectMentorCreationWhenRequiredFieldsAreMissing() throws Exception {
        mockMvc.perform(post("/api/v1/mentores")
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
