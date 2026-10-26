package br.senac.fullstack.perfilmatch.domain;

import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Dia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Periodo;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class AgendaPerfilMatch {
    @Enumerated(EnumType.STRING)
    @Column(name = "dia", nullable = false)
    private Dia day;

    @Enumerated(EnumType.STRING)
    @Column(name = "periodo", nullable = false)
    private Periodo period;
}
