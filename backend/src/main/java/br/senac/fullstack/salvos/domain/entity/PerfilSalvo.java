package br.senac.fullstack.salvos.domain.entity;

import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "perfil_salvo", schema = "damatch_private",
        uniqueConstraints = @UniqueConstraint(name = "uk_perfil_salvo_titular", columnNames = {"usuario_id", "tipo_perfil", "perfil_id"}),
        indexes = @Index(name = "ix_perfil_salvo_lista", columnList = "usuario_id,tipo_perfil,salvo_em,id"))
@Getter
public class PerfilSalvo {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, updatable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_perfil", nullable = false, updatable = false)
    private TipoUsuario tipoPerfil;

    @Column(name = "perfil_id", nullable = false, updatable = false)
    private UUID perfilId;

    @Column(name = "salvo_em", nullable = false, updatable = false)
    private Instant salvoEm;

    protected PerfilSalvo() { }

    public PerfilSalvo(Usuario usuario, TipoUsuario tipoPerfil, UUID perfilId, Instant salvoEm) {
        this.usuario = usuario;
        this.tipoPerfil = tipoPerfil;
        this.perfilId = perfilId;
        this.salvoEm = salvoEm;
    }
}
