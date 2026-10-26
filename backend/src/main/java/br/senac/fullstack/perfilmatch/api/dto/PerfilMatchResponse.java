package br.senac.fullstack.perfilmatch.api.dto;

import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Momento;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Setor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Topico;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Experiencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Publico;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formacao;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Capacidade;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formato;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Frequencia;

import java.util.List;
import java.util.Map;

public record PerfilMatchResponse(
        String questionnaireVersion,
        TipoUsuario kind,
        String projectName,
        List<Momento> moments,
        List<Setor> sectors,
        List<Topico> topics,
        Map<Topico, Experiencia> experience,
        List<Publico> audiences,
        List<Formacao> backgrounds,
        Capacidade capacity,
        Formato format,
        String cityId,
        List<AgendaPerfilMatchDto> availability,
        Frequencia cadence,
        boolean accepting,
        java.time.Instant updatedAt
) { }

