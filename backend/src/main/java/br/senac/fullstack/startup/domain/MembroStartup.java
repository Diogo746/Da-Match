package br.senac.fullstack.startup.domain;

import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Table(name = "membros_da_startup", uniqueConstraints =
        @UniqueConstraint(name = "uk_startup_usuario", columnNames = {"startup_id", "usuario_id"}))
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MembroStartup {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "startup_id", nullable = false)
    private Startup startup;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id" , nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    PapelMembroStartup papelMembro;

    @Column(nullable = false)
    private LocalDate dataEntrada;
}
