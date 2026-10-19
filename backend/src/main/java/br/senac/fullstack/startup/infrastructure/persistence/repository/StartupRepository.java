package br.senac.fullstack.startup.infrastructure.persistence.repository;

import br.senac.fullstack.startup.domain.Startup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StartupRepository extends JpaRepository<Startup, UUID> {
}
