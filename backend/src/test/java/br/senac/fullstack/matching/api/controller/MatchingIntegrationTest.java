package br.senac.fullstack.matching.api.controller;

import br.senac.fullstack.auth.infrastructure.security.UsuarioPrincipal;
import br.senac.fullstack.mentor.domain.DisponibilidadeMentor;
import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.mentor.domain.enums.PeriodoDisponibilidade;
import br.senac.fullstack.mentor.domain.enums.StatusPerfilMentor;
import br.senac.fullstack.mentor.infrastructure.persistence.repository.MentorRepository;
import br.senac.fullstack.perfilmatch.domain.AgendaPerfilMatch;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Capacidade;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Dia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Experiencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formacao;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Frequencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Periodo;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Publico;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Setor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Topico;
import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import br.senac.fullstack.perfilmatch.infrastructure.persistence.repository.PerfilMatchRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.domain.MembroStartup;
import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.startup.domain.enums.StatusPerfilStartup;
import br.senac.fullstack.startup.infrastructure.persistence.repository.StartupRepository;
import br.senac.fullstack.startup.support.PublicacaoStartupFixtures;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:matching;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop", "OLLAMA_BASE_URL="})
@AutoConfigureMockMvc
@Transactional
class MatchingIntegrationTest {
    private static final String MENTOR = "/api/v1/mentores/me/recomendacoes";
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private UsuarioRepository users;
    @Autowired private StartupRepository startups;
    @Autowired private MentorRepository mentors;
    @Autowired private PerfilMatchRepository quizzes;
    @Autowired private EntityManager entities;
    @Autowired private EntityManagerFactory factory;

    @Test
    void publicaProjecaoMinimaNosDoisSentidosERelatorioSomenteAdmin() throws Exception {
        PerfilMatch startup = startup(account(TipoUsuario.STARTUP));
        PerfilMatch mentor = mentor();
        Usuario fundador = startup.getStartup().getMembros().getFirst().getUsuario();
        JsonNode forward = read(startupPath(startup), fundador);
        JsonNode reverse = read(MENTOR, mentor.getMentor().getUsuario());
        assertThat(forward.get("itens")).hasSize(1);
        assertThat(reverse.get("itens")).hasSize(1);
        assertThat(forward.get("itens").get(0).get("superDamatch").asBoolean()).isTrue();
        assertThat(reverse.get("itens").get(0).get("superDamatch").asBoolean()).isTrue();
        assertThat(forward.get("itens").get(0).get("perfil").get("id").asText()).isEqualTo(mentor.getMentor().getId().toString());
        for (JsonNode response : List.of(forward, reverse)) {
            for (String forbidden : List.of("nota", "score", "contribuicoes", "experiencias", "email", "disponibilidades", "revisao")) {
                assertThat(response.findValues(forbidden)).isEmpty();
            }
            assertThat(response.get("versaoRegra").asText()).isEqualTo("damatch-mentoria-v1");
            assertThat(Instant.parse(response.get("calculadoEm").asText())).isNotNull();
        }
        Usuario admin = account(TipoUsuario.ADMIN);
        JsonNode report = read(reportPath(startup, mentor), admin);
        assertThat(report.at("/calculo/nota").decimalValue()).isEqualByComparingTo("100");
        assertThat(report.at("/startup/revisao").asText()).matches("[0-9a-f]{64}");
        assertThat(report.at("/mentor/dados/agenda/0/dia").asText()).isEqualTo("THU");
        assertThat(report.findValues("email")).isEmpty();
        mvc.perform(get(reportPath(startup, mentor)).with(as(fundador))).andExpect(status().isForbidden());
        mvc.perform(get(reportPath(startup, mentor)).with(as(mentor.getMentor().getUsuario()))).andExpect(status().isForbidden());
        mvc.perform(get(startupPath(startup)).with(as(admin))).andExpect(status().isForbidden());
    }

