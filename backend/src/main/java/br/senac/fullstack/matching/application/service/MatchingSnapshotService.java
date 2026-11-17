package br.senac.fullstack.matching.application.service;

import br.senac.fullstack.descoberta.application.service.ElegibilidadeDescobertaService;
import br.senac.fullstack.matching.domain.DadosMatching;
import br.senac.fullstack.matching.domain.PerfilMatching;
import br.senac.fullstack.perfilmatch.api.mapper.PerfilMatchMapper;
import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import br.senac.fullstack.shared.enums.TipoUsuario;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
public class MatchingSnapshotService {
    private final ElegibilidadeDescobertaService elegibilidade;
    private final PerfilMatchMapper questionarios;
    private final ObjectMapper json;

    public MatchingSnapshotService(ElegibilidadeDescobertaService elegibilidade,
            PerfilMatchMapper questionarios, ObjectMapper json) {
        this.elegibilidade = elegibilidade;
        this.questionarios = questionarios;
        this.json = json;
    }

    public Optional<PerfilMatching> preparar(PerfilMatch questionario, TipoUsuario tipo) {
        if (questionario == null || questionario.getUpdatedAt() == null) {
            return Optional.empty();
        }
        return elegibilidade.avaliar(questionario, tipo).map(perfil -> {
            var agenda = questionario.getAvailability();
            if (tipo == TipoUsuario.MENTOR) {
                agenda = questionarios.fromMentorAvailability(questionario.getMentor().getDisponibilidades());
            }
            DadosMatching dados = new DadosMatching(questionario.getMoments(), questionario.getSectors(),
                    questionario.getTopics(), questionario.getExperience(), questionario.getAudiences(),
                    questionario.getBackgrounds(), questionario.getFormat(), questionario.getCityId(),
                    agenda.stream().map(par -> new DadosMatching.Janela(par.getDay(), par.getPeriod())).toList(),
                    questionario.getCadence());
            return new PerfilMatching(perfil, dados, questionario.getUpdatedAt(),
                    revisao(List.of(perfil, dados, questionario.getUpdatedAt())));
        });
    }

    private String revisao(Object fonte) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json.writeValueAsBytes(fonte)));
        } catch (NoSuchAlgorithmException | JsonProcessingException exception) {
            throw new IllegalStateException("Não foi possível identificar a revisão do matching.", exception);
        }
    }
}
