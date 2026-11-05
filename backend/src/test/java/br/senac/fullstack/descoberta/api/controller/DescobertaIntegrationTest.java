package br.senac.fullstack.descoberta.api.controller;

import br.senac.fullstack.auth.infrastructure.security.UsuarioPrincipal;
import br.senac.fullstack.mentor.domain.DisponibilidadeMentor;
import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.mentor.domain.enums.PeriodoDisponibilidade;
import br.senac.fullstack.mentor.domain.enums.StatusPerfilMentor;
import br.senac.fullstack.mentor.infrastructure.persistence.repository.MentorRepository;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Capacidade;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Experiencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formacao;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formato;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Frequencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Publico;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Setor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Topico;
import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
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
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:discovery;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=update", "spring.jpa.open-in-view=false"})
@AutoConfigureMockMvc
class DescobertaIntegrationTest {
    private static final String ROOT = "/api/v1/descoberta";
    private static final String MENTORES = ROOT + "/mentores";
    private static final String STARTUPS = ROOT + "/startups";
    private static final String CACHE = "private, no-store";
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private UsuarioRepository users;
    @Autowired private MentorRepository mentors;
    @Autowired private StartupRepository startups;
    @Autowired private PerfilMatchRepository quizzes;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private EntityManagerFactory factory;

    @BeforeEach
    void reset() {
        quizzes.deleteAll();
        mentors.deleteAll();
        startups.deleteAll();
        users.deleteAll();
    }

