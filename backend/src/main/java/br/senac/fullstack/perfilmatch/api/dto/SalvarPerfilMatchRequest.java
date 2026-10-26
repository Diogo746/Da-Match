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
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

public record SalvarPerfilMatchRequest(
        @NotBlank @Size(max = 40) String questionnaireVersion,
        @NotNull TipoUsuario kind,
        @Size(max = 60) String projectName,
        @NotEmpty @Size(max = 4) List<@NotNull Momento> moments,
        @NotEmpty @Size(max = 5) List<@NotNull Setor> sectors,
        @NotEmpty @Size(max = 6) List<@NotNull Topico> topics,
        @Size(max = 6) Map<@NotNull Topico, @NotNull Experiencia> experience,
        @NotEmpty @Size(max = 4) List<@NotNull Publico> audiences,
        @NotEmpty @Size(max = 3) List<@NotNull Formacao> backgrounds,
        Capacidade capacity,
        @NotNull Formato format,
        @Size(max = 40) String cityId,
        @NotEmpty @Size(max = 21) List<@NotNull @Valid AgendaPerfilMatchDto> availability,
        @NotNull Frequencia cadence,
        Boolean accepting
) { }

