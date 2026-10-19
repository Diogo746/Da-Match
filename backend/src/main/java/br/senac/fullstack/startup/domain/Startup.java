package br.senac.fullstack.startup.domain;

import br.senac.fullstack.startup.domain.enums.StatusValidacao;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "startup")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Startup {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @Column(nullable = false)
    private String nomeProvisorio;

    @Column(nullable = false)
    private String pitchCurto;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String problemaCentral;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String solucaoProposta;

    @Column(nullable = false)
    private String publicoAlvo;

    @Column(nullable = false)
    private String modeloDeNegocio;

    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MembroStartup> membros = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusValidacao statusValidacao;

    @Column(nullable = false)
    private Instant dataCriacao;
}