    @Test
    void privateProjectionIsIdenticalInListAndDetailAndUsesProfileIds() throws Exception {
        PerfilMatch mentor = mentor("Mentora Ágata");
        PerfilMatch startup = startup("Projeto Original");
        Usuario startupReader = account(TipoUsuario.STARTUP, "Leitor sem projeto");
        Usuario mentorReader = account(TipoUsuario.MENTOR, "Leitor sem mentor");
        JsonNode mentorList = read(get(MENTORES), startupReader).get("itens").get(0);
        JsonNode startupList = read(get(STARTUPS), mentorReader).get("itens").get(0);
        assertProjection(mentorList);
        assertProjection(startupList);
        assertThat(read(get(MENTORES + "/" + mentor.getMentor().getId()), startupReader)).isEqualTo(mentorList);
        assertThat(read(get(STARTUPS + "/" + startup.getStartup().getId()), mentorReader)).isEqualTo(startupList);
        assertThat(mentorList.get("nome").asText()).isEqualTo("Mentora Ágata");
        assertThat(startupList.get("nome").asText()).isEqualTo("Projeto Original");
        assertThat(startupList.get("topicos").get(0).asText()).isEqualTo("PITCH");
        assertThat(startupList.get("apresentacao").asText()).isEqualTo("Resumo do projeto fictício");
        assertThat(startupList.toString()).doesNotContain("privado");
        mvc.perform(get(MENTORES + "/" + mentor.getId()).with(as(startupReader))).andExpect(status().isNotFound());
        mvc.perform(get(MENTORES + "/" + mentor.getMentor().getUsuario().getId()).with(as(startupReader)))
                .andExpect(status().isNotFound());
        // Discovery access does not grant access to the target's management DTO or questionnaire.
        mvc.perform(get("/api/v1/startups/" + startup.getStartup().getId()).with(as(startupReader)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/mentores/" + mentor.getMentor().getId() + "/perfil-match").with(as(startupReader)))
                .andExpect(status().isForbidden());
    }

    @Test
    void accessIsCheckedBeforeLookingUpIdsOrParsingPrivateRequestParameters() throws Exception {
        Usuario startup = account(TipoUsuario.STARTUP, "Leitor startup");
        Usuario mentor = account(TipoUsuario.MENTOR, "Leitor mentor");
        Usuario admin = account(TipoUsuario.ADMIN, "Administrador");
        for (String path : List.of(MENTORES, STARTUPS, MENTORES + "/invalido", STARTUPS + "/invalido")) {
            mvc.perform(get(path).param("ator", "forjado")).andExpect(status().isUnauthorized())
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, CACHE));
            mvc.perform(get(path).with(as(admin))).andExpect(status().isForbidden())
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, CACHE));
        }
        mvc.perform(get(STARTUPS).with(as(startup))).andExpect(status().isForbidden());
        mvc.perform(get(MENTORES).with(as(mentor))).andExpect(status().isForbidden());
        mvc.perform(get(STARTUPS + "/invalido").with(as(startup))).andExpect(status().isForbidden());
        mvc.perform(get(MENTORES + "/invalido").with(as(mentor))).andExpect(status().isForbidden());
        mvc.perform(post(MENTORES).with(as(startup)).with(csrf())).andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @ValueSource(strings = {"pagina=-1", "pagina=abc", "pagina=2147483648", "pagina=", "tamanho=0", "tamanho=21",
            "setor=INVALID", "setor=DISCOVERING", "topico=INVALID", "formato=INVALID", "cidade=INVALID",
            "usuarioId=forjado", "sort=nome", "tipo=MENTOR"})
    void malformedFiltersAreRejectedWithoutReflectingInput(String pair) throws Exception {
        String[] pieces = pair.split("=", 2);
        Usuario reader = account(TipoUsuario.STARTUP, "Leitor startup");
        mvc.perform(get(MENTORES).param(pieces[0], pieces[1]).with(as(reader)))
                .andExpect(status().isBadRequest()).andExpect(header().string(HttpHeaders.CACHE_CONTROL, CACHE))
                .andExpect(jsonPath("$.detail").value("Dados da requisição inválidos."));
    }

    @Test
    void rejectsRepeatedOrUnknownParametersAndMalformedIdsOnBothListsAndDetails() throws Exception {
        Usuario startup = account(TipoUsuario.STARTUP, "Leitor startup");
        Usuario mentor = account(TipoUsuario.MENTOR, "Leitor mentor");
        PerfilMatch profile = mentor("Mentora correta");
        mvc.perform(get(MENTORES).param("setor", "TECH", "HEALTH").with(as(startup))).andExpect(status().isBadRequest());
        mvc.perform(get(MENTORES).param("busca", "um", "dois").with(as(startup))).andExpect(status().isBadRequest());
        mvc.perform(get(MENTORES).param("busca", "x".repeat(101)).with(as(startup))).andExpect(status().isBadRequest());
        mvc.perform(get(STARTUPS).param("setor", "GENERAL").with(as(mentor))).andExpect(status().isBadRequest());
        mvc.perform(get(MENTORES + "/" + profile.getMentor().getId()).param("busca", "").with(as(startup)))
                .andExpect(status().isBadRequest());
        mvc.perform(get(MENTORES + "/invalido").with(as(startup))).andExpect(status().isBadRequest());
        mvc.perform(get(STARTUPS + "/invalido").with(as(mentor))).andExpect(status().isBadRequest());
        JsonNode empty = read(get(MENTORES).param("pagina", "2147483647").param("tamanho", "20"), startup);
        assertThat(empty.get("itens")).isEmpty();
        assertThat(empty.get("totalItens").asLong()).isEqualTo(1);
    }

    @Test
    void filtersAreCombinedUsingDeclaredSectorsTopicsCityAndMeetingFormat() throws Exception {
        PerfilMatch first = mentor("Mentora com pares");
        first.setSectors(List.of(Setor.TECH, Setor.HEALTH));
        first.setFormat(Formato.AMBOS);
        first.setCityId("PE_RECIFE");
        quizzes.save(first);
        PerfilMatch second = mentor("Mentora online");
        PerfilMatch general = mentor("Mentora geral");
        general.setSectors(List.of(Setor.GENERAL));
        quizzes.save(general);
        Usuario reader = account(TipoUsuario.STARTUP, "Leitor startup");
        JsonNode filtered = read(get(MENTORES).param("setor", "HEALTH").param("topico", "VALIDATION")
                .param("cidade", "PE_RECIFE").param("formato", "PRESENCIAL"), reader);
        assertThat(filtered.get("itens")).hasSize(1);
        assertThat(filtered.get("itens").get(0).get("id").asText()).isEqualTo(first.getMentor().getId().toString());
        assertThat(read(get(MENTORES).param("formato", "ONLINE"), reader).get("totalItens").asInt()).isEqualTo(3);
        assertThat(read(get(MENTORES).param("formato", "AMBOS"), reader).get("totalItens").asInt()).isEqualTo(1);
        assertThat(read(get(MENTORES).param("setor", "TECH"), reader).get("totalItens").asInt()).isEqualTo(2);
        assertThat(read(get(MENTORES).param("setor", "GENERAL"), reader).get("totalItens").asInt()).isEqualTo(1);
        assertThat(read(get(MENTORES).param("topico", "PRICING"), reader).get("itens")).isEmpty();
        assertThat(read(get(MENTORES).param("cidade", "PB_JOAO_PESSOA"), reader).get("itens")).isEmpty();
        assertThat(read(get(MENTORES).param("busca", "  ").param("setor", ""), reader).get("totalItens").asInt()).isEqualTo(3);
        assertThat(second.getMentor().getId()).isNotNull();
    }

    @Test
    void accentsCaseLiteralSqlCharactersAndStableTiesDoNotDependOnDatabaseCollation() throws Exception {
        PerfilMatch first = mentor("Ágata");
        PerfilMatch second = mentor("agata");
        PerfilMatch symbols = mentor("Nome 100%_ ' OR 1=1 --");
        symbols.getMentor().setBiografia("Apresentação com AÇÃO e validações");
        mentors.save(symbols.getMentor());
        Usuario reader = account(TipoUsuario.STARTUP, "Leitor startup");
        JsonNode matches = read(get(MENTORES).param("busca", "  ÁGATA  "), reader).get("itens");
        List<String> expected = List.of(first.getMentor().getId().toString(), second.getMentor().getId().toString())
                .stream().sorted().toList();
        assertThat(matches.findValuesAsText("id")).containsExactlyElementsOf(expected);
        for (String query : List.of("100%_", "' OR 1=1 --", "acao", "VALIDAÇÕES")) {
            assertThat(read(get(MENTORES).param("busca", query), reader).get("itens")).hasSize(1);
        }
        assertThat(read(get(MENTORES).param("busca", symbols.getMentor().getUsuario().getEmail()), reader).get("itens")).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"RASCUNHO", "PAUSADO", "AUSENTE", "VERSAO", "ACEITANDO", "BIOGRAFIA", "NOME",
            "AGENDA_VAZIA", "AGENDA_INVALIDA", "TOPICOS", "EXPERIENCIA", "CIDADE", "MOMENTOS", "TIPO_CONTA"})
    void unavailableMentorsDoNotCountOrRevealWhyTheyAreUnavailable(String reason) throws Exception {
        PerfilMatch target = mentor("Mentora inelegível");
        Mentor mentor = target.getMentor();
        switch (reason) {
            case "RASCUNHO" -> mentor.setStatus(StatusPerfilMentor.RASCUNHO);
            case "PAUSADO" -> mentor.setStatus(StatusPerfilMentor.PAUSADO);
            case "VERSAO" -> target.setQuestionnaireVersion("legado-v1");
            case "ACEITANDO" -> target.setAccepting(false);
            case "BIOGRAFIA" -> mentor.setBiografia(" ");
            case "NOME" -> { mentor.getUsuario().setNome("x"); users.save(mentor.getUsuario()); }
            case "AGENDA_VAZIA" -> mentor.setDisponibilidades(new LinkedHashSet<>());
            case "AGENDA_INVALIDA" -> mentor.setDisponibilidades(Set.of(new DisponibilidadeMentor(8, PeriodoDisponibilidade.NOITE)));
            case "TOPICOS" -> target.setTopics(List.of());
            case "EXPERIENCIA" -> target.setExperience(Map.of());
            case "CIDADE" -> target.setCityId("PE_RECIFE");
            case "MOMENTOS" -> target.setMoments(List.of());
            case "TIPO_CONTA" -> { mentor.getUsuario().setTipoUsuario(TipoUsuario.STARTUP); users.save(mentor.getUsuario()); }
            default -> { }
        }
        mentors.save(mentor);
        quizzes.save(target);
        if ("AUSENTE".equals(reason)) {
            quizzes.deleteById(target.getId());
        }
        Usuario reader = account(TipoUsuario.STARTUP, "Leitor startup");
        JsonNode result = read(get(MENTORES), reader);
        assertThat(result.get("itens")).isEmpty();
        assertThat(result.get("totalItens").asInt()).isZero();
        MvcResult hidden = mvc.perform(get(MENTORES + "/" + mentor.getId()).with(as(reader)))
                .andExpect(status().isNotFound()).andReturn();
        MvcResult missing = mvc.perform(get(MENTORES + "/" + UUID.randomUUID()).with(as(reader)))
                .andExpect(status().isNotFound()).andReturn();
        assertThat(json.readTree(hidden.getResponse().getContentAsString()).get("detail"))
                .isEqualTo(json.readTree(missing.getResponse().getContentAsString()).get("detail"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"RASCUNHO", "PAUSADO", "AUSENTE", "VERSAO", "NOME", "RESUMO", "PROBLEMA", "SOLUCAO",
            "PUBLICO", "MODELO", "TOPICOS"})
    void incompletePublishedStartupsAreExcludedBeforeCountingAndPaging(String reason) throws Exception {
        PerfilMatch target = startup("AAA projeto inválido");
        Startup startup = target.getStartup();
        switch (reason) {
            case "RASCUNHO" -> startup.setStatus(StatusPerfilStartup.RASCUNHO);
            case "PAUSADO" -> startup.setStatus(StatusPerfilStartup.PAUSADO);
            case "VERSAO" -> target.setQuestionnaireVersion("legado");
            case "NOME" -> startup.setNomeProvisorio("");
            case "RESUMO" -> startup.setPitchCurto("");
            case "PROBLEMA" -> startup.setProblemaCentral("");
            case "SOLUCAO" -> startup.setSolucaoProposta("");
            case "PUBLICO" -> startup.setPublicoAlvo("");
            case "MODELO" -> startup.setModeloDeNegocio("");
            case "TOPICOS" -> target.setTopics(List.of());
            default -> { }
        }
        startups.save(startup);
        quizzes.save(target);
        if ("AUSENTE".equals(reason)) {
            quizzes.deleteById(target.getId());
        }
        PerfilMatch valid = startup("ZZZ projeto válido");
        Usuario reader = account(TipoUsuario.MENTOR, "Leitor mentor");
        JsonNode result = read(get(STARTUPS).param("tamanho", "1"), reader);
        assertThat(result.get("totalItens").asInt()).isEqualTo(1);
        assertThat(result.get("totalPaginas").asInt()).isEqualTo(1);
        assertThat(result.get("itens").get(0).get("id").asText()).isEqualTo(valid.getStartup().getId().toString());
        mvc.perform(get(STARTUPS + "/" + startup.getId()).with(as(reader))).andExpect(status().isNotFound());
        assertThat(read(get(STARTUPS).param("setor", "DISCOVERING"), reader).get("totalItens").asInt()).isEqualTo(1);
    }

    @Test
    void mentorUsesTheSharedAgendaWithoutWritingOrReservingAnything() throws Exception {
        PerfilMatch target = mentor("Mentora com agenda única");
        Usuario reader = account(TipoUsuario.STARTUP, "Leitor startup");
        String id = target.getMentor().getId().toString();
        assertThat(jdbc.queryForObject("select count(*) from perfil_match_agenda", Integer.class)).isZero();
        read(get(MENTORES + "/" + id), reader);
        mvc.perform(patch("/api/v1/mentores/" + id).with(as(target.getMentor().getUsuario())).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("""
                        {"disponibilidades":[{"diaSemana":7,"periodo":"TARDE"}]}
                        """))
                .andExpect(status().isOk());
        read(get(MENTORES + "/" + id), reader);
        assertThat(jdbc.queryForObject("select count(*) from perfil_match_agenda", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select dia_semana from disponibilidade_mentor where mentor_id=?", Integer.class,
                target.getMentor().getId())).isEqualTo(7);
        assertThat(jdbc.queryForObject("select count(*) from membros_da_startup", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from convite_startup", Integer.class)).isZero();
    }

    @Test
    void aFreshDetailRechecksPausingAcceptingAndProfileValidity() throws Exception {
        PerfilMatch target = mentor("Mentora publicada");
        Usuario reader = account(TipoUsuario.STARTUP, "Leitor startup");
        String detail = MENTORES + "/" + target.getMentor().getId();
        read(get(MENTORES), reader);
        target.getMentor().setStatus(StatusPerfilMentor.PAUSADO);
        mentors.save(target.getMentor());
        mvc.perform(get(detail).with(as(reader))).andExpect(status().isNotFound());
        target.getMentor().setStatus(StatusPerfilMentor.PUBLICADO);
        mentors.save(target.getMentor());
        target.setAccepting(false);
        quizzes.save(target);
        mvc.perform(get(detail).with(as(reader))).andExpect(status().isNotFound());
        target.setAccepting(true);
        quizzes.save(target);
        read(get(detail), reader);
    }

    @Test
    void pagesAreStableAndCollectionReadsAreBatchedInsteadOfOneQueryPerProfile() throws Exception {
        List<String> ids = new ArrayList<>();
        for (int i = 0; i < 130; i++) {
            ids.add(mentor("Mentora " + String.format("%03d", i)).getMentor().getId().toString());
        }
        Usuario reader = account(TipoUsuario.STARTUP, "Leitor startup");
        Statistics statistics = factory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        try {
            JsonNode first = read(get(MENTORES), reader);
            assertThat(first.get("totalItens").asInt()).isEqualTo(130);
            assertThat(first.get("totalPaginas").asInt()).isEqualTo(7);
            assertThat(first.get("itens").findValuesAsText("id")).containsExactlyElementsOf(ids.subList(0, 20));
            assertThat(statistics.getPrepareStatementCount()).isLessThanOrEqualTo(16);
            assertThat(statistics.getEntityUpdateCount()).isZero();
            assertThat(statistics.getCollectionUpdateCount()).isZero();
            JsonNode last = read(get(MENTORES).param("pagina", "6"), reader);
            assertThat(last.get("itens").findValuesAsText("id")).containsExactlyElementsOf(ids.subList(120, 130));
            assertThat(read(get(MENTORES).param("pagina", "7"), reader).get("itens")).isEmpty();
        } finally {
            statistics.setStatisticsEnabled(false);
        }
    }

    private JsonNode read(MockHttpServletRequestBuilder request, Usuario reader) throws Exception {
        MvcResult result = mvc.perform(request.with(as(reader))).andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, CACHE)).andReturn();
        return json.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private void assertProjection(JsonNode item) {
        List<String> fields = new ArrayList<>();
        item.fieldNames().forEachRemaining(fields::add);
        assertThat(fields).containsExactlyInAnyOrder("id", "tipo", "nome", "apresentacao", "setores", "topicos", "formato", "cidadeId");
    }

    private RequestPostProcessor as(Usuario account) {
        return user(new UsuarioPrincipal(account.getId(), account.getNome(), account.getEmail(), "unused", account.getTipoUsuario()));
    }

    private Usuario account(TipoUsuario type, String name) {
        return users.save(new Usuario(name, "discovery-" + UUID.randomUUID() + "@example.test", "unused-fixture", type));
    }

    private PerfilMatch mentor(String name) {
        Mentor mentor = new Mentor(account(TipoUsuario.MENTOR, name), LocalDate.now(ZoneId.of("America/Sao_Paulo")),
                "Biografia fictícia de apoio", "https://example.test/privado", "contato-privado", Set.of(new DisponibilidadeMentor(4, PeriodoDisponibilidade.NOITE)));
        mentor.setStatus(StatusPerfilMentor.PUBLICADO);
        mentor = mentors.save(mentor);
        PerfilMatch quiz = PublicacaoStartupFixtures.questionario();
        quiz.setKind(TipoUsuario.MENTOR);
        quiz.setSectors(List.of(Setor.TECH));
        quiz.setTopics(List.of(Topico.VALIDATION, Topico.BUSINESS));
        quiz.setExperience(Map.of(Topico.VALIDATION, Experiencia.PRACTICAL, Topico.BUSINESS, Experiencia.KNOWLEDGE));
        quiz.setAudiences(List.of(Publico.B2B));
        quiz.setBackgrounds(List.of(Formacao.TECH));
        quiz.setCapacity(Capacidade.MANY);
        quiz.setCadence(Frequencia.MONTHLY);
        quiz.setAvailability(List.of());
        quiz.setMentor(mentor);
        quiz.setUpdatedAt(Instant.parse("2026-11-05T12:00:00Z"));
        return quizzes.save(quiz);
    }

    private PerfilMatch startup(String name) {
        Startup startup = PublicacaoStartupFixtures.projeto();
        startup.setNomeProvisorio(name);
        startup.setProblemaCentral("Problema privado");
        startup.setSolucaoProposta("Solução privada");
        startup.setPublicoAlvo("Público privado");
        startup.setModeloDeNegocio("Modelo privado");
        startup.setStatus(StatusPerfilStartup.PUBLICADO);
        MembroStartup founder = new MembroStartup();
        founder.setStartup(startup);
        founder.setUsuario(account(TipoUsuario.STARTUP, "Fundador privado"));
        founder.setPapelMembro(PapelMembroStartup.FUNDADOR);
        founder.setDataEntrada(LocalDate.now(ZoneId.of("America/Sao_Paulo")));
        startup.getMembros().add(founder);
        startup = startups.save(startup);
        PerfilMatch quiz = PublicacaoStartupFixtures.questionario();
        quiz.setProjectName("Rótulo privado");
        quiz.setStartup(startup);
        quiz.setUpdatedAt(Instant.parse("2026-11-05T12:00:00Z"));
        return quizzes.save(quiz);
    }
}
