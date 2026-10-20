package br.senac.fullstack.mentor.domain;

import br.senac.fullstack.mentor.domain.enums.PeriodoDisponibilidade;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class DisponibilidadeMentor {

    @Column(name = "dia_semana", nullable = false)
    private Integer diaSemana;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PeriodoDisponibilidade periodo;
}
