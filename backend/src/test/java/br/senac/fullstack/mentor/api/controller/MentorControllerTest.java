package br.senac.fullstack.mentor.api.controller;

import br.senac.fullstack.mentor.api.dto.CadastrarMentorRequest;
import br.senac.fullstack.mentor.api.dto.AtualizarPerfilMentorRequest;
import br.senac.fullstack.mentor.api.dto.DisponibilidadeMentorResponse;
import br.senac.fullstack.mentor.api.dto.MentorResponse;
import br.senac.fullstack.mentor.application.exception.MentorNaoEncontradoException;
import br.senac.fullstack.mentor.application.service.MentorService;
import br.senac.fullstack.mentor.domain.enums.PeriodoDisponibilidade;
import br.senac.fullstack.mentor.domain.enums.StatusPerfilMentor;
import br.senac.fullstack.shared.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
    @WithMockUser(roles = "MENTOR")
    void shouldHideUnexpectedInternalFailureDetails() throws Exception {
        when(mentorService.atualizarPerfil(any(), any())).thenThrow(new RuntimeException("SQL secret internals"));
        mockMvc.perform(patch("/api/v1/mentores/{mentorId}", UUID.randomUUID())
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.detail").value("Não foi possível processar a solicitação."))
                .andExpect(jsonPath("$.exception").doesNotExist())
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

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
                Set.of(new DisponibilidadeMentorResponse(1, PeriodoDisponibilidade.MANHA)),
                StatusPerfilMentor.RASCUNHO,
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
                                  "instagram": "mentor.teste",
                                  "disponibilidades": [
                                    { "diaSemana": 1, "periodo": "MANHA" }
                                  ]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(mentorId.toString()))
                .andExpect(jsonPath("$.email").value("mentor.teste@example.com"))
                .andExpect(jsonPath("$.disponibilidades[0].diaSemana").value(1))
                .andExpect(jsonPath("$.disponibilidades[0].periodo").value("MANHA"))
                .andExpect(jsonPath("$.status").value("RASCUNHO"));

        ArgumentCaptor<CadastrarMentorRequest> requestCaptor =
                ArgumentCaptor.forClass(CadastrarMentorRequest.class);
        verify(mentorService).criarMentor(requestCaptor.capture());
        assertEquals("mentor.teste@example.com", requestCaptor.getValue().usuario().email());
        assertEquals("Experiencia em produtos digitais.", requestCaptor.getValue().biografia());
        assertEquals(1, requestCaptor.getValue().disponibilidades().size());
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

    @Test
    void shouldRejectMentorCreationWhenAvailabilityDayIsInvalid() throws Exception {
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
                                  "disponibilidades": [
                                    { "diaSemana": 0, "periodo": "MANHA" }
                                  ]
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "MENTOR")
    void shouldUpdateMentorStatusWhenRequestIsValid() throws Exception {
        UUID mentorId = UUID.randomUUID();
        MentorResponse response = new MentorResponse(
                mentorId,
                UUID.randomUUID(),
                "Mentor de Teste",
                "mentor.teste@example.com",
                "Experiencia em produtos digitais.",
                null,
                null,
                null,
                Set.of(),
                StatusPerfilMentor.PUBLICADO,
                LocalDate.of(2026, 10, 15)
        );
        when(mentorService.atualizarStatus(any(UUID.class), any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/mentores/{mentorId}/status", mentorId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "PUBLICADO" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLICADO"));
    }

    @Test
    @WithMockUser(roles = "MENTOR")
    void shouldRejectStatusUpdateWhenStatusIsMissing() throws Exception {
        mockMvc.perform(patch("/api/v1/mentores/{mentorId}/status", UUID.randomUUID())
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "MENTOR")
    void shouldReturnNotFoundWhenUpdatingUnknownMentorStatus() throws Exception {
        UUID mentorId = UUID.randomUUID();
        when(mentorService.atualizarStatus(any(UUID.class), any()))
                .thenThrow(new MentorNaoEncontradoException("Mentor não encontrado"));

        mockMvc.perform(patch("/api/v1/mentores/{mentorId}/status", mentorId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "status": "PAUSADO" }
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "MENTOR")
    void shouldUpdateMentorProfileWhenRequestIsValid() throws Exception {
        UUID mentorId = UUID.randomUUID();
        MentorResponse response = new MentorResponse(
                mentorId,
                UUID.randomUUID(),
                "Mentor de Teste",
                "mentor.teste@example.com",
                "Nova biografia",
                null,
                null,
                "https://mentor.example.com",
                Set.of(new DisponibilidadeMentorResponse(3, PeriodoDisponibilidade.TARDE)),
                StatusPerfilMentor.RASCUNHO,
                LocalDate.of(2026, 10, 19)
        );
        when(mentorService.atualizarPerfil(any(UUID.class), any(AtualizarPerfilMentorRequest.class)))
                .thenReturn(response);

        mockMvc.perform(patch("/api/v1/mentores/{mentorId}", mentorId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "biografia": "Nova biografia",
                                  "site": "https://mentor.example.com",
                                  "disponibilidades": [
                                    { "diaSemana": 3, "periodo": "TARDE" }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.biografia").value("Nova biografia"))
                .andExpect(jsonPath("$.disponibilidades[0].periodo").value("TARDE"));
    }

    @Test
    @WithMockUser(roles = "MENTOR")
    void shouldRejectProfileUpdateWithEmptyAvailability() throws Exception {
        mockMvc.perform(patch("/api/v1/mentores/{mentorId}", UUID.randomUUID())
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "disponibilidades": [] }
                                """))
                .andExpect(status().isBadRequest());
    }
}
