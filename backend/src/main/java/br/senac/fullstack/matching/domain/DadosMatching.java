package br.senac.fullstack.matching.domain;

import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Dia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Experiencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formacao;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formato;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Frequencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Momento;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Periodo;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Publico;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Setor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Topico;

import java.util.Collections;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

public record DadosMatching(List<Momento> momentos, List<Setor> setores, List<Topico> topicos,
        Map<Topico, Experiencia> experiencias, List<Publico> publicos, List<Formacao> formacoes,
        Formato formato, String cidadeId, List<Janela> agenda, Frequencia frequencia) {
    public DadosMatching {
        momentos = List.copyOf(momentos);
        setores = List.copyOf(setores);
        topicos = List.copyOf(topicos);
        EnumMap<Topico, Experiencia> copia = new EnumMap<>(Topico.class);
        copia.putAll(experiencias);
        experiencias = Collections.unmodifiableMap(copia);
        publicos = List.copyOf(publicos);
        formacoes = List.copyOf(formacoes);
        agenda = List.copyOf(agenda);
    }

    public record Janela(Dia dia, Periodo periodo) { }
}
