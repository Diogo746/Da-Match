package br.senac.fullstack.matching.domain;

import br.senac.fullstack.descoberta.domain.PerfilDescoberta;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formato;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Setor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Topico;
import br.senac.fullstack.shared.enums.TipoUsuario;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class CandidatoMatchingTest {
    @Test
    void desempataCadaNivelSemUsarOrdemAssinadaDoUuidOuOrdemDeInsercao() {
        var maior = item("80000000", "95.5", 1, 1, false);
        var necessidades = item("80000000", "95", 2, 0, false);
        var pratica = item("80000000", "95", 2, 2, false);
        var agenda = item("80000000", "95", 2, 2, true);
        var uuidTextual = item("7fffffff", "95", 2, 2, true);
        var menor = item("00000000", "95", 1, 1, true);
        assertThat(List.of(menor, agenda, maior, necessidades, uuidTextual, pratica).stream()
                .sorted(CandidatoMatching.ordem()).toList())
                .containsExactly(maior, uuidTextual, agenda, pratica, necessidades, menor);
    }

    private CandidatoMatching item(String prefixo, String nota, int atendidas, int praticas, boolean agenda) {
        var perfil = new PerfilDescoberta(UUID.fromString(prefixo + "-0000-4000-8000-000000000001"),
                TipoUsuario.MENTOR, "Pessoa fictícia", "Apresentação", List.of(Setor.TECH),
                List.of(Topico.VALIDATION), Formato.ONLINE, "");
        return new CandidatoMatching(new PerfilMatching(perfil, null, Instant.EPOCH, "revisao"),
                new ResultadoMatching(List.of(), new BigDecimal(nota), null, atendidas, praticas, agenda));
    }
}
