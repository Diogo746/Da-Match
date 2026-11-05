package br.senac.fullstack.descoberta.application.service;

import br.senac.fullstack.descoberta.domain.PerfilDescoberta;
import br.senac.fullstack.mentor.domain.DisponibilidadeMentor;
import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.mentor.domain.enums.StatusPerfilMentor;
import br.senac.fullstack.perfilmatch.api.mapper.PerfilMatchMapper;
import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.application.service.AptidaoPublicacaoStartupService;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.StatusPerfilStartup;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class ElegibilidadeDescobertaService {
    private final AptidaoPublicacaoStartupService aptidao;
    private final PerfilMatchMapper questionarios;

    public ElegibilidadeDescobertaService(AptidaoPublicacaoStartupService aptidao, PerfilMatchMapper questionarios) {
        this.aptidao = aptidao;
        this.questionarios = questionarios;
    }

    public Optional<PerfilDescoberta> avaliar(PerfilMatch questionario, TipoUsuario tipo) {
        if (tipo == TipoUsuario.MENTOR) {
            return mentor(questionario);
        }
        return startup(questionario);
    }

    private Optional<PerfilDescoberta> startup(PerfilMatch questionario) {
        Startup startup = questionario.getStartup();
        if (startup == null || questionario.getMentor() != null || startup.getStatus() != StatusPerfilStartup.PUBLICADO
                || !aptidao.avaliar(startup, questionario).isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(perfil(startup.getId(), TipoUsuario.STARTUP,
                startup.getNomeProvisorio(), startup.getPitchCurto(), questionario));
    }

    private Optional<PerfilDescoberta> mentor(PerfilMatch questionario) {
        Mentor mentor = questionario.getMentor();
        if (mentor == null || questionario.getStartup() != null || mentor.getStatus() != StatusPerfilMentor.PUBLICADO
                || mentor.getUsuario().getTipoUsuario() != TipoUsuario.MENTOR || !questionario.isAccepting()
                || !textoValido(mentor.getUsuario().getNome(), 4, 255)
                || !textoValido(mentor.getBiografia(), 1, 1000) || !agendaValida(mentor) || !copiavel(questionario)) {
            return Optional.empty();
        }
        PerfilMatch copia = new PerfilMatch();
        questionarios.update(questionario, copia);
        copia.setAvailability(questionarios.fromMentorAvailability(mentor.getDisponibilidades()));
        try {
            copia.validar(TipoUsuario.MENTOR);
        } catch (IllegalArgumentException exception) {
            return Optional.empty();
        }
        return Optional.of(perfil(mentor.getId(), TipoUsuario.MENTOR,
                mentor.getUsuario().getNome(), mentor.getBiografia(), copia));
    }

    private boolean textoValido(String texto, int minimo, int maximo) {
        return texto != null && texto.strip().length() >= minimo && texto.length() <= maximo;
    }

    private boolean copiavel(PerfilMatch questionario) {
        return Stream.of(questionario.getMoments(), questionario.getSectors(), questionario.getTopics(),
                questionario.getAudiences(), questionario.getBackgrounds(), questionario.getAvailability())
                .allMatch(Objects::nonNull) && questionario.getExperience() != null
                && questionario.getExperience().keySet().stream().allMatch(Objects::nonNull);
    }

    private boolean agendaValida(Mentor mentor) {
        return mentor.getDisponibilidades() != null && !mentor.getDisponibilidades().isEmpty()
                && mentor.getDisponibilidades().stream().allMatch(this::parValido);
    }

    private boolean parValido(DisponibilidadeMentor par) {
        return par != null && par.getDiaSemana() != null && par.getDiaSemana() >= 1
                && par.getDiaSemana() <= 7 && par.getPeriodo() != null;
    }

    private PerfilDescoberta perfil(UUID id, TipoUsuario tipo, String nome, String apresentacao,
            PerfilMatch questionario) {
        return new PerfilDescoberta(id, tipo, nome.strip(), apresentacao.strip(), questionario.getSectors(),
                questionario.getTopics(), questionario.getFormat(), questionario.getCityId());
    }
}
