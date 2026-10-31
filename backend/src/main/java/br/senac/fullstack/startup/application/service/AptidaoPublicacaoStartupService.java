package br.senac.fullstack.startup.application.service;

import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import br.senac.fullstack.perfilmatch.infrastructure.persistence.repository.PerfilMatchRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.domain.PendenciaPublicacaoStartup;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.StatusPerfilStartup;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AptidaoPublicacaoStartupService {
    private static final String PERFIL_MATCH = "perfilMatch";
    private final PerfilMatchRepository profiles;

    public AptidaoPublicacaoStartupService(PerfilMatchRepository profiles) {
        this.profiles = profiles;
    }

    public List<PendenciaPublicacaoStartup> avaliar(Startup startup) {
        return avaliar(startup, profiles.findByStartupId(startup.getId()).orElse(null));
    }

    public List<PendenciaPublicacaoStartup> avaliar(Startup startup, PerfilMatch profile) {
        List<PendenciaPublicacaoStartup> pendencias = new ArrayList<>();
        texto(pendencias, "nomeProvisorio", startup.getNomeProvisorio(), 255);
        texto(pendencias, "pitchCurto", startup.getPitchCurto(), 255);
        texto(pendencias, "problemaCentral", startup.getProblemaCentral(), 5000);
        texto(pendencias, "solucaoProposta", startup.getSolucaoProposta(), 5000);
        texto(pendencias, "publicoAlvo", startup.getPublicoAlvo(), 255);
        texto(pendencias, "modeloDeNegocio", startup.getModeloDeNegocio(), 255);
        if (startup.getStatusValidacao() == null) {
            pendencias.add(new PendenciaPublicacaoStartup("CAMPO_OBRIGATORIO", "statusValidacao",
                    "Informe o momento da ideia."));
        }
        avaliarQuestionario(pendencias, profile);
        return List.copyOf(pendencias);
    }

    public void validarEdicaoPublicada(Startup startup) {
        if (startup.getStatus() == StatusPerfilStartup.PUBLICADO) {
            exigirAptidao(avaliar(startup));
        }
    }

    public void validarEdicaoPublicada(Startup startup, PerfilMatch profile) {
        if (startup.getStatus() == StatusPerfilStartup.PUBLICADO) {
            exigirAptidao(avaliar(startup, profile));
        }
    }

    private void exigirAptidao(List<PendenciaPublicacaoStartup> pendencias) {
        if (!pendencias.isEmpty()) {
            throw new IllegalArgumentException("A edição deve preservar os requisitos de publicação.");
        }
    }

    private void texto(List<PendenciaPublicacaoStartup> pendencias, String campo, String valor, int limite) {
        if (valor == null || valor.isBlank()) {
            pendencias.add(new PendenciaPublicacaoStartup("CAMPO_OBRIGATORIO", campo,
                    "Preencha o campo obrigatório do perfil."));
        } else if (valor.length() > limite) {
            pendencias.add(new PendenciaPublicacaoStartup("CAMPO_INVALIDO", campo,
                    "Revise o limite de caracteres do campo do perfil."));
        }
    }

    private void avaliarQuestionario(List<PendenciaPublicacaoStartup> pendencias, PerfilMatch profile) {
        if (profile == null) {
            pendencias.add(new PendenciaPublicacaoStartup("QUESTIONARIO_AUSENTE", PERFIL_MATCH,
                    "Preencha e salve o questionário desta startup."));
        } else if (!PerfilMatch.VERSION.equals(profile.getQuestionnaireVersion())
                || profile.getKind() != TipoUsuario.STARTUP) {
            pendencias.add(new PendenciaPublicacaoStartup("QUESTIONARIO_INCOMPATIVEL", PERFIL_MATCH,
                    "Atualize e salve o questionário na versão atual para startup."));
        } else {
            validarQuestionario(pendencias, profile);
        }
    }

    private void validarQuestionario(List<PendenciaPublicacaoStartup> pendencias, PerfilMatch profile) {
        try {
            profile.validar(TipoUsuario.STARTUP);
        } catch (IllegalArgumentException exception) {
            pendencias.add(new PendenciaPublicacaoStartup("QUESTIONARIO_INVALIDO", PERFIL_MATCH,
                    "Revise e salve as respostas completas do questionário desta startup."));
        }
    }
}
