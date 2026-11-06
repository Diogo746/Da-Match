package br.senac.fullstack.auth.domain.entity;

import br.senac.fullstack.usuario.domain.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "auth_session", indexes = @Index(name = "ix_auth_session_expiry", columnList = "absolute_expires_at"))
@Getter
@Setter
@NoArgsConstructor
public class AuthSession {
    @Id
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    @Column(nullable = false, length = 64)
    private String credentialStamp;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant refreshExpiresAt;
    @Column(name = "absolute_expires_at", nullable = false)
    private Instant absoluteExpiresAt;
    private Instant revokedAt;
}
