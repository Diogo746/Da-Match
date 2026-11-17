package br.senac.fullstack.matching.api.dto;

import br.senac.fullstack.descoberta.api.dto.PerfilDescobertaResponse;

public record RecomendacaoResponse(PerfilDescobertaResponse perfil, boolean superDamatch, boolean agendaEmComum) { }
