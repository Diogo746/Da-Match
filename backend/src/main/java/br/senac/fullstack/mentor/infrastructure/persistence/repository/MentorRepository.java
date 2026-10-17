package br.senac.fullstack.mentor.infrastructure.persistence.repository;

import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MentorRepository extends JpaRepository<Mentor, UUID> {
    Optional<Mentor> findByUsuario(Usuario usuario);
}
