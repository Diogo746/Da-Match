package br.senac.fullstack.startup.infrastructure.persistence.repository;

import br.senac.fullstack.startup.domain.Startup;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;
import java.util.UUID;

public interface StartupRepository extends JpaRepository<Startup, UUID> {
    @Override
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Startup> findById(UUID id);
}
