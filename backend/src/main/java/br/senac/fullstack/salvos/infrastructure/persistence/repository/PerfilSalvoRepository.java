package br.senac.fullstack.salvos.infrastructure.persistence.repository;

import br.senac.fullstack.salvos.domain.entity.PerfilSalvo;
import br.senac.fullstack.shared.enums.TipoUsuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PerfilSalvoRepository extends JpaRepository<PerfilSalvo, UUID> {
    boolean existsByUsuarioIdAndTipoPerfilAndPerfilId(UUID usuarioId, TipoUsuario tipo, UUID perfilId);

    Page<PerfilSalvo> findByUsuarioIdAndTipoPerfil(UUID usuarioId, TipoUsuario tipo, Pageable pagina);

    void deleteByUsuarioIdAndTipoPerfilAndPerfilId(UUID usuarioId, TipoUsuario tipo, UUID perfilId);
}
