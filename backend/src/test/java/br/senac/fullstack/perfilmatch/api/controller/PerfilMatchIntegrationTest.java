package br.senac.fullstack.perfilmatch.api.controller;

import br.senac.fullstack.auth.infrastructure.security.UsuarioPrincipal;
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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.Instant;
import java.time.LocalDate;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// No test transaction: each HTTP call must commit, reload its collections and enforce real rollback.
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:questionnaire;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=update", "spring.jpa.open-in-view=false"
})
@AutoConfigureMockMvc
class PerfilMatchIntegrationTest {
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private UsuarioRepository users;
    @Autowired private StartupRepository startups;
    @Autowired private MentorRepository mentors;

    @Test
    void startupPersistsAllAnswersPreservesPrioritiesAndReplacesInsteadOfAppending() throws Exception {
        Usuario owner = account(TipoUsuario.STARTUP);
        Startup startup = startup(owner);
        String path = startupPath(startup);
        mvc.perform(get(path).with(as(owner))).andExpect(status().isNoContent());
        ObjectNode body = answers("STARTUP");
        body.put("projectName", "Ideia de saúde");
        body.putArray("sectors").add("HEALTH").add("AGRO");
        body.putArray("backgrounds").add("TECH").add("BUSINESS").add("STUDENT");
        body.putArray("topics").add("PRICING").add("VALIDATION");
        MvcResult token = mvc.perform(get("/csrf").with(as(owner))).andReturn();
        String header = json.readTree(token.getResponse().getContentAsString()).get("headerName").asText();
        String value = json.readTree(token.getResponse().getContentAsString()).get("token").asText();
        MvcResult created = mvc.perform(put(path).with(as(owner)).cookie(token.getResponse().getCookie("XSRF-TOKEN"))
                        .header(header, value).contentType(MediaType.APPLICATION_JSON).content(body.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.topics[0]").value("PRICING"))
                .andExpect(jsonPath("$.updatedAt").isNotEmpty()).andExpect(jsonPath("$.senha").doesNotExist())
                .andExpect(jsonPath("$.startup").doesNotExist()).andExpect(jsonPath("$.score").doesNotExist()).andReturn();
        mvc.perform(get(path).with(as(owner))).andExpect(status().isOk())
                .andExpect(content().json(created.getResponse().getContentAsString(StandardCharsets.UTF_8)))
                .andExpect(jsonPath("$.backgrounds.length()").value(3))
                .andExpect(jsonPath("$.topics[1]").value("VALIDATION"))
                .andExpect(jsonPath("$.availability.length()").value(2));
        body.putArray("topics").add("CUSTOMERS");
        body.putArray("availability").addObject().put("day", "SUN").put("period", "MORNING");
        write(path, owner, body, 200);
        write(path, owner, body, 200);
        mvc.perform(get(path).with(as(owner))).andExpect(jsonPath("$.topics.length()").value(1))
                .andExpect(jsonPath("$.availability.length()").value(1));
        Startup another = startup(owner);
        mvc.perform(get(startupPath(another)).with(as(owner))).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/startups/" + startup.getId()).with(as(owner)))
                .andExpect(jsonPath("$.nomeProvisorio").value("Projeto original"))
                .andExpect(jsonPath("$.statusValidacao").value("APENAS_IDEIA"));
    }

    @Test
    void mentorAcceptsExpandedLimitsAndSharesTheExistingAgendaWithoutChangingPublication() throws Exception {
        Usuario owner = account(TipoUsuario.MENTOR);
        Mentor mentor = mentor(owner);
        String path = mentorPath(mentor);
        ObjectNode body = answers("MENTOR");
        body.putArray("sectors").add("TECH").add("HEALTH").add("AGRO").add("GOVERNMENT").add("PETS");
        body.putArray("topics").add("VALIDATION").add("CUSTOMERS").add("BUSINESS")
                .add("TECHNOLOGY").add("GRANTS").add("ORGANIZATION");
        ObjectNode experience = body.putObject("experience");
        body.withArray("topics").forEach(topic -> experience.put(topic.asText(), "PRACTICAL"));
        body.putArray("audiences").add("B2C").add("B2B").add("B2B2C").add("B2G");
        body.putArray("backgrounds").add("TECH").add("OTHER");
        body.put("accepting", false);
        write(path, owner, body, 200);
        mvc.perform(get(path).with(as(owner))).andExpect(status().isOk())
                .andExpect(jsonPath("$.topics.length()").value(6)).andExpect(jsonPath("$.accepting").value(false));
        mvc.perform(get("/api/v1/mentores/me").with(as(owner)))
                .andExpect(jsonPath("$.status").value("RASCUNHO"))
                .andExpect(jsonPath("$.disponibilidades.length()").value(2))
                .andExpect(jsonPath("$.disponibilidades[0].diaSemana").value(1))
                .andExpect(jsonPath("$.disponibilidades[1].diaSemana").value(7));
        mvc.perform(patch("/api/v1/mentores/" + mentor.getId()).with(as(owner)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("""
                        {"disponibilidades":[{"diaSemana":4,"periodo":"TARDE"}]}
                        """))
                .andExpect(status().isOk());
        mvc.perform(get(path).with(as(owner))).andExpect(status().isOk())
                .andExpect(jsonPath("$.availability.length()").value(1))
                .andExpect(jsonPath("$.availability[0].day").value("THU"))
                .andExpect(jsonPath("$.availability[0].period").value("AFTERNOON"));
    }

    @Test
    void startupMembersCanReadButOnlyManagersCanWriteAndRevocationIsImmediate() throws Exception {
        Usuario owner = account(TipoUsuario.STARTUP);
        Usuario member = account(TipoUsuario.STARTUP);
        Usuario representative = account(TipoUsuario.STARTUP);
        Startup startup = startup(owner, member, representative);
        String path = startupPath(startup);
        ObjectNode body = answers("STARTUP");
        write(path, member, body, 403);
        write(path, representative, body, 200);
        mvc.perform(get(path).with(as(member))).andExpect(status().isOk());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(
                        "/api/v1/startups/" + startup.getId() + "/membros/" + representative.getId())
                        .with(as(owner)).with(csrf())).andExpect(status().isNoContent());
        write(path, representative, body, 403);
        mvc.perform(get(path).with(as(representative))).andExpect(status().isForbidden());
    }

    @Test
    void rejectsAnonymousWrongRolesOtherOwnersAndMissingCsrf() throws Exception {
        Usuario startupOwner = account(TipoUsuario.STARTUP);
        Usuario mentorOwner = account(TipoUsuario.MENTOR);
        String sp = startupPath(startup(startupOwner));
        String mp = mentorPath(mentor(mentorOwner));
        for (String path : Set.of(sp, mp)) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
            mvc.perform(put(path).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                    .content(answers(path.equals(sp) ? "STARTUP" : "MENTOR").toString()))
                    .andExpect(status().isUnauthorized());
            mvc.perform(get(path).with(as(account(TipoUsuario.ADMIN)))).andExpect(status().isForbidden());
        }
        write(sp, mentorOwner, answers("STARTUP"), 403);
        write(mp, startupOwner, answers("MENTOR"), 403);
        write(sp, account(TipoUsuario.STARTUP), answers("STARTUP"), 403);
        write(mp, account(TipoUsuario.MENTOR), answers("MENTOR"), 403);
        mvc.perform(get(mp).with(as(account(TipoUsuario.MENTOR)))).andExpect(status().isForbidden());
        mvc.perform(put(sp).with(as(startupOwner)).contentType(MediaType.APPLICATION_JSON)
                .content(answers("STARTUP").toString())).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/startups/" + UUID.randomUUID() + "/perfil-match").with(as(startupOwner)))
                .andExpect(status().isNotFound());
        mvc.perform(options(sp).header(HttpHeaders.ORIGIN, "http://localhost:4200")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PUT")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Content-Type,X-XSRF-TOKEN"))
                .andExpect(status().isOk());
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "\"questionnaireVersion\":\"v2\"", "\"kind\":\"MENTOR\"", "\"kind\":\"ADMIN\"",
        "\"moments\":[]", "\"moments\":[\"PROBLEM\",\"AUDIENCE\"]", "\"moments\":[null]",
        "\"sectors\":[\"TECH\",\"HEALTH\",\"AGRO\"]", "\"sectors\":[\"GENERAL\"]",
        "\"sectors\":[\"DISCOVERING\",\"TECH\"]", "\"sectors\":[\"TECH\",\"TECH\"]",
        "\"topics\":[\"INVALID\"]", "\"topics\":[\"VALIDATION\",\"VALIDATION\"]",
        "\"audiences\":[\"UNKNOWN\",\"B2C\"]", "\"audiences\":[]",
        "\"backgrounds\":[\"TECH\",\"DESIGN\",\"LAW\",\"OTHER\"]",
        "\"experience\":{\"VALIDATION\":\"PRACTICAL\"}", "\"capacity\":\"ONE\"",
        "\"accepting\":false", "\"format\":\"PRESENCIAL\"", "\"cityId\":\"INVALID\"",
        "\"cityId\":\"PE_RECIFE\"", "\"availability\":[]", "\"availability\":[null]",
        "\"availability\":[{\"day\":\"MON\",\"period\":\"INVALID\"}]",
        "\"availability\":[{\"day\":\"MON\",\"period\":\"MORNING\"},{\"day\":\"MON\",\"period\":\"MORNING\"}]",
        "\"cadence\":null"
    })
    void invalidStartupAnswersDoNotReplaceCommittedAnswers(String mutation) throws Exception {
        Usuario owner = account(TipoUsuario.STARTUP);
        String path = startupPath(startup(owner));
        ObjectNode body = answers("STARTUP");
        write(path, owner, body, 200);
        body.setAll((ObjectNode) json.readTree("{" + mutation + "}"));
        write(path, owner, body, 400);
        mvc.perform(get(path).with(as(owner))).andExpect(status().isOk())
                .andExpect(jsonPath("$.topics[0]").value("VALIDATION"))
                .andExpect(jsonPath("$.availability.length()").value(2));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "\"capacity\":null", "\"audiences\":[\"UNKNOWN\"]", "\"backgrounds\":[\"STUDENT\"]",
        "\"backgrounds\":[\"TECH\",\"OTHER\",\"LAW\"]", "\"sectors\":[\"DISCOVERING\"]",
        "\"sectors\":[\"GENERAL\",\"TECH\"]", "\"projectName\":\"Projeto indevido\"",
        "\"experience\":{}", "\"experience\":{\"VALIDATION\":null}",
        "\"experience\":{\"VALIDATION\":\"PRACTICAL\",\"PITCH\":\"KNOWLEDGE\"}"
    })
    void invalidMentorAnswersNeverChangeTheExistingAgenda(String mutation) throws Exception {
        Usuario owner = account(TipoUsuario.MENTOR);
        String path = mentorPath(mentor(owner));
        ObjectNode body = answers("MENTOR");
        body.setAll((ObjectNode) json.readTree("{" + mutation + "}"));
        write(path, owner, body, 400);
        mvc.perform(get(path).with(as(owner))).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/mentores/me").with(as(owner)))
                .andExpect(jsonPath("$.disponibilidades.length()").value(1))
                .andExpect(jsonPath("$.disponibilidades[0].diaSemana").value(4));
    }

    @Test
    void acceptsExclusiveUnknownsValidCitiesAndAllTwentyOneAgendaPairs() throws Exception {
        Usuario owner = account(TipoUsuario.STARTUP);
        String path = startupPath(startup(owner));
        ObjectNode body = answers("STARTUP");
        body.put("projectName", "a".repeat(60));
        body.putArray("sectors").add("DISCOVERING");
        body.putArray("audiences").add("UNKNOWN");
        body.put("format", "PRESENCIAL"); body.put("cityId", "PE_RECIFE");
        var slots = body.putArray("availability");
        for (String day : Set.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN")) {
            for (String period : Set.of("MORNING", "AFTERNOON", "EVENING")) {
                slots.addObject().put("day", day).put("period", period);
            }
        }
        write(path, owner, body, 200);
        body.put("projectName", "a".repeat(61));
        write(path, owner, body, 400);
        mvc.perform(get(path).with(as(owner))).andExpect(jsonPath("$.availability.length()").value(21));
    }

    private ObjectNode answers(String kind) throws Exception {
        ObjectNode body = (ObjectNode) json.readTree("""
                {"questionnaireVersion":"damatch-profile-v3","kind":"STARTUP","projectName":"",
                 "moments":["PROBLEM"],"sectors":["TECH"],"topics":["VALIDATION"],"experience":{},
                 "audiences":["B2C"],"backgrounds":["TECH"],"format":"ONLINE","cityId":"",
                 "availability":[{"day":"MON","period":"MORNING"},{"day":"SUN","period":"EVENING"}],
                 "cadence":"FLEXIBLE","accepting":true}
                """);
        body.put("kind", kind);
        if ("MENTOR".equals(kind)) {
            body.put("capacity", "FEW"); body.putObject("experience").put("VALIDATION", "KNOWLEDGE");
        }
        return body;
    }

    private void write(String path, Usuario actor, ObjectNode body, int statusCode) throws Exception {
        mvc.perform(put(path).with(as(actor)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(body.toString())).andExpect(status().is(statusCode));
    }

    private Usuario account(TipoUsuario role) {
        return users.saveAndFlush(new Usuario("Pessoa Fictícia", UUID.randomUUID() + "@example.test", "unused", role));
    }

    private RequestPostProcessor as(Usuario actor) {
        return user(new UsuarioPrincipal(actor.getId(), actor.getNome(), actor.getEmail(), "unused", actor.getTipoUsuario()));
    }

    private RequestPostProcessor csrf() {
        return request -> {
            String token = UUID.randomUUID().toString();
            request.setCookies(new Cookie("XSRF-TOKEN", token));
            request.addHeader("X-XSRF-TOKEN", token);
            return request;
        };
    }

    private Startup startup(Usuario owner, Usuario... others) {
        Startup project = new Startup();
        project.setNomeProvisorio("Projeto original"); project.setPitchCurto("Resumo fictício");
        project.setProblemaCentral("Problema"); project.setSolucaoProposta("Solução");
        project.setPublicoAlvo("Público"); project.setModeloDeNegocio("Modelo");
        project.setStatusValidacao(StatusValidacao.APENAS_IDEIA); project.setDataCriacao(Instant.now());
        addMember(project, owner, PapelMembroStartup.FUNDADOR);
        for (int index = 0; index < others.length; index++) {
            addMember(project, others[index], index == 0 ? PapelMembroStartup.MEMBRO : PapelMembroStartup.REPRESENTANTE);
        }
        return startups.saveAndFlush(project);
    }

    private void addMember(Startup project, Usuario person, PapelMembroStartup role) {
        MembroStartup member = new MembroStartup();
        member.setStartup(project); member.setUsuario(person); member.setPapelMembro(role);
        member.setDataEntrada(LocalDate.of(2026, 10, 26)); project.getMembros().add(member);
    }

    private Mentor mentor(Usuario owner) {
        return mentors.saveAndFlush(new Mentor(owner, LocalDate.of(2026, 10, 26), "Biografia fictícia", null, null,
                Set.of(new DisponibilidadeMentor(4, PeriodoDisponibilidade.TARDE))));
    }

    private String startupPath(Startup project) { return "/api/v1/startups/" + project.getId() + "/perfil-match"; }
    private String mentorPath(Mentor mentor) { return "/api/v1/mentores/" + mentor.getId() + "/perfil-match"; }
}
