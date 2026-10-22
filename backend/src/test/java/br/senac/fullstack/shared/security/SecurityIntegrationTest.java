package br.senac.fullstack.shared.security;

import br.senac.fullstack.mentor.domain.DisponibilidadeMentor;
import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.mentor.domain.enums.PeriodoDisponibilidade;
import br.senac.fullstack.mentor.infrastructure.persistence.repository.MentorRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.domain.MembroStartup;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.startup.domain.enums.StatusValidacao;
import br.senac.fullstack.startup.infrastructure.persistence.repository.StartupRepository;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:security;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=update", "spring.jpa.open-in-view=false"
})
@AutoConfigureMockMvc
@Transactional
class SecurityIntegrationTest {
    private static final String PASSWORD = "senha-ficticia-123";
    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper mapper;
    @Autowired
    private UsuarioRepository users;
    @Autowired
    private MentorRepository mentors;
    @Autowired
    private StartupRepository startups;
    @Autowired
    private PasswordEncoder encoder;

    @Test
    void mentorCanRegisterLoadEditPublishAndLogoutUsingTheSession() throws Exception {
        String email = UUID.randomUUID() + "@example.test";
        String biography = "b".repeat(1000);
        String registration = mapper.writeValueAsString(java.util.Map.of(
                "usuario", java.util.Map.of("nome", "Mentora Ficticia", "email", email, "senha", PASSWORD),
                "biografia", biography, "linkedin", "perfil.ficticio",
                "disponibilidades", Set.of(java.util.Map.of("diaSemana", 1, "periodo", "MANHA"))));
        MvcResult token = mvc.perform(get("/csrf")).andReturn();
        MvcResult registered = mvc.perform(withToken(post("/api/v1/mentores"), token)
                        .contentType(MediaType.APPLICATION_JSON).content(registration))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.biografia").value(biography))
                .andExpect(jsonPath("$.status").value("RASCUNHO")).andReturn();
        String mentorId = mapper.readTree(registered.getResponse().getContentAsString()).get("id").asText();
        Usuario owner = users.findByEmail(email).orElseThrow();
        MockHttpSession session = login(owner);
        mvc.perform(get("/api/v1/mentores/me").session(session).param("usuarioId", UUID.randomUUID().toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(mentorId))
                .andExpect(jsonPath("$.usuarioId").value(owner.getId().toString()))
                .andExpect(jsonPath("$.senha").doesNotExist()).andExpect(jsonPath("$.usuario").doesNotExist());
        MvcResult refreshed = mvc.perform(get("/csrf").session(session)).andReturn();
        mvc.perform(withToken(patch("/api/v1/mentores/" + mentorId).session(session), refreshed)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                        {"biografia":"Experiencia atualizada","linkedin":"","site":"",
                         "disponibilidades":[{"diaSemana":7,"periodo":"NOITE"}]}
                        """))
                .andExpect(status().isOk()).andExpect(jsonPath("$.biografia").value("Experiencia atualizada"))
                .andExpect(jsonPath("$.linkedin").isEmpty())
                .andExpect(jsonPath("$.disponibilidades[0].diaSemana").value(7));
        mvc.perform(withToken(patch("/api/v1/mentores/" + mentorId + "/status").session(session), refreshed)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"PUBLICADO\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLICADO"));
        mentors.flush();
        mvc.perform(get("/api/v1/mentores/me").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLICADO"));
        mvc.perform(withToken(post("/api/v1/auth/logout").session(session), refreshed))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/mentores/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void mentorSelfProfileRequiresTheMentorRoleAndNeverUsesAnIdFromTheClient() throws Exception {
        mvc.perform(get("/api/v1/mentores/me")).andExpect(status().isUnauthorized());
        for (TipoUsuario role : Set.of(TipoUsuario.STARTUP, TipoUsuario.ADMIN)) {
            mvc.perform(get("/api/v1/mentores/me").session(login(account(role))))
                    .andExpect(status().isForbidden());
        }
        Usuario owner = account(TipoUsuario.MENTOR);
        Mentor mentor = mentors.saveAndFlush(new Mentor(owner, LocalDate.of(2026, 10, 21), "Biografia",
                null, null, Set.of(new DisponibilidadeMentor(1, PeriodoDisponibilidade.MANHA))));
        mvc.perform(get("/api/v1/mentores/me").session(login(account(TipoUsuario.MENTOR)))
                        .param("mentorId", mentor.getId().toString()).param("usuarioId", owner.getId().toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    void mentorProfileRejectsBlankBiographyAndLinksLongerThanTheDatabaseLimit() throws Exception {
        Usuario owner = account(TipoUsuario.MENTOR);
        Mentor mentor = mentors.saveAndFlush(new Mentor(owner, LocalDate.of(2026, 10, 21), "Biografia",
                null, null, Set.of(new DisponibilidadeMentor(1, PeriodoDisponibilidade.MANHA))));
        MockHttpSession session = login(owner);
        for (String body : Set.of("{\"biografia\":\"   \"}",
                mapper.writeValueAsString(java.util.Map.of("linkedin", "x".repeat(256))))) {
            mvc.perform(patch("/api/v1/mentores/" + mentor.getId()).session(session).with(csrf())
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void publicRegistrationKeepsServerAssignedRolesAndRejectsDuplicateEmail() throws Exception {
        String email = UUID.randomUUID() + "@example.test";
        String body = """
                {"usuario":{"nome":"Mentora Ficticia","email":"%s","senha":"%s","tipoUsuario":"ADMIN"},
                 "biografia":"Biografia","disponibilidades":[{"diaSemana":1,"periodo":"MANHA"}]}
                """.formatted(email, PASSWORD);
        MvcResult csrfToken = mvc.perform(get("/csrf")).andReturn();
        mvc.perform(withToken(post("/api/v1/mentores"), csrfToken).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.usuario.senha").doesNotExist());
        Usuario registered = users.findByEmail(email).orElseThrow();
        assertThat(registered.getTipoUsuario()).isEqualTo(TipoUsuario.MENTOR);
        assertThat(encoder.matches(PASSWORD, registered.getSenha())).isTrue();
        mvc.perform(post("/api/v1/mentores").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
        mvc.perform(get("/api/v1/auth/me").session(login(registered)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.tipoUsuario").value("MENTOR"));
    }

    @Test
    void loginRotatesSessionErasesCredentialsAndLogoutInvalidatesIt() throws Exception {
        Usuario usuario = account(TipoUsuario.MENTOR);
        MockHttpSession prior = new MockHttpSession();
        String oldId = prior.getId();
        MvcResult token = mvc.perform(get("/csrf")).andExpect(status().isOk()).andReturn();
        MvcResult login = mvc.perform(withToken(post("/api/v1/auth/login").session(prior), token)
                        .contentType(MediaType.APPLICATION_JSON).content(credentials(usuario.getEmail(), PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(usuario.getId().toString()))
                .andExpect(jsonPath("$.tipoUsuario").value("MENTOR"))
                .andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.sessionId").doesNotExist())
                .andExpect(cookie().maxAge("XSRF-TOKEN", 0))
                .andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        assertThat(session).isNotNull();
        assertThat(session.getId()).isNotEqualTo(oldId);
        SecurityContext context = (SecurityContext) session.getAttribute("SPRING_SECURITY_CONTEXT");
        assertThat(context.getAuthentication().getCredentials()).isNull();
        assertThat(((org.springframework.security.core.userdetails.UserDetails)
                context.getAuthentication().getPrincipal()).getPassword()).isNull();
        mvc.perform(get("/api/v1/auth/me").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nome").value("Pessoa Ficticia"));
        MvcResult refreshed = mvc.perform(get("/csrf").session(session)).andReturn();
        assertThat(refreshed.getResponse().getCookie("XSRF-TOKEN").getValue())
                .isNotEqualTo(token.getResponse().getCookie("XSRF-TOKEN").getValue());
        mvc.perform(post("/api/v1/auth/logout").session(session)).andExpect(status().isForbidden());
        mvc.perform(withToken(post("/api/v1/auth/logout").session(session), refreshed))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("XSRF-TOKEN", 0))
                .andExpect(cookie().maxAge("JSESSIONID", 0))
                .andExpect(cookie().httpOnly("JSESSIONID", true));
        assertThat(session.isInvalid()).isTrue();
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        MvcResult afterLogout = mvc.perform(get("/csrf")).andExpect(status().isOk()).andReturn();
        assertThat(afterLogout.getResponse().getCookie("XSRF-TOKEN").getValue())
                .isNotEqualTo(refreshed.getResponse().getCookie("XSRF-TOKEN").getValue());
    }

    @Test
    void badPasswordAndUnknownEmailHaveIdenticalGenericFailures() throws Exception {
        Usuario usuario = account(TipoUsuario.MENTOR);
        String first = mvc.perform(post("/api/v1/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(credentials(usuario.getEmail(), "incorreta")))
                .andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
        String second = mvc.perform(post("/api/v1/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(credentials("missing@example.test", "incorreta")))
                .andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
        assertThat(first).isEqualTo(second).doesNotContain(usuario.getEmail(), "senha", "Exception", "SQL");
    }

    @Test
    void csrfIsRequiredForEveryUnsafeMethodIncludingLoginAndLogout() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden()).andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
        mvc.perform(patch("/api/v1/mentores/" + UUID.randomUUID()).with(user("test").roles("MENTOR"))
                        .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/startups/" + UUID.randomUUID() + "/membros/" + UUID.randomUUID())
                        .with(user("test").roles("STARTUP"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/logout").with(csrf())).andExpect(status().isUnauthorized());
        MvcResult token = mvc.perform(get("/csrf")).andReturn();
        mvc.perform(post("/api/v1/auth/login").cookie(token.getResponse().getCookie("XSRF-TOKEN"))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/login").cookie(token.getResponse().getCookie("XSRF-TOKEN"))
                        .header("X-XSRF-TOKEN", "invalid").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/login").header("X-XSRF-TOKEN", "without-cookie")
                        .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
    }

    @Test
    void corsOnlyAllowsTheExactConfiguredOriginAndUsedMethodsAndHeaders() throws Exception {
        mvc.perform(options("/api/v1/auth/login").header(HttpHeaders.ORIGIN, "http://localhost:4200")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Content-Type,X-XSRF-TOKEN"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:4200"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
        for (String origin : Set.of("https://evil.example", "http://localhost.evil.example:4200",
                "http://localhost:4200.evil.example", "null", "*")) {
            mvc.perform(options("/api/v1/auth/login").header(HttpHeaders.ORIGIN, origin)
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                    .andExpect(status().isForbidden())
                    .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
        }
        mvc.perform(options("/api/v1/auth/login").header(HttpHeaders.ORIGIN, "http://localhost:4200")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PUT")).andExpect(status().isForbidden());
        mvc.perform(options("/api/v1/auth/login").header(HttpHeaders.ORIGIN, "http://localhost:4200")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization")).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/auth/me").header(HttpHeaders.ORIGIN, "http://localhost:4200"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:4200"));
    }

    @Test
    void mentorCanOnlyEditOwnProfileAndStatus() throws Exception {
        Usuario owner = account(TipoUsuario.MENTOR);
        Mentor mentor = mentors.saveAndFlush(new Mentor(owner, LocalDate.of(2026, 10, 20), "Biografia",
                null, null, Set.of(new DisponibilidadeMentor(1, PeriodoDisponibilidade.MANHA))));
        String path = "/api/v1/mentores/" + mentor.getId();
        mvc.perform(patch(path).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        MockHttpSession stranger = login(account(TipoUsuario.MENTOR));
        for (String endpoint : Set.of(path, path + "/status")) {
            mvc.perform(patch(endpoint).session(stranger).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                            .content("{\"status\":\"PUBLICADO\",\"biografia\":\"Ataque\"}"))
                    .andExpect(status().isForbidden());
        }
        for (TipoUsuario role : Set.of(TipoUsuario.STARTUP, TipoUsuario.ADMIN)) {
            mvc.perform(patch(path).session(login(account(role))).with(csrf())
                            .contentType(MediaType.APPLICATION_JSON).content("{\"biografia\":\"Ataque\"}"))
                    .andExpect(status().isForbidden());
        }
        assertThat(mentor.getBiografia()).isEqualTo("Biografia");
        MockHttpSession session = login(owner);
        mvc.perform(patch(path).session(session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"biografia\":\"Atualizada\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.biografia").value("Atualizada"));
        mvc.perform(patch(path + "/status").session(session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PUBLICADO\"}")).andExpect(status().isOk());
        mvc.perform(patch("/api/v1/mentores/" + UUID.randomUUID()).session(session).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isNotFound());
    }

    @Test
    void startupManagementRequiresFounderOrRepresentativeAndPreservesInvariants() throws Exception {
        Usuario founder = account(TipoUsuario.STARTUP);
        Usuario representative = account(TipoUsuario.STARTUP);
        Usuario member = account(TipoUsuario.STARTUP);
        Startup startup = startup(founder, representative, member);
        String path = "/api/v1/startups/" + startup.getId() + "/membros";
        Usuario target = account(TipoUsuario.STARTUP);
        for (Usuario denied : Set.of(member, account(TipoUsuario.STARTUP), account(TipoUsuario.MENTOR),
                account(TipoUsuario.ADMIN))) {
            MockHttpSession session = login(denied);
            mvc.perform(post(path).session(session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                            .content(memberJson(target))).andExpect(status().isForbidden());
            mvc.perform(delete(path + "/" + member.getId()).session(session).with(csrf()))
                    .andExpect(status().isForbidden());
        }
        MockHttpSession managerSession = login(representative);
        mvc.perform(post(path).session(managerSession).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(memberJson(target))).andExpect(status().isCreated());
        mvc.perform(post(path).session(managerSession).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(memberJson(target))).andExpect(status().isConflict());
        mvc.perform(delete(path + "/" + founder.getId()).session(managerSession).with(csrf()))
                .andExpect(status().isConflict());
        mvc.perform(delete(path + "/" + target.getId()).session(managerSession).with(csrf()))
                .andExpect(status().isNoContent());
        mvc.perform(delete(path + "/" + member.getId()).session(login(founder)).with(csrf()))
                .andExpect(status().isNoContent());
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
        mvc.perform(get(path).session(managerSession)).andExpect(status().isOk());
    }

    @Test
    void denyUnknownRoutesAndProtectOperationalEndpointsAndRegistrations() throws Exception {
        mvc.perform(get("/api/v1/health")).andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().doesNotExist("Strict-Transport-Security"));
        mvc.perform(get("/unlisted")).andExpect(status().isUnauthorized());
        mvc.perform(get("/unlisted").with(user("admin").roles("ADMIN"))).andExpect(status().isForbidden());
        mvc.perform(get("/actuator/health")).andExpect(status().isUnauthorized());
        mvc.perform(get("/actuator/health").with(user("mentor").roles("MENTOR"))).andExpect(status().isForbidden());
        mvc.perform(get("/actuator/health").with(user("admin").roles("ADMIN"))).andExpect(status().isOk());
        mvc.perform(get("/actuator/metrics").with(user("admin").roles("ADMIN"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/startups").with(user("test").roles("STARTUP")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.TEXT_PLAIN).content("{}"))
                .andExpect(status().isUnsupportedMediaType()).andExpect(jsonPath("$.status").value(415));
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"invalid\",\"senha\":\"\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.email").exists());
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{bad"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.detail").value("Dados da requisição inválidos."));
    }

    @Test
    void startupOnboardingCreatesFounderAndSupportsSessionWithoutAcceptingClientRoles() throws Exception {
        String email = UUID.randomUUID() + "@example.test";
        String body = startupRegistrationBody(email);
        MvcResult token = mvc.perform(get("/csrf")).andExpect(status().isOk()).andReturn();
        mvc.perform(post("/api/v1/startups").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/startups").cookie(token.getResponse().getCookie("XSRF-TOKEN"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        MvcResult registered = mvc.perform(withToken(post("/api/v1/startups"), token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nomeProvisorio").value("Ideia Ficticia"))
                .andExpect(jsonPath("$.statusValidacao").value("PESQUISA_MERCADO"))
                .andExpect(jsonPath("$.membros.length()").value(1))
                .andExpect(jsonPath("$.membros[0].papelMembro").value("FUNDADOR"))
                .andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.fundador").doesNotExist())
                .andExpect(jsonPath("$.membros[0].senha").doesNotExist())
                .andExpect(jsonPath("$.membros[0].usuario").doesNotExist()).andReturn();
        Usuario founder = users.findByEmail(email).orElseThrow();
        assertThat(founder.getTipoUsuario()).isEqualTo(TipoUsuario.STARTUP);
        assertThat(encoder.matches(PASSWORD, founder.getSenha())).isTrue();
        String startupId = mapper.readTree(registered.getResponse().getContentAsString()).get("id").asText();
        assertThat(mapper.readTree(registered.getResponse().getContentAsString())
                .get("membros").get(0).get("usuarioId").asText()).isEqualTo(founder.getId().toString());
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/startups").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
        mvc.perform(get("/api/v1/startups/" + startupId)).andExpect(status().isUnauthorized());
        MockHttpSession session = login(founder);
        mvc.perform(get("/api/v1/auth/me").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.tipoUsuario").value("STARTUP"));
        mvc.perform(get("/api/v1/startups/" + startupId).session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.membros[0].usuarioId").value(founder.getId().toString()));
        mvc.perform(post("/api/v1/startups").session(session).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        MvcResult refreshed = mvc.perform(get("/csrf").session(session)).andReturn();
        mvc.perform(withToken(post("/api/v1/auth/logout").session(session), refreshed))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/startups/" + startupId)).andExpect(status().isUnauthorized());
    }

    @Test
    void startupRegistrationRejectsTextBeyondDatabaseLimitsBeforeCreatingAnAccount() throws Exception {
        String email = UUID.randomUUID() + "@example.test";
        long previousUsers = users.count();
        for (String field : Set.of("nomeProvisorio", "pitchCurto", "publicoAlvo", "modeloDeNegocio",
                "problemaCentral", "solucaoProposta")) {
            int limit = Set.of("problemaCentral", "solucaoProposta").contains(field) ? 5000 : 255;
            var body = (ObjectNode) mapper.readTree(startupRegistrationBody(email));
            body.put(field, "x".repeat(limit + 1));
            mvc.perform(post("/api/v1/startups").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                            .content(mapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields." + field).exists());
        }
        var invalidStatus = (ObjectNode) mapper.readTree(startupRegistrationBody(email));
        invalidStatus.put("statusValidacao", "PUBLICADO");
        mvc.perform(post("/api/v1/startups").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(invalidStatus))).andExpect(status().isBadRequest());
        assertThat(users.count()).isEqualTo(previousUsers);
        assertThat(users.findByEmail(email)).isEmpty();
    }

    private String startupRegistrationBody(String email) {
        return """
                {"fundador":{"nome":"Pessoa Fundadora","email":"%s","senha":"%s","tipoUsuario":"ADMIN"},
                 "nomeProvisorio":" Ideia Ficticia ","pitchCurto":"Uma rede de apoio.",
                 "problemaCentral":"Poucas conexoes.","solucaoProposta":"Conectar pessoas e ideias.",
                 "publicoAlvo":"Projetos iniciais","modeloDeNegocio":"Assinatura",
                 "statusValidacao":"PESQUISA_MERCADO","membros":[{"papelMembro":"REPRESENTANTE"}]}
                """.formatted(email, PASSWORD);
    }

    private Usuario account(TipoUsuario role) {
        return users.saveAndFlush(new Usuario("Pessoa Ficticia", UUID.randomUUID() + "@example.test",
                encoder.encode(PASSWORD), role));
    }

    private RequestPostProcessor csrf() {
        return request -> {
            String token = UUID.randomUUID().toString();
            request.setCookies(new Cookie("XSRF-TOKEN", token));
            request.addHeader("X-XSRF-TOKEN", token);
            return request;
        };
    }

    private MockHttpSession login(Usuario usuario) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(credentials(usuario.getEmail(), PASSWORD)))
                .andExpect(status().isOk()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private String credentials(String email, String password) throws Exception {
        return mapper.writeValueAsString(java.util.Map.of("email", email, "senha", password));
    }

    private MockHttpServletRequestBuilder withToken(MockHttpServletRequestBuilder request, MvcResult result) throws Exception {
        Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
        String token = mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        return request.cookie(cookie).header("X-XSRF-TOKEN", token);
    }

    private String memberJson(Usuario usuario) {
        return "{\"usuarioId\":\"" + usuario.getId() + "\",\"papelMembro\":\"MEMBRO\"}";
    }

    private Startup startup(Usuario founder, Usuario representative, Usuario member) {
        Startup startup = new Startup();
        startup.setNomeProvisorio("Startup ficticia");
        startup.setPitchCurto("Pitch");
        startup.setProblemaCentral("Problema");
        startup.setSolucaoProposta("Solucao");
        startup.setPublicoAlvo("Publico");
        startup.setModeloDeNegocio("Modelo");
        startup.setStatusValidacao(StatusValidacao.APENAS_IDEIA);
        startup.setDataCriacao(Instant.parse("2026-10-20T12:00:00Z"));
        addMember(startup, founder, PapelMembroStartup.FUNDADOR);
        addMember(startup, representative, PapelMembroStartup.REPRESENTANTE);
        addMember(startup, member, PapelMembroStartup.MEMBRO);
        return startups.saveAndFlush(startup);
    }

    private void addMember(Startup startup, Usuario usuario, PapelMembroStartup role) {
        MembroStartup member = new MembroStartup();
        member.setStartup(startup);
        member.setUsuario(usuario);
        member.setPapelMembro(role);
        member.setDataEntrada(LocalDate.of(2026, 10, 20));
        startup.getMembros().add(member);
    }
}
