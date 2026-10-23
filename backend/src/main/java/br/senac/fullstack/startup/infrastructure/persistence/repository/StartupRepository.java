package br.senac.fullstack.startup.infrastructure.persistence.repository;

import br.senac.fullstack.startup.domain.Startup;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StartupRepository extends JpaRepository<Startup, UUID> {
    @Query("select distinct s from Startup s join s.membros m where m.usuario.id = :usuarioId "
            + "order by s.dataCriacao, s.id")
    List<Startup> findByMembroUsuarioId(@Param("usuarioId") UUID usuarioId);

    @Override
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Startup> findById(UUID id);
}
