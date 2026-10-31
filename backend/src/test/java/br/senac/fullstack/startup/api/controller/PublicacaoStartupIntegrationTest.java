package br.senac.fullstack.startup.api.controller;

import br.senac.fullstack.auth.infrastructure.security.UsuarioPrincipal;
import br.senac.fullstack.perfilmatch.infrastructure.persistence.repository.PerfilMatchRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.domain.MembroStartup;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.startup.domain.enums.StatusPerfilStartup;
import br.senac.fullstack.startup.infrastructure.persistence.repository.StartupRepository;
import br.senac.fullstack.startup.support.PublicacaoStartupFixtures;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Each request commits independently: assertions observe actual persistence and rollback.
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:startup-publication;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=update", "spring.jpa.open-in-view=false"
})
@AutoConfigureMockMvc
class PublicacaoStartupIntegrationTest {
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private StartupRepository startups;
    @Autowired private UsuarioRepository users;
    @Autowired private PerfilMatchRepository profiles;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private PlatformTransactionManager transactions;

    @Test
    void onboardingCannotPublishAndOnlyAddsStatusToExistingProfileContract() throws Exception {
        ObjectNode body = json.valueToTree(PublicacaoStartupFixtures.projeto());
        body.put("status", "PUBLICADO");
        body.putObject("fundador").put("nome", "Pessoa fictícia")
                .put("email", UUID.randomUUID() + "@example.test").put("senha", "SenhaFicticia123!");
        var created = write(post("/api/v1/startups"), null, body.toString()).andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("RASCUNHO"))
                .andExpect(jsonPath("$.statusValidacao").value("APENAS_IDEIA"))
                .andExpect(jsonPath("$.pendencias").doesNotExist())
                .andExpect(jsonPath("$.aptoParaPublicacao").doesNotExist()).andReturn();
        UUID id = UUID.fromString(json.readTree(created.getResponse().getContentAsString()).get("id").asText());
        assertThat(jdbc.queryForObject("SELECT status FROM startup WHERE id = ?", String.class, id))
                .isEqualTo("RASCUNHO");
    }

    @Test
    void readinessIsPerProjectAndIndependentOfReaderPermission() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario member = account(TipoUsuario.STARTUP);
        Startup project = project(founder, member, PapelMembroStartup.MEMBRO);
        Startup another = project(founder);
        mvc.perform(get(path(project)).with(as(founder))).andExpect(status().isOk())
                .andExpect(jsonPath("$.aptoParaPublicacao").value(false))
                .andExpect(jsonPath("$.podeGerenciar").value(true))
                .andExpect(jsonPath("$.pendencias[0].codigo").value("QUESTIONARIO_AUSENTE"));
        saveAnswers(another, founder, answers()).andExpect(status().isOk());
        change(project, founder, "PUBLICADO").andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("STARTUP_INCOMPLETA"))
                .andExpect(jsonPath("$.type").value("about:blank"))
                .andExpect(jsonPath("$.title").value("Conflict"))
                .andExpect(jsonPath("$.detail").value("A startup possui pendências para publicação."))
                .andExpect(jsonPath("$.pendencias.length()").value(1));
        saveAnswers(project, founder, answers()).andExpect(status().isOk());
        mvc.perform(get(path(project)).with(as(member))).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RASCUNHO"))
                .andExpect(jsonPath("$.aptoParaPublicacao").value(true))
                .andExpect(jsonPath("$.podeGerenciar").value(false))
                .andExpect(jsonPath("$.pendencias").isEmpty())
                .andExpect(jsonPath("$.membros").doesNotExist())
                .andExpect(jsonPath("$.topics").doesNotExist())
                .andExpect(jsonPath("$.email").doesNotExist());
        change(project, member, "PUBLICADO").andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/startups").with(as(member))).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].pendencias").doesNotExist());
    }

    @ParameterizedTest
    @EnumSource(StatusPerfilStartup.class)
    void allDestinationsAndRepeatedRequestsPreserveOtherData(StatusPerfilStartup origin) throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario representative = account(TipoUsuario.STARTUP);
        Startup project = project(founder, representative, PapelMembroStartup.REPRESENTANTE);
        saveAnswers(project, founder, answers()).andExpect(status().isOk());
        change(project, founder, origin.name()).andExpect(status().isOk());
        for (StatusPerfilStartup destination : StatusPerfilStartup.values()) {
            change(project, representative, destination.name()).andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value(destination.name()))
                    .andExpect(jsonPath("$.aptoParaPublicacao").value(true));
            change(project, representative, destination.name()).andExpect(status().isOk());
            change(project, founder, origin.name()).andExpect(status().isOk());
        }
        mvc.perform(get("/api/v1/startups/" + project.getId()).with(as(founder)))
                .andExpect(jsonPath("$.nomeProvisorio").value(project.getNomeProvisorio()))
                .andExpect(jsonPath("$.membros.length()").value(2))
                .andExpect(jsonPath("$.statusValidacao").value("APENAS_IDEIA"));
    }

    @Test
    void incompleteProfilesCanPauseAndReturnToDraftButCannotPublishFromAnyState() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        for (StatusPerfilStartup origin : StatusPerfilStartup.values()) {
            jdbc.update("UPDATE startup SET status = ? WHERE id = ?", origin.name(), project.getId());
            change(project, founder, "PUBLICADO").andExpect(status().isConflict());
            mvc.perform(get(path(project)).with(as(founder))).andExpect(jsonPath("$.status").value(origin.name()));
            change(project, founder, "PAUSADO").andExpect(status().isOk());
            change(project, founder, "RASCUNHO").andExpect(status().isOk());
        }
    }

    @Test
    void editsPreservePublicationAndInvalidCandidatesRollbackTheCompleteTransaction() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        saveAnswers(project, founder, answers()).andExpect(status().isOk());
        change(project, founder, "PUBLICADO").andExpect(status().isOk());
        String profilePath = "/api/v1/startups/" + project.getId();
        write(patch(profilePath), founder, "{\"pitchCurto\":\"Novo resumo\",\"status\":\"PAUSADO\"}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLICADO"));
        ObjectNode quiz = answers();
        quiz.put("projectName", "Rótulo atualizado");
        saveAnswers(project, founder, quiz).andExpect(status().isOk());
        quiz.putArray("topics");
        saveAnswers(project, founder, quiz).andExpect(status().isBadRequest());
        write(patch(profilePath), founder, "{\"pitchCurto\":\" \"}").andExpect(status().isBadRequest());
        // Simulate legacy corruption: editing another field must validate the whole published profile.
        jdbc.update("UPDATE startup SET publico_alvo = '' WHERE id = ?", project.getId());
        write(patch(profilePath), founder, "{\"pitchCurto\":\"Não deve persistir\"}")
                .andExpect(status().isBadRequest());
        saveAnswers(project, founder, answers()).andExpect(status().isBadRequest());
        mvc.perform(get(profilePath).with(as(founder))).andExpect(jsonPath("$.pitchCurto").value("Novo resumo"))
                .andExpect(jsonPath("$.status").value("PUBLICADO"));
        mvc.perform(get(profilePath + "/perfil-match").with(as(founder)))
                .andExpect(jsonPath("$.projectName").value("Rótulo atualizado"));
        mvc.perform(get(path(project)).with(as(founder)))
                .andExpect(jsonPath("$.pendencias[0].campo").value("publicoAlvo"))
                .andExpect(jsonPath("$.aptoParaPublicacao").value(false));
        write(patch(profilePath), founder, "{\"publicoAlvo\":\"Público corrigido\"}").andExpect(status().isOk());
        jdbc.update("UPDATE perfil_match SET questionnaire_version = 'v2' WHERE startup_id = ?", project.getId());
        mvc.perform(get(path(project)).with(as(founder)))
                .andExpect(jsonPath("$.pendencias[0].codigo").value("QUESTIONARIO_INCOMPATIVEL"));
        write(patch(profilePath), founder, "{\"pitchCurto\":\"Também não deve persistir\"}")
                .andExpect(status().isBadRequest());
        saveAnswers(project, founder, answers()).andExpect(status().isOk());
        jdbc.update("DELETE FROM perfil_match_topico WHERE perfil_match_id = "
                + "(SELECT id FROM perfil_match WHERE startup_id = ?)", project.getId());
        mvc.perform(get(path(project)).with(as(founder)))
                .andExpect(jsonPath("$.pendencias[0].codigo").value("QUESTIONARIO_INVALIDO"));
        change(project, founder, "PUBLICADO").andExpect(status().isConflict());
    }

    @Test
    void accessChecksRejectAnonymousWrongRolesIntrudersAndRevokedRepresentatives() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario representative = account(TipoUsuario.STARTUP);
        Startup project = project(founder, representative, PapelMembroStartup.REPRESENTANTE);
        mvc.perform(get(path(project))).andExpect(status().isUnauthorized());
        write(patch(path(project)), null, "{\"status\":\"PAUSADO\"}").andExpect(status().isUnauthorized());
        for (TipoUsuario role : TipoUsuario.values()) {
            Usuario intruder = account(role);
            mvc.perform(get(path(project)).with(as(intruder))).andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.pendencias").doesNotExist());
            change(project, intruder, "PAUSADO").andExpect(status().isForbidden());
        }
        mvc.perform(patch(path(project)).with(as(founder)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"PAUSADO\"}")).andExpect(status().isForbidden());
        write(delete("/api/v1/startups/" + project.getId() + "/membros/" + representative.getId()), founder, "")
                .andExpect(status().isNoContent());
        change(project, representative, "PAUSADO").andExpect(status().isForbidden());
        mvc.perform(get(path(project)).with(as(representative))).andExpect(status().isForbidden());
        String missing = "/api/v1/startups/" + UUID.randomUUID() + "/status";
        mvc.perform(get(missing).with(as(founder))).andExpect(status().isNotFound());
        write(patch(missing), founder, "{\"status\":\"PAUSADO\"}").andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/startups/invalid/status").with(as(founder))).andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"status\":null}", "{\"status\":\"INVALID\"}", "null", "{"})
    void invalidRequestsNeverChangeState(String payload) throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        write(patch(path(project)), founder, payload).andExpect(status().isBadRequest());
        mvc.perform(get(path(project)).with(as(founder))).andExpect(jsonPath("$.status").value("RASCUNHO"));
        var csrf = mvc.perform(get("/csrf")).andReturn().getResponse();
        JsonNode token = json.readTree(csrf.getContentAsString());
        mvc.perform(patch(path(project)).with(as(founder)).cookie(csrf.getCookie("XSRF-TOKEN"))
                .header(token.get("headerName").asText(), token.get("token").asText())
                .contentType(MediaType.TEXT_PLAIN).content("PAUSADO")).andExpect(status().isUnsupportedMediaType());
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void publicationWaitsForTheParentLockAndRechecksCommittedAnswersOrMembership(boolean revoke) throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario representative = account(TipoUsuario.STARTUP);
        Startup project = project(founder, representative, PapelMembroStartup.REPRESENTANTE);
        saveAnswers(project, founder, answers()).andExpect(status().isOk());
        CountDownLatch locked = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        CountDownLatch requestStarted = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var editing = executor.submit(() -> new TransactionTemplate(transactions).executeWithoutResult(tx -> {
                Startup current = startups.findById(project.getId()).orElseThrow();
                locked.countDown();
                await(release);
                if (revoke) {
                    current.getMembros().removeIf(member -> member.getUsuario().getId().equals(representative.getId()));
                } else {
                    profiles.findByStartupId(project.getId()).orElseThrow().setQuestionnaireVersion("obsolete");
                }
            }));
            assertThat(locked.await(10, TimeUnit.SECONDS)).isTrue();
            var publishing = executor.submit(() -> {
                requestStarted.countDown();
                return change(project, representative, "PUBLICADO").andReturn().getResponse().getStatus();
            });
            assertThat(requestStarted.await(10, TimeUnit.SECONDS)).isTrue();
            assertThatExceptionOfType(TimeoutException.class).isThrownBy(() -> publishing.get(200, TimeUnit.MILLISECONDS));
            release.countDown();
            editing.get(10, TimeUnit.SECONDS);
            assertThat(publishing.get(10, TimeUnit.SECONDS)).isEqualTo(revoke ? 403 : 409);
            mvc.perform(get(path(project)).with(as(founder))).andExpect(jsonPath("$.status").value("RASCUNHO"));
        } finally {
            release.countDown();
            executor.shutdownNow();
        }
    }

    private void await(CountDownLatch latch) {
        try {
            if (!latch.await(10, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Test lock timed out.");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    private ResultActions change(Startup project, Usuario actor, String destination) throws Exception {
        return write(patch(path(project)), actor, json.createObjectNode().put("status", destination).toString());
    }

    private ResultActions saveAnswers(Startup project, Usuario actor, ObjectNode answers) throws Exception {
        return write(put("/api/v1/startups/" + project.getId() + "/perfil-match"), actor, answers.toString());
    }

    private ObjectNode answers() {
        return json.valueToTree(PublicacaoStartupFixtures.respostas());
    }

    private ResultActions write(MockHttpServletRequestBuilder request, Usuario actor, String payload) throws Exception {
        var csrf = mvc.perform(get("/csrf")).andReturn().getResponse();
        JsonNode token = json.readTree(csrf.getContentAsString());
        if (actor != null) {
            request.with(as(actor));
        }
        return mvc.perform(request.cookie(csrf.getCookie("XSRF-TOKEN"))
                .header(token.get("headerName").asText(), token.get("token").asText())
                .contentType(new MediaType("application", "json", java.nio.charset.StandardCharsets.UTF_8))
                .content(payload));
    }

    private String path(Startup project) {
        return "/api/v1/startups/" + project.getId() + "/status";
    }

    private Usuario account(TipoUsuario role) {
        return users.saveAndFlush(new Usuario("Participante fictício", UUID.randomUUID() + "@example.test", "unused", role));
    }

    private RequestPostProcessor as(Usuario actor) {
        return user(new UsuarioPrincipal(actor.getId(), actor.getNome(), actor.getEmail(), "unused", actor.getTipoUsuario()));
    }

    private Startup project(Usuario founder) {
        return project(founder, null, null);
    }

    private Startup project(Usuario founder, Usuario other, PapelMembroStartup role) {
        Startup project = PublicacaoStartupFixtures.projeto();
        addMember(project, founder, PapelMembroStartup.FUNDADOR);
        if (other != null) {
            addMember(project, other, role);
        }
        return startups.saveAndFlush(project);
    }

    private void addMember(Startup project, Usuario person, PapelMembroStartup role) {
        MembroStartup member = new MembroStartup();
        member.setStartup(project);
        member.setUsuario(person);
        member.setPapelMembro(role);
        member.setDataEntrada(LocalDate.of(2026, 10, 30));
        project.getMembros().add(member);
    }
}
