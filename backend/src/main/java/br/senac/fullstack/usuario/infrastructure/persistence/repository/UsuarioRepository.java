package br.senac.fullstack.usuario.infrastructure.persistence.repository;

import br.senac.fullstack.usuario.domain.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    boolean existsByEmail(String email);

    Optional<Usuario> findByEmail(String email);

}
