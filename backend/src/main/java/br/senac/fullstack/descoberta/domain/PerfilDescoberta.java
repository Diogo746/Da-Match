package br.senac.fullstack.descoberta.domain;

import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formato;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Setor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Topico;
import br.senac.fullstack.shared.enums.TipoUsuario;

import java.util.List;
import java.util.UUID;

public record PerfilDescoberta(UUID id, TipoUsuario tipo, String nome, String apresentacao,
        List<Setor> setores, List<Topico> topicos, Formato formato, String cidadeId) {
    public PerfilDescoberta {
        setores = List.copyOf(setores);
        topicos = List.copyOf(topicos);
    }
}