    @Test
    void protegeAntesDeResolverIdsParametrosEMetodos() throws Exception {
        String startup = "/api/v1/startups/invalido/recomendacoes";
        String report = "/api/v1/admin/matching/startups/invalido/mentores/invalido";
        for (String path : List.of(startup, MENTOR, report)) {
            mvc.perform(get(path).param("score", "100")).andExpect(status().isUnauthorized())
                    .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "private, no-store"));
        }
        mvc.perform(get(startup).with(as(account(TipoUsuario.MENTOR)))).andExpect(status().isForbidden());
        mvc.perform(get(MENTOR).with(as(account(TipoUsuario.STARTUP)))).andExpect(status().isForbidden());
        mvc.perform(get(report).with(as(account(TipoUsuario.STARTUP)))).andExpect(status().isForbidden());
        PerfilMatch source = startup(account(TipoUsuario.STARTUP));
        Usuario actor = source.getStartup().getMembros().getFirst().getUsuario();
        for (String parameter : List.of("usuarioId", "score", "pagina", "limite", "startupId")) {
            mvc.perform(get(startupPath(source)).param(parameter, "forjado").with(as(actor))).andExpect(status().isBadRequest());
        }
        mvc.perform(post(startupPath(source)).with(as(actor)).with(csrf())).andExpect(status().isForbidden());
    }

    @Test
    void exigeVinculoCsrfEIndicacaoParaExplicar() throws Exception {
        Usuario titular = account(TipoUsuario.STARTUP);
        PerfilMatch source = startup(titular);
        PerfilMatch target = mentor();
        String path = startupPath(source) + "/" + target.getMentor().getId() + "/explicacao";
        mvc.perform(post(path).with(as(titular))).andExpect(status().isForbidden());
        mvc.perform(post(path).with(as(account(TipoUsuario.STARTUP))).with(csrf()))
                .andExpect(status().isForbidden());
        mvc.perform(post(path).with(as(titular)).with(csrf()))
                .andExpect(status().isServiceUnavailable())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "private, no-store"));
        target.setAccepting(false);
        mvc.perform(post(path).with(as(titular)).with(csrf())).andExpect(status().isNotFound());
    }

    @Test
    void faltasPropriasSaoExplicadasSemRelaxarPublicacaoQuestionarioOuRecebimento() throws Exception {
        PerfilMatch source = startup(account(TipoUsuario.STARTUP));
        Usuario actor = source.getStartup().getMembros().getFirst().getUsuario();
        source.getStartup().setStatus(StatusPerfilStartup.RASCUNHO);
        assertThat(read(startupPath(source), actor).get("perfilElegivel").asBoolean()).isFalse();
        assertThat(read(startupPath(source), actor).get("pendencias").toString()).contains("status");
        quizzes.delete(source);
        entities.flush();
        assertThat(read(startupPath(source), actor).get("pendencias").toString()).contains("perfilMatch");
        PerfilMatch mentor = mentor();
        mentor.setAccepting(false);
        JsonNode response = read(MENTOR, mentor.getMentor().getUsuario());
        assertThat(response.get("itens")).isEmpty();
        assertThat(response.get("perfilElegivel").asBoolean()).isFalse();
        assertThat(response.get("pendencias").toString()).contains("accepting");
    }

    @Test
    void isolaProjetosMembrosERevogacaoDoVinculo() throws Exception {
        Usuario fundador = account(TipoUsuario.STARTUP);
        PerfilMatch first = startup(fundador);
        PerfilMatch second = startup(fundador);
        second.setTopics(List.of(Topico.PITCH));
        mentor();
        assertThat(read(startupPath(first), fundador).get("itens")).hasSize(1);
        assertThat(read(startupPath(second), fundador).get("itens")).isEmpty();
        Usuario member = account(TipoUsuario.STARTUP);
        MembroStartup vinculo = new MembroStartup();
        vinculo.setStartup(first.getStartup());
        vinculo.setUsuario(member);
        vinculo.setPapelMembro(PapelMembroStartup.MEMBRO);
        vinculo.setDataEntrada(LocalDate.now(ZoneId.of("America/Sao_Paulo")));
        first.getStartup().getMembros().add(vinculo);
        startups.save(first.getStartup());
        assertThat(read(startupPath(first), member).get("itens")).hasSize(1);
        mvc.perform(get(startupPath(second)).with(as(member))).andExpect(status().isForbidden());
        first.getStartup().getMembros().removeIf(item -> item.getUsuario().getId().equals(member.getId()));
        startups.save(first.getStartup());
        mvc.perform(get(startupPath(first)).with(as(member))).andExpect(status().isForbidden());
    }

    @Test
    void atualizaAgendaCompartilhadaRevisaoERetiraPausaSemReusarResultados() throws Exception {
        PerfilMatch source = startup(account(TipoUsuario.STARTUP));
        PerfilMatch target = mentor();
        Usuario actor = source.getStartup().getMembros().getFirst().getUsuario();
        Usuario admin = account(TipoUsuario.ADMIN);
        String originalRevision = read(reportPath(source, target), admin).at("/mentor/revisao").asText();
        target.getMentor().getDisponibilidades().clear();
        target.getMentor().getDisponibilidades().add(new DisponibilidadeMentor(1, PeriodoDisponibilidade.MANHA));
        JsonNode changed = read(startupPath(source), actor).get("itens").get(0);
        assertThat(changed.get("agendaEmComum").asBoolean()).isFalse();
        assertThat(changed.get("superDamatch").asBoolean()).isFalse();
        JsonNode report = read(reportPath(source, target), admin);
        assertThat(report.at("/calculo/nota").decimalValue()).isEqualByComparingTo("90");
        assertThat(report.at("/mentor/revisao").asText()).isNotEqualTo(originalRevision);
        assertThat(target.getAvailability()).isEmpty();
        target.getMentor().setStatus(StatusPerfilMentor.PAUSADO);
        assertThat(read(startupPath(source), actor).get("itens")).isEmpty();
        mvc.perform(get(reportPath(source, target)).with(as(admin))).andExpect(status().isNotFound());
        target.getMentor().setStatus(StatusPerfilMentor.PUBLICADO);
        target.setAccepting(false);
        assertThat(read(startupPath(source), actor).get("itens")).isEmpty();
        target.setAccepting(true);
        target.setMoments(List.of());
        assertThat(read(startupPath(source), actor).get("itens")).isEmpty();
    }

    @Test
    void relatorioExplicaFiltrosAntesDaNotaMasNaoExpoePerfisInaptos() throws Exception {
        PerfilMatch source = startup(account(TipoUsuario.STARTUP));
        PerfilMatch target = mentor();
        target.setCadence(Frequencia.WEEKLY);
        JsonNode report = read(reportPath(source, target), account(TipoUsuario.ADMIN));
        assertThat(report.at("/calculo/nota").isNull()).isTrue();
        assertThat(report.at("/calculo/impedimentos").toString()).contains("FREQUENCIA_INCOMPATIVEL");
        assertThat(report.get("indicado").asBoolean()).isFalse();
        assertThat(read(startupPath(source), source.getStartup().getMembros().getFirst().getUsuario()).get("itens")).isEmpty();
    }

    @Test
    void limitaDepoisDeOrdenarTodosOsCandidatosComConsultaEmLotesESemEscritas() throws Exception {
        PerfilMatch source = startup(account(TipoUsuario.STARTUP));
        Usuario actor = source.getStartup().getMembros().getFirst().getUsuario();
        List<PerfilMatch> created = new ArrayList<>();
        for (int i = 0; i < 130; i++) {
            PerfilMatch item = mentor();
            item.setTopics(List.of(Topico.VALIDATION));
            item.setExperience(Map.of(Topico.VALIDATION, Experiencia.PRACTICAL));
            created.add(item);
        }
        PerfilMatch winner = created.getLast();
        winner.setTopics(List.of(Topico.VALIDATION, Topico.BUSINESS));
        winner.setExperience(Map.of(Topico.VALIDATION, Experiencia.PRACTICAL, Topico.BUSINESS, Experiencia.PRACTICAL));
        entities.flush();
        entities.clear();
        var statistics = factory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        try {
            JsonNode response = read(startupPath(source), actor);
            assertThat(response.get("itens")).hasSize(20);
            assertThat(response.at("/itens/0/perfil/id").asText()).isEqualTo(winner.getMentor().getId().toString());
            assertThat(statistics.getPrepareStatementCount()).isLessThan(45);
            assertThat(statistics.getEntityUpdateCount()).isZero();
            assertThat(statistics.getCollectionUpdateCount()).isZero();
            assertThat(read(startupPath(source), actor).get("itens")).isEqualTo(response.get("itens"));
        } finally {
            statistics.setStatisticsEnabled(false);
        }
    }

    private JsonNode read(String path, Usuario actor) throws Exception {
        var response = mvc.perform(get(path).with(as(actor))).andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "private, no-store")).andReturn();
        return json.readTree(response.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private String startupPath(PerfilMatch profile) {
        return "/api/v1/startups/" + profile.getStartup().getId() + "/recomendacoes";
    }

    private String reportPath(PerfilMatch startup, PerfilMatch mentor) {
        return "/api/v1/admin/matching/startups/" + startup.getStartup().getId() + "/mentores/" + mentor.getMentor().getId();
    }

    private RequestPostProcessor as(Usuario actor) {
        return user(new UsuarioPrincipal(actor.getId(), actor.getNome(), actor.getEmail(), "unused", actor.getTipoUsuario()));
    }

    private Usuario account(TipoUsuario tipo) {
        return users.save(new Usuario("Pessoa fictícia", "matching-" + UUID.randomUUID() + "@example.test", "fixture-unused", tipo));
    }

    private PerfilMatch base() {
        PerfilMatch quiz = PublicacaoStartupFixtures.questionario();
        quiz.setSectors(List.of(Setor.TECH));
        quiz.setTopics(List.of(Topico.VALIDATION, Topico.BUSINESS));
        quiz.setAudiences(List.of(Publico.B2B));
        quiz.setBackgrounds(List.of(Formacao.BUSINESS));
        quiz.setAvailability(List.of(new AgendaPerfilMatch(Dia.THU, Periodo.EVENING)));
        quiz.setCadence(Frequencia.MONTHLY);
        quiz.setUpdatedAt(Instant.parse("2026-11-17T12:00:00Z"));
        return quiz;
    }

    private PerfilMatch startup(Usuario fundador) {
        var startup = PublicacaoStartupFixtures.projeto();
        startup.setStatus(StatusPerfilStartup.PUBLICADO);
        MembroStartup member = new MembroStartup();
        member.setStartup(startup);
        member.setUsuario(fundador);
        member.setPapelMembro(PapelMembroStartup.FUNDADOR);
        member.setDataEntrada(LocalDate.now(ZoneId.of("America/Sao_Paulo")));
        startup.getMembros().add(member);
        startup = startups.save(startup);
        PerfilMatch quiz = base();
        quiz.setStartup(startup);
        return quizzes.save(quiz);
    }

    private PerfilMatch mentor() {
        var mentor = new Mentor(account(TipoUsuario.MENTOR), LocalDate.now(ZoneId.of("America/Sao_Paulo")),
                "Biografia fictícia", "https://example.test/privado", "contato-privado",
                Set.of(new DisponibilidadeMentor(4, PeriodoDisponibilidade.NOITE)));
        mentor.setStatus(StatusPerfilMentor.PUBLICADO);
        mentor = mentors.save(mentor);
        PerfilMatch quiz = base();
        quiz.setKind(TipoUsuario.MENTOR);
        quiz.setMentor(mentor);
        quiz.setCapacity(Capacidade.ONE);
        quiz.setBackgrounds(List.of(Formacao.TECH));
        quiz.setExperience(Map.of(Topico.VALIDATION, Experiencia.PRACTICAL, Topico.BUSINESS, Experiencia.PRACTICAL));
        quiz.setAvailability(List.of());
        return quizzes.save(quiz);
    }
}
