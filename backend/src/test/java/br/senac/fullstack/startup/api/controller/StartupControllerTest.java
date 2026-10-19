package br.senac.fullstack.startup.api.controller;

import br.senac.fullstack.shared.security.SecurityConfig;
import br.senac.fullstack.startup.api.dto.AdicionarMembroStartupRequest;
import br.senac.fullstack.startup.api.dto.MembroStartupResponse;
import br.senac.fullstack.startup.api.dto.StartupResponse;
import br.senac.fullstack.startup.application.service.StartupService;
import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.startup.domain.enums.StatusValidacao;
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
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StartupController.class)
@Import(SecurityConfig.class)
class StartupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StartupService startupService;

    @Test
    void deveCriarStartupComFundadorEComCsrf() throws Exception {
        UUID startupId = UUID.randomUUID();
        when(startupService.criarStartup(any())).thenReturn(startupResponse(startupId));

        mockMvc.perform(post("/api/v1/startups")
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fundador": {
                                    "nome": "Fundadora de Teste",
                                    "email": "fundadora.teste@example.com",
                                    "senha": "senha-ficticia"
                                  },
                                  "nomeProvisorio": "Startup de Teste",
                                  "pitchCurto": "Ajuda startups a encontrar mentores.",
                                  "problemaCentral": "Poucas conexões qualificadas.",
                                  "solucaoProposta": "Recomendação de mentores.",
                                  "publicoAlvo": "Startups em ideação.",
                                  "modeloDeNegocio": "SaaS",
                                  "statusValidacao": "APENAS_IDEIA"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(startupId.toString()))
                .andExpect(jsonPath("$.nomeProvisorio").value("Startup de Teste"));
    }

    @Test
    void deveListarEBuscarStartups() throws Exception {
        UUID startupId = UUID.randomUUID();
        StartupResponse response = startupResponse(startupId);
        when(startupService.listarStartups()).thenReturn(List.of(response));
        when(startupService.buscarStartupPorId(startupId)).thenReturn(response);

        mockMvc.perform(get("/api/v1/startups"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(startupId.toString()));

        mockMvc.perform(get("/api/v1/startups/{startupId}", startupId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(startupId.toString()));
    }

    @Test
    void deveAdicionarEListarMembros() throws Exception {
        UUID startupId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        MembroStartupResponse membro = membroResponse(usuarioId);
        when(startupService.adicionarMembro(eq(startupId), any())).thenReturn(membro);
        when(startupService.listarMembros(startupId)).thenReturn(List.of(membro));

        mockMvc.perform(post("/api/v1/startups/{startupId}/membros", startupId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "usuarioId": "%s",
                                  "papelMembro": "MEMBRO"
                                }
                                """.formatted(usuarioId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuarioId").value(usuarioId.toString()));

        mockMvc.perform(get("/api/v1/startups/{startupId}/membros", startupId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuarioId").value(usuarioId.toString()));

        ArgumentCaptor<AdicionarMembroStartupRequest> requestCaptor =
                ArgumentCaptor.forClass(AdicionarMembroStartupRequest.class);
        verify(startupService).adicionarMembro(eq(startupId), requestCaptor.capture());
        assertEquals(PapelMembroStartup.MEMBRO, requestCaptor.getValue().papelMembro());
    }

    @Test
    void deveRemoverMembroComCsrf() throws Exception {
        UUID startupId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        doNothing().when(startupService).removerMembro(startupId, usuarioId);

        mockMvc.perform(delete("/api/v1/startups/{startupId}/membros/{usuarioId}", startupId, usuarioId)
                        .with(SecurityMockMvcRequestPostProcessors.csrf()))
                .andExpect(status().isNoContent());

        verify(startupService).removerMembro(startupId, usuarioId);
    }

    @Test
    void deveRejeitarCriacaoSemCsrf() throws Exception {
        mockMvc.perform(post("/api/v1/startups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    private StartupResponse startupResponse(UUID startupId) {
        return new StartupResponse(
                startupId,
                "Startup de Teste",
                "Ajuda startups a encontrar mentores.",
                "Poucas conexões qualificadas.",
                "Recomendação de mentores.",
                "Startups em ideação.",
                "SaaS",
                StatusValidacao.APENAS_IDEIA,
                new Date(),
                List.of(membroResponse(UUID.randomUUID()))
        );
    }

    private MembroStartupResponse membroResponse(UUID usuarioId) {
        return new MembroStartupResponse(
                UUID.randomUUID(),
                usuarioId,
                "Membro de Teste",
                PapelMembroStartup.MEMBRO,
                LocalDate.of(2026, 10, 19)
        );
    }
}
