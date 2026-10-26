package br.senac.fullstack.perfilmatch.infrastructure.persistence.repository;

import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PerfilMatchRepository extends JpaRepository<PerfilMatch, UUID> {
    Optional<PerfilMatch> findByStartupId(UUID startupId);
    Optional<PerfilMatch> findByMentorId(UUID mentorId);
}
