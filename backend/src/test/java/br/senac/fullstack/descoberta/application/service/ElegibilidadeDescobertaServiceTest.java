package br.senac.fullstack.descoberta.application.service;

import br.senac.fullstack.mentor.domain.DisponibilidadeMentor;
import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.mentor.domain.enums.PeriodoDisponibilidade;
import br.senac.fullstack.mentor.domain.enums.StatusPerfilMentor;
import br.senac.fullstack.perfilmatch.api.mapper.PerfilMatchMapper;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Capacidade;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Experiencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formacao;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Publico;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Setor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Topico;
import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import br.senac.fullstack.perfilmatch.infrastructure.persistence.repository.PerfilMatchRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.application.service.AptidaoPublicacaoStartupService;
import br.senac.fullstack.startup.support.PublicacaoStartupFixtures;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class ElegibilidadeDescobertaServiceTest {
    private final ElegibilidadeDescobertaService service = new ElegibilidadeDescobertaService(
            new AptidaoPublicacaoStartupService(mock(PerfilMatchRepository.class)), new PerfilMatchMapper());

    @ParameterizedTest
    @ValueSource(strings = {"NULL_BIO", "LONG_BIO", "NULL_NAME", "LONG_NAME", "NULL_AGENDA", "NULL_PAR", "NULL_DAY",
            "DAY_ZERO", "NULL_PERIOD", "NULL_EXPERIENCE", "NULL_KEY", "NULL_TOPICS", "NULL_MOMENTS", "NULL_SECTORS",
            "NULL_AUDIENCES", "NULL_BACKGROUNDS", "NULL_QUIZ_AGENDA", "WRONG_KIND", "WRONG_VERSION"})
    void invalidLegacyDataIsExcludedWithoutMutatingOrFailingTheWholeCatalog(String reason) {
        PerfilMatch quiz = mentor();
        Mentor mentor = quiz.getMentor();
        switch (reason) {
            case "NULL_BIO" -> mentor.setBiografia(null);
            case "LONG_BIO" -> mentor.setBiografia("x".repeat(1001));
            case "NULL_NAME" -> mentor.getUsuario().setNome(null);
            case "LONG_NAME" -> mentor.getUsuario().setNome("x".repeat(256));
            case "NULL_AGENDA" -> mentor.setDisponibilidades(null);
            case "NULL_PAR" -> {
                Set<DisponibilidadeMentor> agenda = new LinkedHashSet<>();
                agenda.add(null);
                mentor.setDisponibilidades(agenda);
            }
            case "NULL_DAY" -> mentor.setDisponibilidades(Set.of(new DisponibilidadeMentor(null, PeriodoDisponibilidade.MANHA)));
            case "DAY_ZERO" -> mentor.setDisponibilidades(Set.of(new DisponibilidadeMentor(0, PeriodoDisponibilidade.MANHA)));
            case "NULL_PERIOD" -> mentor.setDisponibilidades(Set.of(new DisponibilidadeMentor(1, null)));
            case "NULL_EXPERIENCE" -> quiz.setExperience(null);
            case "NULL_KEY" -> quiz.setExperience(Collections.singletonMap(null, Experiencia.KNOWLEDGE));
            case "NULL_TOPICS" -> quiz.setTopics(null);
            case "NULL_MOMENTS" -> quiz.setMoments(null);
            case "NULL_SECTORS" -> quiz.setSectors(null);
            case "NULL_AUDIENCES" -> quiz.setAudiences(null);
            case "NULL_BACKGROUNDS" -> quiz.setBackgrounds(null);
            case "NULL_QUIZ_AGENDA" -> quiz.setAvailability(null);
            case "WRONG_KIND" -> quiz.setKind(TipoUsuario.STARTUP);
            case "WRONG_VERSION" -> quiz.setQuestionnaireVersion("legado");
            default -> throw new IllegalArgumentException("Cenário inválido.");
        }
        assertThat(service.avaliar(quiz, TipoUsuario.MENTOR)).isEmpty();
        assertThat(mentor.getStatus()).isEqualTo(StatusPerfilMentor.PUBLICADO);
    }

    private PerfilMatch mentor() {
        Usuario usuario = new Usuario("Mentora fictícia", "fixture@example.test", "unused", TipoUsuario.MENTOR);
        Mentor mentor = new Mentor(usuario, LocalDate.of(2026, 11, 5), "Biografia válida", null, null,
                Set.of(new DisponibilidadeMentor(1, PeriodoDisponibilidade.MANHA)));
        mentor.setId(UUID.randomUUID());
        mentor.setStatus(StatusPerfilMentor.PUBLICADO);
        PerfilMatch quiz = PublicacaoStartupFixtures.questionario();
        quiz.setKind(TipoUsuario.MENTOR);
        quiz.setMentor(mentor);
        quiz.setCapacity(Capacidade.ONE);
        quiz.setSectors(List.of(Setor.GENERAL));
        quiz.setAudiences(List.of(Publico.B2B));
        quiz.setBackgrounds(List.of(Formacao.TECH));
        var experience = new EnumMap<Topico, Experiencia>(Topico.class);
        quiz.getTopics().forEach(topic -> experience.put(topic, Experiencia.PRACTICAL));
        quiz.setExperience(experience);
        quiz.setAvailability(List.of());
        return quiz;
    }
}
