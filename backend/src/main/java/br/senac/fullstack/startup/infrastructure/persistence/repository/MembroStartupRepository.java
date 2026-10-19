package br.senac.fullstack.startup.infrastructure.persistence.repository;

import br.senac.fullstack.startup.domain.MembroStartup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MembroStartupRepository extends JpaRepository<MembroStartup, UUID> {
}
