package br.senac.fullstack.mentor.domain;

import br.senac.fullstack.usuario.domain.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "mentor")
@Getter
@Setter
@NoArgsConstructor
public class Mentor {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @OneToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(nullable = false)
    private String biografia;

    private String linkedin;
    private String instagram;
    private String site;

    @Column(nullable = false)
    private LocalDate dataEntradaPlataforma;

    public Mentor(
            Usuario usuario,
            LocalDate dataEntradaPlataforma,
            String biografia,
            String linkedin,
            String instagram
    ) {
        this.usuario = usuario;
        this.dataEntradaPlataforma = dataEntradaPlataforma;
        this.biografia = normalizarTextoOpcional(biografia);
        this.linkedin = normalizarTextoOpcional(linkedin);
        this.instagram = normalizarTextoOpcional(instagram);
    }

    private String normalizarTextoOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.strip();
    }

}
