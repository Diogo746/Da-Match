package br.senac.fullstack.startup.support;

import br.senac.fullstack.perfilmatch.api.dto.AgendaPerfilMatchDto;
import br.senac.fullstack.perfilmatch.api.dto.SalvarPerfilMatchRequest;
import br.senac.fullstack.perfilmatch.api.mapper.PerfilMatchMapper;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Dia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formacao;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formato;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Frequencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Momento;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Periodo;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Publico;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Setor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Topico;
import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.StatusValidacao;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class PublicacaoStartupFixtures {
    private PublicacaoStartupFixtures() { }

    public static Startup projeto() {
        Startup startup = new Startup();
        startup.setNomeProvisorio("Projeto de publicação");
        startup.setPitchCurto("Resumo do projeto fictício");
        startup.setProblemaCentral("Problema a investigar");
        startup.setSolucaoProposta("Solução a experimentar");
        startup.setPublicoAlvo("Pessoas participantes");
        startup.setModeloDeNegocio("Modelo a validar");
        startup.setStatusValidacao(StatusValidacao.APENAS_IDEIA);
        startup.setDataCriacao(Instant.parse("2026-10-30T12:00:00Z"));
        return startup;
    }

    public static SalvarPerfilMatchRequest respostas() {
        return new SalvarPerfilMatchRequest(PerfilMatch.VERSION, TipoUsuario.STARTUP, "",
                List.of(Momento.PROBLEM), List.of(Setor.DISCOVERING), List.of(Topico.PITCH, Topico.PRICING),
                Map.of(), List.of(Publico.UNKNOWN), List.of(Formacao.STUDENT), null, Formato.ONLINE, "",
                List.of(new AgendaPerfilMatchDto(Dia.TUE, Periodo.AFTERNOON)), Frequencia.FLEXIBLE, true);
    }

    public static PerfilMatch questionario() {
        return new PerfilMatchMapper().toEntity(respostas());
    }
}
