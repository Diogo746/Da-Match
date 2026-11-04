package br.senac.fullstack.startup.domain;

import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import br.senac.fullstack.startup.domain.enums.StatusConviteStartup;
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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "convite_startup", uniqueConstraints = @UniqueConstraint(
        name = "uk_convite_emissor_solicitacao", columnNames = {"emissor_id", "solicitacao_id"}))
@Getter
@Setter
@NoArgsConstructor
public class ConviteStartup {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "startup_id", nullable = false)
    private Startup startup;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "emissor_id", nullable = false)
    private Usuario emissor;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "destinatario_id", nullable = false)
    private Usuario destinatario;
    @Column(name = "solicitacao_id", nullable = false)
    private UUID solicitacaoId;
    @Column(nullable = false, length = 64)
    private String conteudoHash;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PapelMembroStartup papelMembro;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusConviteStartup status = StatusConviteStartup.PENDENTE;
    @Column(nullable = false)
    private Instant criadoEm;
    @Column(nullable = false)
    private Instant expiraEm;

    public StatusConviteStartup statusEm(Instant agora) {
        if (status == StatusConviteStartup.PENDENTE && !agora.isBefore(expiraEm)) {
            return StatusConviteStartup.EXPIRADO;
        }
        return status;
    }
}
