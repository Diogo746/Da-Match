package br.senac.fullstack.startup.application.service;

import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import br.senac.fullstack.perfilmatch.infrastructure.persistence.repository.PerfilMatchRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.domain.PendenciaPublicacaoStartup;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.StatusPerfilStartup;
import br.senac.fullstack.startup.support.PublicacaoStartupFixtures;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AptidaoPublicacaoStartupServiceTest {
    @Mock private PerfilMatchRepository profiles;
    @InjectMocks private AptidaoPublicacaoStartupService service;

    @Test
    void requiredFieldsHaveStableOrderAndNeverEchoStoredContent() {
        Startup startup = new Startup();
        startup.setPitchCurto(" \t");
        startup.setProblemaCentral("confidential".repeat(500));
        startup.setModeloDeNegocio("");
        var pending = service.avaliar(startup, null);
        assertThat(pending).extracting(PendenciaPublicacaoStartup::campo).containsExactly(
                "nomeProvisorio", "pitchCurto", "problemaCentral", "solucaoProposta", "publicoAlvo",
                "modeloDeNegocio", "statusValidacao", "perfilMatch");
        assertThat(pending).extracting(PendenciaPublicacaoStartup::codigo).containsExactly(
                "CAMPO_OBRIGATORIO", "CAMPO_OBRIGATORIO", "CAMPO_INVALIDO", "CAMPO_OBRIGATORIO",
                "CAMPO_OBRIGATORIO", "CAMPO_OBRIGATORIO", "CAMPO_OBRIGATORIO", "QUESTIONARIO_AUSENTE");
        assertThat(pending).allSatisfy(item -> assertThat(item.mensagem()).doesNotContain("confidential"));
    }

    @Test
    void acceptsRegistrationLimitsOptionalNameUnknownsAndOnlineWithoutCity() {
        Startup startup = PublicacaoStartupFixtures.projeto();
        startup.setNomeProvisorio("a".repeat(255));
        startup.setPitchCurto("a".repeat(255));
        startup.setProblemaCentral("a".repeat(5000));
        startup.setSolucaoProposta("a".repeat(5000));
        startup.setPublicoAlvo("a".repeat(255));
        startup.setModeloDeNegocio("a".repeat(255));
        PerfilMatch profile = PublicacaoStartupFixtures.questionario();
        assertThat(service.avaliar(startup, profile)).isEmpty();
        startup.setNomeProvisorio("a".repeat(256));
        startup.setPitchCurto("a".repeat(256));
        startup.setProblemaCentral("a".repeat(5001));
        startup.setSolucaoProposta("a".repeat(5001));
        startup.setPublicoAlvo("a".repeat(256));
        startup.setModeloDeNegocio("a".repeat(256));
        assertThat(service.avaliar(startup, profile)).hasSize(6)
                .allSatisfy(item -> assertThat(item.codigo()).isEqualTo("CAMPO_INVALIDO"));
    }

    @Test
    void distinguishesIncompatibleAndInvalidQuestionnairesWithoutExposingValidationDetails() {
        Startup startup = PublicacaoStartupFixtures.projeto();
        PerfilMatch profile = PublicacaoStartupFixtures.questionario();
        profile.setQuestionnaireVersion(null);
        assertQuestionnaireCode(startup, profile, "QUESTIONARIO_INCOMPATIVEL");
        profile.setQuestionnaireVersion("legacy");
        assertQuestionnaireCode(startup, profile, "QUESTIONARIO_INCOMPATIVEL");
        profile.setQuestionnaireVersion(PerfilMatch.VERSION);
        profile.setKind(TipoUsuario.MENTOR);
        assertQuestionnaireCode(startup, profile, "QUESTIONARIO_INCOMPATIVEL");
        profile.setKind(TipoUsuario.STARTUP);
        profile.setTopics(List.of());
        assertQuestionnaireCode(startup, profile, "QUESTIONARIO_INVALIDO");
    }

    @Test
    void onlyPublishedEditsRequireFullReadinessAndCandidateDoesNotReadOldQuestionnaire() {
        Startup startup = PublicacaoStartupFixtures.projeto();
        startup.setId(UUID.randomUUID());
        service.validarEdicaoPublicada(startup);
        service.validarEdicaoPublicada(startup, null);
        startup.setStatus(StatusPerfilStartup.PAUSADO);
        service.validarEdicaoPublicada(startup);
        verifyNoInteractions(profiles);
        startup.setStatus(StatusPerfilStartup.PUBLICADO);
        PerfilMatch candidate = PublicacaoStartupFixtures.questionario();
        service.validarEdicaoPublicada(startup, candidate);
        verifyNoInteractions(profiles);
        when(profiles.findByStartupId(startup.getId())).thenReturn(Optional.of(candidate));
        service.validarEdicaoPublicada(startup);
        startup.setPitchCurto(" ");
        assertThatIllegalArgumentException().isThrownBy(() -> service.validarEdicaoPublicada(startup, candidate));
        when(profiles.findByStartupId(startup.getId())).thenReturn(Optional.empty());
        assertThatIllegalArgumentException().isThrownBy(() -> service.validarEdicaoPublicada(startup));
    }

    private void assertQuestionnaireCode(Startup startup, PerfilMatch profile, String code) {
        assertThat(service.avaliar(startup, profile)).singleElement()
                .satisfies(item -> {
                    assertThat(item.campo()).isEqualTo("perfilMatch");
                    assertThat(item.codigo()).isEqualTo(code);
                });
    }
}
