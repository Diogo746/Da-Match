package br.senac.fullstack.startup.domain;

import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Table(name = "membros_da_startup")
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
