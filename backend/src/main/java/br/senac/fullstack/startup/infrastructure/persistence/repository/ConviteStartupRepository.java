package br.senac.fullstack.startup.infrastructure.persistence.repository;

import br.senac.fullstack.startup.domain.ConviteStartup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface ConviteStartupRepository extends JpaRepository<ConviteStartup, UUID> {
    Optional<ConviteStartup> findByEmissorIdAndSolicitacaoId(UUID emissorId, UUID solicitacaoId);

    @Query("select c.startup.id from ConviteStartup c where c.id = :id")
    Optional<UUID> findStartupId(@Param("id") UUID id);

    @Query("select count(c) > 0 from ConviteStartup c where c.startup.id = :startup "
            + "and c.destinatario.id = :destinatario and c.status = 'PENDENTE' and c.expiraEm > :agora")
    boolean existePendente(@Param("startup") UUID startup, @Param("destinatario") UUID destinatario,
            @Param("agora") Instant agora);

    @Query("select c from ConviteStartup c where c.startup.id = :id order by c.criadoEm desc, cast(c.id as string)")
    Page<ConviteStartup> listarDoProjeto(@Param("id") UUID id, Pageable pagina);

    @Query("select c from ConviteStartup c where c.destinatario.id = :id "
            + "order by c.criadoEm desc, cast(c.id as string)")
    Page<ConviteStartup> listarRecebidos(@Param("id") UUID id, Pageable pagina);
}
