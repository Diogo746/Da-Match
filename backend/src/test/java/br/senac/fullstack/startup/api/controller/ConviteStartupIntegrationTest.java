package br.senac.fullstack.startup.api.controller;

import br.senac.fullstack.auth.infrastructure.security.UsuarioPrincipal;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.domain.MembroStartup;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.startup.infrastructure.persistence.repository.StartupRepository;
import br.senac.fullstack.startup.support.PublicacaoStartupFixtures;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// No test transaction: HTTP operations commit, and races use independent transactions/connections.
@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:team-invitations;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=update", "spring.jpa.open-in-view=false"})
@AutoConfigureMockMvc
class ConviteStartupIntegrationTest {
    private static final Instant NOW = Instant.parse("2026-11-04T12:00:00Z");
    private static final String ROOT = "/api/v1/startups";
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private UsuarioRepository users;
    @Autowired private StartupRepository projects;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private PlatformTransactionManager transactions;
    @MockBean(name = "conviteStartupClock") private Clock clock;

    @BeforeEach
    void time() {
        when(clock.instant()).thenReturn(NOW);
        when(clock.getZone()).thenReturn(ZoneId.of("America/Sao_Paulo"));
    }

    @Test
    void acceptanceIsTheOnlyNewMembershipAndPreservesProfileAndQuizState() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario recipient = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        JsonNode invitation = create(project, founder, recipient, "REPRESENTANTE");
        assertThat(invitation.size()).isEqualTo(9);
        assertThat(invitation.has("email")).isFalse();
        assertThat(invitation.get("nomeStartup").asText()).isEqualTo(project.getNomeProvisorio());
        assertThat(invitation.get("expiraEm").asText()).isEqualTo("2026-11-11T12:00:00Z");
        mvc.perform(get(ROOT + "/me").with(as(recipient))).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get(team(project) + "/membros").with(as(recipient))).andExpect(status().isForbidden());
        mvc.perform(get(team(project)).with(as(recipient))).andExpect(status().isForbidden());
        mvc.perform(get(ROOT).with(as(recipient))).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get(team(project) + "/perfil-match").with(as(recipient))).andExpect(status().isForbidden());
        action(invitation, recipient, "aceite").andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACEITO"));
        mvc.perform(get(ROOT + "/me").with(as(recipient)))
                .andExpect(jsonPath("$[0].id").value(project.getId().toString()))
                .andExpect(jsonPath("$[0].status").value("RASCUNHO"));
        mvc.perform(get(team(project) + "/status").with(as(recipient)))
                .andExpect(jsonPath("$.podeGerenciar").value(true))
                .andExpect(jsonPath("$.aptoParaPublicacao").value(false));
        assertThat(count(project, recipient)).isEqualTo(1);
        action(invitation, recipient, "aceite").andExpect(status().isOk());
        write(delete(team(project) + "/membros/" + recipient.getId()), founder, null)
                .andExpect(status().isNoContent());
        action(invitation, recipient, "aceite").andExpect(status().isOk());
        assertThat(count(project, recipient)).isZero();
        mvc.perform(get(team(project) + "/status").with(as(recipient))).andExpect(status().isForbidden());
    }

    @Test
    void requestIdRecoversAResponseWithoutDuplicatingOrExtendingTheInvite() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario recipient = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        ObjectNode body = request(recipient, "MEMBRO");
        JsonNode first = node(write(post(team(project) + "/convites"), founder, body.toString())
                .andExpect(status().isCreated()));
        when(clock.instant()).thenReturn(NOW.plusSeconds(60));
        JsonNode repeated = node(write(post(team(project) + "/convites"), founder, body.toString())
                .andExpect(status().isCreated()));
        assertThat(repeated).isEqualTo(first);
        mvc.perform(get(team(project) + "/convites/solicitacoes/" + body.get("solicitacaoId").asText())
                        .with(as(founder))).andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(first.get("id").asText()));
        body.put("papelMembro", "REPRESENTANTE");
        write(post(team(project) + "/convites"), founder, body.toString()).andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("SOLICITACAO_DIVERGENTE"));
        write(post(team(project(founder)) + "/convites"), founder, body.toString())
                .andExpect(status().isConflict());
        write(post(team(project) + "/convites"), founder, request(recipient, "MEMBRO").toString())
                .andExpect(status().isConflict()).andExpect(jsonPath("$.codigo").value("CONVITE_PENDENTE"));
        assertThat(count(project, recipient)).isZero();
    }

    @Test
    void refusalCancellationAndResendingDoNotReactivateOldInvites() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario recipient = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        JsonNode first = create(project, founder, recipient, "MEMBRO");
        action(first, recipient, "recusa").andExpect(status().isOk());
        action(first, recipient, "recusa").andExpect(status().isOk());
        action(first, recipient, "aceite").andExpect(status().isConflict());
        JsonNode next = create(project, founder, recipient, "MEMBRO");
        assertThat(next.get("id")).isNotEqualTo(first.get("id"));
        String cancel = team(project) + "/convites/" + next.get("id").asText() + "/cancelamento";
        write(patch(cancel), founder, "{}").andExpect(status().isOk());
        write(patch(cancel), founder, "{}").andExpect(status().isOk());
        action(next, recipient, "aceite").andExpect(status().isConflict());
        assertThat(count(project, recipient)).isZero();
    }

    @Test
    void exactlySevenDaysExpiresReadsAndActionsWithoutAScheduler() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario recipient = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        JsonNode first = create(project, founder, recipient, "MEMBRO");
        when(clock.instant()).thenReturn(NOW.plusSeconds(604799));
        mvc.perform(get(invite(first)).with(as(recipient))).andExpect(jsonPath("$.status").value("PENDENTE"));
        when(clock.instant()).thenReturn(NOW.plusSeconds(604800));
        mvc.perform(get(invite(first)).with(as(recipient))).andExpect(jsonPath("$.status").value("EXPIRADO"));
        action(first, recipient, "aceite").andExpect(status().isGone())
                .andExpect(jsonPath("$.codigo").value("CONVITE_EXPIRADO"));
        action(first, recipient, "recusa").andExpect(status().isGone());
        JsonNode second = create(project, founder, recipient, "MEMBRO");
        assertThat(second.get("id")).isNotEqualTo(first.get("id"));
        assertThat(count(project, recipient)).isZero();
    }

    @Test
    void currentMembershipAndRecipientIdentityAreRequiredForEveryAction() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario recipient = account(TipoUsuario.STARTUP);
        Usuario other = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        JsonNode first = create(project, founder, recipient, "MEMBRO");
        for (Usuario denied : new Usuario[] {other, account(TipoUsuario.MENTOR), account(TipoUsuario.ADMIN)}) {
            mvc.perform(get(invite(first)).with(as(denied))).andExpect(status().isForbidden());
            action(first, denied, "aceite").andExpect(status().isForbidden());
            action(first, denied, "recusa").andExpect(status().isForbidden());
            mvc.perform(get(team(project) + "/convites").with(as(denied))).andExpect(status().isForbidden());
            write(post(team(project) + "/convites"), denied, request(other, "MEMBRO").toString())
                    .andExpect(status().isForbidden());
        }
        action(first, founder, "aceite").andExpect(status().isForbidden());
        mvc.perform(get(invite(first)).with(as(recipient))).andExpect(status().isOk());
        mvc.perform(get(team(project) + "/convites").with(as(recipient))).andExpect(status().isForbidden());
        mvc.perform(get(ROOT + "/convites/me").with(as(other))).andExpect(jsonPath("$.itens").isEmpty());
        mvc.perform(get(ROOT + "/convites/me").with(as(recipient)))
                .andExpect(jsonPath("$.totalItens").value(1)).andExpect(jsonPath("$.itens[0].id").value(first.get("id").asText()));
        write(patch(team(project(founder)) + "/convites/" + first.get("id").asText() + "/cancelamento"),
                founder, "{}").andExpect(status().isNotFound());
        write(patch(team(project) + "/convites/" + first.get("id").asText() + "/cancelamento"),
                recipient, "{}").andExpect(status().isForbidden());
    }

    @Test
    void rejectedRecipientTypesAndMissingEmailsHaveTheSameSafeResponse() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        for (TipoUsuario type : new TipoUsuario[] {TipoUsuario.MENTOR, TipoUsuario.ADMIN}) {
            write(post(team(project) + "/convites"), founder, request(account(type), "MEMBRO").toString())
                    .andExpect(status().isNotFound()).andExpect(jsonPath("$.email").doesNotExist());
        }
        ObjectNode body = request(founder, "MEMBRO");
        write(post(team(project) + "/convites"), founder, body.toString()).andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("JA_INTEGRANTE"));
        body.put("email", "missing-" + UUID.randomUUID() + "@example.test");
        write(post(team(project) + "/convites"), founder, body.toString()).andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @ValueSource(strings = {"FUNDADOR", "UNKNOWN", "", "null"})
    void invitationCannotGrantFounderOrAnUnknownRole(String role) throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        ObjectNode body = request(account(TipoUsuario.STARTUP), role);
        if (role.equals("null")) {
            body.putNull("papelMembro");
        }
        write(post(team(project) + "/convites"), founder, body.toString()).andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @ValueSource(strings = {"bad", "", "   "})
    void emailValidationNeverCreatesAnInvite(String email) throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        ObjectNode body = request(founder, "MEMBRO").put("email", email);
        write(post(team(project) + "/convites"), founder, body.toString()).andExpect(status().isBadRequest());
    }

    @Test
    void csrfSessionAndJsonAreMandatoryAndLegacyAdditionNeverCreatesMembership() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        Usuario recipient = account(TipoUsuario.STARTUP);
        String body = request(recipient, "MEMBRO").toString();
        mvc.perform(get(ROOT + "/convites/me")).andExpect(status().isUnauthorized());
        mvc.perform(post(team(project) + "/convites").with(as(founder))
                        .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        write(post(team(project) + "/convites"), null, body).andExpect(status().isUnauthorized());
        ObjectNode noId = request(recipient, "MEMBRO"); noId.remove("solicitacaoId");
        write(post(team(project) + "/convites"), founder, noId.toString()).andExpect(status().isBadRequest());
        JsonNode invitation = create(project, founder, recipient, "MEMBRO");
        mvc.perform(patch(invite(invitation) + "/aceite").with(as(recipient))
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
        write(patch(invite(invitation) + "/aceite"), recipient, "{\"status\":\"ACEITO\"}")
                .andExpect(status().isBadRequest());
        write(patch(invite(invitation) + "/recusa"), recipient, "{\"papelMembro\":\"FUNDADOR\"}")
                .andExpect(status().isBadRequest());
        write(patch(team(project) + "/convites/" + invitation.get("id").asText() + "/cancelamento"),
                founder, "{\"destinatario\":\"other\"}").andExpect(status().isBadRequest());
        write(post(team(project) + "/membros"), founder, "{\"usuarioId\":\"" + recipient.getId()
                + "\",\"papelMembro\":\"FUNDADOR\"}").andExpect(status().isGone())
                .andExpect(jsonPath("$.codigo").value("CONVITE_OBRIGATORIO"));
        assertThat(count(project, recipient)).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {"pagina=-1", "tamanho=0", "tamanho=51", "pagina=not-a-number"})
    void paginationIsBounded(String query) throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        mvc.perform(get(team(project) + "/convites?" + query).with(as(founder))).andExpect(status().isBadRequest());
        mvc.perform(get(ROOT + "/convites/me?" + query).with(as(founder))).andExpect(status().isBadRequest());
    }

    @Test
    void pagesAreStableWithTextualUuidTiebreakAndDoNotLeakOtherProjects() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        JsonNode a = create(project, founder, account(TipoUsuario.STARTUP), "MEMBRO");
        JsonNode b = create(project, founder, account(TipoUsuario.STARTUP), "MEMBRO");
        create(project(founder), founder, account(TipoUsuario.STARTUP), "MEMBRO");
        String first = a.get("id").asText().compareTo(b.get("id").asText()) < 0
                ? a.get("id").asText() : b.get("id").asText();
        mvc.perform(get(team(project) + "/convites?tamanho=1").with(as(founder)))
                .andExpect(jsonPath("$.itens[0].id").value(first)).andExpect(jsonPath("$.totalItens").value(2))
                .andExpect(jsonPath("$.totalPaginas").value(2));
        mvc.perform(get(team(project) + "/convites?pagina=2&tamanho=1").with(as(founder)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.itens").isEmpty());
    }

    @Test
    void removedSenderCannotGrantAccessFromAnOldInvitation() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario representative = account(TipoUsuario.STARTUP);
        Usuario recipient = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        new TransactionTemplate(transactions).executeWithoutResult(tx -> {
            Startup loaded = projects.findById(project.getId()).orElseThrow();
            add(loaded, representative, PapelMembroStartup.REPRESENTANTE);
        });
        JsonNode invitation = create(project, representative, recipient, "MEMBRO");
        write(delete(team(project) + "/membros/" + representative.getId()), founder, null)
                .andExpect(status().isNoContent());
        action(invitation, recipient, "aceite").andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("CONVITE_INDISPONIVEL"));
        assertThat(count(project, recipient)).isZero();
    }

    @Test
    void concurrentAcceptsSerializeAndOnlyCreateOneMembership() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario recipient = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        JsonNode invitation = create(project, founder, recipient, "MEMBRO");
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> action(invitation, recipient, "aceite").andReturn().getResponse().getStatus());
            var second = executor.submit(() -> action(invitation, recipient, "aceite").andReturn().getResponse().getStatus());
            assertThat(first.get(10, TimeUnit.SECONDS)).isEqualTo(200);
            assertThat(second.get(10, TimeUnit.SECONDS)).isEqualTo(200);
        }
        assertThat(count(project, recipient)).isEqualTo(1);
    }

    @Test
    void concurrentEmissionsToOneRecipientProduceOnePendingInvite() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario recipient = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        String bodyA = request(recipient, "MEMBRO").toString();
        String bodyB = request(recipient, "REPRESENTANTE").toString();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> write(post(team(project) + "/convites"), founder, bodyA).andReturn().getResponse().getStatus());
            var second = executor.submit(() -> write(post(team(project) + "/convites"), founder, bodyB).andReturn().getResponse().getStatus());
            assertThat(java.util.Set.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(201, 409);
        }
        assertThat(jdbc.queryForObject("select count(*) from convite_startup where startup_id = ?",
                Integer.class, project.getId())).isEqualTo(1);
    }

    @Test
    void senderRevocationCommittedUnderTheProjectLockRejectsWaitingAcceptance() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario representative = account(TipoUsuario.STARTUP);
        Usuario recipient = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        new TransactionTemplate(transactions).executeWithoutResult(tx ->
                add(projects.findById(project.getId()).orElseThrow(), representative, PapelMembroStartup.REPRESENTANTE));
        JsonNode invitation = create(project, representative, recipient, "MEMBRO");
        AtomicReference<Future<Integer>> result = new AtomicReference<>();
        try (var executor = Executors.newSingleThreadExecutor()) {
            new TransactionTemplate(transactions).executeWithoutResult(tx -> {
                projects.findById(project.getId()).orElseThrow();
                var waiting = executor.submit(() -> action(invitation, recipient, "aceite").andReturn().getResponse().getStatus());
                result.set(waiting);
                assertThatExceptionOfType(TimeoutException.class).isThrownBy(() -> waiting.get(250, TimeUnit.MILLISECONDS));
                jdbc.update("delete from membros_da_startup where startup_id = ? and usuario_id = ?",
                        project.getId(), representative.getId());
            });
            assertThat(result.get().get(10, TimeUnit.SECONDS)).isEqualTo(409);
        }
        assertThat(count(project, recipient)).isZero();
    }

    @Test
    void concurrentSameRequestAcrossProjectsCannotReuseTheIdentifier() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario recipient = account(TipoUsuario.STARTUP);
        Startup a = project(founder);
        Startup b = project(founder);
        String body = request(recipient, "MEMBRO").toString();
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> write(post(team(a) + "/convites"), founder, body).andReturn().getResponse().getStatus());
            var second = executor.submit(() -> write(post(team(b) + "/convites"), founder, body).andReturn().getResponse().getStatus());
            assertThat(java.util.Set.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(201, 409);
        }
    }

    @Test
    void cancellationUnderProjectLockWinsAgainstWaitingAcceptance() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario recipient = account(TipoUsuario.STARTUP);
        Startup project = project(founder);
        JsonNode invitation = create(project, founder, recipient, "MEMBRO");
        AtomicReference<Future<Integer>> result = new AtomicReference<>();
        try (var executor = Executors.newSingleThreadExecutor()) {
            new TransactionTemplate(transactions).executeWithoutResult(tx -> {
                projects.findById(project.getId()).orElseThrow();
                var waiting = executor.submit(() -> action(invitation, recipient, "aceite").andReturn().getResponse().getStatus());
                result.set(waiting);
                assertThatExceptionOfType(TimeoutException.class).isThrownBy(() -> waiting.get(250, TimeUnit.MILLISECONDS));
                jdbc.update("update convite_startup set status = 'CANCELADO' where id = ?",
                        UUID.fromString(invitation.get("id").asText()));
            });
            assertThat(result.get().get(10, TimeUnit.SECONDS)).isEqualTo(409);
        }
        mvc.perform(get(invite(invitation)).with(as(recipient))).andExpect(jsonPath("$.status").value("CANCELADO"));
        assertThat(count(project, recipient)).isZero();
    }

    private JsonNode create(Startup project, Usuario sender, Usuario recipient, String role) throws Exception {
        return node(write(post(team(project) + "/convites"), sender, request(recipient, role).toString())
                .andExpect(status().isCreated()));
    }

    private ObjectNode request(Usuario recipient, String role) {
        return json.createObjectNode().put("solicitacaoId", UUID.randomUUID().toString())
                .put("email", " " + recipient.getEmail() + " ").put("papelMembro", role);
    }

    private ResultActions action(JsonNode invitation, Usuario actor, String action) throws Exception {
        return write(patch(invite(invitation) + "/" + action), actor, "{}");
    }

    private ResultActions write(MockHttpServletRequestBuilder request, Usuario actor, String body) throws Exception {
        var response = mvc.perform(get("/csrf")).andReturn().getResponse();
        JsonNode token = json.readTree(response.getContentAsString());
        Cookie cookie = response.getCookie("XSRF-TOKEN");
        request.cookie(cookie).header(token.get("headerName").asText(), token.get("token").asText());
        if (actor != null) {
            request.with(as(actor));
        }
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mvc.perform(request);
    }

    private JsonNode node(ResultActions response) throws Exception {
        return json.readTree(response.andReturn().getResponse().getContentAsByteArray());
    }

    private Usuario account(TipoUsuario type) {
        return users.save(new Usuario("Pessoa fictícia", UUID.randomUUID() + "@example.test", "hash-ficticio", type));
    }

    private Startup project(Usuario founder) {
        return new TransactionTemplate(transactions).execute(tx -> {
            Startup project = PublicacaoStartupFixtures.projeto();
            add(project, founder, PapelMembroStartup.FUNDADOR);
            return projects.saveAndFlush(project);
        });
    }

    private void add(Startup project, Usuario actor, PapelMembroStartup role) {
        MembroStartup member = new MembroStartup();
        member.setStartup(project); member.setUsuario(actor); member.setPapelMembro(role);
        member.setDataEntrada(LocalDate.of(2026, 11, 4)); project.getMembros().add(member);
    }

    private int count(Startup project, Usuario recipient) {
        return jdbc.queryForObject("select count(*) from membros_da_startup where startup_id = ? and usuario_id = ?",
                Integer.class, project.getId(), recipient.getId());
    }

    private RequestPostProcessor as(Usuario actor) {
        return user(new UsuarioPrincipal(actor.getId(), actor.getNome(), actor.getEmail(), actor.getSenha(), actor.getTipoUsuario()));
    }

    private String team(Startup project) {
        return ROOT + "/" + project.getId();
    }

    private String invite(JsonNode invitation) {
        return ROOT + "/convites/" + invitation.get("id").asText();
    }
}
