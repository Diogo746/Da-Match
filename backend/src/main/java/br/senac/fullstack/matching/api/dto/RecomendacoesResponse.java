package br.senac.fullstack.matching.api.dto;

import br.senac.fullstack.shared.enums.TipoUsuario;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RecomendacoesResponse(UUID perfilOrigemId, TipoUsuario tipoOrigem, String versaoRegra,
        Instant calculadoEm, boolean perfilElegivel, List<Pendencia> pendencias, List<RecomendacaoResponse> itens) {
    public record Pendencia(String campo, String mensagem) { }
}
