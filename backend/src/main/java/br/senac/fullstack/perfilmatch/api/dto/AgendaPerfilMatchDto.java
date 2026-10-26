package br.senac.fullstack.perfilmatch.api.dto;

import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Dia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Periodo;
import jakarta.validation.constraints.NotNull;

public record AgendaPerfilMatchDto(@NotNull Dia day, @NotNull Periodo period) { }
